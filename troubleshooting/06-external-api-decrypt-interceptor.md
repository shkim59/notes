---
title: 외부 API 응답 복호화를 인터셉터로 분리하기
---

# 외부 API 응답 복호화를 인터셉터로 분리하기

## 들어가며

화면의 한 탭에서 보여 주는 데이터는 우리 서비스가 갖고 있지 않고 **외부 시스템의 API**에서 받아 온다. 우리 쪽은 받은 컬럼·행을 화면 형식으로 바꾸고 권한만 판단하면 된다.

문제는 이 API가 **요청과 응답을 암호화해서 주고받는다**는 것이었다.

```
[요청]  resource, userId   → 각각 AES 암호화
        apiKey(시스템 키)   → 평문

[응답]  {
          "status": "SUCCESS",
          "message": "...",
          "data": "Q2xhc3Npc...(암호문)"   ← 이 필드만 암호화된 JSON 문자열
        }
```

## 문제 — 서비스가 암호화까지 알아야 할까?

가장 먼저 떠오르는 방법은 서비스에서 응답을 문자열로 받아 직접 푸는 것이다.

```java
// 서비스에서 직접 복호화하는 경우
String raw = client.getDataRaw(...);                 // 응답을 String으로
JsonNode root = objectMapper.readTree(raw);
String decrypted = cryptoService.decrypt(root.path("data").asText());
DataResponse data = objectMapper.readValue(decrypted, DataResponse.class);
// ... 이제야 업무 로직 시작
```

이렇게 하면:

- 서비스가 **"응답 JSON의 `data` 필드가 암호문이다"** 라는 전송 규약을 알아야 한다.
- 클라이언트 인터페이스가 타입 있는 DTO 대신 `String`을 반환하게 된다. 선언형 HTTP 클라이언트(`@HttpExchange`)를 쓰는 이점이 사라진다.
- 같은 외부 시스템의 API가 늘어나면 **엔드포인트마다 같은 파싱·복호화 코드가 복사**된다.
- 서비스의 본래 관심사(대상 확인 → 권한 판단 → 결과 변환)가 암호화 코드에 묻힌다.

암호화는 업무 규칙이 아니라 **이 외부 시스템과 통신하는 방식**이다. 그렇다면 통신 계층에서 처리하는 게 맞다고 판단했다.

## 해결 — 응답 본문을 바꿔 끼우는 인터셉터

Spring의 `RestClient`는 요청을 보내고 응답을 받는 사이에 `ClientHttpRequestInterceptor`를 끼울 수 있다. 여기서 응답 본문을 읽어 **`data`만 복호화한 평문 JSON으로 교체**한 뒤 넘기면, 그 뒤의 JSON 역직렬화는 평소처럼 DTO로 이루어진다.

```
Service ──▶ @HttpExchange 클라이언트 ──▶ RestClient ──▶ 외부 API
                  ▲                          │
                  │         ┌────────────────┘
                  │         ▼
            평문 DTO ◀── 복호화 인터셉터 (data 필드 AES 복호화 → 본문 교체)
```

### 인터셉터

```java
public class ResponseDecryptInterceptor implements ClientHttpRequestInterceptor {

    private final CryptoService cryptoService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public ClientHttpResponse intercept(HttpRequest request, byte[] body,
                                        ClientHttpRequestExecution execution) throws IOException {
        ClientHttpResponse response = execution.execute(request, body);

        // 4xx/5xx는 건드리지 않고 그대로 넘긴다 — 상태 코드 처리는 원래 흐름에 맡긴다
        if (response.getStatusCode().isError()) {
            return response;
        }

        try {
            JsonNode root = objectMapper.readTree(response.getBody().readAllBytes());

            String encrypted = root.path("data").asText(null);
            JsonNode dataNode = (encrypted == null || encrypted.isBlank())
                    ? objectMapper.createObjectNode()
                    : objectMapper.readTree(cryptoService.decrypt(encrypted));

            ObjectNode plain = objectMapper.createObjectNode();
            plain.put("status", root.path("status").asText(null));
            plain.put("message", root.path("message").asText(null));
            plain.set("data", dataNode);                       // 암호문 → 평문 JSON

            return new DecryptedResponse(response, objectMapper.writeValueAsBytes(plain));
        } catch (Exception e) {
            response.close();
            throw new RestClientException("응답 복호화 실패", e);
        }
    }
}
```

**응답 본문은 스트림이라 한 번만 읽을 수 있다.** 그래서 읽은 뒤에는 원래 응답을 감싸는 `ClientHttpResponse` 구현체를 새로 만들어, 상태 코드·헤더는 원래 응답에 위임하고 **본문만 복호화한 바이트로 돌려준다.** Content-Type도 JSON으로 명시해 뒤따르는 메시지 컨버터가 헷갈리지 않게 했다.

```java
@RequiredArgsConstructor
private static class DecryptedResponse implements ClientHttpResponse {
    private final ClientHttpResponse delegate;
    private final byte[] decryptedBody;

    @Override public InputStream getBody() { return new ByteArrayInputStream(decryptedBody); }
    @Override public HttpStatusCode getStatusCode() throws IOException { return delegate.getStatusCode(); }
    @Override public String getStatusText() throws IOException { return delegate.getStatusText(); }
    @Override public void close() { delegate.close(); }
    @Override public HttpHeaders getHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.addAll(delegate.getHeaders());
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }
}
```

### 클라이언트 설정

인터셉터는 **이 외부 시스템 전용 `RestClient`에만** 붙였다. 다른 외부 API까지 복호화를 시도하면 안 되기 때문이다. 상대 시스템이 타임아웃·재시도를 걸지 않는다고 명세에 적혀 있어, 연결·읽기 타임아웃도 여기서 설정했다.

```java
@Bean
ExternalApiClient externalApiClient() {
    SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
    factory.setConnectTimeout(Duration.ofMillis(props.connectTimeoutMs()));
    factory.setReadTimeout(Duration.ofMillis(props.readTimeoutMs()));

    RestClient client = RestClient.builder()
            .baseUrl(props.baseUrl())
            .requestFactory(factory)
            .requestInterceptor(new ResponseDecryptInterceptor(cryptoService))
            .build();

    return HttpServiceProxyFactory.builderFor(RestClientAdapter.create(client))
            .build()
            .createClient(ExternalApiClient.class);
}
```

클라이언트 인터페이스는 **평문 DTO를 반환**한다. 응답이 암호화돼 있다는 사실은 인터페이스 어디에도 드러나지 않는다.

```java
@HttpExchange
public interface ExternalApiClient {
    @PostExchange("/v1/data")
    DataResponse getData(@RequestParam("resource") String resource,
                         @RequestParam("userId") String userId,
                         @RequestParam("apiKey") String apiKey);
}
```

암호화 모듈도 공통 라이브러리를 직접 부르지 않고 `CryptoService` 하나로 감쌌다. 업무 코드는 `encrypt` / `decrypt` / `getApiKey`만 알고, 키·IV 같은 설정은 이 서비스 안에 머문다.

### 서비스에 남은 것

```java
public Result getData(Long targetId, Session session) {
    TargetInfo target = resolveTarget(targetId, session);        // 대상 확인 + 권한 판단
    DataResponse response = callExternalApi(target, session);    // 외부 API 호출
    return toResult(response);                                    // 우리 응답 형식으로 변환
}
```

- **요청 암호화**는 여전히 서비스에서 한다(`cryptoService.encrypt(...)`). 어떤 파라미터를 암호화할지는 API마다 달라서, 인터셉터에서 일괄 처리하기보다 호출하는 쪽이 명시적으로 드러내는 편이 읽기 쉽다고 봤다.
- **실패는 원인별로 구분**했다. 상대 응답이 비어 있으면 `502 Bad Gateway`, 호출 자체가 실패하면 `504 Gateway Timeout`으로 바꿔서, 화면과 로그만 보고도 "상대가 이상한 값을 줬는지 / 상대에 닿지 못했는지"를 알 수 있다.

## 결과

- 서비스는 **암호화를 모르는 상태로** 대상 확인 → 권한 → 변환만 담당한다.
- 같은 외부 시스템에 API가 추가돼도 `@HttpExchange` 메서드만 늘리면 복호화는 자동으로 적용된다.
- 복호화 규약이 바뀌면(필드 추가, 알고리즘 변경) 인터셉터 한 곳만 고치면 된다.

## 지금 다시 본다면

- **복호화 실패도 504로 뭉개진다.** 인터셉터가 복호화 실패를 `RestClientException`으로 던지는데, 서비스는 `RestClientException`을 "호출 실패(504)"로 처리한다. 상대에 닿긴 했는데 응답을 못 푼 경우는 502가 더 정확하다. 복호화 실패용 예외를 따로 두어 구분하는 게 낫겠다.
- **알려진 필드만 옮긴다.** 인터셉터가 평문 응답을 만들 때 `status`·`message`·`data` 등 아는 필드만 복사하므로, 상대가 새 필드를 추가하면 조용히 사라진다. 원래 JSON을 복사한 뒤 `data`만 교체하는 방식(`root.deepCopy()` 후 `set("data", ...)`)이 더 안전하다.
- 인터셉터 단위 테스트(암호문 응답 → 평문 DTO, 빈 `data`, 오류 상태 통과)를 붙여 두면 규약이 바뀔 때 바로 알 수 있다.
