---
title: 계층형 설계
---

# 계층형 설계

소프트웨어 구조를 추상화 수준에 따라 계층(Layer)으로 나누어 설계하는 방법

- **상위 계층**
  - 높은 수준의 추상화를 가진다.
  - 사용자 인터페이스나 개념적인 역할을 담당한다.
  - 하위 계층에 의존한다.
- **하위 계층**
  - 낮은 수준의 추상화를 가진다. (구체적이다)
  - 세부적인 로직, 데이터 처리 등을 담당한다.
  - 상위 계층에 의존하지 않는다. (단방향 의존성)
  - 여러 상위 계층에서 재사용할 수 있다.

## 계층 구조 예시

1. 비즈니스 규칙: 제품을 10만 원 이상 구매할 경우 10% 할인 등
2. 일반 동작: 장바구니에 제품 추가, 삭제, 금액 계산 등
3. 카피 온 라이트
4. 언어 기능: 반복문, 배열 인덱스 참조

## 예시

```javascript
function freeTieClip(cart) {
  var hasTie = false;
  var hasTieClip = false;
  for (var i = 0; i < cart.length; i++) {
    var item = cart[i];
    if (item.name === "tie")
      hasTie = true;
    if (item.name === "tie clip")
      hasTieClip = true;
  }
  if (hasTie && !hasTieClip) {
    var tieClip = make_item("tie clip", 0);
    return add_item(cart, tieClip);
  }
  return cart;
}
```

- 함수가 사용하는 다른 함수와 언어 기능(반복문, 배열 인덱스 참조)을 호출 그래프로 시각화한다.

![호출 그래프](./images/stratified-1.png)

- 직접 만든 함수와 언어 기능은 추상화 수준이 다르다.
  - 언어 기능: array index, for loop
  - 직접 만든 함수: `make_item()`, `add_item()`
  - 반복문과 배열 인덱스 참조는 더 낮은 추상화 단계다.

![추상화 단계 비교](./images/stratified-2.png)

- 한 함수에서 서로 다른 추상화 단계를 섞어 쓰면 코드가 명확하지 않아 읽기 어렵다.

```javascript
function freeTieClip(cart) {
  var hasTie = isInCart(cart, 'tie');
  var hasTieClip = isInCart(cart, 'tie clip');

  if (hasTie && !hasTieClip) {
    var tieClip = make_item("tie clip", 0);
    return add_item(cart, tieClip);
  }

  return cart;
}

function isInCart(cart, name) {
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].name === name) return true;
  }
  return false;
}
```

![개선 후 호출 그래프](./images/stratified-3.png)

- `freeTieClip`에서 언어 기능이 사라짐
- 비슷한 추상화 단계만 사용

![계층 전체](./images/stratified-4.png)

- 그래프의 위쪽 코드는 수정하기 쉽다.
- 그래프의 아래쪽 코드는 재사용성이 좋고, 그만큼 테스트가 중요하다.
