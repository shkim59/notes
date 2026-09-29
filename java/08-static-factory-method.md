---
title: 정적 팩터리 메서드 (Effective Java 1)
---

# 정적 팩터리 메서드

> Effective Java 아이템 1: 생성자 대신 정적 팩터리 메서드를 고려하라

## 정적 팩터리 메서드 vs public 생성자

클래스의 인스턴스를 반환하는 **static** 메서드

```java
public class MyClass {
    // 생성자를 private으로 감춰 외부에서 직접 인스턴스화하는 것을 막는다
    private MyClass() {}

    public static MyClass of() {
        return new MyClass();
    }
}

MyClass myClass = MyClass.of();
```

public 생성자는 클래스의 인스턴스를 직접 생성할 수 있게 허용하는 일반적인 방식

```java
public class MyClass {
    public MyClass() {}
}

MyClass myClass = new MyClass();
```

## 장점

### 1. 이름을 가질 수 있다

- 생성자는 하나의 시그니처로 하나만 만들 수 있다. 매개변수 순서를 바꿔 제한을 피할 수 있지만 각 생성자의 역할을 기억하기 어렵다.

```java
// 생성자가 무엇을 하는지 명확하지 않음
BigInteger bigInt = new BigInteger(10, 5, new Random());

// 의도가 명확히 드러남
BigInteger bigInt = BigInteger.probablePrime(10, new Random());
```

### 2. 호출될 때마다 인스턴스를 새로 생성하지 않아도 된다

- 인스턴스를 캐싱해 재활용하면 불필요한 객체 생성을 피할 수 있다 (생성 비용이 높을수록 효과가 큼)
- 언제 어느 인스턴스를 살아 있게 할지 통제할 수 있다 (**인스턴스 통제 클래스**)
  - 새 인스턴스 생성 여부 결정: 항상 새로 / 캐싱된 것 반환 / 조건부 반환
  - 인스턴스 개수 제한: 하나만(싱글턴), 정해진 개수만(`Boolean.TRUE`, `Boolean.FALSE`), 생성 불가(유틸리티 클래스)

```java
public class ProductFactory {
    private static final Map<String, Product> productCache = new HashMap<>();

    private ProductFactory() {}

    public static Product getProduct(String type) {
        // 캐시에 있으면 반환
        if (productCache.containsKey(type)) {
            return productCache.get(type);
        }

        // 없으면 새로 생성해 캐시에 저장 후 반환
        Product newProduct = switch (type) {
            case "book" -> new Book();
            case "electronics" -> new Electronics();
            default -> throw new IllegalArgumentException("알 수 없는 Product 타입: " + type);
        };
        productCache.put(type, newProduct);
        return newProduct;
    }
}

Product p1 = ProductFactory.getProduct("book");        // 새로 생성 및 캐싱
Product p2 = ProductFactory.getProduct("book");        // 캐시된 인스턴스 (p1과 동일)
Product p3 = ProductFactory.getProduct("electronics"); // 새로 생성 및 캐싱
```

- **싱글턴**: 인스턴스가 애플리케이션 내에서 단 하나만 존재하도록 보장
  - 자원 관리 최적화: 공유 자원에 접근하는 유일한 통로 (커넥션 풀, 스레드 풀, 설정 관리자, 로거 등)
  - 일관성 유지: 여러 객체가 동일한 상태를 참조
  - 성능 향상: 생성 비용이 높은 객체의 오버헤드 감소
- **인스턴스화 불가**: 정적 메서드·필드만으로 구성된 클래스 (`Math`, `Collections`, `Arrays`)
  - 관련 유틸리티를 논리적으로 묶고, 상태가 없으니 인스턴스를 만들 이유도 없음
- **동일성 보장**: 동치인 인스턴스가 단 하나뿐임을 보장
  - 동일성(Identity): 같은 메모리 주소인지 (`==`)
  - 동치성(Equality): 논리적으로 같은 값인지 (`equals()`)
  - `equals()`로 같으면 `==`로도 같음을 보장 → 논리적으로 같은 값은 물리적으로도 하나의 인스턴스

```java
String s1 = new String("hello");
String s2 = new String("hello");
System.out.println(s1 == s2);      // false (다른 인스턴스)
System.out.println(s1.equals(s2)); // true

// Integer.valueOf는 -128 ~ 127 범위를 캐싱
Integer i1 = Integer.valueOf(100);
Integer i2 = Integer.valueOf(100);
Integer i3 = Integer.valueOf(500);
Integer i4 = Integer.valueOf(500);

System.out.println(i1 == i2); // true (캐싱 범위 내 → 동일 인스턴스)
System.out.println(i3 == i4); // false (캐싱 범위 밖 → 새 인스턴스)
```

- **플라이웨이트 패턴**의 근간
  - 공유 가능한 상태(intrinsic)를 분리하고, 고유한 상태(extrinsic)만 외부에서 관리해 메모리 사용량을 줄이는 패턴

### 3. 반환 타입의 하위 타입 객체를 반환할 수 있다

- 생성자는 자기 클래스의 인스턴스만 반환하지만, 정적 팩터리는 하위 클래스 인스턴스도 반환 가능 → 다형성, 유연성
- 구현 클래스를 공개하지 않고 객체를 반환할 수 있어 API를 작게 유지할 수 있다
- 반환 타입으로 인터페이스를 쓰는 **인터페이스 기반 프레임워크**의 핵심 기술 → 낮은 결합도

### 4. 입력 매개변수에 따라 다른 클래스의 객체를 반환할 수 있다

- 런타임에 객체 생성 전략을 유연하게 바꿀 수 있다 (3번의 연장)

```java
public class Person {
    private String name;
    private int age;

    private Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public static Person newAdult(String name, int age) {
        if (age < 18) throw new IllegalArgumentException("성인이 아닙니다");
        return new Person(name, age);
    }

    public static Person newChild(String name, int age) {
        if (age >= 18) throw new IllegalArgumentException("미성년자가 아닙니다");
        return new Person(name, age);
    }
}
```

### 5. 작성 시점에 반환할 객체의 클래스가 존재하지 않아도 된다

- **서비스 제공자 프레임워크**의 근간 → 구현체와 클라이언트를 분리해 연결을 유연하게 해주는 구조

```java
// 서비스 인터페이스
public interface PaymentService {
    void processPayment(double amount);
}

public class PaymentServiceProvider {
    private static final Map<String, PaymentService> services = new HashMap<>();

    // 제공자 등록 API
    public static void registerService(String type, PaymentService service) {
        services.put(type, service);
    }

    // 서비스 접근 API (정적 팩터리 메서드)
    public static PaymentService getService(String type) {
        return services.get(type);
    }
}
```

| 구성 요소 | 역할 | JDBC 예시 |
|---|---|---|
| 서비스 인터페이스 | 서비스의 동작을 정의 | `java.sql.Connection` |
| 제공자 등록 API | 구현체가 자신을 프레임워크에 등록 | `DriverManager.registerDriver` |
| 서비스 접근 API | 클라이언트가 인스턴스를 얻음 (대부분 정적 팩터리) | `DriverManager.getConnection` |

- 클라이언트는 서비스 인터페이스와 접근 API만 알면 되고, 구현체와 완전히 분리된다.
- `DriverManager.getConnection`은 어떤 드라이버 클래스를 반환할지 작성 시점에 몰라도 된다. 런타임에 조건에 맞는 구현체를 찾아 반환한다.
- 이런 구조가 없으면 리플렉션(`Class.forName("com.mysql.cj.jdbc.Driver")`)을 써야 하는데, 구현 클래스 이름에 강하게 결합되고, 컴파일 타임 안전성이 없고, 성능 오버헤드와 보안 문제가 있다.
- 변형: **브릿지 패턴**(추상화와 구현을 분리), **의존 객체 주입(DI)**(의존 객체를 외부에서 주입)

## 단점

1. **public/protected 생성자 없이 정적 팩터리만 제공하면 하위 클래스를 만들 수 없다**
   - 오히려 상속 대신 컴포지션을 사용하도록 유도하는 면도 있다
2. **프로그래머가 찾기 어렵다**
   - API 문서에서 생성자처럼 눈에 띄지 않으므로 명명 규칙을 따르는 것이 중요하다

## 자주 사용하는 명명 방식

| 이름 | 의미 | 예시 |
|---|---|---|
| `from` | 매개변수 하나로 해당 타입 인스턴스 반환 | `Date.from(instant)` |
| `of` | 여러 매개변수로 인스턴스 반환 | `Set.of(a, b, c)` |
| `valueOf` | `from`/`of`의 자세한 버전 | `Integer.valueOf("123")` |
| `instance` / `getInstance` | (매개변수에 맞는) 인스턴스 반환, 같은 인스턴스일 수 있음 | |
| `create` / `newInstance` | 매번 새로운 인스턴스 생성 | |
| `getType` / `newType` | 다른 클래스의 팩터리 메서드 | `Files.getFileStore(path)` |
| `type` | `getType`/`newType`의 간결한 버전 | `Collections.list(e)` |
