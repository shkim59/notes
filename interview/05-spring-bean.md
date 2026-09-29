---
title: Spring에서 객체를 Bean으로 관리하는 이유
---

# Spring에서 객체를 Bean으로 관리하는 이유

## Bean과 IoC 컨테이너

- **Bean**: 스프링 IoC 컨테이너가 생성하고 관리하는 객체. `new`로 직접 만든 객체는 Bean이 아니다.
- **IoC 컨테이너**: Bean을 생성, 관리, 주입, 소멸까지 담당하는 객체 관리 엔진

| 역할 | 설명 |
|---|---|
| Bean 등록 | 설정 정보(`@Configuration`, `@ComponentScan` 등)를 읽어 Bean 정의 등록 |
| Bean 생성 | `new` 대신 컨테이너가 객체 생성 |
| 의존성 주입 | Bean 간 연결 |
| 생명주기 관리 | 생성 → 주입 → 초기화 → 소멸 |
| AOP 적용 | 트랜잭션, 로깅 등 공통 기능 적용 |

## Bean으로 관리하는 이유

### 1. 객체 생명주기 관리

- 컨테이너가 Bean의 **생성 → 초기화 → 사용 → 소멸** 전 과정을 관리
- 개발자가 직접 `new`로 생성하고 해제하는 대신, 컨테이너가 생성 시점·스코프·의존성 주입·종료 시점을 제어
- 기본적으로 **싱글턴**으로 관리해 메모리 사용을 최적화하고 불필요한 객체 생성을 방지
- 효과: 일관된 자원 관리, 수명 주기 제어가 쉬움

### 2. 의존성 주입 (DI)

컨테이너가 객체 간의 의존 관계를 자동으로 주입

```java
@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
}
```

- `UserRepository`도 Bean으로 등록되어 있어야 `UserService`가 주입받을 수 있다
- 효과
  - 결합도 감소
  - 테스트 용이 (Mock 객체 주입)
  - 환경에 따라 다른 Bean을 주입해 재사용성 증가
  - 컨테이너가 순환 의존성을 감지해 설계 오류를 조기에 발견

### 3. 설정 및 공통 기능과의 연계

- **설정 기반 관리**: DB 연결, 캐시, 트랜잭션 정책 등을 Bean 단위로 제어
- **AOP 연동**: 로깅, 보안, 트랜잭션을 Bean 레벨에서 공통 처리 (`@Transactional` 등)
- **Profile**: 개발/운영 환경에 따라 다른 Bean을 선택적으로 로드
- 효과: 코드 변경 없이 설정만으로 환경을 전환하거나 기능을 확장

### 4. 테스트 용이성

- Bean으로 관리되는 컴포넌트는 Mock이나 테스트용 구현체로 쉽게 대체할 수 있다

| 구분 | 설명 | 이점 |
|---|---|---|
| 생명주기 관리 | 생성과 소멸을 컨테이너가 담당 | 자원 관리, 일관성 |
| 의존성 주입 | 객체 간 연결을 자동 구성 | 결합도 감소, 테스트 용이 |
| 설정·AOP 연계 | 설정, 트랜잭션 등과 통합 | 확장성, 유지보수성 |

## Bean 등록 방법

| 방법 | 설명 |
|---|---|
| `@Component` | 기본적인 자동 등록 |
| `@Service`, `@Repository`, `@Controller` | 역할 구분을 위한 특화 Component |
| `@Configuration` + `@Bean` | 수동 등록 (직접 인스턴스 반환) |

```java
@Configuration
public class AppConfig {
    @Bean
    public MemberService memberService() {
        return new MemberService(memberRepository());
    }

    @Bean
    public MemberRepository memberRepository() {
        return new MemberRepository();
    }
}
```

## 의존성 주입 방식

| 방식 | 특징 |
|---|---|
| **생성자 주입 (권장)** | 불변성 보장, 테스트 용이 |
| 필드 주입 | 간단하지만 테스트 어려움 |
| Setter 주입 | 선택적 의존성 주입 가능 |

## Bean 스코프

| 스코프 | 설명 |
|---|---|
| `singleton` | 컨테이너 내 하나의 인스턴스 (기본값) |
| `prototype` | 요청마다 새 객체 생성 |
| `request` | HTTP 요청 단위 |
| `session` | 세션 단위 |

## Bean 생명주기

```text
생성 → 의존성 주입 → 초기화(@PostConstruct) → 사용 → 소멸(@PreDestroy)
```

## Spring 컨테이너 동작 흐름

1. 컨테이너 초기화: 설정(`@Configuration`, ComponentScan 등) 읽기
2. Bean 정의 등록: Bean 메타데이터 생성 및 보관
3. Bean 생성
4. 의존성 주입
5. 초기화 & AOP 프록시 적용
6. 사용
7. 소멸: 컨테이너 종료 시 Bean 정리
