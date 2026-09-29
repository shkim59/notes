---
title: 람다 표현식
---

# 람다 표현식

## 개념

- Java 8에서 도입된, 함수형 프로그래밍을 지원하기 위한 문법
- 익명 클래스를 간결하게 표현할 수 있는 **이름 없는 함수**
- 메서드를 인수로 전달할 수 있다

```java
(매개변수) -> { 실행문; }
```

## 특징

- **익명성**: 기존 익명 클래스를 대체해 불필요한 클래스 정의를 줄임
- **간결성**: 익명 클래스보다 훨씬 짧게 작성
- **지연 실행**: 필요한 시점에 실행되도록 코드를 캡슐화
- **함수형 인터페이스 구현**: 추상 메서드가 하나뿐인 인터페이스를 구현하는 데 사용

## 함수형 인터페이스

단 하나의 추상 메서드만 가진 인터페이스. `@FunctionalInterface`로 표시할 수 있다.

```java
@FunctionalInterface
interface MyFunction {
    void execute();
}
```

## 예시

```java
// 매개변수가 없는 람다
Runnable r = () -> System.out.println("Hello World");

// 매개변수가 하나인 람다 (괄호 생략 가능)
Consumer<String> c = s -> System.out.println(s);

// 매개변수가 여러 개인 람다
BiFunction<Integer, Integer, Integer> add = (a, b) -> a + b;

// 본문이 여러 줄인 람다
Comparator<String> comp = (s1, s2) -> {
    int result = s1.length() - s2.length();
    return result != 0 ? result : s1.compareTo(s2);
};
```

## 표준 함수형 인터페이스 (`java.util.function`)

| 인터페이스 | 매개변수 | 반환값 | 용도 |
|---|---|---|---|
| `Consumer<T>` | O | X | 소비 |
| `Supplier<T>` | X | O | 공급 |
| `Function<T, R>` | O | O | 매핑 |
| `Predicate<T>` | O | boolean | 조건 검사 |
| `BiFunction`, `BiConsumer`, `BiPredicate` | 2개 | | 매개변수 두 개 버전 |

```java
Consumer<String> printer = s -> System.out.println(s);
Supplier<Double> random = () -> Math.random();
Function<String, Integer> toInt = s -> Integer.parseInt(s);
Predicate<String> isEmpty = s -> s.isEmpty();
```

## 메서드 참조

람다가 단순히 메서드를 호출하기만 할 때 더 간결하게 표현

```java
Consumer<String> printer = s -> System.out.println(s);
Consumer<String> printer2 = System.out::println;
```

- 정적 메서드 참조: `ClassName::staticMethod`
- 인스턴스 메서드 참조: `instance::method`
- 특정 타입의 인스턴스 메서드 참조: `ClassName::method`
- 생성자 참조: `ClassName::new`

## 변수 캡처

람다는 외부 변수를 참조할 수 있다. 단, 캡처된 변수는 사실상 final(effectively final)이어야 한다.

```java
String prefix = "User: ";
Consumer<String> printer = name -> System.out.println(prefix + name);
```

## 활용 사례

```java
// 스트림 API
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");
names.stream()
     .filter(name -> name.startsWith("A"))
     .map(String::toUpperCase)
     .forEach(System.out::println);

// 이벤트 처리
button.addActionListener(e -> System.out.println("Button clicked"));

// 스레드 생성
new Thread(() -> {
    for (int i = 0; i < 5; i++) {
        System.out.println("Thread running: " + i);
    }
}).start();
```
