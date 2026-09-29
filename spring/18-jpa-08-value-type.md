---
title: JPA 8. 값 타입
---

# JPA 8. 값 타입

## JPA의 데이터 타입 분류

- **엔티티 타입**
  - `@Entity`로 정의하는 객체
  - 내부 값이 바뀌어도 **식별자로 추적 가능**
- **값 타입**
  - `int`, `Integer`, `String`처럼 단순히 값으로 쓰는 타입
  - 식별자가 없어 변경 시 추적 불가 (100을 200으로 바꾸면 완전히 다른 값)

## 값 타입 분류

- **기본 값 타입**: 자바 기본 타입(`int`, `double`), 래퍼 클래스(`Integer`, `Long`), `String`
  - 엔티티에 생명주기를 의존한다 (회원을 삭제하면 이름, 나이도 삭제)
  - 공유하면 안 된다 (한 회원의 이름을 바꿨는데 다른 회원 이름이 바뀌면 안 됨)
- **임베디드 타입**: 기본 값 타입을 모아 직접 정의한 복합 값 타입
- **컬렉션 값 타입**: 자바 컬렉션에 기본 값 타입이나 임베디드 타입을 넣은 것

## 임베디드 타입

```java
// 사용 전: 회원이 너무 상세한 데이터를 직접 가짐 → 응집도가 낮음
@Entity
public class Member {
    @Id @GeneratedValue
    private Long id;
    private String name;

    LocalDateTime startDate; // 근무 기간
    LocalDateTime endDate;

    private String city;     // 집 주소
    private String street;
    private String zipcode;
}
```

```java
// 사용 후
@Entity
public class Member {
    @Id @GeneratedValue
    private Long id;
    private String name;

    @Embedded Period workPeriod;   // 근무 기간
    @Embedded Address homeAddress; // 집 주소
}

@Embeddable
public class Period {
    private LocalDateTime startDate;
    private LocalDateTime endDate;

    public boolean isWork(LocalDateTime date) {
        // 값 타입을 위한 메서드를 정의할 수 있다
    }

    protected Period() {} // 기본 생성자 필수
}

@Embeddable
public class Address {
    @Column(name = "city")
    private String city;
    private String street;
    private String zipcode;

    protected Address() {}
}
```

- `@Embeddable`: 값 타입을 정의하는 곳 / `@Embedded`: 값 타입을 사용하는 곳 / 기본 생성자 필수

### 장점

- 데이터와 행위(메서드)를 함께 표현해 의미가 명확해진다
- 재사용 가능하고 응집도가 높다
- 테이블은 그대로 두고 엔티티를 객체지향적으로 쓸 수 있다
- 잘 설계된 ORM 애플리케이션은 **매핑한 테이블 수보다 클래스 수가 더 많다**
- 모든 값 타입은 엔티티의 생명주기에 의존한다 (UML의 컴포지션 관계)

### 테이블 매핑

![임베디드 타입 매핑](./images/jpa08-1.png)

- 임베디드 타입은 엔티티의 값일 뿐이므로 엔티티의 테이블에 매핑된다. **사용 전후의 테이블은 같다**
- 임베디드 타입은 다른 값 타입을 포함하거나 엔티티를 참조할 수도 있다

### @AttributeOverride

- 같은 임베디드 타입을 두 번 쓰면 컬럼명이 중복된다 → 속성 재정의

```java
@Embedded Address homeAddress;

@Embedded
@AttributeOverrides({
    @AttributeOverride(name = "city", column = @Column(name = "COMPANY_CITY")),
    @AttributeOverride(name = "street", column = @Column(name = "COMPANY_STREET")),
    @AttributeOverride(name = "zipcode", column = @Column(name = "COMPANY_ZIPCODE"))
})
Address companyAddress;
```

- 임베디드 타입이 null이면 매핑한 컬럼 값은 모두 null

## 값 타입과 불변 객체

- 값 타입은 복잡한 객체를 **단순하고 안전하게** 다루기 위한 개념

### 공유 참조의 위험

![공유 참조](./images/jpa08-2.png)

- 임베디드 타입 같은 값 타입을 여러 엔티티가 공유하면 한쪽의 변경이 다른 쪽에 반영되는 **부작용**이 생긴다
- 값을 복사해서 사용하면 피할 수 있다

![값 복사](./images/jpa08-3.png)

### 객체 타입의 한계

- 기본 타입은 대입하면 값이 복사되지만, 임베디드 타입은 **객체 타입**이라 참조가 복사된다
- 참조 대입을 막을 방법이 없어 공유 참조를 완전히 피할 수 없다

### 불변 객체

- **생성 시점 이후 값을 변경할 수 없는 객체**로 만들면 부작용을 원천 차단할 수 있다
- 생성자로만 값을 설정하고 Setter를 만들지 않는다
- 값을 바꾸고 싶으면 새 객체를 만들어 통째로 교체

### 값 타입 비교

- 동일성(`==`): 참조 값 비교 / 동등성(`equals()`): 값 비교
- 값 타입은 인스턴스가 달라도 값이 같으면 같은 것으로 봐야 한다 → **`equals()`(와 `hashCode()`)를 적절히 재정의** (보통 모든 필드 사용)
