---
title: 메모이제이션 — useCallback, useMemo, React.memo
---

| | 무엇을 기억하나 | 재생성·재실행 조건 |
|---|---|---|
| `useCallback` | **함수 객체** | 의존성 배열의 값이 바뀔 때 |
| `useMemo` | **연산 결과 값** | 의존성 배열의 값이 바뀔 때 |
| `React.memo` | **컴포넌트 렌더링 결과** | props가 바뀔 때 |

## useCallback — 함수 재생성 방지

- 컴포넌트는 상태나 props가 바뀌면 다시 렌더링되고, 그때 내부 함수도 새로 만들어진다.
- `useCallback`은 의존성 배열이 바뀌지 않는 한 **같은 함수 객체**를 반환한다.
- 특히 **자식 컴포넌트에 콜백을 props로 넘길 때** 자식의 불필요한 렌더링을 막는 데 쓴다 (자식이 `React.memo`로 감싸져 있어야 효과가 있다).

```jsx
function ParentComponent() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState('');

  const incrementCount = useCallback(() => {
    setCount((prev) => prev + 1);
  }, []); // 처음 렌더링될 때만 생성

  return (
    <div>
      <h1>Count: {count}</h1>
      <ChildComponent onClick={incrementCount} />
      <input value={text} onChange={(e) => setText(e.target.value)} />
    </div>
  );
}

const ChildComponent = React.memo(function ChildComponent({ onClick }) {
  console.log('ChildComponent 렌더링!');
  return <button onClick={onClick}>Increment</button>;
});
```

- `text`가 바뀌면 `ParentComponent`는 다시 렌더링된다.
- 하지만 `incrementCount`는 같은 함수 객체라 `ChildComponent`는 다시 렌더링되지 않는다.
- `useCallback`이 없으면 매번 새 함수가 생겨 props가 바뀐 것으로 판단되고, 자식도 매번 렌더링된다.

## useMemo — 값 재계산 방지

- 함수의 **연산 결과를 캐시**하고, 의존성 배열이 바뀌지 않으면 다시 계산하지 않는다.
- 비용이 큰 연산이나 렌더링마다 반복되는 불필요한 계산을 피할 때 쓴다.

```jsx
function ExpensiveCalculationComponent({ numbers }) {
  const total = useMemo(() => {
    console.log('비싼 연산 수행 중...');
    return numbers.reduce((sum, n) => sum + n, 0);
  }, [numbers]);

  return <div>총합: {total}</div>;
}
```

- 첫 렌더링에서 합계를 계산한다.
- 부모의 `count`가 바뀌어 다시 렌더링되어도 `numbers`가 그대로면 이전 값을 재사용한다.

## React.memo — 컴포넌트 재렌더링 방지

- 함수형 컴포넌트를 메모이제이션해서 **props가 같으면 재렌더링하지 않는다.**
- 부모가 렌더링될 때 자식도 따라 렌더링되는 기본 동작을 막는다.

```jsx
const ChildComponent = React.memo(({ value }) => {
  console.log('ChildComponent 렌더링');
  return <div>값: {value}</div>;
});

function ParentComponent() {
  const [count, setCount] = useState(0);
  const [inputValue, setInputValue] = useState('');

  return (
    <div>
      <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
      <ChildComponent value={count} />
    </div>
  );
}
```

- input에 입력할 때는 `count`가 그대로라 `ChildComponent`는 렌더링되지 않는다.
- 버튼을 눌러 `count`가 바뀌면 `value` prop이 바뀌므로 렌더링된다.
