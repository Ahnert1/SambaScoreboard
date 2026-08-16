import { motion } from 'framer-motion'
import type { KeyboardEvent } from 'react'
import {
  CARD_POINTS,
  CATEGORIES,
  TEAM_OUT,
  scoreEntry,
  type CategoryId,
} from '../scoring'
import { colorHex, type RoundEntry, type Team, type TeamId } from '../types'
import { buzz, clamp, cx, fmt, teamVar } from '../utils'
import { RollingNumber } from './RollingNumber'

const MAX_COUNT = 999
const MAX_CARD_POINTS = 999999
const IDS: TeamId[] = ['a', 'b']

/** Strips anything that isn't a digit and caps the length. */
const digitsOnly = (raw: string, max: number) =>
  raw.replace(/[^\d]/g, '').slice(0, max)

/**
 * Moves focus to the next number field in DOM order — which is also visual
 * order: team A then team B of a category, then down to the next category.
 * Wired to the keyboard's next/done key so a whole round can be typed without
 * ever reaching for the screen.
 */
function focusNextField(el: HTMLInputElement) {
  const form = el.form
  if (!form) return
  const fields = Array.from(form.querySelectorAll<HTMLInputElement>('input[data-field]'))
  const next = fields[fields.indexOf(el) + 1]
  if (next) {
    next.focus()
    next.select()
  } else {
    el.blur()
  }
}

const onFieldKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
  if (e.key !== 'Enter') return
  e.preventDefault()
  focusNextField(e.currentTarget)
}

/*
 * Drawn rather than typed: a text "−"/"+" sits on the font's baseline, so it
 * lands a couple of pixels below the optical centre of the button no matter
 * how the box is centred. A path in a square viewBox is exact.
 */
const MinusIcon = () => (
  <svg className="step__icon" viewBox="0 0 24 24" aria-hidden focusable="false">
    <path d="M6 12h12" />
  </svg>
)

const PlusIcon = () => (
  <svg className="step__icon" viewBox="0 0 24 24" aria-hidden focusable="false">
    <path d="M12 6v12M6 12h12" />
  </svg>
)

/**
 * One row per category, both teams side by side, so a category gets counted
 * for the whole table in one place. The quantity is a real number field —
 * typing is the primary input and the −/+ buttons are just a nudge by one.
 */
export function RoundGrid({
  teams,
  entries,
  onChange,
}: {
  teams: Record<TeamId, Team>
  entries: Record<TeamId, RoundEntry>
  onChange: (team: TeamId, next: RoundEntry) => void
}) {
  const hex: Record<TeamId, string> = {
    a: colorHex(teams.a.color),
    b: colorHex(teams.b.color),
  }

  const setCount = (team: TeamId, id: CategoryId, next: number) => {
    const entry = entries[team]
    onChange(team, {
      ...entry,
      counts: { ...entry.counts, [id]: clamp(next, 0, MAX_COUNT) },
    })
  }

  /** Only one team goes out in a round, so switching one on clears the other. */
  const toggleOut = (team: TeamId) => {
    const other: TeamId = team === 'a' ? 'b' : 'a'
    const goingOut = !entries[team].teamOut
    buzz(14)
    onChange(team, { ...entries[team], teamOut: goingOut })
    if (goingOut && entries[other].teamOut) {
      onChange(other, { ...entries[other], teamOut: false })
    }
  }

  return (
    // A real <form> is what makes iOS show the ‹ › Done accessory bar above
    // the number pad, which is the other half of sequential entry.
    <form className="grid" onSubmit={(e) => e.preventDefault()}>
      {/* Sticky header: which column is whose, plus each team's live total. */}
      <div className="grid__head">
        {IDS.map((id) => (
          <div key={id} className="teamcol" style={teamVar(hex[id])}>
            <span className="teamcol__name">{teams[id].name}</span>
            <span className="teamcol__total">
              <RollingNumber value={scoreEntry(entries[id])} signed />
            </span>
          </div>
        ))}
      </div>

      {CATEGORIES.map((cat) => {
        const active = IDS.some((id) => (entries[id].counts[cat.id] ?? 0) > 0)
        return (
          <div key={cat.id} className={cx('crow', active && 'crow--on')}>
            <div className="crow__head">
              <span className="crow__name">
                {cat.short ?? cat.label}
                {!cat.confirmed && (
                  <span className="dot" title="Placeholder value — not confirmed yet" />
                )}
              </span>
              <span className="crow__value">
                {fmt(cat.value)} {cat.note}
              </span>
            </div>

            <div className="crow__cells">
              {IDS.map((id) => {
                const count = entries[id].counts[cat.id] ?? 0
                return (
                  <div key={id} className="cell" style={teamVar(hex[id])}>
                    <button
                      type="button"
                      tabIndex={-1}
                      className="step"
                      onClick={() => {
                        buzz()
                        setCount(id, cat.id, count - 1)
                      }}
                      disabled={count === 0}
                      aria-label={`One fewer ${cat.label} for ${teams[id].name}`}
                    >
                      <MinusIcon />
                    </button>

                    <input
                      className={cx('numinput', count > 0 && 'numinput--on')}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      enterKeyHint="next"
                      data-field=""
                      value={count === 0 ? '' : String(count)}
                      placeholder="0"
                      onChange={(e) => {
                        const digits = digitsOnly(e.target.value, 3)
                        setCount(id, cat.id, digits === '' ? 0 : Number(digits))
                      }}
                      onFocus={(e) => e.currentTarget.select()}
                      onKeyDown={onFieldKeyDown}
                      aria-label={`${cat.label} for ${teams[id].name}`}
                    />

                    <button
                      type="button"
                      tabIndex={-1}
                      className="step step--plus"
                      onClick={() => {
                        buzz()
                        setCount(id, cat.id, count + 1)
                      }}
                      aria-label={`One more ${cat.label} for ${teams[id].name}`}
                    >
                      <PlusIcon />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Card count — free entry, no steppers; nobody nudges this by one. */}
      <div
        className={cx('crow', IDS.some((id) => entries[id].cardPoints > 0) && 'crow--on')}
      >
        <div className="crow__head">
          <span className="crow__name">{CARD_POINTS.label}</span>
          <span className="crow__value">{CARD_POINTS.note}</span>
        </div>
        <div className="crow__cells">
          {IDS.map((id) => (
            <div key={id} className="cell cell--wide" style={teamVar(hex[id])}>
              <input
                className={cx('numinput', entries[id].cardPoints > 0 && 'numinput--on')}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                // Last field in the sequence, so the key reads Done, not Next.
                enterKeyHint={id === 'b' ? 'done' : 'next'}
                data-field=""
                value={entries[id].cardPoints === 0 ? '' : String(entries[id].cardPoints)}
                placeholder="0"
                onChange={(e) => {
                  const digits = digitsOnly(e.target.value, 6)
                  onChange(id, {
                    ...entries[id],
                    cardPoints: digits === '' ? 0 : clamp(Number(digits), 0, MAX_CARD_POINTS),
                  })
                }}
                onFocus={(e) => e.currentTarget.select()}
                onKeyDown={onFieldKeyDown}
                aria-label={`${CARD_POINTS.label} for ${teams[id].name}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Team Out — a toggle per team, not a count. */}
      <div className={cx('crow', IDS.some((id) => entries[id].teamOut) && 'crow--on')}>
        <div className="crow__head">
          <span className="crow__name">{TEAM_OUT.label}</span>
          <span className="crow__value">
            {fmt(TEAM_OUT.value)} · {TEAM_OUT.note}
          </span>
        </div>
        <div className="crow__cells">
          {IDS.map((id) => (
            <div key={id} className="switchcell" style={teamVar(hex[id])}>
              <button
                type="button"
                className="switch"
                data-on={entries[id].teamOut}
                aria-pressed={entries[id].teamOut}
                aria-label={`${teams[id].name} went out`}
                onClick={() => toggleOut(id)}
              >
                <motion.span
                  className="switch__knob"
                  layout
                  transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </form>
  )
}
