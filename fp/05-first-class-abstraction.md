---
title: 일급 추상
---

# 일급 추상

## 일급

- 변수, 인자, 반환값 등으로 사용할 수 있는 것

## 암묵적 인자

- 필드를 결정하는 문자열이 함수 이름에 들어 있는 것
- 함수 구현이 거의 똑같고, 함수 이름이 구현의 차이를 만든다.

```javascript
function setPriceByName(cart, name, price) {
  const item = cart[name];
  const newItem = objectSet(item, 'price', price);
  return objectSet(cart, name, newItem);
}

function setQuantityByName(cart, name, quantity) {
  const item = cart[name];
  const newItem = objectSet(item, 'quantity', quantity);
  return objectSet(cart, name, newItem);
}

function setShippingByName(cart, name, shipping) {
  const item = cart[name];
  const newItem = objectSet(item, 'shipping', shipping);
  return objectSet(cart, name, newItem);
}

function setTaxByName(cart, name, tax) {
  const item = cart[name];
  const newItem = objectSet(item, 'tax', tax);
  return objectSet(cart, name, newItem);
}

cart = setPriceByName(cart, 'shoe', 13);
cart = setQuantityByName(cart, 'shoe', 3);
cart = setShippingByName(cart, 'shoe', 0);
cart = setTaxByName(cart, 'shoe', 2.34);
```

- 함수 이름에 있는 필드명을 명시적인 인자로 바꿔 중복 코드를 없앨 수 있다.

```javascript
function setFieldByName(cart, name, field, value) {
  const item = cart[name];
  const newItem = objectSet(item, field, value);
  return objectSet(cart, name, newItem);
}

cart = setFieldByName(cart, 'shoe', 'price', 13);
cart = setFieldByName(cart, 'shoe', 'quantity', 3);
cart = setFieldByName(cart, 'shoe', 'shipping', 0);
cart = setFieldByName(cart, 'shoe', 'tax', 2.34);
```

- 필드명이 인자로 넘길 수 있는 값이 되어 **일급**이 됨

## 고차함수

- 함수를 인자로 사용하거나 결과로 반환하는 함수

```javascript
// 처음
function cookAndEatFoods() {
  for (let i = 0; i < foods.length; i++) {
    const item = foods[i];
    cook(item);
    eat(item);
  }
}

function cleanDishes() {
  for (let i = 0; i < dishes.length; i++) {
    const item = dishes[i];
    wash(item);
    dry(item);
    putAway(item);
  }
}

// 1. 배열을 인자로 받기
function cookAndEatArray(array) {
  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    cook(item);
    eat(item);
  }
}

function cleanArray(array) {
  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    wash(item);
    dry(item);
    putAway(item);
  }
}

// 2. 반복문 본문을 함수로 분리
function cookAndEat(food) {
  cook(food);
  eat(food);
}

function clean(dish) {
  wash(dish);
  dry(dish);
  putAway(dish);
}

// 3. 암묵적 인자(함수명) 제거 → 함수를 인자로 받음
function operateOnArray(array, callback) {
  for (let i = 0; i < array.length; i++) {
    callback(array[i]);
  }
}

operateOnArray(foods, cookAndEat);
operateOnArray(dishes, clean);

// 4. 이름 변경 - 함수를 인자로 받으므로 고차함수
function forEach(array, callback) {
  for (let i = 0; i < array.length; i++) {
    callback(array[i]);
  }
}

forEach(foods, cookAndEat);
forEach(dishes, clean);

// 익명 함수 사용
forEach(foods, (food) => {
  cook(food);
  eat(food);
});
```

## 함수를 반환하는 함수

```javascript
function saveUserData(user) {
  console.log('save user');
}

function fetchProduct(productId) {
  console.log('fetch product');
}

try {
  saveUserData(user);
} catch (error) {
  logToSnapErrors(error);
}

// 고차함수로 공통 로직 추출
function withLogging(callback) {
  try {
    callback();
  } catch (error) {
    logToSnapErrors(error);
  }
}

withLogging(function () {
  saveUserData(user);
});

// 함수를 반환하는 함수
function wrapLogging(callback) {
  return function (arg) {
    try {
      callback(arg);
    } catch (error) {
      logToSnapErrors(error);
    }
  };
}

const saveUserDataWithLogging = wrapLogging(saveUserData);
const fetchProductWithLogging = wrapLogging(fetchProduct);

saveUserDataWithLogging(user);
wrapLogging(saveUserData)(user);
```
