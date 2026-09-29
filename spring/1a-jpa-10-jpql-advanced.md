---
title: JPA 10. 객체지향 쿼리 언어 2 (페치 조인 등)
---

# JPA 10. 객체지향 쿼리 언어 2

## 경로 표현식

`.`을 찍어 객체 그래프를 탐색하는 것

```sql
select m.username      -- 상태 필드
  from Member m
  join m.team t        -- 단일 값 연관 필드
  join m.orders o      -- 컬렉션 값 연관 필드
 where t.name = '팀A'
```

| 종류 | 설명 | 탐색 |
|---|---|---|
| 상태 필드 | 단순히 값을 저장 (`m.username`) | 경로 탐색의 끝 |
| 단일 값 연관 필드 | `@ManyToOne`, `@OneToOne` (`m.team`) | **묵시적 내부 조인** 발생, 계속 탐색 가능 |
| 컬렉션 값 연관 필드 | `@OneToMany`, `@ManyToMany` (`m.orders`) | 묵시적 내부 조인 발생, 더 탐색 불가 |

```sql
select t.members from Team t           -- 성공
select t.members.username from Team t  -- 실패
select m.username from Team t join t.members m -- 명시적 조인으로 별칭을 얻어 탐색
```

- 묵시적 조인은 항상 내부 조인이고, 조인이 일어나는 상황을 파악하기 어렵다 → **가급적 명시적 조인 사용**

## 페치 조인 (중요)

- SQL 조인 종류가 아니라 JPQL에서 **성능 최적화**를 위해 제공하는 기능
- 연관 엔티티나 컬렉션을 **SQL 한 번에 함께 조회**
- `[LEFT [OUTER] | INNER] JOIN FETCH 조인경로`

### 엔티티 페치 조인

```sql
-- JPQL
select m from Member m join fetch m.team

-- SQL
SELECT M.*, T.* FROM MEMBER M INNER JOIN TEAM T ON M.TEAM_ID = T.ID
```

<!-- ![엔티티 페치 조인](./images/jpa10-1.png) -->

### 컬렉션 페치 조인

```sql
-- JPQL
select t from Team t join fetch t.members where t.name = '팀A'

-- SQL
SELECT T.*, M.* FROM TEAM T INNER JOIN MEMBER M ON T.ID = M.TEAM_ID WHERE T.NAME = '팀A'
```

- Team은 하나지만 Member가 여럿이면 결과 row가 늘어나 **같은 Team이 중복**된다

<!-- ![컬렉션 페치 조인](./images/jpa10-2.png) -->

### 페치 조인과 DISTINCT

- JPQL의 DISTINCT는 두 가지 일을 한다
  1. SQL에 DISTINCT 추가 → 하지만 row의 데이터가 달라 SQL에서는 중복 제거 실패
  2. **애플리케이션에서 같은 식별자의 엔티티 중복 제거**
- (참고: 하이버네이트 6부터는 DISTINCT 없이도 애플리케이션 중복 제거가 자동 적용)

### 일반 조인과의 차이

- 일반 조인은 **SELECT 절에 지정한 엔티티만** 조회한다. 연관 컬렉션이 지연 로딩이면 사용 시점에 쿼리가 한 번 더 나간다
- 페치 조인은 **연관 엔티티를 함께 조회**한다. 객체 그래프를 SQL 한 번에 조회하는 개념

### 글로벌 로딩 전략과의 관계

- 페치 조인은 글로벌 로딩 전략(`fetch = LAZY`)보다 우선한다
- 글로벌 전략을 즉시 로딩으로 하면 애플리케이션 전체에서 항상 즉시 로딩이 일어나 오히려 성능이 나빠진다
- → **글로벌 로딩 전략은 모두 지연 로딩, 최적화가 필요한 곳에만 페치 조인**
- 페치 조인으로 조회하면 지연 로딩이 발생하지 않아 준영속 상태에서도 객체 그래프 탐색이 가능하다

### 특징과 한계

- **페치 조인 대상에는 별칭을 줄 수 없다** (하이버네이트는 가능하지만 쓰지 않는 게 좋다)
- **둘 이상의 컬렉션은 페치 조인할 수 없다**
- **컬렉션을 페치 조인하면 페이징 API를 쓸 수 없다**
  - 단일 값 연관 필드(일대일, 다대일)는 페이징 가능
  - 하이버네이트는 경고 로그를 남기고 **메모리에서** 페이징한다 → 매우 위험
- 여러 테이블을 조인해 엔티티와 전혀 다른 모양의 결과가 필요하면 → 일반 조인 후 필요한 데이터만 DTO로 조회

## 다형성 쿼리

<!-- ![다형성 쿼리](./images/jpa10-3.png) -->

```sql
-- TYPE: 조회 대상을 특정 자식으로 한정
select i from Item i where type(i) IN (Book, Movie)
-- SQL: where i.DTYPE in ('B', 'M')

-- TREAT (JPA 2.1): 부모 타입을 특정 자식 타입으로 다룸 (타입 캐스팅과 유사)
select i from Item i where treat(i as Book).author = 'kim'
-- SQL: where i.DTYPE = 'B' and i.author = 'kim'
```

## 엔티티 직접 사용

- JPQL에서 엔티티를 직접 사용하면 SQL에서는 **기본 키 값**을 사용한다

```sql
select count(m) from Member m          -- SQL: select count(m.id)
select m from Member m where m = :member -- SQL: where m.id = ?
select m from Member m where m.team = :team -- SQL: where m.team_id = ? (묵시적 조인 없음)
```

## Named 쿼리

- 미리 이름을 붙여 정의하는 **정적** JPQL
- 애플리케이션 로딩 시점에 초기화 후 재사용 → 파싱 비용 절감
- **애플리케이션 로딩 시점에 쿼리를 검증**한다 (중요: 오류를 빨리 발견)

```java
@Entity
@NamedQuery(
    name = "Member.findByUsername",
    query = "select m from Member m where m.username = :username")
public class Member { }

List<Member> result = em.createNamedQuery("Member.findByUsername", Member.class)
    .setParameter("username", "회원1")
    .getResultList();
```

- XML에도 정의 가능하며 XML이 우선권을 가진다 (환경별로 다른 XML 배포 가능)
- Spring Data JPA의 `@Query`가 이름 없는 Named 쿼리처럼 동작한다

## 벌크 연산

- UPDATE, DELETE로 **여러 데이터를 한 번에** 수정·삭제

```java
int resultCount = em.createQuery(
        "update Product p set p.price = p.price * 1.1 where p.stockAmount < :stockAmount")
    .setParameter("stockAmount", 10)
    .executeUpdate(); // 영향받은 엔티티 수 반환
```

### 주의점

- 벌크 연산은 **영속성 컨텍스트를 무시하고 DB에 직접 쿼리**한다 → 영속성 컨텍스트와 DB의 데이터가 달라질 수 있다
- 해결
  - 벌크 연산을 **먼저** 실행하거나
  - 벌크 연산 수행 후 **영속성 컨텍스트를 초기화** (`em.clear()`, `em.refresh(entity)`)
