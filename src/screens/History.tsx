import { scoreEntry } from '../scoring'
import { useStore } from '../store'
import { colorHex, type Game, type TeamId } from '../types'
import { dateLabel, fmt, teamVar } from '../utils'

interface Best {
  label: string
  value: string
  detail: string
}

/** A few neutral all-time numbers — no wins, no losses, as requested. */
function allTimeBests(games: Game[]): Best[] {
  if (games.length === 0) return []

  let bestRound = { points: -1, team: '', when: 0 }
  let bestGame = { points: -1, team: '', when: 0 }
  let sambas = 0
  let rounds = 0

  for (const g of games) {
    rounds += g.rounds.length
    for (const id of ['a', 'b'] as TeamId[]) {
      let gameTotal = 0
      for (const r of g.rounds) {
        const pts = scoreEntry(r[id])
        gameTotal += pts
        if (pts > bestRound.points) {
          bestRound = { points: pts, team: g.teams[id].name, when: g.createdAt }
        }
        sambas += r[id].counts.samba ?? 0
      }
      if (gameTotal > bestGame.points) {
        bestGame = { points: gameTotal, team: g.teams[id].name, when: g.createdAt }
      }
    }
  }

  const out: Best[] = [
    { label: 'Games', value: String(games.length), detail: `${rounds} rounds` },
  ]
  if (bestRound.points >= 0) {
    out.push({
      label: 'Biggest round',
      value: fmt(bestRound.points),
      detail: `${bestRound.team} · ${dateLabel(bestRound.when)}`,
    })
  }
  if (bestGame.points >= 0) {
    out.push({
      label: 'Highest game',
      value: fmt(bestGame.points),
      detail: `${bestGame.team} · ${dateLabel(bestGame.when)}`,
    })
  }
  out.push({ label: 'Sambas', value: fmt(sambas), detail: 'all time' })
  return out
}

export function History({
  onBack,
  onOpen,
}: {
  onBack: () => void
  onOpen: (id: string) => void
}) {
  const { state } = useStore()
  const games = state.history
  const bests = allTimeBests(games)

  return (
    <div className="screen">
      <header className="topbar">
        <button className="iconbtn" onClick={onBack} aria-label="Back">
          ‹
        </button>
        <span className="topbar__title">History</span>
        <span className="spacer" />
      </header>

      {games.length === 0 ? (
        <div className="empty">
          <div className="empty__mark">♠</div>
          <p>No finished games yet.</p>
          <p className="empty__sub">
            Games land here when you tap <em>Finish &amp; Save Game</em>.
          </p>
        </div>
      ) : (
        <>
          <div className="bests">
            {bests.map((b) => (
              <div key={b.label} className="best">
                <div className="best__label">{b.label}</div>
                <div className="best__value">{b.value}</div>
                <div className="best__detail">{b.detail}</div>
              </div>
            ))}
          </div>

          <div className="gamelist">
            {games.map((g) => {
              const totals: Record<TeamId, number> = {
                a: g.rounds.reduce((s, r) => s + scoreEntry(r.a), 0),
                b: g.rounds.reduce((s, r) => s + scoreEntry(r.b), 0),
              }
              return (
                <button key={g.id} className="gamecard" onClick={() => onOpen(g.id)}>
                  <div className="gamecard__top">
                    <span className="gamecard__date">
                      {dateLabel(g.endedAt ?? g.createdAt)}
                    </span>
                    <span className="gamecard__rounds">
                      {g.rounds.length} {g.rounds.length === 1 ? 'round' : 'rounds'}
                    </span>
                  </div>
                  <div className="gamecard__teams">
                    {(['a', 'b'] as TeamId[]).map((id) => (
                      <div
                        key={id}
                        className="gamecard__team"
                        style={teamVar(colorHex(g.teams[id].color))}
                      >
                        <span className="gamecard__name">{g.teams[id].name}</span>
                        <span className="gamecard__score">{fmt(totals[id])}</span>
                      </div>
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
