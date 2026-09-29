import { defineConfig } from 'vitepress'

// GitHub Pages 프로젝트 사이트(shkim59.github.io/notes/)용 base
export default defineConfig({
  base: '/notes/',
  lang: 'ko-KR',
  title: 'Dev Notes',
  description: '공부하고 정리한 개발 노트',
  themeConfig: {
    search: { provider: 'local' },
  },
})
