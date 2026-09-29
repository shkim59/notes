// 노트 분류 정의. 새 분야를 추가하려면 여기에 항목만 추가하면 됨.
//
// section  : 상단 메뉴(노트 ▾)와 홈 카드에 나오는 큰 분야. 사이드바도 분야별로 따로 보임
// groups   : 분야 안의 폴더들 (폴더 이름 = dir)
// split    : 폴더 안의 글을 파일명 번호로 소분류로 나눌 때 사용 (from~to는 파일명 앞 두 글자, 포함)

export interface Split {
  text: string
  from: string
  to: string
}

export interface Group {
  dir: string
  text: string
  split?: Split[]
}

export interface Section {
  label: string
  groups: Group[]
}

export const sections: Section[] = [
  {
    label: 'Java · Spring',
    groups: [
      { dir: 'java', text: 'Java' },
      {
        dir: 'spring',
        text: 'Spring',
        split: [
          { text: '코어 · MVC', from: '01', to: '08' },
          { text: 'JPA', from: '10', to: '1a' },
          { text: 'Spring Boot + JPA', from: '20', to: '21' },
        ],
      },
    ],
  },
  {
    label: '데이터베이스',
    groups: [
      {
        dir: 'database',
        text: '데이터베이스',
        split: [
          { text: 'MySQL', from: '01', to: '08' },
          { text: '데이터 중심 애플리케이션 설계', from: '09', to: '13' },
        ],
      },
    ],
  },
  {
    label: 'CS 기초',
    groups: [
      { dir: 'os', text: '운영체제' },
      { dir: 'network', text: '네트워크' },
      { dir: 'algorithm', text: '알고리즘' },
    ],
  },
  {
    label: '설계 · 리팩터링',
    groups: [
      { dir: 'fp', text: '함수형 프로그래밍' },
      { dir: 'refactoring', text: '리팩터링' },
    ],
  },
  {
    label: '프론트 · Node.js',
    groups: [
      { dir: 'frontend', text: '프론트엔드' },
      { dir: 'nodejs', text: 'Node.js' },
    ],
  },
  {
    label: '인프라 · 도구',
    groups: [
      {
        dir: 'infra',
        text: '인프라',
        split: [
          { text: 'Docker', from: '01', to: '07' },
          { text: 'Git · AWS', from: '08', to: '09' },
        ],
      },
      { dir: 'linux', text: '리눅스' },
    ],
  },
  {
    label: '면접 · 기록',
    groups: [
      { dir: 'interview', text: '면접 대비' },
      { dir: 'troubleshooting', text: '트러블슈팅' },
      { dir: 'archive', text: '아카이브' },
    ],
  },
]
