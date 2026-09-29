---
title: JPA 7-1. 프록시와 지연 로딩
---

# JPA 7-1. 프록시와 지연 로딩

## 왜 필요한가

- 엔티티를 조회할 때 연관 엔티티가 항상 쓰이는 것은 아니다

<!-- ![Member-Team](./images/jpa07-1.png) -->

```java
// 회원과 팀을 모두 출력 → 팀도 함께 가져오는 게 좋음
public void printUserAndTeam(String memberId) {
    Member member = em.find(Member.class, memberId);
    Team team = member.getTeam();
    System.out.println("회원 이름: " + member.getUsername());
    System.out.println("소속팀: " + team.getName());
}

// 회원만 출력 → 팀까지 조회하는 것은 낭비
public void printUser(String memberId) {
    Member member = em.find(Member.class, memberId);
    System.out.println("회원 이름: " + member.getUsername());
}
```

- 그래서 JPA는 엔티티가 **실제 사용될 때까지 DB 조회를 지연**하는 방법을 제공한다

## 프록시

- `em.find()`: DB를 통해 **실제 엔티티 객체**를 조회
- `em.getReference()`: DB 조회를 미루고, **DB 접근을 위임한 프록시 객체**를 반환

### 초기화

<!-- ![프록시 초기화](./images/jpa07-2.png) -->

```java
Member member = em.getReference(Member.class, "id1"); // MemberProxy 반환
member.getName(); // 이 시점에 영속성 컨텍스트를 통해 DB를 조회하고 실제 엔티티 생성
```

```java
// 프록시 클래스 예상 코드
class MemberProxy extends Member {
    Member target = null; // 실제 엔티티 참조

    public String getName() {
        if (target == null) {
            // 초기화 요청 → DB 조회 → 실제 엔티티 생성 및 참조 보관
            this.target = ...;
        }
        return target.getName();
    }
}
```

### 특징

- 실제 클래스를 상속받아 만들어지므로 겉모양이 같다
- 처음 사용할 때 **한 번만** 초기화된다
- 초기화되어도 프록시가 실제 엔티티로 **바뀌는 것이 아니라**, 프록시를 통해 실제 엔티티에 접근하는 것
- 타입 비교 시 `==` 대신 `instanceof` 사용
- 영속성 컨텍스트에 실제 엔티티가 이미 있으면 `getReference()`도 실제 엔티티를 반환한다. 반대로 프록시가 먼저 등록됐으면 `find()`도 프록시를 반환 (같은 영속성 컨텍스트 안에서 동일성 보장)
- **준영속 상태**에서 프록시를 초기화하면 `org.hibernate.LazyInitializationException` 발생

### 확인 방법

- 초기화 여부: `PersistenceUnitUtil.isLoaded(entity)`
- 프록시 클래스 확인: `entity.getClass().getName()` (`HibernateProxy...`)
- 강제 초기화: `org.hibernate.Hibernate.initialize(entity)` (JPA 표준에는 없음. `member.getName()`처럼 직접 호출해도 됨)

## 즉시 로딩과 지연 로딩

### 지연 로딩 (LAZY)

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "TEAM_ID")
private Team team;
```

- Member를 조회하면 Team은 **프록시**로 초기화된다
- `member.getTeam().getName()`처럼 실제 값을 사용하는 시점에 조회

<!-- ![지연 로딩](./images/jpa07-3.png) -->

### 즉시 로딩 (EAGER)

```java
@ManyToOne(fetch = FetchType.EAGER)
@JoinColumn(name = "TEAM_ID")
private Team team;
```

- Member를 조회할 때 Team까지 조인해서 한 번에 조회. Team은 프록시가 아닌 실제 엔티티

<!-- ![즉시 로딩](./images/jpa07-4.png) -->

### 가급적 지연 로딩을 사용

- 즉시 로딩은 **예상하지 못한 SQL**이 발생한다 (연관 엔티티가 많으면 `find()` 한 번에 여러 테이블이 조인)
- **즉시 로딩은 JPQL에서 N+1 문제를 일으킨다**
- `@ManyToOne`, `@OneToOne`은 기본이 **EAGER** → **LAZY로 직접 설정**
- `@OneToMany`, `@ManyToMany`는 기본이 LAZY

### EAGER일 때의 조인 방식

| 관계 | optional = false | optional = true |
|---|---|---|
| `@ManyToOne`, `@OneToOne` | 내부 조인 | 외부 조인 |
| `@OneToMany`, `@ManyToMany` | 외부 조인 | 외부 조인 |
