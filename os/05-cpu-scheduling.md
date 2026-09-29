---
title: CPU 스케줄링
---

# CPU 스케줄링

## CPU & I/O Bursts

- 프로세스는 CPU burst와 I/O burst가 반복되며 실행된다
- **I/O bound job**: 계산보다 I/O에 많은 시간이 필요 → 짧은 CPU burst가 많음
- **CPU bound job**: 계산 위주 → 매우 긴 CPU burst가 적음

## CPU Scheduler & Dispatcher

- **CPU Scheduler**: Ready 상태의 프로세스 중 이번에 CPU를 줄 프로세스를 고른다
- **Dispatcher**: CPU 제어권을 선택된 프로세스에게 넘긴다 (문맥 교환)
- CPU 스케줄링이 필요한 상태 변화
  1. Running → Blocked (I/O 요청 시스템 콜)
  2. Running → Ready (할당 시간 만료, 타이머 인터럽트)
  3. Blocked → Ready (I/O 완료 후 인터럽트)
  4. Terminate
  - 1, 4: **비선점(nonpreemptive)** → 자진 반납
  - 2, 3: **선점(preemptive)** → 강제로 빼앗음

## 성능 척도 (Scheduling Criteria)

1. **CPU utilization (이용률)**: 전체 시간 중 CPU가 일한 시간의 비율
2. **Throughput (처리량)**: 주어진 시간 동안 처리한 일의 양
3. **Turnaround time (반환 시간)**: CPU를 사용하러 들어와서 I/O를 하러 나가기까지 걸린 시간
4. **Waiting time (대기 시간)**: Ready Queue에서 기다린 시간
5. **Response time (응답 시간)**: 처음으로 CPU를 얻기까지 걸린 시간

## 스케줄링 알고리즘

### FCFS (First-Come First-Served)

- 비선점형
- 긴 프로세스가 먼저 오면 뒤의 짧은 프로세스들이 오래 기다리는 convoy effect 발생

### SJF (Shortest-Job-First)

- CPU burst가 가장 짧은 프로세스를 먼저 스케줄 → 평균 대기 시간이 가장 짧음
- **비선점형**: 일단 CPU를 잡으면 완료될 때까지 선점당하지 않음
- **선점형 (SRTF, Shortest-Remaining-Time-First)**: 현재 프로세스의 남은 burst보다 짧은 프로세스가 도착하면 CPU를 빼앗김
- 기아 현상(starvation)이 발생할 수 있음
- CPU 사용 시간을 미리 알 수 없어 과거 burst time으로 추정

### Priority Scheduling

- 우선순위가 높은 프로세스에게 우선 할당 (비선점/선점 모두 가능)
- 기아 현상 발생 가능 → **aging** 기법(오래 기다리면 우선순위를 높임)으로 해결

### Round Robin (RR)

- 각 프로세스는 동일한 크기의 할당 시간(time quantum)을 가짐
- 할당 시간이 지나면 선점당하고 Ready Queue 맨 뒤로 이동 (타이머 인터럽트)
- n개의 프로세스, 할당 시간 q일 때 어떤 프로세스도 (n-1)q 이상 기다리지 않는다
- 평균 반환 시간은 길어질 수 있지만 응답 시간이 빠르다
- q가 크면 FCFS와 같아지고, q가 작으면 문맥 교환 오버헤드가 커진다

### Multilevel Queue

- Ready Queue를 여러 개로 분할 (예: foreground-interactive, background-batch)
- 각 큐는 독립적인 스케줄링 알고리즘을 가짐 (foreground: RR, background: FCFS)
- 큐 간 스케줄링
  - Fixed priority: foreground를 모두 처리한 뒤 background → 기아 발생 가능
  - Time slice: 큐마다 CPU 시간을 비율로 할당 (예: 80% / 20%)

### Multilevel Feedback Queue

- 프로세스가 다른 큐로 이동 가능 → aging 구현 가능
- 파라미터: 큐의 수, 큐별 스케줄링 알고리즘, 상위/하위 큐로 보내는 기준, 처음 들어갈 큐를 정하는 기준

## 특수한 스케줄링

### Multiple-Processor Scheduling

- 동일한 프로세서들(Homogeneous)이면 한 줄로 세워 각 프로세서가 꺼내가게 할 수 있다
- 특정 프로세서에서만 수행되어야 하는 프로세스가 있으면 더 복잡해짐
- **Load sharing**: 일부 프로세서에 작업이 몰리지 않도록 부하 분산 (별개 큐 vs 공동 큐)
- **Symmetric Multiprocessing (SMP)**: 모든 CPU가 대등하게 각자 스케줄링
- **Asymmetric Multiprocessing**: 하나의 프로세서가 시스템 데이터 접근과 공유를 책임지고 나머지는 따름

### Real-Time Scheduling

- **Hard real-time**: 정해진 시간 안에 반드시 끝내도록 스케줄링
- **Soft real-time**: 일반 프로세스보다 높은 우선순위를 주지만 데드라인을 반드시 보장하지는 않음

### Thread Scheduling

- **Local**: 사용자 수준 스레드는 스레드 라이브러리가 어떤 스레드를 실행할지 결정
- **Global**: 커널 수준 스레드는 커널의 단기 스케줄러가 결정

## 알고리즘 평가

- **Queueing models**: 확률 분포로 주어지는 도착률, 처리율 등으로 성능 지표 계산
- **Implementation & Measurement**: 실제 시스템에 구현해 실제 작업으로 성능 측정
- **Simulation**: 모의 프로그램으로 작성 후 trace를 입력으로 결과 비교
