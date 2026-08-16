import { useState } from 'react'
import { motion } from 'framer-motion'
import { RollingNumber } from '../components/RollingNumber'
import { Sheet } from '../components/Sheet'
import { ROUNDS_PER_GAME, scoreEntry } from '../scoring'
import { teamTotal, useStore } from '../store'
import { colorHex, type Game, type TeamId } from '../types'
import { cx, fmt, teamVar } from '../utils'

export function Scoreboard({
  game,
  onEnterRound,
  onEditRound,
  onHistory,
  onNewGame,
  onFinished,
}: {
  game: Game
  onEnterRound: () => void
  onEditRound: (roundId: string) => void
  onHistory: () => void
  onNewGame: () => void
  onFinished: () => void
}) {
  const { dispatch } = useStore()
  const [menu, setMenu] = useState(false)

  const totals: Record<TeamId, number> = {
    a: teamTotal(game, 'a'),
    b: teamTotal(game, 'b'),
  }
  const leader: TeamId | null =
    totals.a === totals.b ? null : totals.a > totals.b ? 'a' : 'b'

  const played = game.rounds.length
  const slots = Math.max(ROUNDS_PER_GAME, played)
  const complete = played >= ROUNDS_PER_GAME

  return (
    <div className="screen">
      <header className="topbar">
        <span className="topbar__title">
          {played === 0
            ? 'Ready'
            : complete
              ? `${played} rounds played`
              : `Round ${played + 1} of ${ROUNDS_PER_GAME}`}
        </span>
        <span className="spacer" />
        <button className="iconbtn" onClick={onHistory} aria-label="History">
          ☰
        </button>
        <button className="iconbtn" onClick={() => setMenu(true)} aria-label="Game menu">
          ⋯
        </button>
      </header>

      <div className="totals">
        {(['a', 'b'] as TeamId[]).map((id) => (
          <div
            key={id}
            className={cx('total', leader === id && 'total--lead')}
            style={teamVar(colorHex(game.teams[id].color))}
          >
            <div className="total__name">{game.teams[id].name}</div>
            <div className="total__value">
              <RollingNumber value={totals[id]} />
            </div>
          </div>
        ))}
      </div>

      {leader && played > 0 && (
        <motion.p
          className="lead"
          key={`${leader}-${totals[leader] - totals[leader === 'a' ? 'b' : 'a']}`}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={teamVar(colorHex(game.teams[leader].color))}
        >
          {game.teams[leader].name} up by{' '}
          {fmt(Math.abs(totals.a - totals.b))}
        </motion.p>
      )}
      {!leader && played > 0 && <p className="lead lead--tied">Dead even</p>}

      <div className="rounds">
        {Array.from({ length: slots }, (_, i) => {
          const round = game.rounds[i]
          // Rounds fill in order, so every empty slot leads to the same place:
          // entering the next unplayed round.
          const isNext = !round && i === played
          return (
            <button
              key={round?.id ?? `empty-${i}`}
              className={cx(
                'rounds__row',
                !round && 'rounds__row--empty',
                isNext && 'rounds__row--next',
              )}
              onClick={round ? () => onEditRound(round.id) : onEnterRound}
              aria-label={
                round ? `Edit round ${i + 1}` : `Enter round ${played + 1}`
              }
            >
              <span className="rounds__label">R{i + 1}</span>
              {isNext ? (
                <span className="rounds__hint">Tap to enter</span>
              ) : (
                (['a', 'b'] as TeamId[]).map((id) => (
                  <span
                    key={id}
                    className={cx('rounds__cell', !round && 'rounds__cell--blank')}
                    style={teamVar(colorHex(game.teams[id].color))}
                  >
                    {round ? fmt(scoreEntry(round[id])) : '—'}
                  </span>
                ))
              )}
            </button>
          )
        })}

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

      <p className="note">Tap any round to enter or edit its scores.</p>

      <div className="screen__foot">
        <button className="btn btn--primary" onClick={onEnterRound}>
          {complete ? `Add Round ${played + 1}` : `Enter Round ${played + 1}`}
        </button>
        {played > 0 && (
          <button
            className="btn btn--ghost"
            onClick={() => {
              dispatch({ type: 'finish-game' })
              onFinished()
            }}
          >
            Finish &amp; Save Game
          </button>
        )}
      </div>

      <Sheet open={menu} onClose={() => setMenu(false)} title="Game">
        <button
          className="sheet__item"
          onClick={() => {
            setMenu(false)
            onNewGame()
          }}
        >
          New game…
        </button>
        <button
          className="sheet__item"
          onClick={() => {
            setMenu(false)
            onHistory()
          }}
        >
          History
        </button>
        <button
          className="sheet__item sheet__item--danger"
          onClick={() => {
            if (!confirm('Discard this game without saving it to History?')) return
            dispatch({ type: 'discard-game' })
            setMenu(false)
            onFinished()
          }}
        >
          Discard this game
        </button>
      </Sheet>
    </div>
  )
}
