import { defineConfig } from 'vitepress'
import fs from 'node:fs'
import path from 'node:path'
import { sections, type Group } from './sections.mts'

const root = path.resolve(__dirname, '..')

// frontmatter의 title → 없으면 첫 번째 # 제목 → 없으면 파일명
function readTitle(file: string): string {
  const text = fs.readFileSync(file, 'utf-8')
  const fm = text.match(/^---\r?\n[\s\S]*?\btitle:\s*(.+?)\s*\r?\n[\s\S]*?---/)
  if (fm) return fm[1].replace(/^["']|["']$/g, '')
  const h1 = text.match(/^#\s+(.+)$/m)
  return h1 ? h1[1].trim() : path.basename(file, '.md')
}

function listFiles(dir: string): string[] {
  const full = path.join(root, dir)
  if (!fs.existsSync(full)) return []
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith('.md'))
    .sort()
}

const toItem = (dir: string) => (f: string) => ({
  text: readTitle(path.join(root, dir, f)),
  link: `/${dir}/${f.replace(/\.md$/, '')}`,
})

// 폴더 하나 → 사이드바 그룹. split이 있으면 소분류로 한 번 더 묶음
function buildGroup(g: Group) {
  const files = listFiles(g.dir)
  if (!g.split) {
    return { text: g.text, collapsed: true, items: files.map(toItem(g.dir)) }
  }
  const used = new Set<string>()
  const children = g.split.map((s) => {
    const matched = files.filter((f) => f.slice(0, 2) >= s.from && f.slice(0, 2) <= s.to)
    matched.forEach((f) => used.add(f))
    return { text: s.text, collapsed: true, items: matched.map(toItem(g.dir)) }
  })
  // 어느 소분류에도 안 걸린 글은 사라지지 않게 '기타'로 모음
  const rest = files.filter((f) => !used.has(f))
  if (rest.length) children.push({ text: '기타', collapsed: true, items: rest.map(toItem(g.dir)) })
  return { text: g.text, collapsed: false, items: children }
}

// 분야별 사이드바: 주소가 /java/, /spring/ 이면 'Java · Spring' 사이드바만 보임
function buildSidebar() {
  const sidebar: Record<string, unknown[]> = {}
  for (const section of sections) {
    const groups = section.groups.map(buildGroup)
    for (const g of section.groups) sidebar[`/${g.dir}/`] = groups
  }
  return sidebar
}

// 상단 '노트' 메뉴: 분야마다 첫 번째 글로 연결
function buildNav() {
  const items = sections.map((s) => {
    const g = s.groups[0]
    const first = listFiles(g.dir)[0]
    return { text: s.label, link: `/${g.dir}/${first.replace(/\.md$/, '')}` }
  })
  return [{ text: '노트', items }]
}

// 분류(sections.mts)에 없는 폴더가 있으면 빌드 로그로 알려 줌
const known = new Set(sections.flatMap((s) => s.groups.map((g) => g.dir)))
const skip = new Set(['node_modules', '.vitepress', '.github', '.git'])
for (const d of fs.readdirSync(root, { withFileTypes: true })) {
  if (d.isDirectory() && !d.name.startsWith('.') && !skip.has(d.name) && !known.has(d.name)) {
    console.warn(`[sections] '${d.name}' 폴더가 .vitepress/sections.mts에 없어 메뉴에 나오지 않아요.`)
  }
}

// GitHub Pages 프로젝트 사이트(shkim59.github.io/notes/)용 base
export default defineConfig({
  base: '/notes/',
  lang: 'ko-KR',
  title: 'Dev Notes',
  description: '공부하고 정리한 개발 노트',
  themeConfig: {
    nav: buildNav(),
    sidebar: buildSidebar(),
    search: { provider: 'local' },
    outline: { label: '목차' },
    docFooter: { prev: '이전 글', next: '다음 글' },
    darkModeSwitchLabel: '다크 모드',
    sidebarMenuLabel: '메뉴',
    returnToTopLabel: '맨 위로',
  },
})
