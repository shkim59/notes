---
title: React 기본 개념
---

## 프로젝트 구조

### main.jsx

- 애플리케이션의 **진입점**. 브라우저가 페이지를 로딩할 때 가장 먼저 실행된다.
- `import`로 React와 ReactDOM을 불러온다.
- `createRoot`: HTML의 `id="root"` `<div>`에 접근한다.
- `render`: ReactDOM이 제공하는 메서드로 컴포넌트를 렌더링한다. 여기서 JSX가 화면에 출력된다.
- 외부 라이브러리 의존성은 `package.json`으로 관리한다.

## 핵심 개념

- **React**는 컴포넌트 중심 라이브러리다. 컴포넌트를 작성하고 조합해서 UI를 구성한다.
- **컴포넌트**: JSX를 반환하는 함수. 다른 JSX 안에서 HTML 요소처럼 사용할 수 있다. 조합해서 복잡한 UI를 모듈화한다.
- **JSX**: JavaScript 안에서 HTML을 작성하는 문법.

### children

- props에 기본으로 제공되는 값으로, 컴포넌트 태그 **사이의 값**을 받는다.
- 문자열, 태그, 컴포넌트 등 무엇이든 넣을 수 있다.

```jsx
<ButtonComponent>버튼</ButtonComponent>

function ButtonComponent({ children }) {
  return <button>{children}</button>;
}
```

### state vs ref

| | 값이 바뀌면 |
|---|---|
| state | 컴포넌트를 **재평가(재실행)** 한다 |
| ref | 재실행하지 않는다 |

## StrictMode

React가 제공하는 **개발 도구**. 애플리케이션이 예상대로 동작하는지 확인하고 미래 버전과의 호환성을 준비하도록 돕는다. **개발 환경에서만** 동작하고 프로덕션 빌드에는 영향이 없다.

### 주요 기능

1. **잠재적 문제 감지**
   - 제거 예정인 라이프사이클 메서드 등 비권장 API 사용 경고
   - 렌더링 과정에서 부작용을 일으키는 컴포넌트 감지
2. **더블 렌더링** (개발 모드 전용)
   - React 18부터 StrictMode가 켜져 있으면 **초기 렌더링을 두 번** 한다.
   - 의도된 동작으로, 컴포넌트가 **순수한지**(부작용 없이 같은 결과를 내는지) 테스트하기 위함이다.
3. **비동기 코드 검증**
   - `useEffect`, `useState`의 비동기 동작이 의도와 다르게 작성된 경우 경고
   - Concurrent Mode(동시성 모드) 호환성 준비
4. **레거시 API 사용 방지**

### 감지하는 주요 사례

- `componentWillMount`, `componentWillReceiveProps` 같은 deprecated 라이프사이클 사용
- 언마운트된 뒤에도 비동기 작업이 실행되는 메모리 누수
- 의존성 없이 쓴 `useEffect`로 인한 무한 루프

### 쓰는 이유

- 문제를 조기에 발견해 코드 품질을 높인다.
- Concurrent Mode 같은 새 기능과의 호환성을 미리 점검한다.
- 예기치 않은 사이드 이펙트를 쉽게 발견한다.
