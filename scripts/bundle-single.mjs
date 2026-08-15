/**
 * Folds the Vite build into ONE self-contained index.html at the repo root,
 * ready for GitHub Pages with no build step on GitHub's side.
 *
 * The resulting index.html has the JS, the CSS and a favicon inlined — it is
 * the whole app in a single file and runs on its own. The PWA layer (manifest,
 * service worker, home-screen icons) is copied alongside it as separate files,
 * because a service worker cannot be inlined and the 512px icons would triple
 * the page weight. index.html links to them but does not depend on them: if
 * they're missing, you lose offline support and the install prompt, and
 * nothing else changes.
 *
 *   npm run build
 */
import { copyFileSync, existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const PUBLIC = join(ROOT, 'public')

const assetPath = (href) => join(DIST, href.replace(/^\.?\//, ''))

/**
 * Inlined script/style content must not contain a literal `</script` or `<!--`,
 * or the HTML parser ends the block early. Both only ever occur inside string
 * literals in bundled code, where the backslash is a harmless no-op escape.
 */
const guard = (code) =>
  code.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--')

/* Tiny vector version of the app icon — keeps the standalone file light. */
const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" rx="14" fill="#08080f"/>
<rect x="12" y="15" width="23" height="33" rx="5" fill="#0b1a20" stroke="#22d3ee" stroke-width="3.5" transform="rotate(-11 23.5 31.5)"/>
<rect x="29" y="16" width="23" height="33" rx="5" fill="#180d1d" stroke="#e879f9" stroke-width="3.5" transform="rotate(11 40.5 32.5)"/>
</svg>`
const FAVICON_URI = `data:image/svg+xml,${encodeURIComponent(FAVICON_SVG.replace(/\n/g, ''))}`

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('No dist/index.html — run `vite build` first.')
  process.exit(1)
}

let html = readFileSync(join(DIST, 'index.html'), 'utf8')
let inlinedJs = 0
let inlinedCss = 0

// Preloads are pointless once the chunk is inline.
html = html.replace(/\s*<link[^>]+rel="modulepreload"[^>]*>/g, '')

html = html.replace(
  /<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,
  (_match, href) => {
    const css = readFileSync(assetPath(href), 'utf8')
    inlinedCss++
    return `<style>\n${guard(css)}\n    </style>`
  },
)

html = html.replace(
  /<script[^>]*type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g,
  (_match, src) => {
    const js = readFileSync(assetPath(src), 'utf8')
    inlinedJs++
    return `<script type="module">\n${guard(js)}\n    </script>`
  },
)

if (inlinedJs !== 1 || inlinedCss !== 1) {
  console.error(
    `Expected exactly one JS and one CSS bundle, inlined ${inlinedJs} JS / ${inlinedCss} CSS.\n` +
      'The build probably code-split — check cssCodeSplit/assetsInlineLimit in vite.config.ts.',
  )
  process.exit(1)
}

// Swap the PNG favicon for an inline vector so the file stands alone.
html = html.replace(
  /<link rel="icon"[^>]*>/,
  `<link rel="icon" type="image/svg+xml" href="${FAVICON_URI}" />`,
)

writeFileSync(join(ROOT, 'index.html'), html)

// The PWA layer: separate files by necessity, optional by design.
const extras = [
  'manifest.webmanifest',
  'sw.js',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'apple-touch-icon.png',
]
for (const name of extras) {
  const from = join(PUBLIC, name)
  if (existsSync(from)) copyFileSync(from, join(ROOT, name))
}

// Stops GitHub Pages running the output through Jekyll.
writeFileSync(join(ROOT, '.nojekyll'), '')

const kb = (p) => (statSync(p).size / 1024).toFixed(0)
console.log(`  index.html          ${kb(join(ROOT, 'index.html'))} kB  (standalone app)`)
for (const name of extras) {
  const p = join(ROOT, name)
  if (existsSync(p)) console.log(`  ${name.padEnd(24)}${kb(p)} kB`)
}
console.log('  .nojekyll')
console.log('\nRoot is ready for GitHub Pages.')
