import type { Store } from './types'

const KEY = 'samba.scoreboard.v1'

export const emptyStore: Store = { current: null, history: [] }

export function load(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyStore
    const parsed = JSON.parse(raw) as Partial<Store> | null
    if (!parsed || typeof parsed !== 'object') return emptyStore
    return {
      current: parsed.current ?? null,
      history: Array.isArray(parsed.history) ? parsed.history : [],
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
