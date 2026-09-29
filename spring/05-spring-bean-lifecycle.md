---
title: 빈 생명주기 콜백
---

## 왜 필요한가

DB 커넥션 풀이나 네트워크 소켓처럼, 애플리케이션 시작 시점에 연결을 미리 맺어두고 종료 시점에 모두 끊으려면 **객체의 초기화와 종료 작업**이 필요하다.

> **DB 커넥션 풀**: 애플리케이션 서버와 DB의 연결을 미리 맺어두고, 요청이 오면 연결을 재활용하는 것.

### 예제: 생성자에서 연결하면 생기는 문제

```java
public class NetworkClient {
    private String url;

    public NetworkClient() {
        System.out.println("생성자 호출, url = " + url);
        connect();
        call("초기화 연결 메시지");
    }

    public void setUrl(String url) { this.url = url; }
    public void connect() { System.out.println("connect: " + url); }
    public void call(String message) { System.out.println("call: " + url + " message = " + message); }
    public void disconnect() { System.out.println("close: " + url); }
}

@Configuration
static class LifeCycleConfig {
    @Bean
    public NetworkClient networkClient() {
        NetworkClient networkClient = new NetworkClient();
        networkClient.setUrl("http://hello-spring.dev");
        return networkClient;
    }
}
```

```
생성자 호출, url = null
connect: null
call: null message = 초기화 연결 메시지
```

객체 생성 단계에는 url이 없고, 생성 후 수정자 주입으로 `setUrl()`이 호출되어야 url이 생긴다.

## 스프링 빈의 라이프사이클

> 객체 생성 → 의존관계 주입 (생성자 주입은 예외: 생성과 동시에 주입)

빈은 **의존관계 주입이 끝나야** 데이터를 사용할 준비가 완료된다. 그래서 초기화는 주입이 끝난 뒤에 해야 한다. 스프링은 주입 완료 시점과 컨테이너 종료 직전을 **콜백**으로 알려준다.

> 스프링 컨테이너 생성 → 빈 생성 → 의존관계 주입 → **초기화 콜백** → 사용 → **소멸 전 콜백** → 스프링 종료

- **초기화 콜백**: 빈 생성 + 의존관계 주입 완료 후 호출
- **소멸 전 콜백**: 빈이 소멸되기 직전에 호출

> **객체의 생성과 초기화를 분리하자.**
> 생성자는 필수 정보(파라미터)를 받아 메모리를 할당하고 객체를 만드는 책임을 가진다. 초기화는 그 값들로 외부 커넥션을 연결하는 등 무거운 동작을 한다. 둘을 명확히 나누는 것이 유지보수에 좋다. 단, 내부 값만 살짝 바꾸는 단순한 초기화라면 생성자에서 처리하는 게 나을 수도 있다.

> 싱글톤 빈은 컨테이너 종료 시 함께 종료되므로 컨테이너 종료 직전에 소멸 전 콜백이 일어난다. 생명주기가 짧은 빈은 컨테이너와 무관하게 해당 빈이 종료되기 직전에 일어난다 → [빈 스코프](./06-spring-bean-scope.md)

## 콜백 방법 3가지

### 1. 인터페이스 — InitializingBean, DisposableBean

```java
public class NetworkClient implements InitializingBean, DisposableBean {

    @Override
    public void afterPropertiesSet() throws Exception { // 의존관계 주입이 끝나면 호출
        connect();
        call("초기화 연결 메시지");
    }

    @Override
    public void destroy() throws Exception {
        disconnect();
    }
}
```

```
생성자 호출, url = null
NetworkClient.afterPropertiesSet
connect: http://hello-spring.dev
call: http://hello-spring.dev message = 초기화 연결 메시지
... Closing
NetworkClient.destroy
close: http://hello-spring.dev
```

단점:
- 스프링 전용 인터페이스에 의존한다.
- 초기화·소멸 메서드 이름을 바꿀 수 없다.
- 코드를 고칠 수 없는 외부 라이브러리에 적용할 수 없다.

> 스프링 초창기 방식이라 지금은 거의 사용하지 않는다.

### 2. 빈 등록 시 초기화·소멸 메서드 지정

```java
public class NetworkClient {
    public void init()  { connect(); call("초기화 연결 메시지"); }
    public void close() { disconnect(); }
}

@Bean(initMethod = "init", destroyMethod = "close")
public NetworkClient networkClient() { ... }
```

특징:
- 메서드 이름을 자유롭게 정할 수 있다.
- 빈이 스프링 코드에 의존하지 않는다.
- 코드가 아니라 설정 정보를 쓰므로 **외부 라이브러리에도 적용 가능**하다.

**종료 메서드 추론**
- `destroyMethod`의 기본값은 `(inferred)`다.
- 라이브러리는 대부분 `close`, `shutdown`이라는 종료 메서드를 쓰는데, 이 이름의 메서드를 자동으로 호출해 준다.
- 그래서 `@Bean`으로 등록하면 종료 메서드를 적지 않아도 잘 동작한다.
- 추론을 끄려면 `destroyMethod = ""`.

### 3. 애노테이션 — @PostConstruct, @PreDestroy

```java
public class NetworkClient {
    @PostConstruct
    public void init()  { connect(); call("초기화 연결 메시지"); }

    @PreDestroy
    public void close() { disconnect(); }
}
```

특징:
- **최신 스프링에서 가장 권장하는 방법.** 애노테이션 하나만 붙이면 된다.
- 스프링 종속 기술이 아니라 **JSR-250 자바 표준**이라 다른 컨테이너에서도 동작한다. (패키지: 스프링 부트 2 이하는 `javax.annotation`, 스프링 부트 3부터는 `jakarta.annotation`)
- 컴포넌트 스캔과 잘 어울린다.
- 유일한 단점: 외부 라이브러리에는 적용할 수 없다.

## 정리

- **`@PostConstruct`, `@PreDestroy`를 사용하자.**
- 코드를 고칠 수 없는 외부 라이브러리를 초기화·종료해야 하면 `@Bean`의 `initMethod`, `destroyMethod`를 사용하자.
