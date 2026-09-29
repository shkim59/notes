---
title: 유틸리티 컨테이너와 ENTRYPOINT
---

## 유틸리티 컨테이너

애플리케이션을 실행하지 않고 **특정 환경(도구)만 담은 컨테이너**.

### 왜 필요한가

- Node 프로젝트를 시작하려면 `npm init`을 해야 하고, 그러려면 호스트에 Node가 설치되어 있어야 한다. Laravel 같은 다른 프레임워크도 초기 설정에 복잡한 설치가 필요하다.
- 도커의 철학은 호스트에 도구를 전역 설치하지 않고 **컨테이너 안에 격리**하는 것인데, 초기 프로젝트 생성 때문에 호스트에 설치해야 한다면 철학과 어긋난다.
- → 도구를 담은 컨테이너로 초기 작업을 하면 호스트에 아무것도 설치하지 않아도 된다.

### 장점

1. **호스트를 깨끗하게**: Node, PHP, Python 등을 로컬에 설치하지 않아도 되고, 프로젝트별 버전 충돌이 없다.
2. **환경 일관성**: 개발·테스트·배포가 같은 컨테이너 기반이라 환경 차이로 인한 문제가 줄고 팀원 간 격차도 줄어든다.
3. **초기 설정 간소화**: 필요한 도구를 즉시 사용할 수 있다.
4. **확장성**: 필요에 따라 유틸리티 컨테이너를 추가하거나 분리할 수 있다.

## docker exec

실행 중인 컨테이너에 명령을 내린다. 보통 `-it`와 함께 쓴다. 컨테이너를 중단하지 않고 내부 로그 파일을 볼 때도 유용하다.

```bash
docker exec -it CONTAINER_NAME npm init
```

## ENTRYPOINT

```dockerfile
FROM node:14-alpine
WORKDIR /app
ENTRYPOINT ["npm"]
```

```bash
docker build -t mynpm .
docker run -it -v "$(pwd)":/app mynpm init                      # → npm init
docker run -it -v "$(pwd)":/app mynpm install express --save    # → npm install express --save
```

- `docker run`에서 입력한 명령이 ENTRYPOINT **뒤에 붙는다**.
- 실행 가능한 명령을 제한해서 실수로 위험한 명령을 실행하는 것을 막는다 (이 컨테이너는 npm 전용).
- 매번 `npm`을 앞에 붙이는 번거로움이 사라진다.
- 바인드 마운트로 컨테이너에서 만든 `package.json`, `node_modules`가 로컬에 그대로 반영된다.

### ENTRYPOINT vs CMD

| | `docker run IMAGE 명령` 시 |
|---|---|
| CMD | 기본 명령이 입력한 명령으로 **덮어씌워짐** |
| ENTRYPOINT | 입력한 명령이 기본 명령 **뒤에 추가됨** |

## Docker Compose로 쓰기

긴 `docker run` 명령 대신 컴포즈 파일로 관리할 수 있다. 단일 컨테이너에도 쓸 수 있다.

```yaml
services:
  npm:
    build: ./
    stdin_open: true
    tty: true
    volumes:
      - ./:/app
```

| 명령어 | 유틸리티 용도 적합성 |
|---|---|
| `docker compose up` | 서비스를 계속 실행하는 용도라 잘 맞지 않음 |
| `docker compose run npm init` | 단일 서비스에서 명령 실행 후 종료. **컨테이너는 남음** |
| `docker compose run --rm npm init` | 실행 후 컨테이너 자동 삭제 ✅ |

> `--rm`을 빼면 종료된 컨테이너가 쌓인다. `docker container prune`으로 정리할 수 있다.
