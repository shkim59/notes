---
title: JPA 3. 엔티티 매핑
---

# JPA 3. 엔티티 매핑

> 💡 엔티티 매핑
> - 객체와 테이블: `@Entity`, `@Table`
> - 필드와 컬럼: `@Column`
> - 기본 키: `@Id`
> - 연관관계: `@ManyToOne`, `@JoinColumn`

## 객체와 테이블 매핑

### @Entity

- `@Entity`가 붙은 클래스는 JPA가 관리하는 **엔티티**
- 주의사항
  - **기본 생성자 필수** (파라미터 없는 `public` 또는 `protected` 생성자)
  - `final` 클래스, `enum`, `interface`, `inner` 클래스에는 사용 불가
  - 저장할 필드에 `final` 사용 불가
- `name` 속성: JPA에서 사용할 엔티티 이름. 기본값은 클래스 이름이고, 가급적 기본값 사용

### @Table

- 엔티티와 매핑할 테이블 지정. 생략하면 엔티티 이름을 테이블 이름으로 사용

```java
@Entity
@Table(name = "MBR")
public class Member { }
```

| 속성 | 기능 | 기본값 |
|---|---|---|
| name | 매핑할 테이블 이름 | 엔티티 이름 |
| catalog | DB catalog 매핑 | |
| schema | DB schema 매핑 | |
| uniqueConstraints | DDL 생성 시 유니크 제약 조건 생성 | |

## 데이터베이스 스키마 자동 생성

- 애플리케이션 실행 시점에 DDL을 자동 생성 → 테이블 중심에서 객체 중심으로
- 방언을 활용해 DB에 맞는 DDL을 생성
- **생성된 DDL은 개발 장비에서만 사용**. 운영에서는 쓰지 않거나 다듬어서 사용

| `hibernate.hbm2ddl.auto` | 설명 |
|---|---|
| create | 기존 테이블 삭제 후 다시 생성 (DROP + CREATE) |
| create-drop | create와 같으나 종료 시점에 DROP |
| update | 변경분만 반영 (운영 DB에는 사용 금지) |
| validate | 엔티티와 테이블이 정상 매핑되었는지만 확인 |
| none | 사용하지 않음 |

- 개발 초기: `create` 또는 `update`
- 테스트 서버: `update` 또는 `validate`
- 스테이징·운영: `validate` 또는 `none`
- 운영에는 절대 `create`, `create-drop`, `update`를 쓰지 않는다

### DDL 생성 기능

```java
@Column(nullable = false, length = 10) // 필수, 10자 이하

@Table(uniqueConstraints = {
    @UniqueConstraint(name = "NAME_AGE_UNIQUE", columnNames = {"NAME", "AGE"})
})
```

- DDL 자동 생성에만 사용되고 JPA 실행 로직에는 영향을 주지 않는다

## 필드와 컬럼 매핑

| 어노테이션 | 설명 |
|---|---|
| `@Column` | 컬럼 매핑 |
| `@Temporal` | 날짜 타입 매핑 |
| `@Enumerated` | enum 타입 매핑 |
| `@Lob` | BLOB, CLOB 매핑 |
| `@Transient` | 매핑하지 않음 |

- **@Column**: `name`, `nullable`, `length`, `columnDefinition` 등. `unique`는 이름이 랜덤하게 생성되므로 `@Table`의 `uniqueConstraints` 사용 권장
- **@Enumerated**: **`ORDINAL`은 사용하지 말 것**. 타입이 추가/변경되면 순서가 달라져 문제가 생긴다 → `EnumType.STRING`
- **@Temporal**: `java.util.Date`, `Calendar` 매핑용. `LocalDate`, `LocalDateTime`은 최신 하이버네이트가 지원하므로 생략 가능
- **@Lob**: 필드가 문자면 CLOB(`String`, `char[]`), 나머지는 BLOB(`byte[]`)
- **@Transient**: DB에 저장·조회하지 않고 메모리에서만 임시로 값을 보관할 때

## 기본 키 매핑

```java
@Id @GeneratedValue(strategy = GenerationType.AUTO)
private Long id;
```

- **직접 할당**: `@Id`만 사용
- **자동 생성** (`@GeneratedValue`)
  - `IDENTITY`: DB에 위임 (MySQL)
  - `SEQUENCE`: DB 시퀀스 사용 (Oracle), `@SequenceGenerator` 필요
  - `TABLE`: 키 생성용 테이블 사용 (모든 DB), `@TableGenerator` 필요
  - `AUTO`: 방언에 따라 자동 지정 (기본값)

### IDENTITY 전략

- MySQL의 `AUTO_INCREMENT` 등. 기본 키 생성을 DB에 위임
- `AUTO_INCREMENT`는 **INSERT를 실행한 뒤에야** ID를 알 수 있다
- 그런데 영속성 컨텍스트에 저장하려면 식별자가 필요하다
- 그래서 IDENTITY 전략은 **`persist` 시점에 즉시 INSERT를 실행**하고 DB에서 식별자를 조회한다
- 따라서 쓰기 지연으로 모아서 한 번에 INSERT하는 것이 불가능하다

### SEQUENCE 전략

```java
@Entity
@SequenceGenerator(
    name = "MEMBER_SEQ_GENERATOR",
    sequenceName = "MEMBER_SEQ", // 매핑할 DB 시퀀스 이름
    initialValue = 1, allocationSize = 50)
public class Member {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "MEMBER_SEQ_GENERATOR")
    private Long id;
}
```

- `persist` 시 먼저 DB 시퀀스로 식별자를 조회해 엔티티에 할당하고, 영속성 컨텍스트에 저장한다. 실제 INSERT는 커밋(플러시) 시점

![SEQUENCE 전략](./images/jpa03-1.png)

- **allocationSize**
  - 시퀀스를 얻으려면 매번 DB와 통신해야 한다
  - size만큼 한 번에 가져와 메모리에 두고 사용 → 통신 횟수를 줄여 성능 최적화
  - 여러 서버가 동시에 접근해도 구간이 겹치지 않는다 (1~50, 51~100)

### TABLE 전략

- 키 생성 전용 테이블로 시퀀스를 흉내내는 전략
- 모든 DB에 적용 가능하지만 성능이 떨어져 운영에서는 잘 쓰지 않음

```java
@Entity
@TableGenerator(
    name = "MEMBER_SEQ_GENERATOR",
    table = "MY_SEQUENCES",
    pkColumnValue = "MEMBER_SEQ", allocationSize = 1)
public class Member {
    @Id
    @GeneratedValue(strategy = GenerationType.TABLE, generator = "MEMBER_SEQ_GENERATOR")
    private Long id;
}
```

### 권장하는 식별자 전략

- 기본 키 제약 조건: NOT NULL, UNIQUE, **변하면 안 된다**
- 미래까지 이 조건을 만족하는 자연키는 찾기 어렵다 → **대리키(대체키) 사용**
- 권장: **`Long` 타입 + 대체키 + 키 생성 전략** (IDENTITY, SEQUENCE, UUID 등)
