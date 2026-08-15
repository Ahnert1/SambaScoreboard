import { motion } from 'framer-motion'
import { CATEGORIES, TEAM_OUT, scoreEntry, type CategoryId } from '../scoring'
import { colorHex, type RoundEntry, type Team, type TeamId } from '../types'
import { buzz, clamp, cx, fmt, teamVar } from '../utils'
import { RollingNumber } from './RollingNumber'

const MAX_COUNT = 99
const IDS: TeamId[] = ['a', 'b']

/**
 * One row per category, both teams side by side — so a category gets counted
 * for the whole table in one place instead of scrolling between two forms.
 * Column widths come from `--group` on `.grid`, shared by the sticky header
 * and every row so the columns stay in register.
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
    buzz()
    const entry = entries[team]
    onChange(team, {
      ...entry,
      counts: { ...entry.counts, [id]: clamp(next, 0, MAX_COUNT) },
    })
  }

  return (
    <div className="grid">
      {/* Sticky header: which column is whose, plus each team's live total. */}
      <div className="grid__head">
        <span className="grid__headlabel">Category</span>
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
            <div className="crow__label">
              <div className="crow__name">
                {cat.short ?? cat.label}
                {!cat.confirmed && (
                  <span className="dot" title="Placeholder value — not confirmed yet" />
                )}
              </div>
              <div className="crow__meta">
                {fmt(cat.value)} · {cat.note}
              </div>
            </div>

            {IDS.map((id) => {
              const count = entries[id].counts[cat.id] ?? 0
              return (
                <div key={id} className="cell" style={teamVar(hex[id])}>
                  <button
                    className="step"
                    onClick={() => setCount(id, cat.id, count - 1)}
                    disabled={count === 0}
                    aria-label={`One fewer ${cat.label} for ${teams[id].name}`}
                  >
                    −
                  </button>
                  <span className={cx('cell__n', count > 0 && 'cell__n--on')}>{count}</span>
                  <button
                    className="step step--plus"
                    onClick={() => setCount(id, cat.id, count + 1)}
                    aria-label={`One more ${cat.label} for ${teams[id].name}`}
                  >
                    +
                  </button>
                </div>
              )
            })}
          </div>
        )
      })}

      {/* Card points — the one free-entry number, one per team. */}
      <div className="crow crow--field">
        <div className="crow__label">
          <div className="crow__name">Card Points</div>
          <div className="crow__meta">counted up from the melds</div>
        </div>
        {IDS.map((id) => (
          <div key={id} className="numcell" style={teamVar(hex[id])}>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={entries[id].cardPoints === 0 ? '' : String(entries[id].cardPoints)}
              placeholder="0"
              onChange={(e) => {
                const digits = e.target.value.replace(/[^\d]/g, '').slice(0, 6)
                onChange(id, {
                  ...entries[id],
                  cardPoints: digits === '' ? 0 : Number(digits),
                })
              }}
              onFocus={(e) => e.currentTarget.select()}
              aria-label={`Card points for ${teams[id].name}`}
            />
          </div>
        ))}
      </div>

      {/* Team Out — a toggle per team, not a count. */}
      <div className={cx('crow', 'crow--field', IDS.some((id) => entries[id].teamOut) && 'crow--on')}>
        <div className="crow__label">
          <div className="crow__name">{TEAM_OUT.label}</div>
          <div className="crow__meta">
            {fmt(TEAM_OUT.value)} · {TEAM_OUT.note}
          </div>
        </div>
        {IDS.map((id) => (
          <div key={id} className="switchcell" style={teamVar(hex[id])}>
            <button
              className="switch"
              data-on={entries[id].teamOut}
              aria-pressed={entries[id].teamOut}
              aria-label={`${teams[id].name} went out`}
              onClick={() => {
                buzz(14)
                onChange(id, { ...entries[id], teamOut: !entries[id].teamOut })
              }}
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
  )
}
