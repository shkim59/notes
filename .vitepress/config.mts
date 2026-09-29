import { defineConfig } from 'vitepress'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(__dirname, '..')

// 폴더 이름 → 사이드바 그룹 이름 (이 순서대로 표시됨)
const groups: Record<string, string> = {
  java: 'Java',
  spring: 'Spring · JPA',
  database: '데이터베이스',
  os: '운영체제',
  network: '네트워크',
  fp: '함수형 프로그래밍',
  refactoring: '리팩터링',
  frontend: '프론트엔드',
  nodejs: 'Node.js',
  infra: '인프라 (Docker · Git · AWS)',
  linux: '리눅스',
  algorithm: '알고리즘',
  interview: '면접 대비',
  troubleshooting: '트러블슈팅',
  archive: '아카이브',
}

// frontmatter의 title → 없으면 첫 번째 # 제목 → 없으면 파일명
function readTitle(file: string): string {
  const text = fs.readFileSync(file, 'utf-8')
  const fm = text.match(/^---\r?\n[\s\S]*?\btitle:\s*(.+?)\s*\r?\n[\s\S]*?---/)
  if (fm) return fm[1].replace(/^["']|["']$/g, '')
  const h1 = text.match(/^#\s+(.+)$/m)
  return h1 ? h1[1].trim() : path.basename(file, '.md')
}

function buildSidebar() {
  return Object.entries(groups)
    .filter(([dir]) => fs.existsSync(path.join(root, dir)))
    .map(([dir, label]) => {
      const files = fs
        .readdirSync(path.join(root, dir))
        .filter((f) => f.endsWith('.md'))
        .sort()
      return {
        text: label,
        collapsed: true,
        items: files.map((f) => ({
          text: readTitle(path.join(root, dir, f)),
          link: `/${dir}/${f.replace(/\.md$/, '')}`,
        })),
      }
    })
}

// GitHub Pages 프로젝트 사이트(shkim59.github.io/notes/)용 base
export default defineConfig({
  base: '/notes/',
  lang: 'ko-KR',
  title: 'Dev Notes',
  description: '공부하고 정리한 개발 노트',
  themeConfig: {
    sidebar: buildSidebar(),
    search: { provider: 'local' },
    outline: { label: '목차' },
    docFooter: { prev: '이전 글', next: '다음 글' },
    darkModeSwitchLabel: '다크 모드',
    sidebarMenuLabel: '메뉴',
    returnToTopLabel: '맨 위로',
  },
})
