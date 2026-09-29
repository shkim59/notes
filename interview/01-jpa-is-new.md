---
title: Spring Data JPA에서 새로운 Entity인지 판단하는 방법
---

# Spring Data JPA에서 새로운 Entity인지 판단하는 방법은?

> 출처: 매일메일(maeil-mail) 면접 질문. 원문을 옮겨 적은 노트라 외부 공개 시에는 직접 다시 정리할 것.

```java
@Override
public boolean isNew(T entity) {

    if (versionAttribute.isEmpty()
          || versionAttribute.map(Attribute::getJavaType).map(Class::isPrimitive).orElse(false)) {
        return super.isNew(entity);
    }

    BeanWrapper wrapper = new DirectFieldAccessFallbackBeanWrapper(entity);

    return versionAttribute.map(it -> wrapper.getPropertyValue(it.getName()) == null).orElse(true);
}
```

- 새로운 Entity인지는 `JpaEntityInformation`의 `isNew(T entity)`로 판단한다.
- 별도 설정이 없으면 구현체 중 `JpaMetamodelEntityInformation`이 동작한다.
- `@Version` 필드가 없거나 primitive 타입이면 `AbstractEntityInformation`의 `isNew()`를 호출하고, wrapper 타입이면 null 여부를 확인한다.

```java
public boolean isNew(T entity) {

    ID id = getId(entity);
    Class<ID> idType = getIdType();

    if (!idType.isPrimitive()) {
        return id == null;
    }

    if (id instanceof Number) {
        return ((Number) id).longValue() == 0L;
    }

    throw new IllegalArgumentException(String.format("Unsupported primitive id type %s", idType));
}
```

- `AbstractEntityInformation`은 `@Id` 필드를 확인해서, primitive가 아니면 null 여부를, Number 하위 타입이면 0인지를 확인한다.
- `@GeneratedValue`로 키 생성 전략을 쓰면 DB에 저장될 때 id가 할당된다. 그래서 저장 전 메모리에서 만든 객체는 id가 비어 있어 `isNew()`가 true가 된다.

## 직접 ID를 할당하는 경우는?

- 키 생성 전략 없이 직접 ID를 할당하면 새로운 entity로 간주되지 않는다.
- 이때는 엔티티가 `Persistable<ID>`를 구현해서, `JpaPersistableEntityInformation`의 `isNew()`가 동작하도록 해야 한다.

```java
public class JpaPersistableEntityInformation<T extends Persistable<ID>, ID>
        extends JpaMetamodelEntityInformation<T, ID> {

    @Override
    public boolean isNew(T entity) {
        return entity.isNew();
    }

    @Nullable
    @Override
    public ID getId(T entity) {
        return entity.getId();
    }
}
```

## 새로운 Entity인지 판단하는 게 왜 중요한가?

```java
@Override
@Transactional
public <S extends T> S save(S entity) {

    Assert.notNull(entity, "Entity must not be null");

    if (entityInformation.isNew(entity)) {
        entityManager.persist(entity);
        return entity;
    } else {
        return entityManager.merge(entity);
    }
}
```

- `SimpleJpaRepository.save()`는 `isNew()`로 persist와 merge 중 무엇을 할지 결정한다.
- ID를 직접 지정하면 신규로 판단되지 않아 merge가 실행되고, 신규 엔티티인데도 DB를 한 번 조회하게 되어 비효율적이다.
