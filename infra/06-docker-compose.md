---
title: Docker Compose
---

## 개요

- 여러 개의 `docker build`, `docker run` 명령을 **하나의 설정 파일**로 대체하는 도구.
- 서비스(컨테이너) 단위로 정의한다.
- **한 호스트**에서 여러 컨테이너를 관리하기 좋다. 여러 호스트에 걸친 관리는 다른 도구(쿠버네티스 등)의 영역.

## docker-compose.yaml

```yaml
version: "3.8"          # 컴포즈 사양 버전 (최신 Compose에서는 생략 가능)

services:
  mongodb:
    image: 'mongo'
    volumes:
      - data:/data/db
    env_file:
      - ./env/mongo.env

  backend:
    build: ./backend
    ports:
      - '80:80'
    volumes:
      - logs:/app/logs           # named 볼륨
      - ./backend:/app           # 바인드 마운트 (상대 경로 가능)
      - /app/node_modules        # 익명 볼륨
    environment:
      MONGODB_USERNAME: admin
    depends_on:
      - mongodb

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile-Dev
    stdin_open: true
    tty: true

volumes:                         # named 볼륨은 최상위에도 선언해야 함
  data:
  logs:
```

| 항목 | 설명 |
|---|---|
| `services` | 컨테이너 구성 정의. 하위 키(예: `backend`)가 서비스 이름(label) |
| `image` | 사용할 이미지. 로컬이나 Docker Hub에서 조회 |
| `build` | Dockerfile로 이미지 빌드. `context`(경로), `dockerfile`(파일명이 다를 때) |
| `ports` | 포트 매핑 `'호스트:컨테이너'` |
| `volumes` | 볼륨 목록(`-`로 나열). named 볼륨은 최상위 `volumes`에도 등록해야 서비스 간 공유 가능 |
| `environment` | 환경 변수 직접 지정 (`KEY: VALUE` 또는 `- KEY=VALUE`) |
| `env_file` | 환경 변수 파일. 컴포즈 파일 기준 상대 경로 |
| `networks` | 네트워크 지정. 컴포즈는 파일 안의 모든 서비스를 **자동으로 같은 네트워크**에 넣으므로 보통 불필요. 서비스 이름으로 서로 접근 가능 |
| `depends_on` | 의존하는 서비스 (예: 백엔드 → DB). 해당 서비스를 먼저 시작 |
| `stdin_open`, `tty` | `-it`에 해당. 표준 입력·터미널 입력 받기 |

> 컴포즈로 띄운 컨테이너는 `docker compose down` 시 삭제되므로 `--rm`을 따로 지정할 필요가 없다.

## 실행 명령어

| 명령어 | 설명 |
|---|---|
| `docker compose up` | 이미지를 가져오거나 빌드해서 모든 서비스 실행. `-d`로 detached |
| `docker compose up --build` | 이미지를 강제로 다시 빌드 |
| `docker compose down` | 컨테이너, 네트워크 삭제. **볼륨은 유지**, `-v`로 볼륨까지 삭제 |
| `docker compose run SERVICE 명령` | 단일 서비스에서 명령 실행 → [유틸리티 컨테이너](./07-docker-utility-container.md) |

### --build는 언제?

도커는 변경을 감지해 필요한 것만 다시 빌드하므로 자주 쓰진 않는다. 다음 경우에 유용하다.

- 로컬 빌드 캐시 문제가 생겼을 때
- 빌드 컨텍스트 밖의 파일이나 환경 변수가 바뀌었을 때
- CI/CD에서 항상 최신 이미지를 만들어야 할 때
