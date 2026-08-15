import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * The HTML entry template lives in `app/` rather than at the repo root,
 * because the root `index.html` is the *built* single-file app that GitHub
 * Pages serves. Keeping them apart means `npm run dev` never accidentally
 * serves a stale build.
 *
 * `base: './'` keeps every path relative so the app works from a GitHub Pages
 * project subpath (username.github.io/SambaScoreboard/) without extra config.
 */
export default defineConfig({
  base: './',
  root: 'app',
  publicDir: '../public',
  plugins: [react()],
  server: { host: true },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    // One CSS file and one JS file, with every asset inlined — that's what
    // scripts/bundle-single.mjs folds into a single index.html.
    cssCodeSplit: false,
    assetsInlineLimit: 1024 * 1024,
  },
})
