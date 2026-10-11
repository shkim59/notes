import { defineConfig } from 'vitepress'
import fs from 'node:fs'
import path from 'node:path'
import { sections as declared, type Group, type Section } from './sections.mts'

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

const link = (dir: string, f: string) => `/${dir}/${f.replace(/\.md$/, '')}`
const toItem = (dir: string) => (f: string) => ({
  text: readTitle(path.join(root, dir, f)),
  link: link(dir, f),
})

// ---------- 분야 목록 만들기 ----------
// 1) sections.mts에 선언된 분야 (글이 없는 폴더는 건너뜀)
// 2) 선언되지 않은 폴더에 글이 있으면 자동으로 '기타' 분야에 모음
const skipDirs = new Set(['node_modules', 'public'])
const known = new Set(declared.flatMap((s) => s.groups.map((g) => g.dir)))
const extraGroups: Group[] = fs
  .readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('.') && !skipDirs.has(d.name) && !known.has(d.name))
  .filter((d) => listFiles(d.name).length > 0)
  .map((d) => ({ dir: d.name, text: d.name }))

const allSections: Section[] = [...declared, ...(extraGroups.length ? [{ label: '기타', groups: extraGroups }] : [])]
  .map((s) => ({ ...s, groups: s.groups.filter((g) => listFiles(g.dir).length > 0) }))
  .filter((s) => s.groups.length > 0)

// ---------- 사이드바 ----------
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
  return { text: g.text, collapsed: false, items: children.filter((c) => c.items.length > 0) }
}

// 분야별 사이드바: 주소가 /java/, /spring/ 이면 'Java · Spring' 사이드바만 보임
function buildSidebar() {
  const sidebar: Record<string, unknown[]> = {}
  for (const section of allSections) {
    const groups = section.groups.map(buildGroup)
    for (const g of section.groups) sidebar[`/${g.dir}/`] = groups
  }
  return sidebar
}

// ---------- 상단 메뉴 · 홈 ----------
const firstLink = (s: Section) => link(s.groups[0].dir, listFiles(s.groups[0].dir)[0])
const countOf = (s: Section) => s.groups.reduce((n, g) => n + listFiles(g.dir).length, 0)

function buildNav() {
  if (allSections.length === 0) return []
  return [{ text: '노트', items: allSections.map((s) => ({ text: s.label, link: firstLink(s) })) }]
}

// 홈의 '노트 보기' 버튼과 분야별 카드는 빌드할 때마다 자동으로 만듦
function homeData(frontmatter: Record<string, any>) {
  if (allSections.length === 0) return
  frontmatter.hero = {
    ...(frontmatter.hero ?? {}),
    actions: [{ theme: 'brand', text: '노트 보기', link: firstLink(allSections[0]) }],
  }
  frontmatter.features = allSections.map((s) => ({
    title: s.label,
    details: `${s.groups.map((g) => g.text).join(', ')} · ${countOf(s)}편`,
    link: firstLink(s),
  }))
}

// GitHub Pages 프로젝트 사이트(shkim59.github.io/notes/)용 base
export default defineConfig({
  base: '/notes/',
  lang: 'ko-KR',
  title: 'Dev Notes',
  description: '공부하고 정리한 개발 노트',
  transformPageData(pageData) {
    if (pageData.relativePath === 'index.md') homeData(pageData.frontmatter)
  },
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
