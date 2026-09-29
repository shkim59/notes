---
title: 액션과 계산, 데이터 구분하기
---

# 액션과 계산, 데이터 구분하기

<!-- ![액션, 계산, 데이터](./images/acd-1.png) -->

## 데이터

- 프로그램에서 처리되는 정보나 값, 이벤트에 대한 결과 (이름, 전화번호, 구매 리스트 등)
- 직렬화를 통해 전송하거나 저장, 읽기가 쉽다.
- 동일성 비교가 쉽다.

## 계산

- 부수효과가 발생하지 않는 순수함수 (사칙연산, 문자열 합치기 등)
- 입력으로 출력을 계산
  - 입력에만 의존하며 같은 입력에 항상 같은 출력을 반환
- 테스트가 쉽다

## 액션

- 부수효과가 발생하는 함수 (메일 전송, 파일 입출력 등)
- 실행 시점과 횟수에 의존 → 결과가 달라질 수 있다.

## 구분하는 이유

- 계산과 데이터는 상대적으로 예측과 테스트가 쉽다.
- 액션은 시점과 횟수에 의존하고 부수효과가 있어 예측과 테스트가 어렵다.
  - 액션을 호출하는 함수도 액션이 된다. (전파됨)
- 액션이 미치는 범위를 최소화하기 위해 계산과 데이터로 구분한다.

## 액션 나누기

- 가능한 액션을 적게 사용하고, 대신 계산을 사용할 수 있는지 고려한다.
- 액션과 관련 없는 코드는 모두 빼낸다.
  - 결정이나 계획과 관련된 부분은 계산이 될 가능성이 높다.
- 계산도 더 작은 계산과 데이터로 나눌 수 있는지 고려한다.
- 데이터는 다른 영향을 주지 않는다.
  - 데이터를 먼저 찾는 것이 좋다.
  - 데이터를 알면 동작에 대해 알 수 있다.

### 암묵적 입력과 출력

함수에는 입력과 출력이 있다. 입력은 함수가 계산하기 위한 외부 정보, 출력은 함수 밖으로 나오는 정보나 동작이다.

| | 명시적 | 암묵적 (부수효과) |
|---|---|---|
| 입력 | 인자 | 전역변수 읽기 |
| 출력 | 리턴값 | 콘솔 출력, 전역변수 변경 |

- 암묵적 입력과 출력이 있으면 액션이 된다.
- 암묵적 입력은 인자로, 암묵적 출력은 리턴값으로 바꾸면 계산으로 만들 수 있다.

## 예시

요구사항: 친구를 10명 이상 추천한 구독자에게 높은 등급의 쿠폰을 보내준다.

### 첫 번째 방법

```javascript
// 1. 구독자 목록을 가져온다 (액션)
const subscribers = fetchSubscribers();

// 2. 쿠폰 목록을 가져온다 (액션)
const coupons = fetchCoupons();

// 3. 친구를 10명 이상 추천한 구독자를 뽑아낸다 (계산)
const bestSubscribers = findBestSubscribers(subscribers);

// 4. 높은 등급의 쿠폰을 뽑아낸다 (계산)
const bestCoupon = findBestCoupon(coupons);

// 5. 3번의 구독자에게 4번의 쿠폰을 발송한다 (액션)
bestSubscribers.forEach(subscriber => sendMail(subscriber, bestCoupon));

// DB에서 구독자 목록을 가져온다.
function fetchSubscribers() {
  return [
    { email: 'user1@gmail.com', count: 10 },
    { email: 'user2@gmail.com', count: 4 },
    { email: 'user3@gmail.com', count: 1 },
    { email: 'user4@gmail.com', count: 15 },
  ];
}

// DB에서 쿠폰 목록을 가져온다.
function fetchCoupons() {
  return [
    { code: '5% 할인쿠폰', rank: 'bad' },
    { code: '10% 할인쿠폰', rank: 'good' },
    { code: '30% 할인쿠폰', rank: 'best' },
  ];
}

// 좋은 구독자를 뽑아낸다.
function findBestSubscribers(subscribers) {
  return subscribers.filter(subscriber => subscriber.count >= 10);
}

// 좋은 쿠폰을 뽑아낸다.
function findBestCoupon(coupons) {
  return coupons.find(coupon => coupon.rank === 'best');
}

// 메일을 보낸다.
function sendMail(subscriber, coupon) {
  const content = { to: subscriber.email, coupon };
  console.log(content); // 메일을 보낸다고 가정
}
```

### 개선 방법

<!-- ![개선 구조](./images/acd-2.png) -->

1. 1 ~ 4번 과정은 동일
2. 5번 과정을 계산과 액션으로 나눈다
   1. 좋은 구독자에게 좋은 쿠폰을 발송할 목록을 만든다. (계산)
   2. 만들어진 목록으로 메일을 발송한다. (액션)

```javascript
// 5-1. 발송 메일 목록을 만든다 (계산)
const mailList = createMailList(bestSubscribers, bestCoupon);

// 5-2. 메일을 발송한다 (액션)
sendMail(mailList);

function createMailList(subscribers, coupon) {
  return subscribers.map(subscriber => ({ subscriber, coupon }));
}

function sendMail(mailList) {
  for (let i = 0; i < mailList.length; i++) {
    console.log(mailList[i]); // 메일을 보낸다고 가정
  }
}
```

- 메일 목록 생성을 계산으로 분리해서 테스트가 훨씬 수월해진다.
