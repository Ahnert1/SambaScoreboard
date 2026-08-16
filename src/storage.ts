import type { Game, RoundEntry, Store } from './types'

const KEY = 'samba.scoreboard.v1'

export const emptyStore: Store = { current: null, history: [] }

/**
 * Sambas, 7s and Wild Cards used to be three separate categories. They were
 * all worth 2,000, so folding old saved counts into the single `bigMelds`
 * category preserves every score exactly — without this, points already on
 * the board would silently vanish from history.
 */
const LEGACY_2000_IDS = ['samba', 'sevens', 'wildCards'] as const

function migrateEntry(entry: RoundEntry): RoundEntry {
  if (!entry || typeof entry !== 'object') return entry
  const counts: Record<string, number> = { ...(entry.counts ?? {}) }

  let merged = counts.bigMelds ?? 0
  let touched = false
  for (const id of LEGACY_2000_IDS) {
    if (id in counts) {
      merged += counts[id] || 0
      delete counts[id]
      touched = true
    }
  }
  if (!touched) return entry

  counts.bigMelds = merged
  return { ...entry, counts: counts as RoundEntry['counts'] }
}

function migrateGame(game: Game): Game {
  if (!game || !Array.isArray(game.rounds)) return game
  return {
    ...game,
    rounds: game.rounds.map((r) => ({
      ...r,
      a: migrateEntry(r.a),
      b: migrateEntry(r.b),
    })),
  }
}

export function load(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyStore
    const parsed = JSON.parse(raw) as Partial<Store> | null
    if (!parsed || typeof parsed !== 'object') return emptyStore
    return {
      current: parsed.current ? migrateGame(parsed.current) : null,
      history: Array.isArray(parsed.history) ? parsed.history.map(migrateGame) : [],
    }
  } catch {
    // Corrupt or unavailable storage should never stop a game from starting.
    return emptyStore
  }
}

export function save(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    /* private mode / quota — the game still works, it just won't persist */
  }
}
