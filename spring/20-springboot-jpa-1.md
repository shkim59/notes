---
title: 스프링 부트와 JPA 활용 1 - 웹 애플리케이션 개발
---

# 스프링 부트와 JPA 활용 1

> 인프런 김영한 「실전! 스프링 부트와 JPA 활용 1」 정리

## 환경 설정

### 설정 파일

- properties와 yml 중 하나를 선택. 설정이 많아지고 복잡해지면 yml이 나음
- yml은 공백 2칸으로 계층을 만든다

```yaml
spring:
  datasource:
    url: jdbc:h2:tcp://localhost/~/test
    username: sa
    password:
    driver-class-name: org.h2.Driver

  jpa:
    hibernate:
      ddl-auto: create
    properties:
      hibernate:
        # show_sql: true
        format_sql: true

logging:
  level:
    org.hibernate.SQL: debug
    org.hibernate.orm.jdbc.bind: trace
```

### 쿼리 파라미터 로그 남기기

- 스프링 부트 3.x, Hibernate 6: `org.hibernate.orm.jdbc.bind: trace`로 쿼리 파라미터(`?`) 값을 확인
- 외부 라이브러리: `implementation 'com.github.gavlyukovskiy:p6spy-spring-boot-starter:1.9.0'`
  - 시스템 자원을 사용하므로 개발 단계에서는 편하게 쓰되, 운영에 적용하려면 성능 테스트 후 사용

### jar 빌드로 실행

1. 프로젝트 폴더에서 `./gradlew clean build`
2. `build/libs/*-SNAPSHOT.jar` 생성
3. `java -jar *.jar`로 실행

## 엔티티 설계

### 엔티티에 Setter 사용 X

- 변경 포인트가 너무 많아 유지보수가 어려움

### 모든 연관관계는 지연 로딩으로 설정

- 즉시 로딩은 어떤 SQL이 나갈지 예측하기 어렵다
- JPQL 실행 시 N+1 문제 발생
- 연관 엔티티를 함께 조회해야 하면 fetch join 또는 엔티티 그래프 사용
- `@XToOne(OneToOne, ManyToOne)`은 기본이 즉시 로딩 → **직접 지연 로딩으로 설정**해야 함

### 컬렉션은 필드에서 초기화

```java
@OneToMany(mappedBy = "member")
private List<Order> orders = new ArrayList<>(); // 필드에서 초기화
```

- null 문제에서 안전
- 하이버네이트는 엔티티를 영속화할 때 컬렉션을 내장 컬렉션으로 감싸서 관리하므로, 필드 초기화가 가장 안전하다

### 테이블, 컬럼명 생성 전략

- 스프링 부트 기본 설정 (`SpringPhysicalNamingStrategy`)
  - 카멜 케이스 → 언더스코어 (`memberPoint` → `member_point`)
  - `.`(점) → `_`(언더스코어)
  - 대문자 → 소문자
- 적용 단계
  - **논리명 생성**: 컬럼·테이블명을 명시하지 않으면 `ImplicitNamingStrategy` 사용 (`spring.jpa.hibernate.naming.implicit-strategy`)
  - **물리명 적용**: 모든 논리명에 적용되어 실제 테이블에 반영 (`spring.jpa.hibernate.naming.physical-strategy`). `username` → `usernm`처럼 회사 규칙으로 바꿀 수 있다

### 연관관계 편의 메서드

```java
public class Order {
    //== 연관관계 메서드 ==//
    public void setMember(Member member) {
        this.member = member;
        member.getOrders().add(this);
    }
}
```

- 양방향 관계에서는 양쪽 모두에 값을 넣어줘야 하므로 편의 메서드로 묶는다

## 도메인 개발

- **동시성 문제**: 필드 중복을 막으려면 엔티티 설계 단계에서 unique 제약을 둔다
- **수정과 조회 분리**: 객체를 수정하고 그 객체를 반환하면 예상 못한 사이드 이펙트가 생길 수 있다. 수정 후에는 id 정도만 반환하는 것을 권장

### 테스트

- `@Transactional`을 테스트에 쓰면 테스트가 끝나고 롤백된다
  - `@Rollback(false)`로 커밋 가능 (필요할 때만)
- 테스트는 격리된 환경에서 실행하고 데이터를 초기화하는 것이 좋다
  - 스프링 부트는 datasource 설정이 없으면 메모리 DB를 사용
  - `test/resources/application.yml`로 테스트 전용 설정 분리

### 도메인 모델 패턴 vs 트랜잭션 스크립트 패턴

| 도메인 모델 패턴 | 트랜잭션 스크립트 패턴 |
|---|---|
| 비즈니스 로직이 엔티티에 존재 | 비즈니스 로직이 서비스 계층에 존재 |
| 객체지향 특성을 활용 | 절차적 |

- ORM을 쓰면 도메인 모델 패턴을 많이 사용한다
- 유지보수 관점에서 상황에 맞게 선택하고, 함께 쓸 수도 있다

## 웹 계층 개발

### 데이터 전송

![데이터 전송 구조](./images/sbjpa1-1.png)

- **엔티티를 그대로 사용 (권장 X)**
  - 화면에 불필요한 데이터를 보냄 → 성능·보안 문제
  - 순환 참조 발생 가능
  - 엔티티가 화면/API에 종속되어 유지보수가 어려움. 엔티티는 핵심 비즈니스 로직만 갖고 순수하게 유지해야 한다
- **DTO(폼 객체) 사용 (권장)**
  - 데이터 전송 전용 객체
  - 순환 참조 예방, validation 로직 분리

### 변경 감지와 병합

```java
Book book = new Book();

// 식별자(id)를 가지므로 준영속 엔티티로 볼 수 있다
book.setId(form.getId());
book.setName(form.getName());
book.setPrice(form.getPrice());
book.setStockQuantity(form.getStockQuantity());

itemService.saveItem(book);
```

- 임의로 만든 엔티티지만 식별자를 가지고 있어 **준영속 엔티티**로 볼 수 있다
- 준영속 엔티티를 수정하는 방법: 변경 감지, 병합

**변경 감지 (권장)**

```java
@Transactional
public void updateItem(Long itemId, Book param) {
    Item findItem = itemRepository.findOne(itemId);
    findItem.setPrice(param.getPrice());
    findItem.setName(param.getName());
    findItem.setStockQuantity(param.getStockQuantity());
}
```

- 식별자로 조회한 영속 엔티티의 값을 바꾸면 트랜잭션 커밋 시점에 변경 감지가 실행되어 업데이트된다
- 원하는 속성만 선택해서 변경할 수 있다
- **엔티티를 변경할 때는 항상 변경 감지를 사용하는 것을 권장**

**병합 (merge)**

```java
@Transactional
void update(Item itemParam) {
    Item mergeItem = em.merge(itemParam);
}
```

1. 파라미터로 넘어온 식별자로 엔티티를 조회
2. 조회된 영속 엔티티에 넘어온 엔티티의 값을 **전부** 채워 넣음
   - 모든 속성이 변경되므로, 값이 없으면 null로 업데이트될 수 있음 → 위험
3. 영속 상태의 엔티티를 반환
