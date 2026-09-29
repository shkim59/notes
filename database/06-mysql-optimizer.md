---
title: MySQL 옵티마이저 개요 및 기본 데이터 처리
---

# MySQL 옵티마이저 개요 및 기본 데이터 처리

## 옵티마이저란

- 쿼리를 실행할 때 가장 효율적인 방법을 결정

## 쿼리 실행 절차

1. **파싱**
   - SQL 문법 검사
     - 테이블과 컬럼의 존재 여부 확인
     - 권한 검사 (해당 사용자가 테이블에 접근할 권한이 있는지)
     - 데이터 타입 검사
     - 별칭(alias) 해석
   - 파서를 이용해 SQL 문을 토큰으로 분해
   - 토큰의 의미를 파악하여 파스 트리를 생성
2. **최적화**
   - 데이터 읽기 순서, 인덱스 사용 여부, 조인 순서 등 결정
   - 불필요한 연산 제거, 서브쿼리 최적화
   - 최적화된 쿼리를 바탕으로 **실행 계획**을 생성
3. **실행**
   - 생성된 실행 계획을 기반으로 쿼리가 실행된다.

## 옵티마이저 종류

### 규칙 기반 옵티마이저 (Rule-Based Optimizer, RBO)

- 미리 정의된 규칙의 우선순위에 따라 실행 계획을 생성
- 데이터의 실제 분포나 테이블 크기와 관계없이 규칙만을 기반으로 판단
- 항상 동일한 결과 → 예측 가능한 실행 계획
- 성능 이슈가 발생할 가능성이 높다

```sql
-- 사용자 활동 테이블
CREATE TABLE user_activities (
    id BIGINT PRIMARY KEY,
    user_id INT,
    activity_type VARCHAR(20),
    created_date DATE,
    INDEX idx_user_id (user_id),
    INDEX idx_activity_type (activity_type)
);

-- 데이터 분포 상황:
-- 전체 레코드: 10,000,000건
-- user_id = 1 (관리자): 9,500,000건
-- user_id = 2~10000: 500,000건
-- activity_type = 'page_view': 9,800,000건
-- activity_type = 'purchase': 200,000건

SELECT * FROM user_activities
WHERE user_id = 1 AND activity_type = 'purchase';

-- RBO 규칙: 조건절(where)의 순서대로 데이터를 스캔한다.
-- 실행 과정:
-- 1. user_id = 1로 인덱스 스캔 → 9,500,000건 반환
-- 2. 9,500,000건을 스캔하며 activity_type = 'purchase' 필터링

-- 비용 기반:
-- 1. activity_type = 'purchase'로 인덱스 스캔 → 200,000건 반환
-- 2. 200,000건을 스캔하며 user_id = 1 필터링
```

### 비용 기반 옵티마이저 (Cost-Based Optimizer, CBO)

- 테이블 크기, 카디널리티, 데이터 분포 등 통계 정보를 바탕으로 비용을 계산
  - 통계 정보 업데이트 방식
    - 테이블 변경량이 임계값 초과 시(10% 이상) 자동 업데이트
    - `ANALYZE TABLE` 명령 실행 시
  - 하드웨어의 특성을 반영
- 통계 정보 품질에 의존적
- 최적화 오버헤드
  - 계획 수립 시간: 복잡한 쿼리의 경우 최적의 실행 계획을 찾는 데 시간 소요
  - 메모리 사용: 통계 정보 등을 저장하기 위한 추가 메모리 필요

```sql
-- 옵티마이저 결정 결과 확인
EXPLAIN SELECT * FROM user_activities WHERE user_id = 1;
EXPLAIN FORMAT=JSON SELECT * FROM user_activities WHERE user_id = 1;

-- 실제 실행 통계 포함
EXPLAIN ANALYZE SELECT * FROM user_activities WHERE user_id = 1;

-- 인덱스 힌트 예시
SELECT * FROM user_activities USE INDEX(idx_activity_type)
WHERE user_id = 1 AND activity_type = 'purchase';

-- 주요 옵티마이저 설정 확인
SHOW VARIABLES LIKE 'optimizer_switch';
```

## 기본 데이터 처리

### 테이블 스캔

- 사용하는 경우
  - 테이블의 레코드 건수가 너무 작은 경우
  - 사용 가능한 인덱스가 없는 경우
  - 조건 일치 레코드 건수가 너무 많은 경우
- 기본 읽기 방식
  - 페이지 단위(16KB)로 데이터를 요청
  - 버퍼 풀에서 페이지를 찾음
  - 버퍼 풀에 없으면 디스크에서 해당 페이지를 읽어옴
- InnoDB 엔진에서
  - 처음은 기본 읽기와 같음 → 포그라운드 스레드가 처리
  - 순차 접근 패턴이 감지되면 백그라운드 스레드가 페이지를 읽어 버퍼 풀에 저장 → 리드 어헤드
- 리드 어헤드 (Read-ahead): 읽어 올 데이터를 예측해서 요청 전에 미리 디스크에서 읽어 버퍼 풀에 저장

### 인덱스 스캔

[MySQL 인덱스 Part 1 - B-Tree 인덱스 데이터 읽기](./04-mysql-index-1.md#b-tree-인덱스-데이터-읽기) 참고

### 병렬 처리

- 하나의 쿼리를 여러 스레드가 나누어 동시에 처리
- 풀 테이블 스캔, 인덱스 풀 스캔 등 대량의 데이터를 스캔하는 경우 병렬 처리 가능
- `innodb_parallel_read_threads` 변수 사용

```sql
SET SESSION innodb_parallel_read_threads = 4;
SELECT COUNT(*) FROM salaries;
```

- CPU의 코어 개수를 넘는 경우 성능이 떨어질 수 있음
