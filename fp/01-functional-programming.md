---
title: 함수형 프로그래밍
---

# 함수형 프로그래밍

## 보편적 정의

- **순수함수**를 기반으로 상태 변경과 **부수효과**를 최소화하며 **선언형 스타일**을 지향하는 프로그래밍 패러다임
- 함수를 **일급**으로 다루며 함수를 변수처럼 전달하고 조합할 수 있다.
- **불변성**과 **고차함수** 등의 개념을 활용해 예측과 유지보수가 쉬운 코드를 작성할 수 있다.

## 선언형 스타일

프로그램이 어떤 방법으로 해야 하는지보다 무엇과 같은지를 설명하는 방식
→ **"어떻게(How)"가 아니라 "무엇을(What)"** 할 것인지에 초점을 맞춘 스타일

**명령형**

```javascript
const numbers = [1, 2, 3, 4, 5, 6];
const evens = [];

for (let i = 0; i < numbers.length; i++) {
  if (numbers[i] % 2 === 0) {
    evens.push(numbers[i]);
  }
}
```

- 절차가 어떻게 수행되는지 기술한다.
  → `for` 루프로 배열을 순회하면서 `if` 문으로 짝수를 판별하고, `push()`로 `evens` 배열에 추가한다.

**선언형**

```javascript
const numbers = [1, 2, 3, 4, 5, 6];
const evens = numbers.filter(n => n % 2 === 0);
```

- 무엇을 할지를 기술한다.
  → `filter()` 함수(고차 함수)로 배열에서 짝수만 남긴다.
- `for` 루프나 `if` 조건문을 명시적으로 사용할 필요가 없다.
- 코드가 간결해지고 상대적으로 가독성이 좋다.

## 부수효과(Side Effect)와 순수함수

**부수효과**

- 함수에서 리턴값 이외에 하는 모든 일 (외부의 상태를 변경하거나 영향을 주는 일)
- 코드의 예측 가능성을 낮추고 디버깅을 어렵게 만드는 원인

```javascript
// 부수효과가 발생하는 함수
let total = 0;

function addToTotal(value) {
  total += value; // 외부 변수(total)를 변경 → 부수효과 발생
}
```

**순수함수**

- 입력에만 의존하며 부수효과가 없는 함수
- 동일한 입력에 대해 항상 동일한 출력을 반환한다.

```javascript
// 부수효과가 없는 순수함수
function add(a, b) {
  return a + b; // 같은 입력에 대해 항상 같은 결과 반환
}
```

## 일급(First-class) 함수

일급이란 **특정 엔티티(함수나 객체)가 다른 모든 엔티티와 동일하게 취급된다**는 개념으로, 다음 특성을 가진다.

1. 변수에 할당할 수 있다.
2. 함수의 인자로 전달할 수 있다.
3. 함수의 반환값으로 사용할 수 있다.
4. 자료구조(배열, 객체 등)에 저장할 수 있다.
5. 런타임에 생성 가능하다.

```javascript
// 함수를 변수에 할당
const greet = function(name) {
  return `Hello, ${name}!`;
};

// 함수를 다른 함수의 인자로 전달
function callFunction(fn, name) {
  return fn(name);
}

// 함수를 반환값으로 사용
function createGreeting(greeting) {
  return function(name) {
    return `${greeting}, ${name}!`;
  };
}
```

> 💡 일급이라는 표현은 해당 요소가 언어 내에서 일급 시민(first-class citizen)처럼 모든 권리와 특권을 가진다는 의미다. 즉, 숫자나 문자열 같은 기본 데이터 타입과 동일한 수준으로 취급된다.

## 고차(Higher-order) 함수

다른 함수를 인자로 받거나 함수를 결과로 반환하는 함수

1. 하나 이상의 함수를 매개변수로 받음
2. 함수를 결과로 반환함

**함수를 인자로 받는 고차함수**

```javascript
// map: 배열의 각 요소에 함수를 적용하고 결과로 새 배열을 반환
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(num => num * 2); // [2, 4, 6, 8, 10]

// filter: 조건을 만족하는 요소만 필터링
const evens = numbers.filter(num => num % 2 === 0); // [2, 4]

// reduce: 배열의 모든 값을 하나로 축소
const sum = numbers.reduce((acc, curr) => acc + curr, 0); // 15
```

**함수를 반환하는 고차함수**

```javascript
// 특정 숫자만큼 증가시키는 함수를 반환
function createIncrementer(increment) {
  return function(number) {
    return number + increment;
  };
}

const incrementByOne = createIncrementer(1);
const incrementByTen = createIncrementer(10);

console.log(incrementByOne(5));  // 6
console.log(incrementByTen(5));  // 15
```

> 💡 고차라는 표현은 함수가 다른 함수를 다룬다는 의미다. 일반 함수가 값을 다룬다면 고차함수는 함수 자체를 다루는, 더 **높은 계층의 추상화와 유연성**을 제공한다.

**고차함수의 장점**

- **추상화 수준 향상**: 동작의 패턴을 추상화하여 재사용 가능한 코드 생성
- **코드 간결성**: 복잡한 로직을 간결하게 표현
- **테스트 용이성**: 단일 책임을 가진 작은 함수들로 분리되어 테스트가 쉬움
- **유연성**: 런타임에 알고리즘이나 동작을 변경할 수 있음

## 불변성 (Immutability)

데이터를 변경하지 않고 새로운 데이터를 생성하여 반환하는 방식

```javascript
// 불변성을 지키지 않는 코드
function addNumber(arr, num) {
  arr.push(num); // 원본 배열을 변경 (불변성 위반)
  return arr;
}

// 불변성을 유지하는 방법
function addNumber(arr, num) {
  return [...arr, num]; // 기존 배열을 복사하고 새로운 요소 추가
}
```

- 불변성을 유지하면 부수효과를 최소화하고 순수함수를 만들기 쉽다.
- 데이터의 일관성이 유지된다.

> 💡 함수형 프로그래밍은 순수함수와 불변성 덕분에 공유 상태 없이 **입력에만 의존**하고 **데이터의 일관성을 유지하기 쉽다.** 상태 공유를 최소화하므로 **상태 동기화 비용이 적고 확장성이 좋아서**, 병렬 프로그래밍·동시성 프로그래밍·분산 시스템에 유리하다.
