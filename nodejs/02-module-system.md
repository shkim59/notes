---
title: Node.js 모듈 시스템 — CommonJS와 ESM
---

## 모듈을 쓰는 이유

- 코드를 구조적으로 관리 → 이해·개발·테스트가 쉬움
- 코드 재사용
- 은닉성 (공개할 것만 내보냄)
- 종속성 관리

## CommonJS (CJS)

Node.js의 첫 내장 모듈 시스템. `.cjs` 확장자를 쓰거나 `package.json`의 `type`을 `commonjs`로 둔다(기본값).

- `require()`: 로컬 파일 시스템에서 모듈을 임포트
- `exports`, `module.exports`: 공개할 기능을 내보냄
- `require()`는 **동기적**이다. 그래서 `module.exports` 할당도 동기적이어야 한다.
- **순환 종속성**이 있으면 로드 순서에 따라 일부 모듈이 덜 로드된 상태로 보일 수 있다.

### 모듈 정의 패턴

| 패턴 | 방법 | 특징 |
|---|---|---|
| **named exports** | `exports.info = ...` | 내보낸 객체가 네임스페이스 역할. Node.js 코어 모듈 대부분이 이 방식 |
| **함수 내보내기** (서브스택 패턴) | `module.exports = fn` (+ 부가 기능은 함수의 속성으로) | 명확한 진입점 하나, 최소한의 노출 |
| **클래스 내보내기** | `module.exports = Logger` | 생성자로 인스턴스 생성·상속 가능. 내부를 더 많이 노출하지만 확장에 강함 |
| **인스턴스 내보내기** | `module.exports = new Logger('DEFAULT')` | 모듈 캐싱 덕분에 상태를 공유하는 인스턴스처럼 동작. **비추천** |

```javascript
// named exports
exports.info = (message) => console.log(`info: ${message}`);
exports.verbose = (message) => console.log(`verbose: ${message}`);

// 함수 내보내기 (서브스택 패턴)
module.exports = (message) => console.log(`info: ${message}`);
module.exports.verbose = (message) => console.log(`verbose: ${message}`);

// 클래스 내보내기
class Logger {
  constructor(name) { this.name = name; }
  log(message) { console.log(`[${this.name}] ${message}`); }
}
module.exports = Logger;

// 인스턴스 내보내기
module.exports = new Logger('DEFAULT');
// 사용하는 쪽에서 new logger.constructor('CUSTOM')으로 새 인스턴스도 만들 수 있음
```

### 몽키 패치

모듈이 전역 범위의 다른 모듈이나 객체를 런타임에 수정하는 것. 임시방편으로 쓰이지만 **하지 않는 것을 권장**한다.

## ES Modules (ESM)

`.mjs` 확장자를 쓰거나 `package.json`의 `type`을 `module`로 둔다.

- **정적(static)** 이다. `import`는 파일 최상위, 제어 흐름 밖에 있어야 하고 모듈 식별자는 상수 문자열만 된다.
- 정적 분석이 가능해서 **tree shaking**(사용하지 않는 코드 제거) 같은 최적화가 가능하다.
- 기본적으로 모든 것이 private이고, `export`한 것만 접근 가능하다.

### default export

```javascript
// logger.js
export default class Logger {
  constructor(name) { this.name = name; }
  log(message) { console.log(`[${this.name}] ${message}`); }
}

// main.js — 임포트하면서 원하는 이름을 붙인다
import MyLogger from './logger.js';
```

- 내부적으로는 `default`라는 이름으로 내보내지지만, `import { default }`처럼 직접 임포트할 수는 없다. (`import * as m` 후 `m.default`는 가능)

### mixed exports

```javascript
export default function log(message) { console.log(message); }
export function info(message) { log(`info: ${message}`); }

import mylog, { info } from './logger.js';
```

| | 장점 | 단점 |
|---|---|---|
| named export | IDE 자동 임포트·자동 완성·리팩터링 지원 | 정확한 이름을 알아야 함 |
| default export | 모듈의 핵심 기능 하나를 이름 신경 쓰지 않고 쉽게 임포트 | 경우에 따라 tree shaking을 어렵게 함 |

→ 명확한 기능 하나를 내보낼 때만 default, **그 외에는 named export를 권장**.

### 모듈 적재 3단계

인터프리터는 진입점부터 `import`를 **깊이 우선**으로 재귀 탐색한다.

1. **생성(파싱)**: 모든 `import`를 찾아 각 파일의 모듈 내용을 재귀적으로 적재
2. **인스턴스화**: 내보낸 모든 개체의 명명된 참조를 메모리에 만들고 `import`/`export` 간 연결을 추적. **코드는 아직 실행되지 않음**
3. **평가**: 코드를 실행해 인스턴스화된 개체들이 실제 값을 갖게 함

> **CJS와의 차이**: CJS는 동적이라 종속성 그래프를 탐색하기 전에 파일을 실행한다. 그래서 `if`문이나 반복문 안에서 `require`를 쓰거나 모듈 식별자를 변수로 만들 수 있다.

### 읽기 전용 바인딩

- ESM에서 임포트한 개체는 **읽기 전용 라이브 바인딩**이다. 임포트한 쪽에서 값을 재할당할 수 없고, 내보낸 모듈에서 값이 바뀌면 그대로 반영된다.
- CJS는 `require` 시점에 `exports` 객체를 받아오므로(값 복사), 이후 원본 모듈의 재할당은 반영되지 않는다.

## ESM에서 CJS 기능 쓰기

```javascript
// __filename, __dirname
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// require (JSON 임포트 등)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const data = require('./data.json');
```

> 참고: 『Node.js 디자인 패턴 바이블』 2장
