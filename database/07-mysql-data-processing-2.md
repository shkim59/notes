---
title: MySQL 기본 데이터 처리 Part 2
---

# MySQL 기본 데이터 처리 Part 2

## ORDER BY

### 정렬 방법

- **인덱스 이용**
  - 이미 정렬되어 있음
  - 매우 빠름
- **Filesort 이용**
  - 메모리 정렬
    - 소트 버퍼: 정렬을 수행하기 위해 별도의 메모리 공간을 할당받은 것
      - 쿼리 실행이 완료되면 즉시 반납
      - [세션(로컬) 메모리 영역](./01-mysql-engine-architecture.md#메모리-할당-및-구조)에 해당 → 커넥션이 많고 정렬 작업이 많을수록 소비되는 메모리 공간이 커짐
    - 결과가 `sort_buffer_size`보다 작으면 메모리에서 정렬 → 빠른 처리
      - `sort_buffer_size`: 최대 사용 가능한 버퍼 공간 크기 설정
  - 디스크 정렬
    - 메모리 버퍼를 초과하면 임시 디스크 파일 사용
    - 성능이 크게 저하됨

### 정렬 알고리즘

- **싱글 패스**
  - 정렬 대상 컬럼을 포함해 SELECT 컬럼 전부를 담아 정렬 수행
  - 정렬이 완료되면 버퍼의 내용을 그대로 넘겨준다
  - 최신 버전에서 주로 사용
  - 메모리 사용량 많음
- **투 패스**
  - 정렬 대상 컬럼과 프라이머리 키만 담아 정렬 수행
  - 정렬된 순서대로 프라이머리 키를 사용해 대상 컬럼을 SELECT
  - 메모리 사용량 적음

```text
if (max_length_for_sort_data >= 필요한 모든 컬럼의 총 크기) {
    싱글 패스 사용
} else {
    투 패스 사용
}
```

### JOIN 정렬 처리 방법

- **인덱스 이용**
- **드라이빙 테이블만 정렬** (조인의 기준이 되는 테이블)
  - 드라이빙 테이블을 먼저 정렬하고 조인을 수행
  - ORDER BY 절이 드라이빙 테이블의 컬럼만 참조하는 경우

```sql
SELECT u.name, p.title
FROM users u -- 드라이빙 테이블
JOIN posts p ON u.id = p.user_id
ORDER BY u.name; -- 드라이빙 테이블의 컬럼만 참조
```

- **임시 테이블을 이용한 정렬**
  - 조인을 먼저 수행하고 결과를 임시 테이블에 저장 후 정렬 수행

```sql
SELECT u.name, p.title
FROM users u
JOIN posts p ON u.id = p.user_id
ORDER BY p.created_at; -- 드라이빙 테이블의 컬럼 참조 X
```

### 정렬 데이터 전송 방식

- **스트리밍 방식**
  - 인덱스 사용
  - 정렬된 순서대로 데이터를 즉시 전송
  - 빠른 첫 번째 응답: 첫 레코드를 즉시 받을 수 있음
  - LIMIT를 사용해 쿼리 실행 시간을 단축할 수 있다.
- **버퍼링 방식**
  - 모든 데이터를 정렬한 후 일괄 전송
  - LIMIT가 성능 향상에 도움이 되지 않는다.

## GROUP BY

- 인덱스 스캔
- 루스 인덱스 스캔
  - [MySQL 인덱스 Part 1 - 루스 인덱스 스캔](./04-mysql-index-1.md#루스-인덱스-스캔) 참고
  - 선택도(카디널리티)에 영향
- 임시 테이블
  - 인덱스를 활용할 수 없을 때 사용
- HAVING 절은 인덱스 조건을 사용할 수 없다

## DISTINCT 처리

- **일반적인 사용**: GROUP BY와 동일하게 동작

```sql
-- GROUP BY와 동일
SELECT DISTINCT emp_no FROM salaries;
SELECT emp_no FROM salaries GROUP BY emp_no;
```

- **집합 함수와 함께 사용**
  - 내부적으로 임시 테이블을 사용 → 실행 계획에 표시되지 않음
  - 해당 컬럼의 유니크 인덱스가 생성 → 풀 스캔

```sql
SELECT COUNT(DISTINCT s.salary)
FROM employees e, salaries s
WHERE e.emp_no = s.emp_no;
```
