---
title: JPA 9. 객체지향 쿼리 언어 (JPQL)
---

# JPA 9. 객체지향 쿼리 언어 (JPQL)

## JPA가 지원하는 쿼리 방법

- **JPQL**: SQL을 추상화한 객체지향 쿼리 언어. 엔티티 객체를 대상으로 쿼리하며 특정 DB에 의존하지 않는다

```java
String jpql = "select m from Member m where m.username like '%kim%'";
List<Member> result = em.createQuery(jpql, Member.class).getResultList();
```

- **Criteria**: 자바 코드로 JPQL을 작성하는 JPA 공식 빌더. 너무 복잡하고 실용성이 없어 잘 안 씀
- **QueryDSL**: 자바 코드로 JPQL을 작성. **컴파일 시점에 문법 오류를 잡을 수 있고** 동적 쿼리가 편해 실무에서 많이 사용

```java
JPAQueryFactory queryFactory = new JPAQueryFactory(em);
QMember m = QMember.member;

List<Member> list = queryFactory.selectFrom(m)
        .where(m.age.gt(18))
        .orderBy(m.name.desc())
        .fetch();
```

- **네이티브 SQL**: 특정 DB 의존 기능(Oracle `CONNECT BY` 등)이 필요할 때 SQL 직접 사용
- **JDBC, JdbcTemplate, MyBatis 직접 사용**: JPA를 우회하므로 SQL 실행 직전에 영속성 컨텍스트를 **수동 플러시**해야 한다

## 기본 문법

- **엔티티와 속성은 대소문자 구분** (`Member`, `age`), JPQL 키워드는 구분하지 않음
- 테이블 이름이 아닌 **엔티티 이름** 사용
- **별칭 필수** (`as`는 생략 가능)
- 집계(`COUNT`, `SUM`, `AVG`, `MAX`, `MIN`), `GROUP BY`, `HAVING`, `ORDER BY` 지원

### TypedQuery vs Query

```java
TypedQuery<Member> q1 = em.createQuery("select m from Member m", Member.class); // 반환 타입 명확
Query q2 = em.createQuery("select m.username, m.age from Member m");          // 반환 타입 불명확
```

### 결과 조회

- `getResultList()`: 결과가 하나 이상. 없으면 빈 리스트
- `getSingleResult()`: 결과가 정확히 하나
  - 없으면 `NoResultException`, 둘 이상이면 `NonUniqueResultException`

### 파라미터 바인딩

```java
// 이름 기준 (권장)
em.createQuery("select m from Member m where m.username = :username", Member.class)
  .setParameter("username", usernameParam);

// 위치 기준 → 중간에 파라미터가 추가되면 순서가 밀려 오류. 사용 X
"select m from Member m where m.username = ?1"
```

## 프로젝션

- SELECT 절에 조회할 대상을 지정: 엔티티(`m`, `m.team`), 임베디드 타입(`m.address`), 스칼라 타입(`m.username, m.age`)
- `DISTINCT`로 중복 제거
- 여러 값 조회
  - `Query` 타입 / `Object[]` 타입으로 조회
  - **`new` 명령어로 DTO 조회** (권장): 패키지명을 포함한 전체 클래스명, 순서와 타입이 맞는 생성자 필요

```java
List<MemberDTO> result = em.createQuery(
        "select new jpql.MemberDTO(m.username, m.age) from Member m", MemberDTO.class)
    .getResultList();
```

## 페이징

```java
List<Member> result = em.createQuery("select m from Member m order by m.name desc", Member.class)
    .setFirstResult(10) // 조회 시작 위치 (0부터)
    .setMaxResults(20)  // 조회할 데이터 수
    .getResultList();
```

## 조인

```sql
-- 내부 조인
SELECT m FROM Member m [INNER] JOIN m.team t
-- 외부 조인
SELECT m FROM Member m LEFT [OUTER] JOIN m.team t
-- 세타 조인 (연관관계 없는 엔티티)
SELECT count(m) FROM Member m, Team t WHERE m.username = t.name
```

### ON 절 (JPA 2.1+)

```sql
-- 조인 대상 필터링: 팀 이름이 A인 팀만 조인
SELECT m, t FROM Member m LEFT JOIN m.team t ON t.name = 'A'

-- 연관관계 없는 엔티티 외부 조인
SELECT m, t FROM Member m LEFT JOIN Team t ON m.username = t.name
```

## 서브 쿼리

```sql
-- 나이가 평균보다 많은 회원
select m from Member m where m.age > (select avg(m2.age) from Member m2)

-- 팀A 소속인 회원
select m from Member m where exists (select t from m.team t where t.name = '팀A')

-- 전체 상품 각각의 재고보다 주문량이 많은 주문
select o from Order o where o.orderAmount > ALL (select p.stockAmount from Product p)
```

- 지원 함수: `[NOT] EXISTS`, `ALL`, `ANY`/`SOME`, `[NOT] IN`
- **한계**: 표준은 WHERE, HAVING 절에서만 사용 가능 (하이버네이트는 SELECT도 지원). **FROM 절 서브쿼리는 불가** → 조인으로 풀어서 해결

## 타입 표현과 기타 식

- 문자 `'HELLO'`, 숫자 `10L`, `10D`, `10F`, Boolean `TRUE`/`FALSE`, ENUM은 패키지명 포함, 엔티티 타입 `TYPE(m) = Member`

```sql
-- 기본 CASE 식
select
    case when m.age <= 10 then '학생요금'
         when m.age >= 60 then '경로요금'
         else '일반요금'
    end
from Member m

-- COALESCE: null이 아닌 첫 값
select coalesce(m.username, '이름 없는 회원') from Member m

-- NULLIF: 두 값이 같으면 null
select nullif(m.username, '관리자') from Member m
```

- 기본 함수: `CONCAT`, `SUBSTRING`(1부터 시작), `TRIM`, `LOWER`, `UPPER`, `LENGTH`, `LOCATE`, `ABS`, `SQRT`, `MOD`, `SIZE`, `INDEX`
