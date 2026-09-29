---
title: MySQL 인덱스 Part 2
---

# MySQL 인덱스 Part 2

## 클러스터링 인덱스

- 프라이머리 키(PK)를 기준으로 레코드를 정렬해서 저장한 인덱스
- 테이블당 클러스터링 인덱스는 하나만 존재
- InnoDB 스토리지 엔진에서는 모든 테이블이 클러스터링 인덱스를 가짐
  - **PK가 있는 경우**: PK를 클러스터링 인덱스로 사용
  - **PK가 없는 경우**: 첫 번째 NOT NULL UNIQUE 인덱스를 클러스터링 인덱스로 사용
  - **둘 다 없는 경우**: 내부적으로 일련번호 컬럼을 생성하여 클러스터링 인덱스로 사용
- 리프 노드에 레코드의 모든 값이 저장

## 세컨더리 인덱스

- 리프 노드에 PK 값을 저장
  - 레코드 주소를 저장하면, PK 값이 변경될 때 저장된 값도 모두 변경되어야 하기 때문
- PK 값이 커지면 세컨더리 인덱스도 커짐

## 유니크 인덱스

- MySQL에서는 인덱스 없이 유니크 제약만 설정할 수 없음
- NULL 가능 → NULL은 값이 아니므로 2개 이상 저장 가능
- 세컨더리 인덱스와 구조상 같다
  - 검색 속도의 차이는 거의 없다
  - 중복 체크 과정이 필요해 세컨더리 인덱스보다 쓰기 속도가 느리다

## 외래 키

- 참조 무결성: 다른 테이블의 PK나 유니크 키를 참조해 데이터의 일관성을 유지하는 것
- 데이터를 삽입하거나 삭제할 때 다른 테이블(부모 테이블)로 잠금이 확장된다 → 동시성 처리에 영향

---

## 그 외 인덱스

### 전문(Full Text) 검색 인덱스

- 문자형 타입의 컬럼에서 단어나 구문을 빠르게 검색할 수 있도록 최적화된 인덱스

**어근 분석 알고리즘**

- 단어에서 어근을 추출하는 자연어처리 기법
- 불용어 처리: 의미를 파악하는 데 도움이 되지 않는 단어를 필터링하는 작업
- 어근 분석: 검색어의 원형을 찾는 작업 (형태소 분석)

**n-gram 알고리즘**

- 키워드를 검색하기 위한 알고리즘
- n만큼 단어 또는 문자를 잘라서 인덱싱
- 인덱스의 크기가 큼

```sql
CREATE TABLE articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    FULLTEXT(title, content)
);

-- 기존 테이블에 전문 검색 인덱스 추가
ALTER TABLE articles ADD FULLTEXT(title, content);

-- 또는
CREATE FULLTEXT INDEX ft_title_content ON articles(title, content);
```

```sql
-- 자연어 모드
SELECT * FROM articles
WHERE MATCH(title, content) AGAINST('MySQL 데이터베이스');

-- 불린 모드
SELECT * FROM articles
WHERE MATCH(title, content) AGAINST('+MySQL -Oracle' IN BOOLEAN MODE);
-- +단어: 반드시 포함되어야 함
-- -단어: 포함되지 않아야 함
-- "구문": 정확한 구문 매치
-- *: 와일드카드 (단어 끝에만 사용 가능)
```

### 함수 기반 인덱스

- 컬럼 값에 함수나 표현식을 적용한 결과에 대해 생성하는 인덱스
- 계산된 값을 인덱싱
- 내부 구조는 B-Tree 인덱스와 같음

**가상 컬럼 기반**

- 테이블에 새로운 컬럼을 추가하는 것과 같은 효과 (테이블의 구조 변경)

```sql
ALTER TABLE user
  ADD full_name VARCHAR(30) AS (CONCAT(first_name, ' ', last_name)) VIRTUAL,
  ADD INDEX ix_fullname (full_name);
```

**함수 기반**

- 테이블의 구조를 변경하지 않음
- 조건절에 함수 기반 인덱스의 표현식이 그대로 사용돼야 한다

```sql
CREATE TABLE user (
  user_id BIGINT,
  first_name VARCHAR(10),
  last_name VARCHAR(10),
  PRIMARY KEY (user_id),
  INDEX ix_fullname ((CONCAT(first_name, ' ', last_name)))
);

SELECT * FROM user WHERE CONCAT(first_name, ' ', last_name) = 'HOHO';
```

### 멀티 밸류 인덱스

- 하나의 데이터 레코드가 여러 개의 키 값을 가질 수 있는 형태의 인덱스
- JSON 타입을 지원하기 위함
