# Samba Scoreboard

An offline scorekeeper for the card game Samba. Two teams, four rounds, seven
scoring categories. Built to be fast to tap at the table and nice to look at.

No accounts, no server, no network calls. Everything lives in your browser's
local storage.

**Live:** https://<your-username>.github.io/SambaScoreboard/

## Deploying to GitHub Pages

The repo root holds a **self-contained `index.html`** — the entire app, with the
JavaScript, CSS and favicon inlined into one file. GitHub needs no build step;
it just serves the root.

```bash
npm run build     # regenerates index.html + the PWA files at the repo root
git add -A
git commit -m "Update scoreboard"
git push
```

One-time setup: **Settings → Pages → Source: Deploy from a branch → `main` /
`(root)`**. Note that Pages on a free account requires the repo to be **public**.

### What's at the root, and why

| File | Required? | What it does |
| --- | --- | --- |
| `index.html` | **yes** | The whole app. Runs on its own. |
| `manifest.webmanifest` | optional | Android install prompt, fullscreen, app name |
| `sw.js` | optional | Offline support — a service worker can't be inlined |
| `icon-*.png`, `apple-touch-icon.png` | optional | Home-screen icons (too big to inline sensibly) |
| `.nojekyll` | keep | Stops GitHub running the output through Jekyll |

`index.html` links to the optional files but doesn't depend on them. Delete them
and you still have a working scoreboard — you just lose offline support and the
home-screen icon.

### Getting it onto phones

Send the Pages link. On each phone: **Share → Add to Home Screen** (iPhone) or
**⋮ → Add to Home screen** (Android). It then launches fullscreen with no
browser chrome and works with no signal.

Two things worth knowing:

- **Scores are per-device.** Each phone has its own local storage, so history
  doesn't sync between them. Fine when one person keeps score for the table.
- **Updates land one launch later.** The service worker serves its cached copy
  immediately and refreshes in the background, so after you push a change the
  next open still shows the old version and the one after that is current.

## Developing

```bash
npm install
npm run dev      # open the printed http://... URL
```

`npm run dev` also prints a `Network:` URL — open that on a phone on the same
Wi-Fi to test the real thing.

## Changing the scoring

**[`src/scoring.ts`](src/scoring.ts) is the only file with point values in it.**
Edit a number, run `npm run build`, commit, push.

```ts
export const CATEGORIES: CategoryDef[] = [
  { id: 'samba', label: 'Samba', note: '7-card suit run', value: 2000, confirmed: true },
  //                                                             ↑ this
]
```

Adding or removing a category means editing that array and the `CategoryId`
union above it — the round entry, the history breakdown and the persistence
layer all read from it. Old saved games missing a new category read as zero
rather than breaking.

`confirmed: false` marks a value as a guess: it shows an amber dot next to the
category during round entry and a warning banner at the top. All seven are
currently `true`, so neither appears.

`TEAM_OUT` and `ROUNDS_PER_GAME` live in the same file.

## How it works

- **New Game** — name both teams, pick a neon colour each.
- **Scoreboard** — big rolling totals, the leader's card pulses, four round
  slots. Tap any played round to edit or delete it.
- **Round entry** — one row per category with both teams' colour-coded `+`/`−`
  counters side by side, so a category gets counted for the whole table in one
  place. Same for the free **Card Points** field and the **Team Out** toggle. A
  sticky header keeps both team names and their live round totals on screen
  while the list scrolls.
- **Reveal** — after submitting, the totals roll up and big rounds get particles.
  Tap to skip.
- **History** — finished games with a round-by-round and per-category breakdown,
  plus a few all-time numbers.

Four rounds is the assumed shape of a game, but stopping after two is normal —
**Finish & Save Game** files it away with however many rounds got played. There's
no winner/loser logic anywhere.

The app is a pure calculator: it multiplies counts by point values and adds them
up. It never validates a play or tells you a score is illegal.

## Layout

```
index.html             ← GENERATED single-file app (committed, served by Pages)
manifest.webmanifest   ← GENERATED    sw.js, icon-*.png likewise
app/index.html         ← the HTML template the build starts from
src/
  scoring.ts     ← all point values and the score function
  types.ts  storage.ts  store.tsx  utils.ts
  App.tsx        ← screen switching
  screens/       ← Setup, Scoreboard, RoundEntry, Reveal, History, GameDetail
  components/    ← RollingNumber, RoundGrid, Burst, Sheet
  styles.css     ← the whole theme
public/          ← source copies of the manifest, service worker and icons
scripts/
  bundle-single.mjs    ← folds the build into the root index.html
  generate-icons.mjs   ← redraws the PWA icons (npm run icons)
dist/                  ← intermediate build output, gitignored
```

The template lives in `app/` rather than at the root so that the root
`index.html` can be the built artifact without `npm run dev` ever serving a
stale build.

## Regenerating icons

The app icons are drawn programmatically with signed-distance fields — no image
files to edit:

```bash
npm run icons     # then npm run build to copy them to the root
```

Colours are near the top of the drawing section in
[`scripts/generate-icons.mjs`](scripts/generate-icons.mjs).
