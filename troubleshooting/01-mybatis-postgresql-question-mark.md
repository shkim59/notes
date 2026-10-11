---
title: MyBatis + PostgreSQL `?` 연산자 충돌 이슈
---

# MyBatis + PostgreSQL `?` 연산자 충돌 이슈

## 문제 상황

팀원분이 MyBatis 쿼리를 수정한 이후 파라미터가 하나씩 밀려서 바인딩되는 현상이 발생한다며 이슈를 공유해주셨습니다.

백엔드에서 디버깅해보니 DTO에는 값이 정상적으로 들어가 있었지만, 실제 MyBatis가 실행하는 쿼리에서는 아래 에러가 발생하고 있었습니다.

```text
org.postgresql.util.PSQLException: No value specified for parameter 1
```

## 원인 분석

새로 추가된 쿼리를 하나씩 제거해 가며 범위를 좁혀 나갔고, 특정 쿼리를 제거했을 때 에러가 사라지는 것을 확인했습니다. 해당 쿼리에는 `?` 연산자가 포함되어 있었습니다.

**[작성한 쿼리 예시]**

```xml
<select id="findData" resultType="map">
    SELECT * FROM my_table
    WHERE json_column ? 'target_key'
</select>
```

원인은 `?`의 의미가 레이어마다 달라서 충돌이 발생한 것이었습니다.

| 레이어 | `?`의 의미 |
|---|---|
| **PostgreSQL** | `jsonb` 타입에서 해당 키가 존재하는지 확인하는 연산자 |
| **JDBC (PreparedStatement)** | 동적 파라미터 바인딩을 위한 예약어 |

MyBatis는 JDBC 위에서 동작하기 때문에 쿼리 안의 `?`를 보는 순간 "파라미터가 바인딩되어야 하는 자리"로 인식합니다. 실제로는 파라미터가 아니라 PostgreSQL 연산자였기 때문에, 매핑할 파라미터 개수가 맞지 않는다는 에러가 발생한 것입니다.

## 해결 방법

### 1. PostgreSQL 내장 함수로 대체 (권장)

기호 형태의 연산자 대신 같은 기능의 내장 함수를 사용하면 JDBC 드라이버와의 충돌을 원천적으로 막을 수 있고, 쿼리의 의도도 더 잘 드러납니다.

```sql
-- Before
WHERE json_column ? 'target_key'

-- After
WHERE jsonb_exists(json_column, 'target_key')
```

### 2. 이스케이프 처리

내장 함수를 쓰기 어렵거나 `?` 연산자를 유지해야 한다면, PostgreSQL JDBC 드라이버가 `??`를 하나의 `?`로 해석하는 점을 이용할 수 있습니다.

```sql
-- Before
WHERE json_column ? 'target_key'

-- After
WHERE json_column ?? 'target_key'
```

## 마치며

프레임워크나 드라이버가 내부적으로 쓰는 예약어와 데이터베이스 고유 문법이 겹치면 이런 오류가 생길 수 있습니다. 증상만 보면 단순한 '파라미터 개수 불일치'처럼 보여 디버깅 방향을 잡기 어렵지만, 실제 원인은 레이어 간 기호 해석 차이에 있었습니다. 쿼리를 작성할 때 사용 중인 ORM이나 SQL Mapper가 그 문법을 어떻게 해석할지 한 번 더 고민해보는 것이 중요하다고 느꼈습니다.
