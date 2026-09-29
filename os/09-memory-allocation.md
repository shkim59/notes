---
title: 메모리 할당
---

# 메모리 할당

- 메모리는 일반적으로 두 영역으로 나뉘어 사용
  - **OS 상주 영역**: interrupt vector와 함께 낮은 주소 영역 사용
  - **사용자 프로세스 영역**: 높은 주소 영역 사용
- 할당 방법
  - **Contiguous allocation**: 각 프로세스가 메모리의 연속적인 공간에 적재 (고정 분할, 가변 분할)
  - **Noncontiguous allocation**: 하나의 프로세스가 메모리의 여러 영역에 분산되어 올라감 (Paging, Segmentation, Paged Segmentation)

## Contiguous Allocation

### 고정 분할 방식

- 물리적 메모리를 몇 개의 영구적 분할(partition)로 나눔 (크기가 모두 같거나 서로 다름)
- 분할당 하나의 프로그램 적재
- 융통성 없음
  - 동시에 메모리에 load되는 프로그램의 수가 고정
  - 최대 수행 가능 프로그램 크기 제한
- 내부 조각, 외부 조각 모두 발생

### 가변 분할 방식

- 프로그램의 크기를 고려해서 할당 → 분할의 크기와 개수가 동적으로 변함
- 기술적 관리 기법 필요
- 외부 조각 발생

### 외부 조각 vs 내부 조각

- **External fragmentation (외부 조각)**: 분할의 크기가 프로그램보다 작아서 아무 프로그램에도 배정되지 않은 빈 공간
- **Internal fragmentation (내부 조각)**: 분할의 크기가 프로그램보다 커서 하나의 분할 내부에 남는 사용되지 않는 공간

### Hole

- 가용 메모리 공간. 다양한 크기의 hole이 메모리 곳곳에 흩어져 있음
- 프로세스가 도착하면 수용 가능한 hole을 할당
- 운영체제는 할당 공간과 가용 공간(hole) 정보를 유지

### Dynamic Storage-Allocation Problem

가변 분할 방식에서 크기 n인 요청을 만족하는 가장 적절한 hole을 찾는 문제

- **First-fit**: 최초로 찾아지는 hole에 할당
- **Best-fit**: 크기 n 이상인 가장 작은 hole에 할당
  - 크기순 정렬이 안 되어 있으면 모든 hole을 탐색
  - 아주 작은 hole들이 많이 생김
- **Worst-fit**: 가장 큰 hole에 할당
  - 모든 리스트를 탐색
  - 상대적으로 큰 hole들이 생성

## Noncontiguous Allocation

### Paging

- 프로세스의 가상 메모리를 동일한 크기의 page 단위로 나눔
- page 단위로 불연속적으로 저장. 일부는 backing storage에, 일부는 physical memory에 저장
- **기본 방법**
  - 물리 메모리를 같은 크기의 frame으로, 논리 메모리를 같은 크기의 page로 나눔
  - 모든 가용 frame들을 관리
  - page table로 논리 주소를 물리 주소로 변환
- **Page table 구현**
  - page table은 main memory에 상주
  - PTBR(page-table base register)가 page table을 가리킴
  - PTLR(page-table length register)가 테이블 크기를 보관
  - 모든 메모리 접근에 2번의 memory access 필요 (page table 접근 + 실제 data/instruction 접근)

### Segmentation

- 프로그램을 의미 단위인 여러 개의 segment로 구성
  - 작게는 함수 하나하나, 크게는 프로그램 전체를 하나의 세그먼트로 정의
  - 일반적으로 code, data, stack이 각각 하나의 세그먼트
- **구조**
  - 논리 주소는 `<segment-number, offset>`으로 구성
  - segment table
  - STBR(segment-table base register): 물리 메모리에서 segment table의 위치
  - STLR(segment-table length register): 프로그램이 사용하는 segment의 수
- **Sharing**: segment는 의미 단위이므로 공유와 보안이 paging보다 효과적
- **Allocation**: first-fit / best-fit. segment 길이가 제각각이라 가변 분할과 같은 문제(외부 조각)가 발생

### Paged Segmentation

- segment-table entry가 segment의 base address 대신, segment를 구성하는 page table의 base address를 가지고 있음
