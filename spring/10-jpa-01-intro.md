---
title: JPA 1. 개요
---

# JPA 1. 개요

> 인프런 김영한 「자바 ORM 표준 JPA 프로그래밍 - 기본편」 정리

## SQL 중심 개발의 문제점

객체와 관계형 데이터베이스의 패러다임 차이 때문에 생기는 문제들

### 상속

![상속 관계](https://user-images.githubusercontent.com/52024566/132992161-2db24f9c-3106-4d50-bdf1-9b83088d63a3.png)

- DB에 저장할 객체에는 보통 상속을 쓰지 않는다 (복잡함)
- ALBUM 저장: ITEM과 ALBUM 테이블에 각각 INSERT 해야 함
- ALBUM 조회: 테이블별 조인 SQL을 작성하고 객체를 각각 생성해야 함

### 연관관계

![연관관계](./images/jpa01-1.png)

- 테이블은 외래 키를 사용하므로 객체를 테이블에 맞춰 모델링하게 된다

```java
class Member {
    String id;       // MEMBER_ID
    Long teamId;     // TEAM_ID FK
    String username; // USERNAME
}

class Team {
    Long id;         // TEAM_ID PK
    String name;     // NAME
}
```

### 객체 그래프 탐색

- 처음 실행한 SQL에 따라 탐색 범위가 결정되므로 자유로운 탐색이 불가능하다

```java
// SELECT M.*, T.* FROM MEMBER M JOIN TEAM T ON M.TEAM_ID = T.TEAM_ID

class MemberService {
    public void process() {
        Member member = memberDAO.find(memberId);
        member.getTeam();                // 사용 가능?
        member.getOrder().getDelivery(); // 사용 가능?
    }
}
```

- 계층형 아키텍처에서는 이전 계층에서 넘어온 객체를 신뢰할 수 있어야 하는데, SQL로 조회한 범위 밖은 쓸 수 없으니 **엔티티를 신뢰할 수 없다**
- 모든 객체를 미리 로딩할 수도 없어서 같은 조회 메서드를 여러 개 만들게 된다

### 비교

```java
Member member1 = memberDAO.getMember("100");
Member member2 = memberDAO.getMember("100");

member1 == member2; // false
```

## JPA (Java Persistence API)

- 자바 진영의 **ORM 기술 표준**
- **ORM**: 객체는 객체대로, 관계형 DB는 관계형 DB대로 설계하고, ORM 프레임워크가 중간에서 매핑

## JPA 동작

![JPA 동작](./images/jpa01-2.png)

- JPA는 애플리케이션과 JDBC 사이에서 동작
- JPA가 내부적으로 JDBC API를 사용해 SQL을 호출한다. **개발자가 JDBC API를 직접 사용하지 않는다**

**저장**

1. MemberDAO가 Member 객체를 JPA에 넘긴다
2. JPA가 객체를 분석해 INSERT 쿼리를 생성
3. JDBC API로 INSERT 쿼리를 DB에 보냄

**조회**

1. JPA가 JDBC API로 ResultSet을 가져온다
2. ResultSet을 객체에 매핑

## JPA 표준 명세

- JPA는 인터페이스의 모음
- 구현체: 하이버네이트, EclipseLink, DataNucleus (대부분 하이버네이트 사용)

## JPA를 사용하는 이유

1. **SQL 중심 개발 → 객체 중심 개발**
2. **생산성**: 기본 CRUD가 구현되어 있다
   - 저장 `jpa.persist(member)`, 조회 `jpa.find(memberId)`, 수정 `member.setName("변경")`, 삭제 `jpa.remove(member)`
3. **유지보수**: 필드를 추가해도 SQL은 JPA가 처리
4. **패러다임 불일치 해결**
   - 상속: `jpa.persist(album)` 하면 ITEM, ALBUM INSERT를 JPA가 처리
   - 연관관계와 객체 그래프 탐색: `member.getTeam()`, `member.getOrder().getDelivery()`를 자유롭게 사용
   - 비교: **같은 트랜잭션에서 조회한 엔티티는 같음(`==`)을 보장**
5. **성능**
   - 1차 캐시와 동일성 보장: 같은 트랜잭션에서 같은 엔티티 반환, DB 격리 수준이 Read Committed여도 애플리케이션 차원에서 Repeatable Read 보장
   - 트랜잭션을 지원하는 쓰기 지연: 커밋까지 INSERT를 모았다가 JDBC Batch로 한 번에 전송, UPDATE·DELETE로 인한 row lock 시간 최소화
   - 지연 로딩과 즉시 로딩 선택 가능
6. **데이터 접근 추상화와 벤더 독립성**
7. **표준**

## 데이터베이스 방언 (Dialect)

- JPA는 특정 DB에 종속되지 않지만, DB마다 SQL 문법과 함수가 조금씩 다르다
  - 가변 문자: MySQL `VARCHAR`, Oracle `VARCHAR2`
  - 문자열 자르기: 표준 `SUBSTRING()`, Oracle `SUBSTR()`
  - 페이징: MySQL `LIMIT`, Oracle `ROWNUM`
- **방언**: SQL 표준이 아닌 특정 DB만의 고유 기능. 설정한 방언에 맞춰 JPA가 SQL을 생성한다

## JPA 구동 방식

![JPA 구동 방식](./images/jpa01-3.png)

- `Persistence`가 `persistence.xml` 설정을 읽어 `EntityManagerFactory`를 생성
- `EntityManagerFactory`에서 필요할 때마다 `EntityManager`를 생성해 사용
- **주의사항**
  - 엔티티 매니저 팩토리는 **하나만 생성**해서 애플리케이션 전체에서 공유
  - 엔티티 매니저는 스레드 간에 공유하지 않는다 (쓰고 버린다)
  - **JPA의 모든 데이터 변경은 트랜잭션 안에서 실행**

## JPQL

- 식별자로 단순 조회하는 것이 아니라 **조건을 붙여 조회**할 때 사용
- JPA는 엔티티 중심으로 개발하므로 검색도 테이블이 아닌 엔티티를 대상으로 한다
- 모든 DB 데이터를 객체로 변환해 검색할 수는 없으니, 필요한 데이터만 가져오려면 조건이 포함된 SQL이 필요하다

| JPQL | SQL |
|---|---|
| **엔티티 객체**를 대상으로 쿼리 | **테이블**을 대상으로 쿼리 |
| SQL을 추상화해 특정 DB에 의존하지 않음 | DB마다 문법이 다를 수 있음 |
