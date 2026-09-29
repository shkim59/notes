---
title: JPA 4. 연관관계 매핑 기초
---

# JPA 4. 연관관계 매핑 기초

## 연관관계가 필요한 이유

### 테이블에 맞춘 모델링

<!-- ![테이블 중심 모델링](./images/jpa04-1.png) -->

```java
@Entity
public class Member {
    @Id @GeneratedValue
    @Column(name = "MEMBER_ID")
    private Long id;

    @Column(name = "USERNAME")
    private String username;

    @Column(name = "TEAM_ID")
    private Long teamId; // 참조 대신 외래 키를 그대로 사용
}

// 저장
member.setTeamId(team.getId()); // 외래 키 식별자를 직접 다룸 → 객체지향적이지 않음

// 조회
Member findMember = em.find(Member.class, member.getId());
Team findTeam = em.find(Team.class, findMember.getTeamId()); // 연관관계가 없어 다시 조회
```

> 💡 객체를 테이블에 맞춰 데이터 중심으로 모델링하면 **협력 관계를 만들 수 없다.**
> - 테이블은 **외래 키로 조인**해서 연관된 테이블을 찾는다
> - 객체는 **참조**를 사용해서 연관된 객체를 찾는다

## 단방향 연관관계

<!-- ![객체지향 모델링](./images/jpa04-2.png) -->

```java
@Entity
public class Member {
    @Id @GeneratedValue
    @Column(name = "MEMBER_ID")
    private Long id;

    @Column(name = "USERNAME")
    private String username;

    @ManyToOne
    @JoinColumn(name = "TEAM_ID")
    private Team team;
}
```

- 회원 여러 명이 한 팀에 속할 수 있다 → Member : Team = N : 1 → `@ManyToOne`
- DB에서는 **N쪽에 외래 키**가 있다. 외래 키가 있는 쪽에 `@JoinColumn`을 둔다

<!-- ![ORM 매핑](./images/jpa04-3.png) -->

```java
// 저장
member.setTeam(team); // 참조 저장
em.persist(member);

// 조회 - 객체 그래프 탐색
Team findTeam = em.find(Member.class, member.getId()).getTeam();

// 수정
member.setTeam(teamB);
```

## 양방향 연관관계와 연관관계의 주인

<!-- ![양방향](./images/jpa04-4.png) -->

```java
@Entity
public class Team {
    @Id @GeneratedValue
    @Column(name = "TEAM_ID")
    private Long id;

    private String name;

    @OneToMany(mappedBy = "team")
    private List<Member> members = new ArrayList<>();
}

// 반대 방향 탐색
int memberSize = em.find(Team.class, team.getId()).getMembers().size();
```

- `mappedBy`: 양방향 매핑에서 반대쪽 매핑 필드의 이름
- 컬렉션은 `new ArrayList<>()`로 초기화해 NPE를 방지하는 것이 관례

### 객체와 테이블의 양방향은 다르다

<!-- ![객체 양방향](./images/jpa04-5.png) -->

- **객체**에는 양방향 연관관계가 없다. **단방향 2개**를 애플리케이션 로직으로 묶은 것이다
- **테이블**은 **외래 키 하나**로 양방향 조인이 가능하다

<!-- ![테이블 양방향](./images/jpa04-6.png) -->

### 연관관계의 주인

- 양방향 매핑에서는 둘 중 하나를 **주인**으로 지정해야 한다
- **주인만 외래 키를 관리(등록, 수정, 삭제)**할 수 있고, 주인이 아닌 쪽은 읽기만 가능하다
- 주인은 `mappedBy`를 쓰지 않고, 주인이 아닌 쪽이 `mappedBy`로 주인을 지정한다
- **외래 키가 있는 곳(N쪽)을 주인으로 정한다**
  - `Team.members`를 주인으로 하면, TEAM 엔티티를 바꿨는데 MEMBER 테이블에 UPDATE가 나가는 혼란스러운 구조가 된다

<!-- ![연관관계 주인](./images/jpa04-7.png) -->

### 주의사항

```java
// 주인이 아닌 쪽에만 값을 넣으면 외래 키가 저장되지 않는다
team.getMembers().add(member);
em.persist(member); // TEAM_ID = null

// 주인에 값을 넣어야 한다
team.getMembers().add(member);
member.setTeam(team);
em.persist(member);
```

- **양쪽 모두에 값을 넣어주는 것이 좋다**
  - flush/clear 없이 1차 캐시의 team을 조회하면 `members`는 빈 리스트
  - 테스트에서는 JPA 없이 순수 객체로 다루는 경우가 많다
- **연관관계 편의 메서드**를 한쪽에만 만든다

```java
// Member
public void changeTeam(Team team) {
    this.team = team;
    team.getMembers().add(this);
}
```

- 양방향 매핑 시 무한 루프 주의: `toString()`, lombok, JSON 라이브러리
  - **컨트롤러에서 엔티티를 반환하지 말고 DTO로 반환**할 것 (무한 루프, 엔티티 변경 시 API 스펙 변경 문제)
- **단방향 매핑만으로 연관관계 매핑은 완료된다.** 단방향으로 설계하고, 역방향 탐색이 필요할 때 양방향을 추가한다
