---
title: Dockerfile 명령어
---

| 명령어 | 역할 |
|---|---|
| `FROM` | 기반(base) 이미지 설정. Dockerfile의 첫 명령어 |
| `WORKDIR` | 작업 디렉토리 설정. 이후 명령어는 이 디렉토리 기준으로 실행 |
| `COPY` | 로컬 파일을 컨테이너 내부로 복사 |
| `EXPOSE` | 컨테이너가 수신할 포트 명시 (문서화 목적) |
| `RUN` | **이미지 빌드 중** 실행 |
| `CMD` | **컨테이너 시작 시** 실행할 기본 명령 |
| `ENTRYPOINT` | 컨테이너 시작 시 실행할 고정 명령 → [유틸리티 컨테이너](./07-docker-utility-container.md) |

### FROM

```dockerfile
FROM node
FROM node:14
```

지정한 이미지를 토대로 새 이미지를 만든다.

### WORKDIR

```dockerfile
WORKDIR /app
```

- 상대·절대 경로 모두 가능하다.
- 컨테이너 안에 `/app`을 만들고 이후 명령어는 이 디렉토리에서 실행된다.

### COPY

```dockerfile
COPY LOCAL_PATH CONTAINER_PATH

# WORKDIR /app 이후
COPY package.json .   # → /app/package.json
```

> 제외할 파일은 `.dockerignore`에 적는다 (예: `node_modules`, `Dockerfile`).

### EXPOSE

```dockerfile
EXPOSE 3000
```

사실상 **문서화 목적**이다. 실제로 호스트와 연결하려면 실행 시 `-p` 플래그로 포트를 매핑해야 한다.

### RUN

- **실행 시점**: 이미지가 빌드될 때 한 번 실행되고 끝난다. 결과는 이미지에 포함된다.
- **용도**: 소프트웨어 설치, 파일 설정, 환경 구성 등.

### CMD

```dockerfile
CMD ["node", "app.mjs"]
CMD ["python", "rng.py"]
```

- **실행 시점**: 컨테이너가 시작될 때마다 실행된다.
- Dockerfile에 하나만 유효하다 (여러 개면 마지막 것만 적용).
- `docker run IMAGE 다른명령`처럼 명령을 지정하면 `CMD`는 무시된다.

## RUN vs CMD

| | RUN | CMD |
|---|---|---|
| 시점 | 이미지 빌드 시 | 컨테이너 시작 시 |
| 목적 | 이미지의 환경 구성·설치 | 컨테이너의 기본 실행 명령 |
| 예 | 패키지 설치, 파일 다운로드, 빌드 | 서버 시작 |
| 특징 | 새 레이어 생성, 캐시됨 | 매 시작 시 실행, `docker run`으로 대체 가능 |

### 서버 실행을 RUN으로 하면?

```dockerfile
RUN node server.js   # ❌
```

빌드 중에 서버가 실행되고 빌드가 끝나면 종료된다. 결국 이미지에는 서버가 실행되지 않은 상태만 남는다.

```dockerfile
CMD ["node", "server.js"]   # ✅
```

컨테이너가 시작될 때 서버를 실행하고, 컨테이너가 도는 동안 계속 실행된다.

### 예시

```dockerfile
FROM ubuntu:20.04

# 빌드 시 실행
RUN apt-get update && apt-get install -y python3

WORKDIR /app
COPY . .

# 컨테이너 시작 시 실행
CMD ["python3", "app.py"]
```
