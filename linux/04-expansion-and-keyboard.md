---
title: 확장과 인용, 커맨드라인 키보드 기법
---

> 『리눅스 커맨드라인 완벽 입문서』 7~8장

## 확장

bash는 명령어를 실행하기 전에 입력을 **확장**한다. `echo`로 확장 결과를 확인할 수 있다.

| 확장 | 예 | 결과 |
|---|---|---|
| 경로명 | `echo D*`, `echo [[:upper:]]*` | 패턴과 일치하는 파일명 목록 |
| 틸드 | `echo ~` | `/home/user` |
| 산술 | `echo $((2 + 2))` | `4` |
| 중괄호 | `echo Front-{A,B,C}-Back` | `Front-A-Back Front-B-Back Front-C-Back` |
| 매개변수 | `echo $USER` | 변수 값. `printenv`로 변수 목록 확인 |
| 명령어 치환 | `ls -l $(which cp)` | 명령어의 출력으로 치환. 예전 문법은 백틱 `` `which cp` `` |

```shell
echo a{A{1,2},B{3,4}}b                         # 중첩 가능 → aA1b aA2b aB3b aB4b
mkdir {2023..2024}-0{1..9} {2023..2024}-{10..12}   # 연월별 디렉토리 한 번에 만들기
file $(ls /usr/bin/* | grep zip)
```

### 숨김 파일 경로명 확장

`echo *`는 `.`으로 시작하는 파일을 잡지 않고, `echo .*`는 `.`와 `..`까지 잡는다.

```shell
ls -d .[!.]?*    # 점으로 시작, 두 번째 글자는 점이 아니고, 한 글자 이상 더 있는 이름
```

## 인용 — 원치 않는 확장 막기

기본적으로 공백·탭·개행은 단어 구분자다. `two words.txt`는 인자 두 개로 쪼개진다.

```shell
ls -l "two words.txt"
mv "two words.txt" two_words.txt   # 애초에 공백 없는 이름이 낫다
```

| 인용 | 막는 확장 | 살아 있는 확장 |
|---|---|---|
| 없음 | — | 전부 |
| 쌍따옴표 `"..."` | 경로명, 틸드, 중괄호, 단어 분리 | **매개변수, 산술, 명령어 치환** |
| 홑따옴표 `'...'` | **전부** | 없음 |

```shell
$ echo text ~/*.txt {a,b} $(echo foo) $((2+2)) $USER
text /home/me/ls-output.txt a b foo 4 me

$ echo "text ~/*.txt {a,b} $(echo foo) $((2+2)) $USER"
text ~/*.txt {a,b} foo 4 me

$ echo 'text ~/*.txt {a,b} $(echo foo) $((2+2)) $USER'
text ~/*.txt {a,b} $(echo foo) $((2+2)) $USER
```

**이스케이프**: 문자 하나만 인용할 때는 앞에 `\`.

```shell
echo "The balance for $USER is: \$5.00"   # The balance for me is: $5.00
```

## 커맨드라인 편집 (Readline)

### 커서 이동

| 키 | 동작 |
|---|---|
| CTRL+A / CTRL+E | 줄 맨 앞 / 맨 끝 |
| CTRL+F / CTRL+B | 한 글자 앞 / 뒤 |
| ALT+F / ALT+B | 한 단어 앞 / 뒤 |
| CTRL+L | 화면 지우기 (`clear`) |

### 편집

| 키 | 동작 |
|---|---|
| CTRL+D | 커서 위치 글자 삭제 |
| CTRL+T / ALT+T | 앞 글자 / 앞 단어와 위치 바꾸기 |
| ALT+L / ALT+U | 커서부터 단어 끝까지 소문자 / 대문자로 |

### 잘라내기와 붙이기 (Kill & Yank)

잘라낸 텍스트는 **kill-ring**이라는 버퍼에 저장된다.

| 키 | 동작 |
|---|---|
| CTRL+K | 커서부터 줄 끝까지 잘라내기 |
| CTRL+U | 커서부터 줄 처음까지 잘라내기 |
| ALT+D | 커서부터 단어 끝까지 잘라내기 |
| ALT+Backspace | 커서부터 단어 앞까지 잘라내기 |
| CTRL+Y | kill-ring의 텍스트 붙이기 |

### 자동 완성

Tab으로 자동 완성. **Tab 두 번**(또는 ALT+?)은 후보 목록, ALT+*는 모든 후보 삽입.

## 히스토리

- 홈 디렉토리의 `.bash_history`에 저장되고, 기본으로 최근 500개를 기억한다.

```shell
history | less
history | grep /usr/bin
```

| 키 | 동작 |
|---|---|
| CTRL+P / CTRL+N | 이전 / 다음 항목 (↑ / ↓) |
| ALT+< / ALT+> | 목록 처음 / 끝 |
| **CTRL+R** | **역순 증분 검색** |
| CTRL+O | 현재 항목 실행 후 다음 항목으로 |

| 히스토리 확장 | 동작 |
|---|---|
| `!!` | 마지막 명령어 다시 실행 |
| `!number` | 해당 번호의 명령어 실행 |
| `!string` | string으로 시작하는 최근 명령어 |
| `!?string` | string이 포함된 최근 명령어 |
