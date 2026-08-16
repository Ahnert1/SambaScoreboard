import { CARD_POINTS, CATEGORIES, TEAM_OUT, scoreEntry } from '../scoring'
import { useStore } from '../store'
import { colorHex, type Game, type TeamId } from '../types'
import { cx, dateLabel, fmt, teamVar } from '../utils'

export function GameDetail({
  game,
  onBack,
}: {
  game: Game
  onBack: () => void
}) {
  const { dispatch } = useStore()
  const totals: Record<TeamId, number> = {
    a: game.rounds.reduce((s, r) => s + scoreEntry(r.a), 0),
    b: game.rounds.reduce((s, r) => s + scoreEntry(r.b), 0),
  }

  // Only show category rows that actually happened in this game.
  const usedCategories = CATEGORIES.filter((c) =>
    game.rounds.some((r) => (r.a.counts[c.id] ?? 0) > 0 || (r.b.counts[c.id] ?? 0) > 0),
  )

  return (
    <div className="screen">
      <header className="topbar">
        <button className="iconbtn" onClick={onBack} aria-label="Back">
          ‹
        </button>
        <span className="topbar__title">{dateLabel(game.endedAt ?? game.createdAt)}</span>
        <span className="spacer" />
        <button
          className="iconbtn iconbtn--danger"
          aria-label="Delete game"
          onClick={() => {
            if (!confirm('Delete this game from History?')) return
            dispatch({ type: 'delete-history', id: game.id })
            onBack()
          }}
        >
          ✕
        </button>
      </header>

      <div className="totals">
        {(['a', 'b'] as TeamId[]).map((id) => (
          <div key={id} className="total" style={teamVar(colorHex(game.teams[id].color))}>
            <div className="total__name">{game.teams[id].name}</div>
            <div className="total__value">{fmt(totals[id])}</div>
          </div>
        ))}
      </div>

      <div className="rounds">
        {game.rounds.map((r, i) => (
          <div key={r.id} className="rounds__row">
            <span className="rounds__label">R{i + 1}</span>
            {(['a', 'b'] as TeamId[]).map((id) => (
              <span
                key={id}
                className="rounds__cell"
                style={teamVar(colorHex(game.teams[id].color))}
              >
                {fmt(scoreEntry(r[id]))}
                {r[id].teamOut && <span className="tag">out</span>}
              </span>
            ))}
          </div>
        ))}
        <div className="rounds__row rounds__row--total">
          <span className="rounds__label">TOTAL</span>
          {(['a', 'b'] as TeamId[]).map((id) => (
            <span
              key={id}
              className="rounds__cell rounds__cell--total"
              style={teamVar(colorHex(game.teams[id].color))}
            >
              {fmt(totals[id])}
            </span>
          ))}
        </div>
      </div>

      <h3 className="subhead">Breakdown</h3>
      <div className="rounds rounds--breakdown">
        {usedCategories.map((c) => {
          const per = (id: TeamId) =>
            game.rounds.reduce((s, r) => s + (r[id].counts[c.id] ?? 0), 0)
          return (
            <div key={c.id} className="rounds__row">
              <span className={cx('rounds__label', 'rounds__label--wide')}>
                {c.short ?? c.label}
              </span>
              {(['a', 'b'] as TeamId[]).map((id) => (
                <span
                  key={id}
                  className="rounds__cell"
                  style={teamVar(colorHex(game.teams[id].color))}
                >
                  {per(id)}
                </span>
              ))}
            </div>
          )
        })}
        <div className="rounds__row">
          <span className="rounds__label rounds__label--wide">{CARD_POINTS.label}</span>
          {(['a', 'b'] as TeamId[]).map((id) => (
            <span
              key={id}
              className="rounds__cell"
              style={teamVar(colorHex(game.teams[id].color))}
            >
              {fmt(game.rounds.reduce((s, r) => s + r[id].cardPoints, 0))}
            </span>
          ))}
        </div>
        <div className="rounds__row">
          <span className="rounds__label rounds__label--wide">{TEAM_OUT.label}</span>
          {(['a', 'b'] as TeamId[]).map((id) => (
            <span
              key={id}
              className="rounds__cell"
              style={teamVar(colorHex(game.teams[id].color))}
            >
              {game.rounds.filter((r) => r[id].teamOut).length}
            </span>
          ))}
        </div>
      </div>

      <div className="screen__foot">
        <button className="btn btn--ghost" onClick={onBack}>
          Back to History
        </button>
      </div>
    </div>
  )
}
