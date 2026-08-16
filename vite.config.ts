import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * The HTML entry template lives in `app/` rather than at the repo root,
 * because the root `index.html` is the *built* single-file app that GitHub
 * Pages serves. Keeping them apart means `npm run dev` never accidentally
 * serves a stale build.
 *
 * That split puts `src/` outside Vite's root, and the dev server resolves a
 * script `src` as a URL, not a filesystem path — so a relative `../src/...`
 * would escape the root and 404. The alias below pins `/src/` to the real
 * folder, which resolves identically in dev and in the build.
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
  resolve: {
    alias: [
      {
        find: /^\/src\//,
        replacement: fileURLToPath(new URL('./src/', import.meta.url)),
      },
    ],
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    // One CSS file and one JS file, with every asset inlined — that's what
    // scripts/bundle-single.mjs folds into a single index.html.
    cssCodeSplit: false,
    assetsInlineLimit: 1024 * 1024,
  },
})
