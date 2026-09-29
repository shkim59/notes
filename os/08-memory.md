---
title: 메모리 관리
---

# 메모리 관리

## Logical / Physical Address

- **Logical (virtual) address**
  - 프로세스마다 독립적으로 가지는 주소
  - 프로세스마다 0번지부터 시작
  - CPU가 보는 주소
- **Physical address**
  - 메모리에 실제로 올라가는 위치
- **주소 바인딩**: 주소를 결정하는 것
  - Symbolic → Logical → Physical

## 주소 바인딩 시점

| 시점 | 설명 |
|---|---|
| **Compile time** | 물리적 주소가 컴파일 시 결정. 시작 위치가 바뀌면 재컴파일 필요. 컴파일러가 절대 코드(absolute code) 생성 |
| **Load time** | 로더가 물리적 주소를 부여. 컴파일러가 재배치 가능 코드를 생성한 경우 가능 |
| **Execution time (Run time)** | 수행 중에도 메모리 위치를 옮길 수 있음. CPU가 주소를 참조할 때마다 바인딩을 점검. 하드웨어 지원(MMU) 필요 |

## MMU (Memory-Management Unit)

- 논리 주소를 물리 주소로 매핑해주는 하드웨어
- 사용자 프로세스가 생성하는 모든 주소값에 base register(relocation register) 값을 더한다
- 사용자 프로그램은 논리 주소만 다루며, 물리 주소를 볼 수 없고 알 필요도 없다

## 메모리 활용 기법

### Dynamic Loading

- 프로세스 전체를 미리 올리지 않고 해당 루틴이 불릴 때 메모리에 load
- 메모리 이용률 향상
- 가끔 사용되는 많은 양의 코드(예: 오류 처리 루틴)에 유용
- 운영체제의 특별한 지원 없이 프로그램 자체에서 구현 가능

### Overlays

- 프로세스 중 실제 필요한 부분만 메모리에 올림
- 프로세스 크기가 메모리보다 클 때 유용
- 운영체제 지원 없이 사용자가 구현 (초창기 시스템에서 수작업으로 구현)

### Swapping

- 프로세스를 일시적으로 메모리에서 backing store(디스크)로 쫓아내는 것
- 중기 스케줄러가 swap out할 프로세스를 선정
  - 우선순위 기반: 우선순위가 낮은 프로세스를 swap out, 높은 프로세스를 적재
- Compile time / Load time 바인딩이면 원래 위치로 swap in해야 하고, Execution time 바인딩이면 아무 빈 곳에나 올릴 수 있음
- swap time의 대부분은 transfer time

### Dynamic Linking

- 링킹을 실행 시간까지 미루는 기법
- **Static linking**: 라이브러리가 실행 파일 코드에 포함 → 실행 파일이 커짐
- **Dynamic linking**
  - 라이브러리가 실행 시 연결
  - 라이브러리 호출 부분에 루틴 위치를 찾기 위한 stub이라는 작은 코드를 둠
  - 라이브러리가 메모리에 있으면 그 주소로 가고, 없으면 디스크에서 읽어옴
  - 운영체제의 도움이 필요
