---
title: 도커 CLI 명령어
---

## 이미지

| 명령어 | 설명 |
|---|---|
| `docker build .` | 현재 경로의 Dockerfile로 이미지 빌드. `-t NAME:TAG`로 이름·태그 지정 |
| `docker images` | 이미지 목록 |
| `docker pull IMAGE` | 레지스트리(Docker Hub 등)에서 이미지 다운로드. `docker run` 시 이미지가 없으면 자동 수행 |
| `docker push IMAGE` | 레지스트리에 업로드. 이미지 이름에 저장소 이름/URL이 포함되어야 함 |
| `docker rmi IMAGE...` | 이미지 삭제. **그 이미지를 쓰는 컨테이너를 먼저 지워야** 함 |
| `docker image prune` | 태그 없는 이미지 모두 삭제. `-a`면 사용하지 않는 모든 이미지 |
| `docker image inspect IMAGE` | 이미지 상세 정보 |

## 컨테이너 생성·실행 — docker run

```bash
docker run IMAGE_NAME   # 또는 IMAGE_ID
```

이미지로 새 컨테이너를 만들고 시작한다. 기본은 **attached 모드**.

| 옵션 | 설명 |
|---|---|
| `--name NAME` | 컨테이너 이름 지정. 중지·삭제할 때 사용 |
| `-d` | **detached 모드**. 출력이 보이지 않고, 터미널이 컨테이너 종료를 기다리지 않음 |
| `-it` | **인터랙티브 모드**. `-i`는 표준 입력을 열어두고, `-t`는 가상 터미널 할당. CTRL+C로 중지 가능 |
| `--rm` | 컨테이너가 중지되면 자동 삭제 |
| `-p 호스트포트:컨테이너포트` | 포트 바인딩 |
| `-v` | 볼륨 연결 → [볼륨](./04-docker-volume.md) |
| `--network NAME` | 네트워크 연결 → [네트워크](./05-docker-network.md) |

## 컨테이너 관리

| 명령어 | 설명 |
|---|---|
| `docker ps` | **실행 중인** 컨테이너 목록. `-a`면 중지된 것 포함 |
| `docker stop CONTAINER` | 중지 |
| `docker start CONTAINER` | 중지된 컨테이너 재시작. 기본은 **detached**. `-a`로 attached |
| `docker attach CONTAINER` | 실행 중인 detached 컨테이너를 attached로 전환 |
| `docker logs CONTAINER` | detached 컨테이너의 로그 보기 (`-f`로 계속 따라가기) |
| `docker rm CONTAINER` | 삭제. 실행 중인 컨테이너는 삭제되지 않음 |
| `docker exec -it CONTAINER 명령` | 실행 중인 컨테이너에서 명령 실행 |
| `docker container prune` | 중지된 컨테이너 모두 삭제 |

### -it로 만든 컨테이너를 재시작할 때

`docker run`에 붙인 플래그는 컨테이너에 저장된다. 하지만 `-it`로 만든 컨테이너를 재시작할 때 `-a`만 쓰면 입력이 안 된다.

- `-a`: 표준 출력을 터미널에 연결
- `-i`: 표준 입력을 열어 입력을 받음 → **재시작할 때도 필요**
- `-t`: 가상 터미널 할당 → 이미 할당되어 있어 다시 붙일 필요 없음

```bash
docker start -a -i CONTAINER
```

## 파일 복사 — docker cp

```bash
docker cp [OPTIONS] SRC_PATH DEST_PATH

# 호스트 → 컨테이너
docker cp /path/on/host CONTAINER:/path/in/container

# 컨테이너 → 호스트
docker cp CONTAINER:/path/in/container /path/on/host
```

- 파일이나 디렉토리(재귀적으로 전체)를 복사한다.
- 컨테이너 식별자가 없으면 로컬 경로로 간주한다. `CONTAINER:/`는 `C:/`처럼 컨테이너 내부 경로를 가리킨다.
