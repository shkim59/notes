---
title: Java 버전별 변화 (JVM · GC · 언어 기능)
---

# Java 버전별 변화 (JVM · GC · 언어 기능)

## 한눈에 보기

| 영역 | 흐름 |
|---|---|
| 메모리 | PermGen → Metaspace, Compressed Oops, Compact Strings, CDS/AppCDS, Elastic Metaspace, Object Header 축소(Lilliput) |
| GC | CMS → G1 기본, ZGC/Shenandoah(저지연), Generational ZGC, Epsilon(측정용) |
| 컴파일러 | C1/C2 계층적 컴파일, Graal AOT, Vector API, Escape Analysis + OSR |
| 스레드 | OS 스레드 1:1 매핑 → Virtual Threads (Java 21) |
| 운영 도구 | JFR, JFR Event Streaming, NUMA-aware GC, Dynamic CDS |

## Java 1.4 ~ 6: HotSpot JVM 기반 구축

- **Java 1.4 (2002)**
  - **TLAB (Thread-Local Allocation Buffer)**: 스레드별 객체 할당 버퍼를 제공해 락 경합 없이 빠른 메모리 할당
  - **CMS GC 최초 도입**: STW 시간을 크게 줄였으나 메모리 단편화와 CPU 오버헤드가 단점
- **Java 5.0 (2004)**
  - **Java Memory Model 재정립**: `volatile` 등의 동작을 명확히 정의해 `happens-before` 관계 보장, 스레드 간 가시성 강화
  - **OSR (On-Stack Replacement) 향상**: 긴 루프 실행 중에도 실행 중인 스택을 JIT 컴파일된 코드로 교체
  - **CDS 1단계**: `rt.jar` 핵심 클래스를 공유 아카이브에 저장해 JVM 시작 시간 20~30% 단축
- **Java 6 (2006)**
  - **Parallel Old GC**: Old Generation까지 병렬 GC 적용 → 멀티코어에서 전체 GC 병렬화
  - **Escape Analysis + 스택 할당 실험**: 스코프 내에서만 쓰이는 객체를 스택에 할당하거나 필드별 변수로 분해(스칼라 교체)

```java
// TLAB 개념
// 기존 방식 (느림)
synchronized (heap) {
    Object obj = new Object(); // 락 경합 발생
}

// TLAB 방식 (빠름)
if (tlab.hasSpace()) {
    Object obj = tlab.allocate(); // 락 없이 빠른 할당
} else {
    // 새 TLAB 요청 (큰 객체는 직접 Old Generation)
}
```

```text
CMS GC 동작
기존 Serial GC: [STW] Mark → [STW] Sweep → [STW] Compact

CMS GC: Initial Mark [STW 짧음]
      → Concurrent Mark [앱 실행 중]
      → Remark [STW 짧음]
      → Concurrent Sweep [앱 실행 중]
```

## Java 7 ~ 11: 새로운 GC 패러다임

- **Java 7 (2011)**
  - **Compressed Oops 기본 활성화**: 32GB 미만 힙에서 32비트 포인터를 사용해 64비트 JVM의 메모리 사용량 30~50% 절감
  - **G1 GC 정식 제공**: 힙을 1~32MB Region으로 분할하고 가비지가 많은 영역부터 정리 → 예측 가능한 STW (`-XX:MaxGCPauseMillis=200`)
  - **InvokeDynamic + MethodHandle**: 동적 언어 호출 최적화, 리플렉션보다 빠름
- **Java 8 (2014)** ★
  - **PermGen → Metaspace**: 네이티브 메모리를 사용해 OS 한계까지 자동 확장, 클래스 언로딩 시 자동 회수
  - **Tiered Compilation 기본 활성화**: 인터프리터 → C1 → C2 단계적 컴파일로 워밍업 단축
  - **Compact Strings**: `char[]` → `byte[]` + `coder` 필드로 문자열 메모리 25~30% 절감
- **Java 9 (2017)**
  - **G1 GC 기본 GC 전환** (Java 8까지는 Parallel GC가 기본)
  - **모듈 시스템(Jigsaw) + jlink**: 필요한 모듈만 포함한 최소 런타임 생성 (100MB+ → 10~20MB)
  - **AOT 컴파일 실험적 지원**, **AppCDS** (애플리케이션 클래스까지 공유 아카이브)
- **Java 10 (2018)**
  - **`var`** 지역 변수 타입 추론 (바이트코드에는 기존 타입 유지)
  - **G1 Full GC 병렬화**
- **Java 11 (2018)** ★
  - **ZGC 실험적 도입**: Colored Pointers + Load Barrier로 대용량 힙에서도 매우 짧은 STW 목표
  - **Shenandoah GC**, **Epsilon GC** (GC 오버헤드 측정용 No-op GC)
  - **Flight Recorder / JMC 오픈소스화**
  - CMS GC deprecated (Java 14에서 제거)

## Java 12 ~ 21: 저지연 GC와 가상 스레드

- **Java 12~13**: Dynamic CDS Archive (실행 프로파일로 아카이브 자동 생성)
- **Java 14**: NUMA-aware GC, JFR Event Streaming
- **Java 15**: **ZGC / Shenandoah 정식 전환**, Hidden Class
- **Java 16**: Concurrent Thread-Stack Processing, Elastic Metaspace
- **Java 17 (LTS)** ★: Vector API Incubator (명시적 SIMD), Always-Pre-Touch G1
- **Java 18~20**: Loom 프리뷰, FFM/Vector API 개선, Generational ZGC 실험 (20)
- **Java 21 (LTS)** ★
  - **Virtual Threads 정식 도입**: 캐리어(플랫폼) 스레드에 N:M으로 매핑되는 경량 스레드. 블로킹 시 자동으로 다른 가상 스레드로 전환
  - **Generational ZGC 정식**
  - Tiered-CDS 기본 활성화

```java
// 기존 스레드: 1만 개 생성 시 메모리 부족 (1MB 스택 × 10000)
for (int i = 0; i < 10000; i++) {
    new Thread(() -> { /* ... */ }).start();
}

// Virtual Thread: 1백만 개도 가능
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 1_000_000; i++) {
        executor.submit(() -> { /* 블로킹 시 캐리어 스레드 반납 */ });
    }
}
```

## LTS 버전별 주요 언어 기능

### Java 8

- 람다 표현식, 스트림 API
- `Optional`
- 새로운 날짜/시간 API (`java.time`)
- 인터페이스 default 메서드

### Java 11

- Oracle JDK 상업용 유료화 → OpenJDK 사용 확산
- HTTP Client API (HTTP/2, WebSocket)
- 람다 매개변수에 `var` 사용 가능
- Java EE, CORBA 모듈 제거, TLS 1.3 지원

### Java 17

- Sealed Classes
- Record Classes (16에서 정식)
- Pattern Matching for switch (프리뷰)
- Spring Boot 3.x의 최소 요구 버전

### Java 21

- Virtual Threads
- Sequenced Collections
- Record Patterns
- String Templates (프리뷰)

## GC 종류 요약

| GC | 특징 |
|---|---|
| Serial | 단일 스레드, 소규모 애플리케이션 |
| Parallel | 여러 스레드로 병렬 수행, 처리량(throughput) 중심 |
| CMS | 애플리케이션과 동시 실행해 STW 최소화 (Java 14에서 제거) |
| G1 | Region 단위, 예측 가능한 일시 정지, Java 9+ 기본 |
| ZGC | 10ms 이하 일시 정지 목표, TB 단위 힙 지원 |
| Shenandoah | ZGC와 유사, 힙 크기와 무관한 일관된 일시 정지 |

## 참고 자료

- Oracle Java SE 릴리즈 노트, JVM Specification
- OpenJDK JEP: JEP 122 (Remove PermGen), JEP 248 (G1 기본), JEP 333/377 (ZGC), JEP 379 (Shenandoah), JEP 444 (Virtual Threads)
