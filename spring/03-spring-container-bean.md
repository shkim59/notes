---
title: 스프링 컨테이너와 빈 — 싱글톤, 컴포넌트 스캔
---

## 스프링 컨테이너

- `ApplicationContext`는 인터페이스이며, 이를 스프링 컨테이너라 부른다.
- XML 기반으로도, 애노테이션 기반 자바 설정 클래스로도 만들 수 있다.
- 엄밀히는 `BeanFactory`와 `ApplicationContext`로 구분하지만, `BeanFactory`를 직접 쓰는 일은 거의 없어 보통 `ApplicationContext`를 컨테이너라 한다.

### BeanFactory와 ApplicationContext

![BeanFactory ← ApplicationContext 상속 구조](./images/beanfactory-applicationcontext.png)

| | 역할 |
|---|---|
| **BeanFactory** | 컨테이너의 최상위 인터페이스. 빈 관리·조회(`getBean()`) 담당. 대부분의 핵심 기능은 여기서 나온다 |
| **ApplicationContext** | BeanFactory 기능을 모두 상속 + 애플리케이션 개발에 필요한 부가 기능 |

ApplicationContext의 부가 기능:

- **메시지 소스를 활용한 국제화**: 한국에서 접속하면 한국어, 영어권이면 영어로 출력
- **환경 변수**: 로컬·개발·운영 환경 구분
- **애플리케이션 이벤트**: 이벤트 발행·구독 모델 지원
- **편리한 리소스 조회**: 파일, 클래스패스, 외부 리소스

## BeanDefinition — 빈 설정 메타 정보

- 스프링이 여러 설정 형식을 지원할 수 있는 중심에는 `BeanDefinition`이라는 **추상화**가 있다.
- XML을 읽든 자바 코드를 읽든 결과는 BeanDefinition이고, 컨테이너는 **BeanDefinition만 알면 된다** (역할과 구현의 분리).
- `@Bean`, `<bean>` 하나당 메타 정보가 하나씩 생성되고, 컨테이너는 이를 기반으로 빈을 생성한다.

![BeanDefinition 추상화](./images/beandefinition.png)

![BeanDefinition 코드 레벨 구조](./images/beandefinition-code.png)

| 속성 | 의미 |
|---|---|
| BeanClassName | 생성할 빈의 클래스명 (자바 설정처럼 팩토리 빈을 쓰면 없음) |
| factoryBeanName | 팩토리 역할 빈의 이름 (예: appConfig) |
| factoryMethodName | 빈을 생성할 팩토리 메서드 (예: memberService) |
| Scope | 싱글톤(기본값) |
| lazyInit | 컨테이너 생성 시가 아니라 실제 사용 시점까지 생성을 지연할지 |
| InitMethodName | 생성·의존관계 주입 후 호출되는 초기화 메서드 |
| DestroyMethodName | 제거 직전 호출되는 메서드 |
| Constructor arguments, Properties | 의존관계 주입에 사용 (팩토리 빈 방식이면 없음) |

## 싱글톤

![요청마다 객체를 생성하는 DI 컨테이너](./images/no-singleton.png)

- 웹 애플리케이션은 여러 고객이 동시에 요청한다. 초당 100건이면 초당 100개 객체가 생성·소멸 → 메모리 낭비.
- 객체를 딱 1개만 생성하고 공유하도록 설계하는 것이 **싱글톤 패턴**이다.

### 싱글톤 패턴의 문제점

- 패턴 구현 코드 자체가 많이 들어간다.
- 클라이언트가 구체 클래스에 의존 → **DIP 위반**, OCP 위반 가능성도 높음
- 테스트하기 어렵고, 내부 속성 변경·초기화가 어렵다.
- private 생성자라 자식 클래스를 만들기 어렵다.
- 결론적으로 유연성이 떨어져 **안티패턴**으로 불리기도 한다.

### 싱글톤 컨테이너

- 스프링 컨테이너는 싱글톤 패턴을 적용하지 않아도 객체를 싱글톤으로 관리한다. 이 기능을 **싱글톤 레지스트리**라 한다.
- 지저분한 패턴 코드 없이, DIP·OCP·테스트·private 생성자 제약에서 자유롭게 싱글톤을 쓸 수 있다.

![스프링 컨테이너의 싱글톤 관리](./images/singleton-container.png)

### 주의: 무상태(stateless)로 설계할 것

여러 클라이언트가 같은 인스턴스를 공유하므로 **상태를 유지하면 안 된다.**

- 특정 클라이언트에 의존적인 필드가 있으면 안 된다.
- 특정 클라이언트가 값을 변경할 수 있는 필드가 있으면 안 된다.
- 가급적 읽기만 가능해야 한다.
- 필드 대신 공유되지 않는 지역변수, 파라미터, ThreadLocal을 사용한다.

> 스프링 빈의 필드에 공유 값을 설정하면 정말 큰 장애가 발생할 수 있다.

### @Configuration과 싱글톤

- `@Configuration`이 붙은 설정 클래스는 스프링이 CGLIB로 **상속받은 임의의 클래스**를 만들어 빈으로 등록한다. 이 클래스가 싱글톤을 보장한다.
- `@Bean`만 써도 빈 등록은 되지만, `memberRepository()`처럼 메서드를 직접 호출해 의존관계를 주입할 때 싱글톤이 보장되지 않는다.
- → **스프링 설정 정보에는 항상 `@Configuration`을 사용한다.**

## 컴포넌트 스캔

`@Component`가 붙은 클래스를 스캔해서 자동으로 빈으로 등록한다.

### @ComponentScan

- 빈 기본 이름: 클래스명에서 맨 앞글자만 소문자 (`MemberServiceImpl` → `memberServiceImpl`)
- 직접 지정: `@Component("memberService2")`

### @Autowired 자동 주입

- 생성자에 `@Autowired`를 붙이면 컨테이너가 해당 빈을 찾아 주입한다. 여러 의존관계도 한 번에 주입 가능.
- 기본 조회 전략은 **타입 매칭** (`getBean(MemberRepository.class)`와 비슷).

### 탐색 위치

```java
@ComponentScan(basePackages = "com.java")
```

위치를 지정하지 않으면 `@ComponentScan`이 붙은 클래스의 패키지가 시작 위치가 된다. **설정 클래스를 프로젝트 최상단에 두고 위치를 지정하지 않는 방식을 권장** (스프링 부트의 `@SpringBootApplication`도 이 방식).

### 필터

- `includeFilters`: 스캔 대상 추가
- `excludeFilters`: 스캔 대상 제외

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface MyIncludeComponent {}

@MyIncludeComponent
public class BeanA {}

@MyExcludeComponent
public class BeanB {}
```

```java
@Configuration
@ComponentScan(
    includeFilters = @Filter(type = FilterType.ANNOTATION, classes = MyIncludeComponent.class),
    excludeFilters = @Filter(type = FilterType.ANNOTATION, classes = MyExcludeComponent.class)
)
static class ComponentFilterAppConfig {}

// BeanA는 등록되고, BeanB는 NoSuchBeanDefinitionException
```

| FilterType | 동작 | 예 |
|---|---|---|
| ANNOTATION | 기본값, 애노테이션 인식 | `org.example.SomeAnnotation` |
| ASSIGNABLE_TYPE | 지정 타입과 자식 타입 | `org.example.SomeClass` |
| ASPECTJ | AspectJ 패턴 | `org.example..*Service+` |
| REGEX | 정규 표현식 | `org\.example\.Default.*` |
| CUSTOM | `TypeFilter` 구현 | `org.example.MyTypeFilter` |

> `@Component`면 충분해서 includeFilters를 쓸 일은 거의 없다. excludeFilters도 간혹 쓰는 정도. 옵션을 바꾸기보다 스프링 기본 설정에 맞추는 것을 권장.

### 중복 등록과 충돌

| 상황 | 결과 |
|---|---|
| 자동 vs 자동 (같은 이름) | `ConflictingBeanDefinitionException` |
| 수동 vs 자동 | 과거: 수동 빈이 자동 빈을 오버라이딩 (`Overriding bean definition...` 로그) |
| | **스프링 부트: 기본적으로 오류 발생** |

의도적인 오버라이딩보다 설정이 꼬여서 생기는 경우가 대부분이고, 이런 애매한 버그는 잡기 어렵다. 그래서 스프링 부트는 기본값을 오류로 바꿨다.

```
Consider renaming one of the beans or enabling overriding by setting
spring.main.allow-bean-definition-overriding=true
```

→ 이어서: [의존관계 주입](./04-spring-dependency-injection.md)
