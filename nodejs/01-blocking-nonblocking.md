---
title: 블로킹 I/O와 논블로킹 I/O, 이벤트 루프
---

## 블로킹 I/O

- I/O를 요청한 함수 호출이 **완료될 때까지 스레드 실행을 차단**한다.
- 한 스레드가 여러 연결을 동시에 처리할 수 없으므로, 동시 연결마다 **별도 스레드나 프로세스**가 필요하다.
- 스레드는 메모리와 CPU를 많이 쓰고 **컨텍스트 스위칭**을 일으켜 시스템 자원을 많이 소모한다.

## 논블로킹 I/O

호출이 결과를 기다리지 않고 **즉시 반환**된다. 데이터가 아직 없으면 "없음"을 알려 준다.

### 바쁜 대기(busy-waiting)

데이터가 올 때까지 루프 안에서 리소스를 계속 **폴링**(주기적으로 확인)한다. CPU를 낭비하는 비효율적인 방식이다.

```javascript
resources = [socketA, socketB, socketC];
while (!resources.isEmpty()) {
  for (resource of resources) {
    data = resource.read();                  // 읽기 시도
    if (data === NO_DATA_AVAILABLE) continue; // 지금은 읽을 데이터 없음
    if (data === RESOURCE_CLOSED) {
      resources.remove(resource);            // 닫힌 리소스는 제거
    } else {
      consumeData(data);                     // 데이터 처리
    }
  }
}
```

### 이벤트 디멀티플렉싱과 이벤트 루프

**동기 이벤트 디멀티플렉서**(이벤트 통지 인터페이스)가 여러 리소스를 관찰하다가, 읽기·쓰기가 가능해진 리소스가 생기면 이벤트로 돌려준다. 그동안은 블로킹되어 CPU를 쓰지 않는다.

```javascript
watchedList.add(socketA, FOR_READ);
watchedList.add(fileB, FOR_READ);

while (events = demultiplexer.watch(watchedList)) {   // 준비된 리소스가 생길 때까지 대기
  // 이벤트 루프
  for (const event of events) {
    data = event.resource.read();                     // 블로킹 없이 항상 데이터를 반환
    if (data === RESOURCE_CLOSED) {
      demultiplexer.unwatch(event.resource);
    } else {
      consumeData(data);
    }
  }
}
```

→ **하나의 스레드로 여러 I/O를 동시에 다룰 수 있다.** Node.js가 싱글 스레드로도 많은 연결을 처리하는 기반이 이 구조다 (리액터 패턴).

| | 동시 연결 처리 | 자원 사용 |
|---|---|---|
| 블로킹 I/O | 연결마다 스레드 | 스레드·컨텍스트 스위칭 비용 큼 |
| 논블로킹 + 바쁜 대기 | 한 스레드 | 쉬지 않고 폴링 → CPU 낭비 |
| 논블로킹 + 이벤트 디멀티플렉서 | 한 스레드 | 준비된 것만 처리 → 효율적 |

> 참고: 『Node.js 디자인 패턴 바이블』 1장
