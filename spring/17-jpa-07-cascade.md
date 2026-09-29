---
title: JPA 7-2. 영속성 전이와 고아 객체
---

# JPA 7-2. 영속성 전이(CASCADE)와 고아 객체

## 영속성 전이

- 특정 엔티티를 영속 상태로 만들 때 **연관된 엔티티도 함께** 영속 상태로 만드는 기능
- JPA에서 엔티티를 저장할 때 연관된 모든 엔티티는 영속 상태여야 한다

<!-- ![부모-자식](./images/jpa07-5.png) -->

```java
// CASCADE 없이: 부모와 자식을 각각 persist 해야 함
Parent parent = new Parent();
em.persist(parent);

Child child1 = new Child();
child1.setParent(parent);
parent.getChildren().add(child1);
em.persist(child1);
```

### 저장

```java
@Entity
public class Parent {
    @OneToMany(mappedBy = "parent", cascade = CascadeType.PERSIST)
    private List<Child> children = new ArrayList<>();
}

Child child1 = new Child();
Child child2 = new Child();

Parent parent = new Parent();
parent.addChild(child1);
parent.addChild(child2);

em.persist(parent); // 부모만 persist 하면 자식도 함께 저장
```

### 삭제

```java
@OneToMany(mappedBy = "parent", cascade = CascadeType.REMOVE)
private List<Child> children = new ArrayList<>();

Parent findParent = em.find(Parent.class, 1L);
em.remove(findParent); // 자식 먼저 삭제 후 부모 삭제 (외래 키 제약 고려)
```

### CASCADE 종류

```java
public enum CascadeType {
    ALL,     // 모두 적용
    PERSIST, // 영속
    MERGE,   // 병합
    REMOVE,  // 삭제
    REFRESH,
    DETACH
}

cascade = {CascadeType.PERSIST, CascadeType.REMOVE} // 여러 개 사용 가능
```

> 💡 참고
> - `PERSIST`, `REMOVE`는 `persist()`, `remove()` 호출 시점이 아니라 **플러시 시점**에 전이된다
> - 부모와 자식의 **라이프사이클이 거의 같을 때**, 그리고 **소유자가 하나일 때**만 사용 (예: 게시글과 첨부파일)
> - 연관관계 매핑과는 관계가 없다

## 고아 객체

- 부모 엔티티와 연관관계가 끊어진 자식 엔티티를 **자동으로 삭제**하는 기능

```java
@OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
private List<Child> childList = new ArrayList<>();

Parent findParent = em.find(Parent.class, parent.getId());
findParent.getChildList().remove(0); // 컬렉션에서 제거하면 DB에서도 DELETE
```

- 플러시 시점에 DELETE SQL 실행
- 참조하는 곳이 **하나일 때만** 사용. 특정 엔티티가 **개인 소유**하는 경우에만 적용
- `@OneToOne`, `@OneToMany`에만 사용 가능
- 부모를 제거하면 자식도 함께 제거된다 (`CascadeType.REMOVE`처럼 동작)

## 영속성 전이 + 고아 객체

- `CascadeType.ALL` + `orphanRemoval = true`를 함께 쓰면 **부모 엔티티를 통해 자식의 생명주기를 관리**할 수 있다
  - 자식은 별도의 Repository(DAO)가 없어도 됨
- DDD의 **Aggregate Root** 개념을 구현할 때 유용

```java
parent.addChild(child1);                  // 자식 저장: 부모에 등록만 하면 됨 (CASCADE)
parent.getChildren().remove(removeObject); // 자식 삭제: 부모에서 제거하면 됨 (orphanRemoval)
```
