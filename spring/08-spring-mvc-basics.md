---
title: 스프링 MVC 기본 기능 — 로깅, 요청 매핑, 요청·응답, 메시지 컨버터
---

## 로깅

### 라이브러리

- 스프링 부트를 쓰면 `spring-boot-starter-logging`이 함께 포함되고, 기본으로 **SLF4J + Logback**을 사용한다.
- Logback, Log4J, Log4J2 등 수많은 로그 라이브러리를 통합해서 인터페이스로 제공하는 것이 SLF4J다. **SLF4J는 인터페이스, Logback은 구현체.** 실무에서는 스프링 부트 기본인 Logback을 대부분 쓴다.

### 선언과 호출

```java
private final Logger log = LoggerFactory.getLogger(getClass());
private static final Logger log = LoggerFactory.getLogger(Xxx.class);
@Slf4j // 롬복이 위 코드를 자동 생성

log.info("hello");
log.info("username={}, age={}", username, age); // 문자열 더하기 대신 {} 치환
```

### System.out 대신 로그를 쓰는 이유

- 스레드 정보, 클래스 이름 같은 부가 정보를 함께 볼 수 있고 출력 형식을 조정할 수 있다.
- **로그 레벨**로 개발 서버는 전부 출력, 운영 서버는 일부만 출력하는 식으로 **코드 수정 없이 설정만으로** 환경별 조절이 가능하다.
- 콘솔뿐 아니라 파일, 네트워크 등 별도 위치에 남길 수 있고, 파일은 일자·용량별로 분할할 수 있다.
- 내부 버퍼링, 멀티 스레드 처리 등으로 성능도 System.out보다 좋다.

→ **실무에서는 항상 로그를 사용한다.**

## 요청 매핑 — 미디어 타입 조건

### consumes — 요청 Content-Type 기준

컨트롤러가 **소비하는** 타입을 지정한다. Content-Type 조건은 `headers`가 아니라 `consumes`를 써야 한다 (스프링 MVC 내부에서 이 값으로 처리하는 것들이 있기 때문).

```java
@PostMapping(value = "/mapping-consume", consumes = MediaType.APPLICATION_JSON_VALUE)
public String mappingConsumes() { ... }
```

- 맞지 않으면 **415 Unsupported Media Type**
- 예: `consumes = "text/plain"`, `consumes = {"text/plain", "application/*"}`, `consumes = MediaType.TEXT_PLAIN_VALUE`

### produces — 요청 Accept 기준

컨트롤러가 **생산하는** 타입을 지정한다.

```java
@PostMapping(value = "/mapping-produce", produces = MediaType.TEXT_HTML_VALUE)
public String mappingProduces() { ... }
```

- 맞지 않으면 **406 Not Acceptable** (클라이언트는 `application/json`만 받겠다는데 서버는 `text/html`을 만드는 경우)
- 예: `produces = "text/plain"`, `produces = {"text/plain", "application/*"}`, `produces = "text/plain;charset=UTF-8"`

## HTTP 요청 데이터

클라이언트 → 서버 데이터 전달 방법은 주로 3가지다.

| 방법 | 형태 | 예 |
|---|---|---|
| GET 쿼리 파라미터 | `/url?username=hello&age=20`, 바디 없음 | 검색, 필터, 페이징 |
| POST HTML Form | `Content-Type: application/x-www-form-urlencoded`, 바디에 `username=hello&age=20` | 회원 가입, 상품 주문 |
| HTTP 메시지 바디 | JSON, XML, TEXT (주로 JSON) / POST, PUT, PATCH | HTTP API |

앞의 두 방식은 형식이 같아서 `request.getParameter()` 또는 `@RequestParam`으로 똑같이 조회한다.

### @RequestParam 필수 여부

```java
@ResponseBody
@RequestMapping("/request-param-required")
public String requestParamRequired(
        @RequestParam(required = true) String username,
        @RequestParam(required = false) Integer age) {
    log.info("username={}, age={}", username, age);
    return "ok";
}
```

- `required` 기본값은 `true`. `username` 없이 요청하면 **400**.
- **주의 — 이름만 있는 파라미터**: `?username=`은 빈 문자열로 통과한다.
- **주의 — 기본형에 null**: `@RequestParam(required = false) int age`에 값이 없으면 null을 int에 넣을 수 없어 **500**. `Integer`로 바꾸거나 `defaultValue`를 쓴다.

```java
@RequestParam(defaultValue = "guest") String username,
@RequestParam(required = false, defaultValue = "-1") int age
```

> `defaultValue`는 빈 문자열에도 적용된다.

## HTTP 응답

서버에서 응답 데이터를 만드는 방법은 3가지다.

| 방법 | 용도 | 위치 |
|---|---|---|
| 정적 리소스 | 정적인 HTML, CSS, JS | 클래스패스의 `/static`, `/public`, `/resources`, `/META-INF/resources` |
| 뷰 템플릿 | 동적인 HTML | `src/main/resources/templates` |
| HTTP 메시지 | HTTP API — 바디에 JSON 등 데이터 | `@ResponseBody`, `@RestController` |

- 정적 리소스는 파일을 **변경 없이 그대로** 서비스한다. `src/main/resources/static/basic/hello-form.html` → `http://localhost:8080/basic/hello-form.html`
- 뷰 템플릿은 템플릿을 거쳐 HTML을 생성한다. 보통 HTML이지만 템플릿이 만들 수 있는 것이면 뭐든 가능하다.

### @RestController

- `@Controller` 대신 쓰면 모든 메서드에 `@ResponseBody`가 적용된다. 뷰 템플릿이 아니라 HTTP 메시지 바디에 직접 데이터를 쓴다.
- `@RestController` 안에 `@ResponseBody`가 들어 있다. `@ResponseBody`를 클래스 레벨에 두면 전체 메서드에 적용된다.

## HTTP 메시지 컨버터

### 스프링 부트 기본 메시지 컨버터 (우선순위 순)

| 컨버터 | 클래스 타입 | 미디어 타입 | 요청 예 | 응답 예 (쓰기 미디어 타입) |
|---|---|---|---|---|
| ByteArrayHttpMessageConverter | `byte[]` | `*/*` | `@RequestBody byte[] data` | `return byte[]` (`application/octet-stream`) |
| StringHttpMessageConverter | `String` | `*/*` | `@RequestBody String data` | `return "ok"` (`text/plain`) |
| MappingJackson2HttpMessageConverter | 객체, `HashMap` | `application/json` 관련 | `@RequestBody HelloData data` | `return helloData` (`application/json`) |

### 어디서 사용될까 — RequestMappingHandlerAdapter

MVC 구조 그림에는 메시지 컨버터가 보이지 않는다. 비밀은 `@RequestMapping`을 처리하는 **RequestMappingHandlerAdapter**에 있다.

![RequestMappingHandlerAdapter 동작 방식](./images/request-mapping-handler-adapter.png)

**ArgumentResolver**
- `HttpServletRequest`, `Model`, `@RequestParam`, `@ModelAttribute`, `@RequestBody`, `HttpEntity`까지 파라미터를 유연하게 처리할 수 있는 이유.
- 어댑터가 ArgumentResolver를 호출해 컨트롤러가 필요로 하는 파라미터 값(객체)을 만들고, 준비가 끝나면 컨트롤러를 호출하며 넘겨준다.
- 동작: `supportsParameter()`로 지원 여부 확인 → `resolveArgument()`로 실제 객체 생성.
- 인터페이스를 확장해 직접 만들 수도 있다.

**ReturnValueHandler** (`HandlerMethodReturnValueHandler`)
- ArgumentResolver와 비슷하게 **응답 값**을 변환·처리한다.
- 컨트롤러가 String으로 뷰 이름을 반환해도 동작하는 이유.

**메시지 컨버터의 위치**

![HTTP 메시지 컨버터 위치](./images/http-message-converter-position.png)

| | 처리 주체 | 사용하는 것 |
|---|---|---|
| 요청 | `@RequestBody`, `HttpEntity`를 처리하는 **ArgumentResolver** | 메시지 컨버터로 필요한 객체 생성 |
| 응답 | `@ResponseBody`, `HttpEntity`를 처리하는 **ReturnValueHandler** | 메시지 컨버터로 응답 결과 생성 |

- `@RequestBody`/`@ResponseBody` → `RequestResponseBodyMethodProcessor`
- `HttpEntity` → `HttpEntityMethodProcessor`

### 확장

다음이 모두 인터페이스라 언제든 확장할 수 있다.

- `HandlerMethodArgumentResolver`
- `HandlerMethodReturnValueHandler`
- `HttpMessageConverter`

대부분의 기능을 스프링이 제공하므로 확장할 일은 많지 않다. 필요하면 `WebMvcConfigurer`를 구현해 빈으로 등록한다.
