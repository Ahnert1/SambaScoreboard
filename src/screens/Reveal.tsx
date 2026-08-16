import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Burst } from '../components/Burst'
import { RollingNumber } from '../components/RollingNumber'
import { scoreEntry } from '../scoring'
import { totalsBefore } from '../store'
import { colorHex, type Game, type Round, type TeamId } from '../types'
import { signed, teamVar } from '../utils'

/** A round this big (or a Team Out) earns particles. */
const BURST_AT = 2000

export function Reveal({
  game,
  round,
  onDone,
}: {
  game: Game
  round: Round
  onDone: () => void
}) {
  // "Before" is derived from the stored game rather than captured at submit
  // time, so editing an old round replays correctly too.
  const before = totalsBefore(game, round.id)
  const deltas: Record<TeamId, number> = { a: scoreEntry(round.a), b: scoreEntry(round.b) }
  const after: Record<TeamId, number> = {
    a: before.a + deltas.a,
    b: before.b + deltas.b,
  }

  // Start on the old totals, then roll up to the new ones a beat later.
  const [shown, setShown] = useState(before)

  // No auto-dismiss: the screen waits for a tap, so nobody misses the moment.
  useEffect(() => {
    const roll = setTimeout(() => setShown(after), 550)
    return () => clearTimeout(roll)
    // Deliberately runs once: this screen animates one specific round.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className="screen reveal"
      onClick={onDone}
      onKeyDown={(e) => {
        // Dismissing is now the only way forward, so give the keyboard a route.
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onDone()
        }
      }}
      role="button"
      tabIndex={0}
    >
      <motion.p
        className="reveal__kicker"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Round {game.rounds.findIndex((r) => r.id === round.id) + 1}
      </motion.p>

      <div className="reveal__teams">
        {(['a', 'b'] as TeamId[]).map((id, i) => {
          const hex = colorHex(game.teams[id].color)
          const big = deltas[id] >= BURST_AT || round[id].teamOut
          return (
            <motion.div
              key={id}
              className="reveal__team"
              style={teamVar(hex)}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 260, damping: 22 }}
            >
              <div className="reveal__name">{game.teams[id].name}</div>

              <motion.div
                className="reveal__delta"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.1 }}
              >
                {signed(deltas[id])}
              </motion.div>

              <div className="reveal__total">
                <RollingNumber value={shown[id]} />
              </div>

              {round[id].teamOut && (
                <motion.div
                  className="reveal__badge"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.55 + i * 0.1, type: 'spring', stiffness: 400, damping: 14 }}
                >
                  OUT
                </motion.div>
              )}

              {big && <Burst color={hex} />}
            </motion.div>
          )
        })}
      </div>

      {/* Fades in once the numbers have finished rolling — by then it's the
          only thing left to do, so it should be the only thing moving. */}
      <motion.p
        className="reveal__hint"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3, duration: 0.5 }}
      >
        tap to continue
      </motion.p>
    </div>
  )
}
