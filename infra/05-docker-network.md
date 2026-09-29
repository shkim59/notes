---
title: 도커 네트워크 — 컨테이너 통신
---

| 통신 대상 | 방법 |
|---|---|
| **웹(WWW)** | 별도 설정 없이 컨테이너 안에서 바로 요청 가능 |
| **호스트 머신** (로컬 DB 등) | 코드에서 `localhost` 대신 **`host.docker.internal`** 사용 |
| **다른 컨테이너** | 같은 **도커 네트워크**에 넣고 **컨테이너 이름**으로 통신 |

## 컨테이너 간 통신

`docker inspect`로 컨테이너 IP를 알아내 쓸 수도 있지만, IP가 바뀔 수 있어서 비추천이다.

```bash
# 네트워크 생성
docker network create NETWORK_NAME

# 컨테이너를 네트워크에 연결해 실행
docker run -d --name mongodb --network NETWORK_NAME mongo
docker run -d --name app --network NETWORK_NAME my-app

# 같은 네트워크의 컨테이너는 이름으로 접근
# mongodb://mongodb:27017, http://CONTAINER_NAME:8080/
```

## 원칙

- 컨테이너는 **하나의 역할만** 수행하는 것이 좋다 (앱 / DB 분리).
- 내부에서만 쓰는 컨테이너(예: 같은 네트워크의 DB)는 `-p` 포트 매핑이 필요 없다.
