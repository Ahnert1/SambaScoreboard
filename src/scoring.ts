import type { RoundEntry } from './types'

/**
 * ────────────────────────────────────────────────────────────────────────
 *  THE HOUSE SCORING TABLE
 *
 *  Every point value the app uses lives in this file and nowhere else.
 *  To change a house rule: edit the number, save, rebuild. That's it.
 *
 *  `confirmed: false` marks a PLACEHOLDER — a value I guessed rather than
 *  one you gave me. Those tiles render a small amber dot in the round-entry
 *  screen so nobody trusts a made-up number. Set it to `true` once the real
 *  value is in.
 * ────────────────────────────────────────────────────────────────────────
 */

export const ROUNDS_PER_GAME = 4

export type CategoryId =
  | 'cut30'
  | 'samba'
  | 'sevens'
  | 'wildCards'
  | 'redCanasta'
  | 'mixedCanasta'
  | 'redThrees'

export interface CategoryDef {
  id: CategoryId
  /** Full name — used in history breakdowns and screen-reader labels. */
  label: string
  /** Optional shorter name for the narrow round-entry column. */
  short?: string
  /** Small grey text under the label. */
  note: string
  /** Points awarded per one of these. */
  value: number
  /** false = placeholder value, still needs the real family number. */
  confirmed: boolean
}

export const CATEGORIES: CategoryDef[] = [
  { id: 'cut30', label: '"30" Cut', note: 'each', value: 100, confirmed: true },
  { id: 'samba', label: 'Samba', note: '7-card suit run', value: 2000, confirmed: true },
  { id: 'sevens', label: 'Sevens', note: 'canasta of 7s', value: 2000, confirmed: true },
  { id: 'wildCards', label: 'Wild Cards', note: 'canasta of wilds', value: 2000, confirmed: true },
  {
    id: 'redCanasta',
    label: 'Red / Pure Canasta',
    short: 'Red Canasta',
    note: 'each',
    value: 500,
    confirmed: true,
  },
  { id: 'mixedCanasta', label: 'Mixed Canasta', note: 'each', value: 300, confirmed: true },
  { id: 'redThrees', label: 'Red 3s', note: 'each', value: 100, confirmed: true },
]

/** One-off bonus for the team that went out. Toggle, not a count. */
export const TEAM_OUT = { label: 'Team Out', note: 'went out this round', value: 2000, confirmed: true }

/** True when at least one value on screen is still a guess. */
export const HAS_PLACEHOLDERS =
  CATEGORIES.some((c) => !c.confirmed) || !TEAM_OUT.confirmed

export function emptyEntry(): RoundEntry {
  const counts = {} as Record<CategoryId, number>
  for (const c of CATEGORIES) counts[c.id] = 0
  return { counts, cardPoints: 0, teamOut: false }
}

/** The whole calculator: counts × values, plus card points, plus the out bonus. */
export function scoreEntry(entry: RoundEntry): number {
  let total = entry.cardPoints || 0
  for (const c of CATEGORIES) total += (entry.counts[c.id] ?? 0) * c.value
  if (entry.teamOut) total += TEAM_OUT.value
  return total
}

/** True if the user actually put something in — used to grey out empty rounds. */
export function isEntryBlank(entry: RoundEntry): boolean {
  if (entry.cardPoints) return false
  if (entry.teamOut) return false
  return CATEGORIES.every((c) => !(entry.counts[c.id] ?? 0))
}
