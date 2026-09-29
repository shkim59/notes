---
title: Java 자료형 & 메모리 구조 & GC
---

# Java 자료형 & 메모리 구조 & GC

- Java는 데이터를 저장하는 방식에 따라 Primitive 타입과 Reference 타입으로 구분
- JVM의 각 메모리 영역에 다르게 저장

## Primitive 타입 (기본 자료형)

- Stack 메모리에 실제 값이 직접 저장
- 특징
  - 값이 직접 저장되므로 접근 속도가 빠름
  - null 할당 불가
  - 할당 시 값 복사

```java
int a = 10;
int b = a;
a = 20; // b는 여전히 10
```

- **종류**
  - 정수형: byte, short, int, long
  - 실수형: float, double
  - 논리형: boolean
  - 문자형: char

## Reference 타입

- Stack 메모리에 주소값, Heap 메모리에 실제 객체(인스턴스) 저장
- 특징
  - `new` 키워드를 통해 객체를 생성할 때 Heap 메모리에 할당
  - null 값 할당 가능
  - 할당 시 주소값(참조값)이 복사
    - 여러 변수가 하나의 동일한 객체를 참조 가능

```java
int[] arr1 = {1, 2, 3};
int[] arr2 = arr1;
arr1[0] = 100;  // arr2[0]도 100
```

- **종류**: 클래스의 인스턴스, 배열, 열거형(Enum) 등 `new` 연산자로 생성되는 모든 객체

## 메모리 구조

<!-- ![JVM 메모리 구조](./images/java-memory-1.png) -->

### Method Area / Metaspace

- 클래스 정보(필드, 메서드, 생성자 등), static 변수, 상수(literal pool) 등이 저장되는 영역
- 특징
  - JVM 내의 모든 스레드가 공유하는 메모리 영역
  - 클래스가 JVM에 로딩될 때 생성
  - JDK 8부터 Metaspace로 불리며, JVM이 아닌 네이티브 메모리 영역을 사용

### Stack Memory

- 메서드 호출 시 생성되는 지역 변수, 매개변수, Primitive 타입의 값, 메서드의 반환 주소 등이 저장되는 영역
- 특징
  - 스레드별로 독립적으로 생성
  - 메서드가 호출될 때 스택에 쌓이고, 메서드 실행이 끝나면 해당 프레임이 스택에서 제거
  - 데이터 접근 속도가 빠름
  - 크기가 제한 (StackOverflow 발생 가능)

```text
Stack Memory (Thread별 독립적)

┌─────────────────────────────┐
│     method2() Frame         │ ← 현재 실행 중인 메서드
│  - Local Variables: b=20    │
│  - Parameters: param=10     │
│  - Return Address           │
├─────────────────────────────┤
│     method1() Frame         │
│  - Local Variables: a=10    │
│  - Reference: str → Heap    │ (str 변수는 Stack에, "Hello" 객체는 Heap에)
│  - Return Address           │
├─────────────────────────────┤
│     main() Frame            │
│  - Parameters: args[]       │
│  - Return Address           │
└─────────────────────────────┘
```

### Heap Memory

- 객체, 배열, 인스턴스 변수 등 대부분의 Reference 타입 객체들이 저장되는 영역
- 특징
  - `new` 키워드를 사용하여 객체 생성 시 메모리 할당
  - JVM 내의 모든 스레드가 공유하는 영역
  - 크기가 Stack 메모리보다 큼, 동적 할당
  - Garbage Collector(GC)에 의해 메모리 관리
  - 상대적으로 데이터 접근 속도 느림

```text
Heap Memory
┌─────────────────────────────────────────────────────────┐
│                    Young Generation                     │ (전체 Heap의 약 1/3)
├─────────────┬─────────────┬─────────────────────────────┤
│    Eden     │ Survivor 0  │        Survivor 1           │
│   Space     │   (S0)      │          (S1)               │
└─────────────┴─────────────┴─────────────────────────────┘
                            ↓ (객체의 'Age' 임계값 도달 시)
┌─────────────────────────────────────────────────────────┐
│                  Old Generation                         │ (전체 Heap의 약 2/3)
│               (Tenured Space)                           │
└─────────────────────────────────────────────────────────┘
```

- **Young Generation**
  - 새로운 객체가 생성되는 공간
  - Eden Space(약 80%)와 Survivor Space(S0, S1 각 10%)로 구성
  - 대부분의 객체는 생성 후 짧은 시간 내에 더 이상 참조되지 않음
  - Minor GC 발생
- **Old Generation**
  - Young Generation의 Age 임계값보다 오래 살아남은 객체들이 저장되는 공간
  - 상대적으로 크기가 큼
  - Young Generation보다 GC 발생 빈도가 낮다
  - Major GC (Full GC) 발생

## GC

### Minor GC

- Eden Space가 가득 찰 때 발생
- 과정
  1. 새로운 객체는 Eden Space에 생성
  2. Eden Space가 가득 차면 Minor GC가 실행
  3. Eden Space와 현재 활성화된 Survivor Space(S0)를 스캔하여 더 이상 참조되지 않는 객체 제거
  4. 살아남은 객체들은 Age 값을 1 증가시키고, 다른 Survivor Space(S1)로 이동
  5. S0와 S1을 번갈아 스캔하면서 위 과정을 반복
  6. 객체의 Age 값이 특정 임계값에 도달하면 Old Generation으로 이동

### Major GC (Full GC)

- Old Generation이 가득 찰 때 발생
- Minor GC보다 시간이 오래 걸림

### 참조 해제 조건 (GC 대상이 되는 경우)

1. 지역 변수가 선언된 블록의 스코프를 벗어날 때

```java
public void scopeExample() {
    {
        String localString = new String("지역변수");
    } // 이 블록을 벗어나면 localString 참조가 해제되어 GC 대상이 됨
}
```

2. 참조를 `null`로 설정할 때

```java
public void nullReferenceExample() {
    String data = new String("데이터");
    data = null; // "데이터" 객체에 대한 참조가 끊어져 GC 대상이 됨
}
```

3. 컬렉션에서 제거될 때

```java
public void collectionExample() {
    List<String> list = new ArrayList<>();
    list.add(new String("항목1"));
    list.add(new String("항목2"));

    list.clear(); // 리스트의 모든 요소에 대한 참조가 끊어지고 GC 대상이 됨
}
```

## Static과 Instance

<!-- ![static과 instance](./images/java-memory-2.png) -->

- **static (정적) 멤버**
  - 클래스 로딩 시점에 메모리(Method Area / Metaspace)에 할당되고 초기화되며, 프로그램이 종료될 때까지 메모리에 남아있다
  - 모든 객체가 공유
  - 유틸리티 클래스의 메서드나 전역 상수 등을 정의할 때 사용
- **instance (인스턴스) 멤버**
  - `new` 키워드로 객체가 생성되는 시점에 Heap Memory에 할당
  - 객체마다 각각의 독립적인 공간을 가짐
  - 객체가 GC에 의해 메모리에서 해제될 때 함께 사라짐
  - 객체마다 고유한 값, 즉 객체의 상태(state)를 나타낼 때 적합
