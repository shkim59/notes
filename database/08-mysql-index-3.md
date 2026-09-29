---
title: MySQL 인덱스 Part 3 - 정렬과 인덱스 활용
---

# MySQL 인덱스 Part 3 - 정렬과 인덱스 활용

## 인덱스 사용 이유

- 빠른 스캔
- 스트리밍 전송 방식 사용 → 클라이언트가 첫 번째 응답을 빨리 받을 수 있다
- LIMIT을 사용해 결과 건수 제한 가능

## 단일 인덱스

```sql
CREATE TABLE posts (
  id INT PRIMARY KEY,
  title VARCHAR(255),
  created_at DATETIME
);
```

```sql
EXPLAIN SELECT * FROM posts
WHERE created_at >= '2024-01-01'
ORDER BY created_at ASC;

EXPLAIN SELECT * FROM posts
WHERE created_at >= '2024-01-01'
ORDER BY created_at DESC;
```

### 오름차순 인덱스 (Forward Scan, 기본값)

```sql
CREATE INDEX idx_created_at_asc ON posts(created_at);

CREATE INDEX idx_created_at ON posts(created_at ASC);
```

- B-Tree 인덱스는 기본적으로 정렬되어 있어 오름차순 인덱스만으로도 내림차순 정렬을 수행할 수 있음
  - 인덱스의 뒤에서부터 읽으면 됨
  - 약간의 오버헤드 발생

### 내림차순 인덱스 (Backward Scan, 8.0부터 지원)

```sql
CREATE INDEX idx_created_at_desc ON posts(created_at DESC);
```

## 복합 인덱스

```sql
EXPLAIN SELECT * FROM posts
WHERE created_at >= '2024-01-01'
ORDER BY title;

EXPLAIN SELECT * FROM posts
WHERE title = '2024-01-01'
ORDER BY created_at;
```

### SQL 실행 순서

1. **FROM (JOIN)**
2. **WHERE**
3. **GROUP BY**
4. HAVING
5. SELECT
6. **ORDER BY**

- WHERE 절이 먼저 실행 → 풀 스캔 → 풀 스캔 결과에는 인덱스 사용 X → Filesort

```sql
CREATE INDEX idx_title_created_at ON posts(title, created_at);

-- OR

CREATE INDEX idx_title ON posts(title);
CREATE INDEX idx_created_at ON posts(created_at);
```

- 복합 인덱스는 왼쪽 컬럼을 기준으로 정렬되기 때문에 순서대로 사용해야 함
- 복합 인덱스가 아닌 두 개의 인덱스를 각각 만든 경우 ORDER BY에서 인덱스 사용 X

## GROUP BY

- 인덱스의 순서가 같아야 함

```sql
SELECT title, created_at FROM posts
GROUP BY title, created_at
ORDER BY title, created_at;
```

## JOIN

```sql
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100)
);

CREATE TABLE posts (
  id INT PRIMARY KEY,
  user_id INT,
  created_at DATETIME,
  content TEXT,
  INDEX idx_user_created (user_id, created_at)
);

-- 스트리밍 O
SELECT posts.*
FROM users
JOIN posts ON posts.user_id = users.id
WHERE users.id = 123
ORDER BY posts.created_at DESC
LIMIT 10;

-- 스트리밍 X
SELECT users.*, posts.*
FROM users
JOIN posts ON posts.user_id = users.id
ORDER BY posts.created_at DESC
LIMIT 10;
```

- 정렬 대상이 되는 테이블의 인덱스가 있어야 함
- 조인 대상이 WHERE로 필터링돼야 함
