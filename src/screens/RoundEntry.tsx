import { useState } from 'react'
import { RoundGrid } from '../components/RoundGrid'
import { HAS_PLACEHOLDERS, emptyEntry } from '../scoring'
import { useStore } from '../store'
import type { Game, Round, TeamId } from '../types'
import { buzz, uid } from '../utils'

export function RoundEntry({
  game,
  roundId,
  onDone,
  onCancel,
}: {
  game: Game
  /** Present when editing an already-submitted round. */
  roundId?: string
  onDone: (round: Round, isNew: boolean) => void
  onCancel: () => void
}) {
  const { dispatch } = useStore()
  const existing = roundId ? game.rounds.find((r) => r.id === roundId) : undefined
  const isNew = !existing
  const index = existing
    ? game.rounds.findIndex((r) => r.id === roundId)
    : game.rounds.length

  const [round, setRound] = useState<Round>(
    () => existing ?? { id: uid(), a: emptyEntry(), b: emptyEntry() },
  )

  const submit = () => {
    buzz(20)
    dispatch(isNew ? { type: 'add-round', round } : { type: 'update-round', round })
    onDone(round, isNew)
  }

  const remove = () => {
    if (!existing) return
    if (!confirm(`Delete round ${index + 1}? Later rounds move up.`)) return
    dispatch({ type: 'delete-round', id: existing.id })
    onCancel()
  }

  return (
    <div className="screen">
      <header className="topbar">
        <button className="iconbtn" onClick={onCancel} aria-label="Back">
          ‹
        </button>
        <span className="topbar__title">
          {isNew ? `Round ${index + 1}` : `Edit round ${index + 1}`}
        </span>
        <span className="spacer" />
        {existing && (
          <button
            className="iconbtn iconbtn--danger"
            onClick={remove}
            aria-label="Delete round"
          >
            ✕
          </button>
        )}
      </header>

      {HAS_PLACEHOLDERS && (
        <p className="note note--warn">
          <span className="dot" /> marks a placeholder point value — edit{' '}
          <code>src/scoring.ts</code> once you have the real number.
        </p>
      )}

      <RoundGrid
        teams={game.teams}
        entries={{ a: round.a, b: round.b }}
        onChange={(team: TeamId, next) => setRound((r) => ({ ...r, [team]: next }))}
      />

      {/* Sits in the flow rather than sticking to the bottom: a sticky bar has
          to paint an opaque backdrop to hide the rows scrolling under it, and
          that backdrop blocks the aurora, reading as a dark slab behind the
          button. Sequential entry ends on the last field anyway, right here. */}
      <div className="screen__foot">
        <button className="btn btn--primary" onClick={submit}>
          {isNew ? 'Submit Round' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
