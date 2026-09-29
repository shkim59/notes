---
title: 리팩터링을 위한 테스트 작성
---

> 『리팩터링 2판』 4장

## 무엇을 테스트하나

- **위험 요인을 중심으로** 작성한다. 모든 public 메서드를 테스트할 필요는 없다.
- 테스트를 너무 많이 만들면 오히려 꼭 필요한 테스트를 놓칠 수 있다.

## 픽스처

```javascript
// ❌ 테스트 케이스끼리 공유 → 한 테스트가 값을 바꾸면 다른 테스트가 깨질 수 있다
// const asia = new Province(sampleProvinceData());

// ✅ beforeEach는 각 테스트 직전에 실행되어 공유되지 않는다
let asia;
beforeEach(function () {
  asia = new Province(sampleProvinceData());
});

it('shortfall', function () {
  assert.equal(asia.shortfall, 5);   // assert 스타일
  expect(asia.shortfall).equal(5);   // expect 스타일
});

it('profit', function () {
  expect(asia.profit).equal(230);
});
```

- **매번 새 픽스처를 만드는 것을 권장**한다 (성능 차이는 미미하다).
- 테스트 안에서 픽스처 값을 바꾸지 않는다.
- 픽스처가 **불변**이라면 공유해도 괜찮다.
- `beforeEach`로 **표준 픽스처**를 만들면 모든 테스트가 같은 기준 데이터로 시작한다.

## 테스트 하나에 검증 하나

- 앞의 검증이 실패하면 나머지 검증은 실행되지 않아, 나머지의 성공·실패 여부와 원인을 알 수 없다.
- 그래서 **테스트 케이스 하나당 검증 하나**를 권장한다.

## 경계값 검사

- 정상 범위뿐 아니라 **범위를 벗어나는 경계 지점**의 케이스를 작성한다 (빈 컬렉션, 0, 음수, 잘못된 타입 등).
- 경계 조건은 리팩터링으로 동작이 바뀌지 않아야 하는 부분이라, 한 번 테스트해 두면 리팩터링할 때 따로 신경 쓰지 않아도 된다.
