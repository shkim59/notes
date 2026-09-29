---
title: Stream API
---

# Stream API

## Stream API란?

- Java 8부터 도입된 **데이터 처리용 선언형 API**
- 다량의 데이터를 for/while 없이 간결하고 읽기 쉬운 방식으로 처리
- 스트림 = 데이터 원소의 유한 혹은 무한 시퀀스
  - **유한 스트림**: 배열, 컬렉션, 파일 등
  - **무한 스트림**: `Stream.generate()`, `Stream.iterate()` 등

> 💡 스트림은 데이터를 직접 저장하지 않으며, 원본 데이터를 변경하지 않는다.

## 파이프라이닝

스트림은 연산을 연결해 하나의 파이프라인을 구성한다.

| 구분 | 예시 | 역할 | 개수 | 실행 시점 |
|---|---|---|---|---|
| **중간 연산** | `filter`, `map`, `sorted`, `distinct`, `peek` | 변환/필터링 | 없어도 되고 여러 개 가능 | **지연 실행(lazy)** |
| **최종 연산** | `collect`, `forEach`, `reduce`, `count`, `anyMatch` | 결과 생성 | 스트림당 하나 | 호출 시 즉시 실행 |

```java
Stream<Integer> s = list.stream()
    .filter(v -> v > 10)
    .map(v -> v * 2); // 아직 아무 연산도 실행되지 않음

List<Integer> result = s.collect(Collectors.toList()); // 이 시점에 전체 파이프라인 실행
```

- 중간 연산만 있으면 스트림은 실행되지 않는다

### 지연 연산 (Lazy Evaluation)

- 파이프라인 정의만 해두고 **최종 연산이 호출되기 전까지 실제 연산을 수행하지 않는다**
- 불필요한 연산을 최대한 뒤로 미뤄, 최종 결과에 필요 없는 작업은 아예 하지 않기 위한 설계

```java
list.stream()
    .filter(v -> v > 10)
    .map(v -> v * 2)
    .findFirst(); // 조건을 만족하는 첫 원소를 찾으면 즉시 멈춤
```

### 수평적 반복 vs 수직적 반복

- 일반 루프나 자바스크립트 고차함수는 **연산별로 컬렉션을 한 바퀴씩** 돈다 (수평적)
- 스트림은 **요소 하나가 파이프라인 전체를 위에서 아래로 통과**한 뒤 다음 요소로 넘어간다 (수직적)
  1. 원본에서 요소 하나를 꺼냄
  2. `filter` 통과 여부 확인
  3. 통과하면 `map` 적용
  4. 최종 연산에서 소비
  5. 다음 요소에 대해 반복
- 덕분에 여러 연산을 **하나의 루프로 통합(loop fusion)**하고, 불필요한 연산을 건너뛸 수 있다

### Stateless vs Stateful 중간 연산

- **Stateless** (`map`, `filter`, `peek`, `flatMap`): 이전 요소의 정보가 필요 없음 → 병렬 처리와 파이프라인 최적화에 유리
- **Stateful** (`sorted`, `distinct`, `limit`, `skip`): 요소를 모아두었다가 처리해야 함 → 메모리 사용량 증가, 병렬 처리에 상대적으로 불리

### 단락(Short-circuit) 연산

- `findFirst`, `findAny`, `anyMatch`, `allMatch`, `noneMatch`, `limit`
- 결과를 얻는 순간 나머지 요소는 읽지도 않고 파이프라인을 종료한다
- 지연 평가 덕분에 **필요한 만큼만 읽고 필요한 만큼만 연산**하는 구조가 된다

## 자바스크립트 고차함수와의 차이

| 항목 | JavaScript `map`, `filter` | Java Stream |
|---|---|---|
| 처리 방식 | 함수마다 개별 루프 수행 | 파이프라인으로 통합해 한 번의 루프 |
| 평가 시점 | 즉시 평가 | 지연 평가 |
| 병렬 처리 | 직접 관리 필요 | `parallelStream()` |

- 예: `filter → filter → map`이면 JS는 3번 루프, Stream은 1번 루프
- JS의 고차함수는 루프를 선언형으로 쓰는 것에 가깝고, 동작 방식은 완전히 다르다

## 병렬 처리

```java
List<Integer> result = list.parallelStream()
    .filter(v -> v > 10)
    .map(v -> v * 2)
    .collect(Collectors.toList());
```

### Fork/Join Framework

- 병렬 스트림은 내부적으로 Java 7부터 지원하는 **Fork/Join Framework**를 사용
- **Fork**: 큰 작업을 작은 작업으로 쪼갬 / **Join**: 결과를 다시 합침
- 분할 정복(Divide & Conquer) 패턴을 일반화한 프레임워크 (병합 정렬, 퀵 정렬 같은 구조)

### ForkJoinPool

- 직접 스레드를 만들지 않고 **공용 ForkJoinPool**을 사용
- 기본적으로 CPU 코어 수만큼 워커 스레드를 생성
- JVM 전역에 하나뿐이라, 병렬 스트림을 과도하게 쓰면 다른 병렬 작업과 스레드를 두고 경쟁할 수 있다

### 데이터 분할

1. `parallelStream()` 호출
2. **Spliterator**가 데이터 소스를 여러 청크로 쪼갬
   - `ArrayList`, 배열은 분할이 쉬워 효율적
   - `LinkedList`처럼 랜덤 접근이 안 되는 구조는 비효율적
3. 각 청크가 별도 작업으로 ForkJoinPool에 제출되고, 자기 범위에 대해서만 중간 연산을 수행

### Work Stealing

- 각 워커 스레드는 자기 전용 작업 큐를 가진다
- 일반 스레드 풀은 할 일이 없으면 대기하지만, ForkJoinPool의 워커는 **다른 워커의 큐에서 남은 작업을 훔쳐 와서** 처리한다
- 특정 스레드에 일이 몰리는 것을 줄이고 CPU 코어가 쉬지 않게 한다

### 주의점

무조건 빠른 것은 아니다.

- 데이터가 적을 때 → 분할/병합 오버헤드가 더 큼
- 순서가 중요한 연산 (`forEachOrdered`, 정렬 등)
- 공유 mutable 상태를 수정하는 연산 (예: 외부 리스트에 `add`)
- → **읽기 전용, 순서 무관, 데이터 많음**일 때 병렬 스트림을 고려

## 언제 Stream을 쓰면 좋은가?

- 복잡한 필터링/매핑/정렬을 간단하게 표현하고 싶을 때
- 컬렉션 데이터 변환이 많을 때
- 가독성을 높이고 싶을 때
- 대규모 데이터를 병렬 처리해야 할 때
- 반대로 아주 단순한 반복에서는 일반 반복문이 더 빠를 수 있다
