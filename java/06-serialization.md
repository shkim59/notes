---
title: 직렬화와 역직렬화
---

# 직렬화와 역직렬화

## 직렬화 (Serialization)

- 자바 객체를 바이트 스트림으로 변환하는 과정
- 바이트 스트림은 파일에 저장하거나 네트워크로 전송할 수 있는 형태로, 객체의 현재 상태(데이터)를 보존하는 데 사용

**필요한 이유**

- **객체 저장**: 프로그램이 종료된 후에도 다시 로드해 사용 (게임 상태, 사용자 설정 저장 등)
- **객체 전송**: 네트워크를 통해 다른 JVM이나 애플리케이션으로 전송 (RMI, 메시지 큐 등)
- **객체 복제**: 깊은 복사

## Serializable 인터페이스

- 직렬화하려면 클래스가 `java.io.Serializable`을 구현해야 한다.
- 메서드가 없는 **마커 인터페이스**. "이 클래스는 직렬화될 수 있다"는 표시만 한다.
- 구현하지 않은 클래스의 객체를 직렬화하면 `NotSerializableException` 발생
- 개발자가 직렬화를 의도적으로 제어하고, 보안이나 버전 호환성 문제를 인지하도록 유도하는 장치

## transient 키워드

- 직렬화 대상에서 특정 필드를 제외
- 역직렬화 시 해당 필드는 기본값(0, false, null)으로 초기화
- 사용하는 경우
  - **민감한 정보**: 비밀번호, 카드 번호 등
  - **일시적인 데이터**: 런타임에만 유효한 값, 계산된 값
  - **직렬화할 수 없는 객체**: `Socket`, `Thread` 등의 참조

```java
import java.io.Serializable;

public class User implements Serializable {
    private String username;
    private transient String password; // 비밀번호는 직렬화하지 않음
    private int age;

    public User(String username, String password, int age) {
        this.username = username;
        this.password = password;
        this.age = age;
    }

    @Override
    public String toString() {
        return "User{" +
               "username='" + username + '\'' +
               ", password='" + password + '\'' + // 역직렬화 후에는 null
               ", age=" + age +
               '}';
    }
}
```

## 역직렬화 (Deserialization)

직렬화된 바이트 스트림을 다시 자바 객체로 변환하는 과정

1. `ObjectInputStream`으로 바이트 스트림을 읽는다.
2. 바이트 데이터를 기반으로 새로운 객체를 생성하고 필드에 값을 할당한다.
3. `transient` 필드는 제외되고 기본값으로 초기화된다.

## 주의사항

- **`serialVersionUID`**
  - 직렬화된 클래스의 버전을 식별하는 ID
  - 선언하지 않으면 JVM이 자동 생성하는데, 클래스 구조가 조금만 바뀌어도 ID가 바뀌어 역직렬화 시 `InvalidClassException` 발생
  - 항상 `private static final long serialVersionUID = 1L;`처럼 명시적으로 선언하고, 하위 호환성을 깨는 변경이 있을 때만 값을 바꾼다.
- **참조 무결성**
  - 객체 그래프 전체가 직렬화된다. 직렬화 불가능한 객체를 참조하면 `NotSerializableException`
  - 해당 필드를 `transient`로 제외하거나, 참조 객체도 `Serializable`을 구현
- **보안**
  - 직렬화된 데이터는 조작될 수 있고, 안전하지 않은 역직렬화는 원격 코드 실행(RCE) 취약점으로 이어질 수 있다.
  - 민감한 정보는 `transient` 처리하거나 암호화·서명으로 무결성 보장
- **버전 호환성**
  - 필드 이름·타입 변경, 삭제는 역직렬화 문제를 일으킬 수 있다.
  - `readObject()` / `writeObject()` 커스터마이징, 또는 JSON·XML 같은 포맷을 고려
- **상속 관계**
  - 부모가 `Serializable`이면 자식도 직렬화 가능
  - 부모는 구현하지 않고 자식만 구현한 경우, 역직렬화 시 부모 필드는 부모의 기본 생성자로 초기화된다. 부모에 기본 생성자가 없으면 `InvalidClassException`
