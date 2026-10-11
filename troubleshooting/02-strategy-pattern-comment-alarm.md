---
title: 전략 패턴 실전 적용 - 댓글 알림 구조 설계
---

# 전략 패턴 실전 적용 - 댓글 알림 구조 설계

## 들어가며

해당 프로젝트는 기업 내 **표준 단어·용어를 사전처럼 관리하는 메타 시스템**을 구축하는 프로젝트입니다.

메타 시스템은 기업 내에서 테이블이나 컬럼을 설계할 때 데이터의 일관성을 지키기 위해 사용하는 일종의 '표준 사전'입니다. 사내에서 '고객 ID'를 어떤 팀은 `cust_id`, 어떤 팀은 `customer_no`로 제각각 명명한다면 데이터의 일관성이 무너지게 됩니다.

그래서 개발자, 데이터 분석가 등의 사용자는 새로운 테이블·컬럼이 필요하면 표준화된 단어·용어를 사용해(없으면 단어·용어를 신청해) **신청서를 작성하고, 관리자가 신청서를 검토한 후 반영**하는 방식으로 표준을 지킵니다.

## 요구사항

관리자가 **신청서를 검토하면서 보완이나 반려 사유가 있을 때 사용자와 소통할 창구**가 필요했습니다. 그래서 게시판 댓글처럼 신청 내역에 의견을 남기는 기능을 구현했습니다.

**핵심 요구사항**

- **단일 UI 컴포넌트**: 프론트엔드에서는 UI 일관성과 재사용성을 위해 하나의 의견(댓글) 컴포넌트를 사용합니다.
- **5가지 도메인 대상**: 백엔드 관점에서는 의견이 달리는 대상이 5가지(신청서, 테이블, 컬럼, 용어, 단어)로 나뉩니다.
- **도메인별 맞춤형 알림**: 의견이 등록되면 관련 담당자에게 알림을 보냅니다. 도메인에 따라 알림 종류, 메시지 내용, 수신자 목록을 구성하는 로직이 모두 다릅니다.
- **확장성**: 향후 '수정'·'삭제' 시에도 알림을 보낼 수 있고, 새로운 관리 대상 도메인이 추가될 가능성도 있었습니다.

## 해결책

### 방법 1. 분기문 (if-else / switch)

가장 직관적인 방법은 서비스 로직에서 파라미터 값을 확인해 분기하는 것입니다.

```java
// 분기문 접근 시 예상되는 구조
public void sendCommentAlarm(CommentEvent event, Comment comment) {
    String type = comment.getType();

    // 1 depth: 이벤트(생성/수정/삭제) 분기
    if (CommentEvent.CREATED.equals(event)) {

        // 2 depth: 도메인(컬럼/테이블/신청서 등) 분기
        if ("col".equals(type)) {
            // 컬럼 도메인 등록 알림 로직...
        } else if ("tbl".equals(type)) {
            // 테이블 도메인 등록 알림 로직...
        } // ...

    } else if (CommentEvent.UPDATED.equals(event)) {

        if ("col".equals(type)) {
            // 컬럼 도메인 수정 알림 로직...
        } // ...
    }
    // ... 이벤트와 도메인이 결합되어 끝없이 길어지는 중첩 조건문
}
```

도메인 타입과 이벤트가 결합되면 조건문이 깊게 중첩되어 복잡도가 크게 올라갑니다.

- **OCP 위배**: 도메인이 추가되거나 조건이 바뀔 때마다 핵심 서비스 클래스를 직접 수정해야 합니다.
- **SRP 위배 및 높은 결합도**: 하나의 서비스 클래스가 모든 도메인·이벤트의 조회 방식과 비즈니스 로직을 떠안게 됩니다.

### 방법 2. 전략 패턴 (채택)

다형성을 활용해 타입별 알림 생성 로직을 독립적인 클래스로 분리하고, 실행 시점에 알맞은 구현체를 찾아 실행하는 방식입니다.

**인터페이스 정의**: 알림 발송에 필요한 데이터(Payload)를 만드는 공통 인터페이스

```java
public interface CommentAlarmResolver {
    CommentType supportsType();    // 지원하는 대상 타입 (req, tbl, col 등)
    CommentEvent supportsEvent();  // 지원하는 이벤트 (생성, 수정, 삭제)
    CommentAlarmPayload resolve(Comment comment); // 알림 페이로드 조립
}
```

**전략 구현체 분리**: 도메인별 로직을 각각의 구현체로 격리

```java
@Component
@RequiredArgsConstructor
public class ColumnCommentCreatedAlarmResolver implements CommentAlarmResolver {
    private final CommentAlarmReceiverService receiverService;

    @Override
    public CommentAlarmPayload resolve(Comment comment) {
        return CommentAlarmPayload.builder()
                .alarmType(AlarmType.COLUMN_COMMENT_CREATED) // 컬럼 전용 알림 타입
                .params(CommentAlarmParams.from(comment))
                .receivers(receiverService.getReceivers(comment))
                .build();
    }

    @Override
    public CommentEvent supportsEvent() { return CommentEvent.CREATED; }

    @Override
    public CommentType supportsType() { return CommentType.COLUMN; }
}
```

신청서 타입처럼 상세 정보를 조회하는 등 복잡한 과정이 필요한 경우에도, 그 도메인 특화 로직이 전략 클래스 안에 안전하게 격리됩니다.

**Registry 도입**: 상황(타입, 이벤트)에 맞는 전략을 찾아주는 클래스. 스프링이 `List<CommentAlarmResolver>`로 모든 구현체를 주입해주면, 빠른 조회를 위해 `EnumMap`에 캐싱합니다.

```java
@Component
public class CommentAlarmResolverRegistry {
    private final EnumMap<CommentType, EnumMap<CommentEvent, CommentAlarmResolver>> registry;

    public CommentAlarmResolverRegistry(List<CommentAlarmResolver> resolvers) {
        registry = new EnumMap<>(CommentType.class);

        for (CommentAlarmResolver r : resolvers) {
            var byEvent = registry.computeIfAbsent(r.supportsType(), t -> new EnumMap<>(CommentEvent.class));
            if (byEvent.putIfAbsent(r.supportsEvent(), r) != null) {
                // 같은 타입·이벤트 조합이 중복 등록되면 애플리케이션 시작 단계에서 차단
                throw new IllegalStateException("Duplicate resolver: " + r.supportsType() + "/" + r.supportsEvent());
            }
        }
    }

    // 타입과 이벤트에 맞는 전략을 O(1)로 반환
    public CommentAlarmPayload resolve(CommentType type, CommentEvent event, Comment comment) {
        return registry.get(type).get(event).resolve(comment);
    }
}
```

### if 문이 없는 비즈니스 로직

알림 발송을 담당하는 서비스에서는 분기문이 사라졌습니다.

```java
@Service
@RequiredArgsConstructor
public class CommentAlarmService {
    private final AlarmService alarmService;
    private final CommentAlarmResolverRegistry registry;

    private void send(CommentEvent event, Comment comment) {
        CommentType type = CommentType.fromCode(comment.getType());

        // Registry에 페이로드 조립을 위임 (다형성)
        CommentAlarmPayload payload = registry.resolve(type, event, comment);

        // 조립된 페이로드로 공통 알림 발송
        alarmService.send(payload.getAlarmType(), payload.getParams(), payload.getReceivers());
    }

    public void sendCreatedAlarm(Comment comment) {
        send(CommentEvent.CREATED, comment);
    }
}
```

## 마무리

복잡하게 얽혀 있던 분기 로직을 전략 패턴으로 리팩토링해서 도메인과 로직 사이의 결합도를 크게 낮출 수 있었습니다.

이제 새로운 신청 도메인이 생기거나 '댓글 수정/삭제 알림' 요구사항이 추가되어도 기존 코드를 수정할 필요가 없습니다. `CommentAlarmResolver`를 구현한 클래스 하나만 추가하면 스프링이 빈으로 등록하고 Registry가 매핑해주기 때문입니다. 객체지향 설계 원칙을 실무에 적용해 시스템의 유연성을 확보한 경험이었습니다.
