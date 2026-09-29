---
title: 의존관계 주입 — 방법, 옵션, 빈 충돌 해결
---

## 의존관계 주입 방법 4가지

| 방법 | 특징 | 용도 |
|---|---|---|
| **생성자 주입** | 생성자 호출 시점에 딱 1번 호출 보장 | **불변, 필수** 의존관계 |
| 수정자(setter) 주입 | 자바빈 프로퍼티 규약의 setter 사용 | 선택, 변경 가능성이 있는 의존관계 |
| 필드 주입 | 코드는 간결하지만 외부에서 변경 불가 → 테스트 어려움, DI 프레임워크 없이는 동작 불가 | 테스트 코드, `@Configuration` 같은 특수 용도에서만 |
| 일반 메서드 주입 | 여러 필드를 한 번에 주입 가능 | 거의 안 씀 |

### 생성자 주입

```java
@Component
public class OrderServiceImpl implements OrderService {

    private final MemberRepository memberRepository;
    private final DiscountPolicy discountPolicy;

    // 생성자가 딱 1개면 @Autowired 생략 가능
    public OrderServiceImpl(MemberRepository memberRepository, DiscountPolicy discountPolicy) {
        this.memberRepository = memberRepository;
        this.discountPolicy = discountPolicy;
    }
}
```

### 수정자 주입

```java
@Component
public class OrderServiceImpl implements OrderService {

    private MemberRepository memberRepository;

    @Autowired
    public void setMemberRepository(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }
}
```

> `@Autowired`는 주입할 대상이 없으면 오류가 난다. 없어도 동작하게 하려면 `@Autowired(required = false)`.

### 필드 주입

```java
@Component
public class OrderServiceImpl implements OrderService {
    @Autowired private MemberRepository memberRepository;
    @Autowired private DiscountPolicy discountPolicy;
}
```

> 순수 자바 테스트에서는 `@Autowired`가 동작하지 않는다. `@SpringBootTest`처럼 컨테이너를 통합한 경우에만 가능.

> `@Bean` 메서드의 파라미터에도 의존관계가 자동 주입된다. 수동 등록 시 자동 등록된 빈이 필요할 때 유용하다.
>
> ```java
> @Bean
> OrderService orderService(MemberRepository memberRepository, DiscountPolicy discountPolicy) {
>     return new OrderServiceImpl(memberRepository, discountPolicy);
> }
> ```

### 일반 메서드 주입

```java
@Autowired
public void init(MemberRepository memberRepository, DiscountPolicy discountPolicy) {
    this.memberRepository = memberRepository;
    this.discountPolicy = discountPolicy;
}
```

## 옵션 처리

주입할 빈이 없어도 동작해야 할 때:

| 방법 | 대상이 없을 때 |
|---|---|
| `@Autowired(required = false)` | 수정자 메서드 자체가 호출되지 않음 |
| `@Nullable` (`org.springframework.lang`) | `null` 입력 |
| `Optional<>` | `Optional.empty` 입력 |

```java
@Autowired(required = false)
public void setNoBean1(Member member) { }           // 호출 안 됨

@Autowired
public void setNoBean2(@Nullable Member member) { } // null

@Autowired
public void setNoBean3(Optional<Member> member) { } // Optional.empty
```

## 생성자 주입을 선택하라

최근에는 스프링을 포함한 대부분의 DI 프레임워크가 생성자 주입을 권장한다.

**불변**
- 대부분의 의존관계는 한 번 정해지면 애플리케이션 종료 전까지 바뀌면 안 된다.
- 수정자 주입은 setter를 public으로 열어둬야 해서 누군가 실수로 바꿀 수 있다.
- 생성자 주입은 객체 생성 시 1번만 호출되므로 불변하게 설계할 수 있다.

**final 키워드**
- 생성자 주입만 필드에 `final`을 쓸 수 있다. 생성자에서 값 설정을 빠뜨리면 컴파일 오류로 막아준다.

```
java: variable discountPolicy might not have been initialized
```

> 컴파일 오류는 세상에서 가장 빠르고 좋은 오류다.

**정리**
- 프레임워크에 의존하지 않고 순수 자바 언어의 특징을 잘 살리는 방법이다.
- 기본은 생성자 주입, 필수가 아닌 경우에만 수정자 주입을 옵션으로. 둘은 함께 쓸 수 있다.
- **필드 주입은 사용하지 않는다.**

### 롬복

`@RequiredArgsConstructor`는 final 필드를 모아 생성자를 자동으로 만들어 준다. 생성자가 1개라 `@Autowired`도 생략된다.

```java
@Component
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {
    private final MemberRepository memberRepository;
    private final DiscountPolicy discountPolicy;
}
```

## 조회 빈이 2개 이상일 때

`@Autowired`는 타입으로 조회하므로 같은 타입의 빈이 여럿이면 문제가 된다.

```java
@Component public class FixDiscountPolicy implements DiscountPolicy {}
@Component public class RateDiscountPolicy implements DiscountPolicy {}

@Autowired private DiscountPolicy discountPolicy;
// NoUniqueBeanDefinitionException: expected single matching bean but found 2
```

하위 타입으로 지정하면 DIP를 위배하고, 이름만 다른 같은 타입 빈 2개는 해결도 안 된다. 해결 방법은 세 가지다.

### 1. 필드명 매칭

타입 매칭 결과가 여럿이면 **필드명, 파라미터명**으로 빈 이름을 추가 매칭한다.

```java
@Autowired
private DiscountPolicy rateDiscountPolicy; // rateDiscountPolicy 빈이 주입됨
```

순서: ① 타입 매칭 → ② 결과가 2개 이상이면 필드명/파라미터명으로 빈 이름 매칭

### 2. @Qualifier

빈 이름을 바꾸는 게 아니라 **추가 구분자**를 붙인다.

```java
@Component
@Qualifier("mainDiscountPolicy")
public class RateDiscountPolicy implements DiscountPolicy {}

public OrderServiceImpl(MemberRepository memberRepository,
                        @Qualifier("mainDiscountPolicy") DiscountPolicy discountPolicy) { ... }
```

순서: ① `@Qualifier`끼리 매칭 → ② 빈 이름 매칭 → ③ `NoSuchBeanDefinitionException`

> 못 찾으면 같은 이름의 빈을 찾긴 하지만, `@Qualifier`는 `@Qualifier`를 찾는 용도로만 쓰는 게 명확하다.

### 3. @Primary

여러 빈이 매칭되면 `@Primary`가 우선권을 가진다.

```java
@Component
@Primary
public class RateDiscountPolicy implements DiscountPolicy {}
```

### @Primary vs @Qualifier

- `@Qualifier`는 주입받는 모든 곳에 붙여야 하는 단점이 있다.
- 활용 예: 자주 쓰는 메인 DB 커넥션 빈은 `@Primary`로 편하게, 가끔 쓰는 서브 DB 커넥션 빈은 `@Qualifier`로 명시적으로.
- **우선순위**: 스프링은 자동보다 수동, 넓은 선택권보다 좁은 선택권이 우선 → `@Qualifier`가 더 높다.

### 애노테이션 직접 만들기

`@Qualifier("mainDiscountPolicy")`처럼 문자열을 쓰면 컴파일 시 타입 체크가 안 된다.

```java
@Target({ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER,
         ElementType.TYPE, ElementType.ANNOTATION_TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Qualifier("mainDiscountPolicy")
public @interface MainDiscountPolicy {}

@Component
@MainDiscountPolicy
public class RateDiscountPolicy implements DiscountPolicy {}

public OrderServiceImpl(MemberRepository memberRepository,
                        @MainDiscountPolicy DiscountPolicy discountPolicy) { ... }
```

애노테이션에는 상속 개념이 없다. 여러 애노테이션을 모아 쓰는 건 스프링이 지원하는 기능이다. `@Autowired`도 재정의할 수 있지만, 뚜렷한 목적 없는 재정의는 유지보수에 혼란만 더한다.

## 조회한 빈이 모두 필요할 때 — List, Map

클라이언트가 할인 종류(rate, fix)를 선택하는 경우처럼, 해당 타입의 빈이 모두 필요할 때가 있다. 스프링을 쓰면 **전략 패턴**을 간단히 구현할 수 있다.

```java
static class DiscountService {
    private final Map<String, DiscountPolicy> policyMap;
    private final List<DiscountPolicy> policyList;

    public DiscountService(Map<String, DiscountPolicy> policyMap, List<DiscountPolicy> policyList) {
        this.policyMap = policyMap;
        this.policyList = policyList;
    }

    public int discount(Member member, int price, String discountCode) {
        DiscountPolicy discountPolicy = policyMap.get(discountCode);
        return discountPolicy.discount(member, price);
    }
}

// 사용
discountService.discount(member, 10000, "fixDiscountPolicy");  // 1000
discountService.discount(member, 20000, "rateDiscountPolicy"); // 2000
```

- `Map<String, DiscountPolicy>`: 키에 빈 이름, 값에 해당 타입으로 조회한 모든 빈
- `List<DiscountPolicy>`: 해당 타입의 모든 빈. 없으면 빈 컬렉션 주입
- `new AnnotationConfigApplicationContext(클래스...)`에 넘긴 클래스는 자동으로 빈 등록된다.

> 실무 적용 사례: [전략 패턴으로 댓글 알림 분기 처리하기](../troubleshooting/02-strategy-pattern-comment-alarm.md)

## 자동 vs 수동 — 실무 운영 기준

**기본은 자동.** 스프링은 `@Controller`, `@Service`, `@Repository`처럼 계층별 자동 스캔을 지원하고, 스프링 부트도 컴포넌트 스캔이 기본이다. `@Configuration`에 일일이 `@Bean`을 적는 건 번거롭고, 설정 정보가 커지면 관리 자체가 부담이다. 그리고 **자동 등록으로도 OCP, DIP를 지킬 수 있다.**

| 구분 | 예 | 등록 방식 |
|---|---|---|
| 업무 로직 빈 | 컨트롤러, 서비스, 리포지토리 | **자동** — 수가 많고 패턴이 유사하며, 문제 위치가 명확함 |
| 기술 지원 빈 | DB 연결, 공통 로그, AOP | **수동** — 수는 적지만 영향 범위가 넓고, 적용 여부조차 파악하기 어려움 → 설정 정보에 바로 드러나게 |
| 다형성을 적극 활용하는 비즈니스 로직 | 위 `Map<String, DiscountPolicy>` | **수동 등록 고민** 또는 **특정 패키지에 모아두기** |

다형성 예시에서 어떤 빈들이 주입될지 코드만 보고 알기 어렵다. 별도 설정으로 수동 등록하면 한눈에 보인다.

```java
@Configuration
public class DiscountPolicyConfig {
    @Bean public DiscountPolicy rateDiscountPolicy() { return new RateDiscountPolicy(); }
    @Bean public DiscountPolicy fixDiscountPolicy()  { return new FixDiscountPolicy(); }
}
```

> 핵심은 **딱 보고 이해가 되어야 한다**는 것.

→ 이어서: [빈 생명주기 콜백](./05-spring-bean-lifecycle.md)
