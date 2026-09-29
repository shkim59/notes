---
title: 빈 스코프 — 싱글톤, 프로토타입, Provider
---

## 빈 스코프란

빈이 존재할 수 있는 범위. 스프링 빈은 기본적으로 싱글톤 스코프로 생성된다.

| 스코프 | 범위 |
|---|---|
| **singleton** | 기본값. 컨테이너 시작부터 종료까지 유지되는 가장 넓은 범위 |
| **prototype** | 컨테이너가 생성과 의존관계 주입까지만 관여하고 더는 관리하지 않는 매우 짧은 범위 |
| request | 웹 요청이 들어오고 나갈 때까지 |
| session | 웹 세션이 생성되고 종료될 때까지 |
| application | 서블릿 컨텍스트와 같은 범위 |

## 프로토타입 스코프

| | 조회 시 |
|---|---|
| 싱글톤 | 항상 **같은** 인스턴스 반환 |
| 프로토타입 | 조회 시점에 **새** 인스턴스를 생성하고 의존관계 주입·초기화 후 반환 |

![싱글톤 빈 요청 vs 프로토타입 빈 요청](./images/prototype-scope.png)

**핵심: 컨테이너는 프로토타입 빈을 생성하고, 의존관계 주입, 초기화까지만 처리한다.** 반환 이후에는 관리하지 않으므로 관리 책임은 받은 클라이언트에 있다. 그래서 **`@PreDestroy` 같은 종료 메서드가 호출되지 않는다.**

### 코드로 확인

```java
@Scope("singleton") // 기본값
static class SingletonBean {
    @PostConstruct public void init()    { System.out.println("SingletonBean.init"); }
    @PreDestroy    public void destroy() { System.out.println("SingletonBean.destroy"); }
}

@Scope("prototype")
static class PrototypeBean {
    @PostConstruct public void init()    { System.out.println("PrototypeBean.init"); }
    @PreDestroy    public void destroy() { System.out.println("PrototypeBean.destroy"); }
}

@Test
void prototypeBeanFind() {
    var ac = new AnnotationConfigApplicationContext(PrototypeBean.class);
    PrototypeBean bean1 = ac.getBean(PrototypeBean.class);
    PrototypeBean bean2 = ac.getBean(PrototypeBean.class);
    assertThat(bean1).isNotSameAs(bean2);
    ac.close();
}
```

> `AnnotationConfigApplicationContext`에 클래스를 넘기면 그 클래스가 바로 빈으로 등록되므로 `@Component`를 붙이지 않아도 된다.

| | 싱글톤 | 프로토타입 |
|---|---|---|
| 초기화 시점 | 컨테이너 생성 시 1번 | **조회할 때마다** (2번 조회 → init 2번) |
| 인스턴스 | 같음 | 매번 다름 |
| 종료 메서드 | 컨테이너 종료 시 호출 | **호출 안 됨** — 필요하면 클라이언트가 직접 `bean.destroy()` |

## 싱글톤 빈과 함께 쓸 때의 문제

프로토타입 빈을 컨테이너에서 **직접** 조회하면 매번 새 인스턴스라 각자의 `count`가 1이 된다. 그런데 **싱글톤 빈이 프로토타입 빈을 주입받으면** 얘기가 달라진다.

```java
@Scope("singleton")
static class ClientBean {
    private final PrototypeBean prototypeBean; // 생성 시점에 주입된 참조를 계속 보관

    public ClientBean(PrototypeBean prototypeBean) {
        this.prototypeBean = prototypeBean;
    }

    public int logic() {
        prototypeBean.addCount();
        return prototypeBean.getCount();
    }
}

// clientBean1.logic() → 1
// clientBean2.logic() → 2  (같은 프로토타입 인스턴스를 공유!)
```

![싱글톤 빈 내부의 프로토타입 빈](./images/singleton-with-prototype.png)

- `clientBean`은 싱글톤이라 컨테이너 생성 시점에 한 번 만들어지고, 그때 프로토타입 빈을 요청해 **참조를 보관**한다.
- 프로토타입 빈은 **주입 시점에 새로 생성된 것일 뿐, 사용할 때마다 생성되는 게 아니다.**
- 원하는 건 보통 **사용할 때마다** 새 인스턴스다.

> 여러 빈이 같은 프로토타입 빈을 주입받으면 각각 다른 인스턴스를 받는다 (clientA → @x01, clientB → @x02). 그래도 사용할 때마다 새로 생기는 건 아니다.

## 해결: Provider로 DL(Dependency Lookup)

### ApplicationContext를 직접 주입 (비추천)

```java
@Autowired ApplicationContext ac;

public int logic() {
    PrototypeBean prototypeBean = ac.getBean(PrototypeBean.class);
    ...
}
```

- 외부에서 주입(DI)받지 않고 직접 찾는 것을 **DL(의존관계 조회)** 이라 한다.
- 컨테이너 전체를 주입받으면 스프링에 종속되고 단위 테스트가 어려워진다.
- 필요한 건 **지정한 빈을 대신 찾아주는 DL 기능 정도**다.

### ObjectFactory, ObjectProvider

```java
@Autowired
private ObjectProvider<PrototypeBean> prototypeBeanProvider;

public int logic() {
    PrototypeBean prototypeBean = prototypeBeanProvider.getObject(); // 매번 새 인스턴스
    prototypeBean.addCount();
    return prototypeBean.getCount();
}
```

- `getObject()`를 호출하면 내부에서 컨테이너를 통해 빈을 찾아 반환한다.
- 기능이 단순해서 단위 테스트나 mock을 만들기 훨씬 쉽다.

| | 특징 |
|---|---|
| ObjectFactory | 기능 단순, 별도 라이브러리 불필요, 스프링 의존 |
| ObjectProvider | ObjectFactory 상속 + 옵션·스트림 등 편의 기능, 별도 라이브러리 불필요, 스프링 의존 |

### JSR-330 Provider

```groovy
implementation 'javax.inject:javax.inject:1'   // 스프링 부트 3+: jakarta.inject:jakarta.inject-api
```

```java
@Autowired
private Provider<PrototypeBean> prototypeBeanProvider;

public int logic() {
    PrototypeBean prototypeBean = prototypeBeanProvider.get();
    ...
}
```

- `get()` 하나로 기능이 매우 단순하다.
- 별도 라이브러리가 필요하다.
- 자바 표준이라 스프링이 아닌 컨테이너에서도 쓸 수 있다.

## 정리

- 프로토타입 빈은 사용할 때마다 의존관계 주입이 완료된 새 객체가 필요할 때 쓴다. 하지만 실무 웹 애플리케이션은 대부분 싱글톤으로 해결되어 **직접 쓸 일은 매우 드물다.**
- `ObjectProvider`, `JSR-330 Provider`는 프로토타입뿐 아니라 **DL이 필요한 모든 경우**에 쓸 수 있다.
- 둘 중에는 편의 기능이 많고 추가 의존성이 없는 **`ObjectProvider`** 가 기본. 스프링 외 컨테이너에서도 돌아가야 할 때만 JSR-330.
- 자바 표준과 스프링 기능이 겹칠 때는, 다른 컨테이너를 쓸 일이 없다면 대체로 더 다양하고 편리한 스프링 기능을 쓰면 된다.
- 참고: `@Lookup` 애노테이션 방식도 있지만 위 방법들로 충분하다.
