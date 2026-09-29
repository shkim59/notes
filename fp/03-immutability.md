---
title: 불변성 유지하기
---

# 불변성 유지하기

## 동작 분류하기

- **읽기**
  - 데이터에서 정보를 가져온다.
  - 데이터를 변경하지 않는다.
  - 인자에만 의존해 정보를 가져오면 계산이 될 수 있다.
- **쓰기**
  - 데이터를 변경한다.

## 카피 온 라이트 (Copy-on-Write)

- 데이터를 변경할 때 복사본을 만들어서 변경하는 방법
- 세 단계로 구성
  1. 복사본 만들기
  2. 복사본 변경하기
  3. 복사본 리턴하기
- 쓰기를 읽기로 바꾼다.
- 얕은 복사를 사용한다.
- 일반화하기 쉽다.

```javascript
// 처음 코드
let cart = [];

function addItem(item) {
  cart.push(item);
}

addItem(item);

// 매개변수로 받기
function addItem(items, item) {
  items.push(item);
}

addItem(cart, item);

// 카피 온 라이트
function addItem(items, item) {
  const copyItems = items.slice();
  copyItems.push(item);
  return copyItems;
}

const updated = addItem(cart, item);
```

## 쓰기와 읽기를 둘 다 하는 동작

- 방법 1: 읽기와 쓰기 함수로 분리
  1. 쓰기에서 읽기를 분리한다.
  2. 쓰기에 카피 온 라이트를 적용해 읽기로 바꾼다.
- 방법 2: 함수에서 값을 두 개 리턴

```javascript
// shift()는 값을 변경하면서 읽는다
items.shift();

// 읽기와 쓰기 동작으로 분리
function firstElement(array) {
  return array[0];
}

function dropFirst(array) {
  array.shift();
}

// 쓰기 동작을 카피 온 라이트로 변경
function dropFirst(array) {
  const copy = array.slice();
  copy.shift();
  return copy;
}

// 값을 두 개 리턴하는 함수로 만들기
function shift(array) {
  const copy = array.slice();
  const first = copy.shift();

  return {
    first,
    array: copy,
  };
}

// 첫 번째와 두 번째 방법 조합하기
function shift(array) {
  return {
    first: firstElement(array),
    array: dropFirst(array),
  };
}
```

## 중첩 데이터 구조의 카피 온 라이트

```javascript
const cart = [
  { name: 'item1', price: 10, quantity: 10 },
  { name: 'item2', price: 20, quantity: 20 },
  { name: 'item3', price: 30, quantity: 30 },
];

function objectSet(object, key, value) {
  const copy = Object.assign({}, object);
  copy[key] = value;
  return copy;
}

function setPrice(item, newPrice) {
  return objectSet(item, 'price', newPrice);
}

function setQuantity(item, newQuantity) {
  return objectSet(item, 'quantity', newQuantity);
}

function setPriceByName(cart, name, price) {
  const cartCopy = cart.slice();

  for (let i = 0; i < cartCopy.length; i++) {
    if (cartCopy[i].name === name) {
      cartCopy[i] = setPrice(cartCopy[i], price);
    }
  }

  return cartCopy;
}
```

- 중첩된 데이터 구조에서 바뀌는 부분만 복사한다. (**얕은 복사**)
- 두 중첩 데이터 구조가 안쪽의 같은 데이터를 참조하는 것을 **구조적 공유**라고 한다.

## 방어적 복사

- 신뢰할 수 없는 코드와 데이터를 주고받을 때 **깊은 복사**를 사용해 데이터를 지키는 방법
- API 요청 등에서 사용

```javascript
function safe(cart) {
  const cartCopy = deepCopy(cart);
  apiCall(cartCopy); // 신뢰할 수 없는 코드
  return deepCopy(cartCopy);
}
```

## 얕은 복사와 깊은 복사

| | 얕은 복사 | 깊은 복사 |
|---|---|---|
| 범위 | 필요한(변경된) 부분만 최소한으로 복사 | 모든 계층의 중첩 데이터 구조를 복사 |
| 비용 | 메모리를 적게 쓰고 빠름 | 상대적으로 비용이 큼 |
| 용도 | 카피 온 라이트 | 방어적 복사 |
