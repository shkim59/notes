---
title: HTML 기초 — 요소, 속성, 문서 구조, 메타데이터
---

> MDN 「HTML 시작하기」, 「head에는 무엇이 있을까? HTML 메타데이터」 학습 노트

## HTML

- 프로그래밍 언어가 아니라, 웹페이지의 **구조를 브라우저에 알려 주는 마크업 언어**.
- 요소(element)들로 구성되고, 태그로 링크를 만들거나 단어를 강조한다.
- 태그는 대소문자를 구분하지 않지만(`<title>` = `<TITLE>`), 가독성 때문에 **소문자**로 쓴다.

## 요소(Element)

<!-- ![요소 구조](./images/html-element.png) -->

| 구성 | 설명 |
|---|---|
| 여는 태그 | `<p>` — 요소가 시작되는 곳 |
| 닫는 태그 | `</p>` — 이름 앞에 `/`. 빠뜨리면 예상치 못한 결과가 생길 수 있음 |
| 내용 | 태그 사이의 내용 |
| 요소 | 여는 태그 + 내용 + 닫는 태그 전체 |

### 중첩

요소 안에 요소를 넣을 수 있다. **나중에 연 태그를 먼저 닫아야** 한다.

```html
<p>My cat is <strong>very</strong> grumpy.</p>   <!-- O -->
<p>My cat is <strong>very grumpy.</p></strong>   <!-- X -->
```

### 블록 vs 인라인

| | 블록 레벨 | 인라인 |
|---|---|---|
| 줄바꿈 | 앞뒤로 새 줄을 만듦 | 새 줄을 만들지 않고 문단 안에 이어짐 |
| 용도 | 페이지의 구조 (문단, 목록, 내비게이션, 푸터) | 문장·단어 같은 작은 부분 |
| 중첩 | 블록 안에 블록 가능, **인라인 안에는 불가** | 항상 블록 요소 안에 들어감 |
| 예 | `<p>`, `<ul>`, `<div>` | `<a>`, `<em>`, `<strong>` |

> HTML5에서 요소 분류(콘텐츠 카테고리)가 재정의됐지만, 이해하기 쉽게 블록/인라인으로 구분한다.

### 빈 요소 (Void element)

내용 없이 태그 하나로 끝나는 요소. 예: `<img src="image-path" />`

## 속성(Attribute)

<!-- ![속성 구조](./images/html-attribute.png) -->

- 요소에 추가 정보를 담는다. 예: 스타일을 위한 `class`.
- 규칙: 요소 이름·다른 속성과 **공백**으로 구분, 이름 뒤에 `=`, 값은 **따옴표**로 감싼다.

### 불리언 속성

값 없이 이름만 써도 되는 속성. 값은 속성 이름과 같은 하나만 가질 수 있다.

```html
<input type="text" disabled="disabled">
<input type="text" disabled />
```

## 문서 구조

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <title>My test page</title>
  </head>
  <body>
    <p>This is my page</p>
  </body>
</html>
```

| 요소 | 역할 |
|---|---|
| `<!doctype html>` | 문서 형식 선언 |
| `<html>` | 루트 요소. 페이지 전체를 감쌈. `lang`으로 기본 언어 지정 |
| `<head>` | 화면에 보이지 않는 **메타데이터** (검색 키워드, 설명, CSS, 문자 인코딩 등) |
| `<body>` | 화면에 표시되는 모든 콘텐츠 |

## head와 메타데이터

| 요소 | 역할 |
|---|---|
| `<title>` | 문서 제목. 브라우저 탭, 검색 결과, 북마크 기본 이름에 쓰임 |
| `<meta charset="utf-8">` | 문자 인코딩 지정 (UTF-8 권장) |
| `<meta name="..." content="...">` | `name`은 정보의 종류, `content`는 내용. 예: `author`, `description` |
| `<link rel="stylesheet" href="...">` | CSS 연결. 항상 `<head>` 안에 |
| `<script src="...">` | JS 연결. head에 없어도 되며 보통 `</body>` 바로 앞에 둔다 |

```html
<meta name="author" content="Chris Mills" />
<meta name="description" content="페이지 설명 — 검색 결과에 노출될 수 있음" />
<link rel="stylesheet" href="my-css-file.css" />
<script src="my-js-file.js"></script>
```

### 언어 설정

```html
<html lang="en-US">
<p>Korean example: <span lang="ko">한글</span>.</p>
```

검색 엔진이 더 정확히 색인하고, 스크린 리더가 올바른 발음으로 읽을 수 있다. 일부 구간만 다른 언어로 지정할 수도 있다.

## 그 밖에

- **공백**: HTML 파서는 연속된 공백·줄바꿈을 **공백 하나**로 줄인다.
- **특수 문자**: `<`, `>`, `"`, `'`, `&`는 문법의 일부라 문자 참조로 써야 한다.

| 문자 | 참조 |
|---|---|
| `<` | `&lt;` |
| `>` | `&gt;` |
| `"` | `&quot;` |
| `'` | `&apos;` |
| `&` | `&amp;` |

- **주석**: `<!-- 주석 -->`
