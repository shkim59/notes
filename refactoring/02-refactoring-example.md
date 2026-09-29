---
title: 리팩터링 첫 예시 — 공연료 청구서
---

> 『리팩터링 2판』 1장 예제

## 예제 프로그램

공연 목록과 관객 수로 청구서를 출력하는 `statement` 함수.

```json
// invoices.json
[
  {
    "customer": "BigCo",
    "performances": [
      { "playID": "hamlet",  "audience": 55 },
      { "playID": "as-like", "audience": 35 },
      { "playID": "othello", "audience": 40 }
    ]
  }
]

// plays.json
{
  "hamlet":  { "name": "Hamlet",         "type": "tragedy" },
  "as-like": { "name": "As You Like It", "type": "comedy" },
  "othello": { "name": "Othello",        "type": "tragedy" }
}
```

```javascript
function statement(invoice, plays) {
  let totalAmount = 0;
  let volumeCredits = 0;
  let result = `청구 내역 (고객명: ${invoice.customer})\n`;
  const format = new Intl.NumberFormat("en-US",
    { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format;

  for (let perf of invoice.performances) {
    const play = plays[perf.playID];
    let thisAmount = 0;

    switch (play.type) {
      case "tragedy":
        thisAmount = 40000;
        if (perf.audience > 30) {
          thisAmount += 1000 * (perf.audience - 30);
        }
        break;
      case "comedy":
        thisAmount = 30000;
        if (perf.audience > 20) {
          thisAmount += 10000 + 500 * (perf.audience - 20);
        }
        thisAmount += 300 * perf.audience;
        break;
      default:
        throw new Error(`알 수 없는 장르: ${play.type}`);
    }

    // 포인트 적립
    volumeCredits += Math.max(perf.audience - 30, 0);
    // 희극 관객 5명마다 추가 포인트
    if ("comedy" === play.type) volumeCredits += Math.floor(perf.audience / 5);

    // 청구 내역 출력
    result += ` ${play.name}: ${format(thisAmount / 100)} (${perf.audience}석)\n`;
    totalAmount += thisAmount;
  }

  result += `총액: ${format(totalAmount / 100)}\n`;
  result += `적립 포인트: ${volumeCredits}점\n`;
  return result;
}
```

## 1단계: 테스트 코드 작성

- **리팩터링의 첫 단계는 테스트 코드 작성**이다.
- 테스트는 결과를 사람이 눈으로 비교하지 않아도 되도록 **자가진단**하게 만든다.

## 2단계: 함수 추출하기

`switch` 문(공연 요금 계산)을 `amountFor` 함수로 추출하고, `thisAmount`를 반환하게 한다.

```javascript
for (let perf of invoice.performances) {
  const play = plays[perf.playID];
  let thisAmount = amountFor(perf, play); // 추출한 함수 사용
  ...
}

function amountFor(perf, play) {
  let thisAmount = 0;
  switch (play.type) {
    ... // 기존 switch 문 그대로
  }
  return thisAmount;
}
```

- 리팩터링 후에는 **반드시 테스트**한다.
- 자주 테스트할수록 한 번의 변경 폭이 작아 문제를 찾고 고치기 쉽다.
- **리팩터링은 프로그램 수정을 작은 단계로 나눠 진행한다. 중간에 실수해도 버그를 쉽게 찾을 수 있다.**

## 3단계: 변수 이름 바꾸기

`thisAmount` → `result`, `perf` → `aPerformance`

```javascript
function amountFor(aPerformance, play) {
  let result = 0;
  switch (play.type) {
    case "tragedy":
      result = 40000;
      if (aPerformance.audience > 30) {
        result += 1000 * (aPerformance.audience - 30);
      }
      break;
    case "comedy":
      result = 30000;
      if (aPerformance.audience > 20) {
        result += 10000 + 500 * (aPerformance.audience - 20);
      }
      result += 300 * aPerformance.audience;
      break;
    default:
      throw new Error(`알 수 없는 장르: ${play.type}`);
  }
  return result;
}
```

- 함수의 반환 값을 담는 변수는 **`result`** 로 한다.
- 매개변수 이름에는 **타입 이름**을 넣고, 역할이 뚜렷하지 않으면 부정관사(a, an)를 붙인다.
- 명확성을 높이기 위한 이름 변경은 적극 권장한다.
