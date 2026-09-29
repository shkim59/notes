---
title: Hook 규칙과 커스텀 훅
---

## Hook 규칙

1. **컴포넌트 함수나 커스텀 훅 안에서만 사용한다.**
   - 일반 함수에서는 쓸 수 없다. React의 상태 관리가 제대로 이루어지기 위한 조건이다.
2. **조건문, 반복문, 중첩 함수 안에서 호출하지 않는다.**
   - 훅은 **항상 같은 순서로** 호출되어야 React가 상태와 의존성을 일관되게 관리할 수 있다.
   - `if`, `for`, `while` 블록 안에서 호출하면 의도대로 동작하지 않거나 오류가 난다.

## 커스텀 훅

반복되는 로직을 재사용하기 위한 **사용자 정의 훅**.

- `useState`, `useEffect` 같은 내장 훅을 조합해서 만든다.
- 일반 자바스크립트 함수처럼 동작하지만 훅 규칙을 따른다.

### 쓰는 이유

- **중복 제거**: 같은 로직을 여러 컴포넌트에서 재사용
- **가독성**: 컴포넌트 로직이 간결해져 유지보수가 쉬움
- **관심사 분리**: 비동기 요청, 폼 상태 같은 복잡한 로직을 분리

### 만드는 규칙

1. 이름은 **`use`로 시작**한다. React는 `use`로 시작하는 함수를 훅으로 인식하고 규칙을 적용한다.
2. 내부에서 다른 훅을 쓸 수 있다.
3. 최상위 레벨에서만 호출한다.

### 예: useFetch

```jsx
import { useState, useEffect } from 'react';

function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        setData(await response.json());
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [url]);

  return { data, loading, error };
}

export default useFetch;
```

```jsx
function UserList() {
  const { data, loading, error } = useFetch('https://jsonplaceholder.typicode.com/users');

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <ul>
      {data.map((user) => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}
```

- `url`을 받아 fetch하고, `data`/`loading`/`error` 상태를 `useState`로 관리한다.
- `useEffect`로 렌더링 후 요청하고, `url`이 바뀌면 다시 요청한다.
- 여러 컴포넌트에서 같은 로직을 재사용할 수 있다.
