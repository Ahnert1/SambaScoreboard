import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import { emptyStore, load, save } from './storage'
import { scoreEntry } from './scoring'
import type { Game, Round, Store, Team, TeamId } from './types'
import { uid } from './utils'

type Action =
  | { type: 'new-game'; teams: Record<TeamId, Team> }
  | { type: 'add-round'; round: Round }
  | { type: 'update-round'; round: Round }
  | { type: 'delete-round'; id: string }
  | { type: 'rename-teams'; teams: Record<TeamId, Team> }
  | { type: 'finish-game' }
  | { type: 'discard-game' }
  | { type: 'delete-history'; id: string }
  | { type: 'clear-all' }

function reducer(state: Store, action: Action): Store {
  switch (action.type) {
    case 'new-game': {
      // Starting a new game while one is open files the open one away,
      // as long as it has something worth keeping.
      const history =
        state.current && state.current.rounds.length > 0
          ? [{ ...state.current, endedAt: Date.now() }, ...state.history]
          : state.history
      const game: Game = {
        id: uid(),
        createdAt: Date.now(),
        endedAt: null,
        teams: action.teams,
        rounds: [],
      }
      return { current: game, history }
    }

    case 'add-round': {
      if (!state.current) return state
      return {
        ...state,
        current: { ...state.current, rounds: [...state.current.rounds, action.round] },
      }
    }

    case 'update-round': {
      if (!state.current) return state
      return {
        ...state,
        current: {
          ...state.current,
          rounds: state.current.rounds.map((r) =>
            r.id === action.round.id ? action.round : r,
          ),
        },
      }
    }

    case 'delete-round': {
      if (!state.current) return state
      return {
        ...state,
        current: {
          ...state.current,
          rounds: state.current.rounds.filter((r) => r.id !== action.id),
        },
      }
    }

    case 'rename-teams': {
      if (!state.current) return state
      return { ...state, current: { ...state.current, teams: action.teams } }
    }

    case 'finish-game': {
      if (!state.current) return state
      if (state.current.rounds.length === 0) return { ...state, current: null }
      return {
        current: null,
        history: [{ ...state.current, endedAt: Date.now() }, ...state.history],
      }
    }

    case 'discard-game':
      return { ...state, current: null }

    case 'delete-history':
      return { ...state, history: state.history.filter((g) => g.id !== action.id) }

    case 'clear-all':
      return emptyStore
  }
}

interface Ctx {
  state: Store
  dispatch: (a: Action) => void
}

const StoreContext = createContext<Ctx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)

  useEffect(() => {
    save(state)
  }, [state])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Ctx {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}

/* ── derived helpers ─────────────────────────────────────────────────── */

/** Running total for one team across every round played so far. */
export function teamTotal(game: Game, team: TeamId): number {
  return game.rounds.reduce((sum, r) => sum + scoreEntry(r[team]), 0)
}

/** Totals after each round, useful for "before this round" snapshots. */
export function totalsBefore(game: Game, roundId: string): Record<TeamId, number> {
  const out: Record<TeamId, number> = { a: 0, b: 0 }
  for (const r of game.rounds) {
    if (r.id === roundId) break
    out.a += scoreEntry(r.a)
    out.b += scoreEntry(r.b)
  }
  return out
}
