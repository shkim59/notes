---
title: JPA N+1 문제
---

# JPA의 N+1 문제에 대해 설명해주세요

> 출처: 매일메일(maeil-mail) 면접 질문. 원문을 옮겨 적은 노트라 외부 공개 시에는 직접 다시 정리할 것.

- 연관관계가 설정된 엔티티를 조회할 때, 조회된 데이터 개수(N)만큼 연관관계 조회 쿼리가 추가로 발생하는 현상
- 예: 게시글을 조회한 뒤 각 게시글의 댓글을 조회하는 쿼리가 게시글 수만큼 추가 발생

## findAll()의 글로벌 페치 전략별 상황

- **즉시 로딩(EAGER)**: `findAll()`은 `select u from User u` JPQL을 생성해 실행하는데, JPQL은 글로벌 페치 전략을 고려하지 않는다. 모든 User를 조회한 뒤, 즉시 로딩 설정을 보고 연관 엔티티를 조회하는 쿼리를 추가로 실행한다 → N+1 발생
- **지연 로딩(LAZY)**: 연관 엔티티를 프록시로 주입하므로 조회 시점에는 N+1이 발생하지 않는다. 하지만 프록시의 실제 데이터를 사용하는 순간 조회 쿼리가 나가서 결국 N+1이 발생할 수 있다

## 해결 방법

- **fetch join**: 연관 엔티티를 한 번에 조회하는 JPQL 구문

```sql
select distinct u
from User u
left join fetch u.posts
```

- **@EntityGraph**: 쿼리 메서드에 어노테이션을 붙여 비슷한 효과

```java
@EntityGraph(attributePaths = {"posts"}, type = EntityGraphType.FETCH)
List<User> findAll();
```
