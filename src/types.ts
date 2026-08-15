import type { CategoryId } from './scoring'

export type TeamId = 'a' | 'b'

export type ColorKey = 'cyan' | 'magenta' | 'lime' | 'amber' | 'violet' | 'rose'

export const COLORS: { key: ColorKey; hex: string }[] = [
  { key: 'cyan', hex: '#22d3ee' },
  { key: 'magenta', hex: '#e879f9' },
  { key: 'lime', hex: '#a3e635' },
  { key: 'amber', hex: '#fbbf24' },
  { key: 'violet', hex: '#a78bfa' },
  { key: 'rose', hex: '#fb7185' },
]

export const colorHex = (key: ColorKey): string =>
  COLORS.find((c) => c.key === key)?.hex ?? '#22d3ee'

export interface Team {
  name: string
  color: ColorKey
}

/** One team's numbers for one round. */
export interface RoundEntry {
  counts: Record<CategoryId, number>
  /** Raw card points counted up from the melds. */
  cardPoints: number
  teamOut: boolean
}

export interface Round {
  id: string
  a: RoundEntry
  b: RoundEntry
}

export interface Game {
  id: string
  createdAt: number
  /** Set when the game is filed away into history. */
  endedAt: number | null
  teams: Record<TeamId, Team>
  rounds: Round[]
}

export interface Store {
  current: Game | null
  history: Game[]
}
