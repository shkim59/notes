---
title: JPA 2. 영속성 컨텍스트
---

# JPA 2. 영속성 컨텍스트

> 💡 JPA에서 가장 중요한 두 가지
> - 객체와 RDB 매핑하기 (ORM) → 설계
> - **영속성 컨텍스트** → JPA 내부 동작

## 엔티티 매니저 팩토리와 엔티티 매니저

<!-- ![엔티티 매니저 팩토리](./images/jpa02-1.png) -->

- 애플리케이션이 실행될 때 `EntityManagerFactory`가 생성된다
- 요청이 올 때마다 `EntityManager`를 생성하고, 커넥션 풀을 사용해 DB에 접근한다

| | EntityManagerFactory | EntityManager |
|---|---|---|
| 개수 | DB 하나당 보통 하나 | 요청마다 생성 |
| 비용 | 생성 비용이 큼 | 가벼움 |
| 스레드 | 여러 스레드가 공유해도 안전 | **스레드 간 공유 금지** |
| 역할 | 엔티티 매니저를 만드는 공장 | 엔티티의 저장/수정/삭제/조회 등 모든 일 처리 |

```java
EntityManagerFactory emf = Persistence.createEntityManagerFactory("jpabook");
EntityManager em = emf.createEntityManager();
```

## 영속성 컨텍스트

- **엔티티를 영구 저장하는 환경**. JPA를 이해하는 데 가장 중요한 개념
- `em.persist(entity)` → 영속성 컨텍스트에 엔티티를 저장한다는 의미
- 눈에 보이지 않는 **논리적인 개념**이며, **엔티티 매니저를 통해 접근**한다

## 엔티티 생명주기

<!-- ![엔티티 생명주기](./images/jpa02-2.png) -->

```java
// 1. 비영속 (new/transient): 영속성 컨텍스트와 무관, 객체만 생성된 상태
Member member = new Member();
member.setId("member1");
member.setUsername("회원1");

// 2. 영속 (managed): 영속성 컨텍스트가 관리
em.getTransaction().begin();
em.persist(member); // 이 시점에 바로 DB에 쿼리가 나가지는 않음 (커밋 시점)

// 3. 준영속 (detached): 관리되다가 분리된 상태
em.detach(member); // em.clear(), em.close()로도 준영속이 됨

// 4. 삭제 (removed): DB에서 해당 row를 삭제
em.remove(member);
```

## 영속성 컨텍스트의 이점

### 1. 1차 캐시

```java
Member member = new Member();
member.setId("member1");
member.setUsername("회원1");

em.persist(member);                                   // 1차 캐시에 저장 (key: "member1", value: member)
Member findMember = em.find(Member.class, "member1"); // 1차 캐시에서 조회

Member findMember2 = em.find(Member.class, "member2"); // 1차 캐시에 없으면 DB 조회 후 1차 캐시에 저장
```

- JPA는 엔티티를 조회할 때 1차 캐시부터 찾는다

### 2. 영속 엔티티의 동일성 보장

```java
Member a = em.find(Member.class, "member1");
Member b = em.find(Member.class, "member1");

System.out.println(a == b); // true
```

- 1차 캐시로 REPEATABLE READ 수준의 격리를 DB가 아닌 **애플리케이션 차원**에서 제공

### 3. 트랜잭션을 지원하는 쓰기 지연

```java
EntityTransaction transaction = em.getTransaction();
transaction.begin();

em.persist(memberA);
em.persist(memberB);
// 여기까지 INSERT SQL을 DB에 보내지 않는다

transaction.commit(); // 커밋하는 순간 INSERT SQL을 보낸다
```

1. `persist` 시 엔티티를 1차 캐시에 넣고, 동시에 INSERT SQL을 만들어 **쓰기 지연 SQL 저장소**에 쌓아둔다
2. 커밋 시점에 쌓인 SQL을 한꺼번에 DB로 보낸다 (flush)

<!-- ![쓰기 지연 1](./images/jpa02-3.png) -->
<!-- ![쓰기 지연 2](./images/jpa02-4.png) -->
<!-- ![쓰기 지연 3](./images/jpa02-5.png) -->

> 💡 버퍼링으로 쿼리를 모아 보낼 수 있어 최적화에 유리하다

### 4. 변경 감지 (Dirty Checking)

```java
transaction.begin();

Member memberA = em.find(Member.class, "memberA"); // 영속 엔티티 조회
memberA.setUsername("hi");                          // 데이터 수정
memberA.setAge(10);
// em.update(member) 같은 코드가 필요 없음

transaction.commit();
```

<!-- ![변경 감지](./images/jpa02-6.png) -->

1. 1차 캐시에는 엔티티를 처음 읽어온 시점의 **스냅샷**이 저장되어 있다
2. 커밋 시점에 flush가 실행되면서 엔티티와 스냅샷을 비교
3. 변경이 있으면 UPDATE SQL을 만들어 쓰기 지연 SQL 저장소에 쌓음
4. SQL을 DB에 보내고 트랜잭션을 커밋

> 💡 변경 감지는 **영속 상태의 엔티티에만** 적용된다. 비영속·준영속 엔티티는 값을 바꿔도 DB에 반영되지 않는다.

### 5. 엔티티 삭제

```java
Member memberA = em.find(Member.class, "memberA");
em.remove(memberA);
```

- 삭제된 엔티티는 재사용하지 말고 GC 대상이 되도록 둔다

### 특징

- 영속성 컨텍스트는 엔티티를 **식별자(@Id)로 구분**하므로, 영속 상태는 식별자가 반드시 있어야 한다
- 트랜잭션을 커밋하는 순간 영속성 컨텍스트의 변경을 DB에 반영한다 → 플러시

## 플러시 (Flush)

영속성 컨텍스트의 변경 내용을 DB에 반영하는 것

1. 변경 감지로 수정된 엔티티를 찾는다
2. 수정 쿼리를 쓰기 지연 SQL 저장소에 등록
3. 저장소의 쿼리(등록, 수정, 삭제)를 DB에 전송

### 플러시 호출 방법

- `em.flush()`: 직접 호출. 테스트나 다른 프레임워크와 함께 쓸 때 말고는 거의 사용하지 않음
- 트랜잭션 커밋: 자동 호출
- JPQL 쿼리 실행: 자동 호출 (DB와 영속성 컨텍스트를 동기화하기 위해)

```java
em.persist(memberA);
em.persist(memberB);
em.persist(memberC);

// JPQL 실행 전에 자동으로 플러시 → 방금 등록한 member들도 조회됨
List<Member> members = em.createQuery("select m from Member m", Member.class).getResultList();
```

### 플러시 모드

```java
em.setFlushMode(FlushModeType.COMMIT);
```

- `FlushModeType.AUTO`: 커밋이나 쿼리 실행 시 플러시 (기본값, 권장)
- `FlushModeType.COMMIT`: 커밋할 때만 플러시

> 💡 플러시는 영속성 컨텍스트를 **비우는 것이 아니라** 변경 내용을 DB에 **동기화**하는 것이다 (1차 캐시는 남아 있다). 트랜잭션 커밋 직전에만 동기화하면 된다.

## 준영속 상태

- 영속 상태의 엔티티가 영속성 컨텍스트에서 분리(detached)된 상태
- 만드는 방법
  - `em.detach(entity)`: 특정 엔티티만 준영속으로
  - `em.clear()`: 영속성 컨텍스트를 완전히 초기화
  - `em.close()`: 영속성 컨텍스트를 종료
- 특징
  - 비영속에 가깝다: 1차 캐시, 쓰기 지연, 변경 감지, 지연 로딩 등 어떤 기능도 동작하지 않음
  - 한 번 영속 상태였으므로 반드시 식별자를 가지고 있다
  - 지연 로딩을 할 수 없다 (프록시를 초기화할 영속성 컨텍스트가 없으므로)
