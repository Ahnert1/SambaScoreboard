import { useState } from 'react'
import { motion } from 'framer-motion'
import { COLORS, colorHex, type ColorKey, type Team, type TeamId } from '../types'
import { useStore } from '../store'
import { buzz, cx, teamVar } from '../utils'

const DEFAULTS: Record<TeamId, Team> = {
  a: { name: 'Us', color: 'cyan' },
  b: { name: 'Them', color: 'magenta' },
}

export function Setup({
  onStart,
  onHistory,
  onCancel,
  hasHistory,
}: {
  onStart: () => void
  onHistory: () => void
  /** Present only when there's a game to go back to. */
  onCancel?: () => void
  hasHistory: boolean
}) {
  const { state, dispatch } = useStore()
  const [teams, setTeams] = useState<Record<TeamId, Team>>(() =>
    state.current ? state.current.teams : DEFAULTS,
  )

  const set = (id: TeamId, patch: Partial<Team>) =>
    setTeams((t) => ({ ...t, [id]: { ...t[id], ...patch } }))

  const start = () => {
    const cleaned: Record<TeamId, Team> = {
      a: { ...teams.a, name: teams.a.name.trim() || 'Team 1' },
      b: { ...teams.b, name: teams.b.name.trim() || 'Team 2' },
    }
    buzz(18)
    dispatch({ type: 'new-game', teams: cleaned })
    onStart()
  }

  return (
    <div className="screen">
      {onCancel && (
        <header className="topbar">
          <button className="iconbtn" onClick={onCancel} aria-label="Back to current game">
            ‹
          </button>
          <span className="topbar__title">New game</span>
          <span className="spacer" />
        </header>
      )}

      <header className="hero">
        <motion.h1
          className="hero__title"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          SAMBA
        </motion.h1>
        <motion.p
          className="hero__sub"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          Scoreboard
        </motion.p>
      </header>

      <div className="setup">
        {(['a', 'b'] as TeamId[]).map((id, i) => (
          <motion.div
            key={id}
            className="setup__team"
            style={teamVar(colorHex(teams[id].color))}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08, type: 'spring', stiffness: 260, damping: 26 }}
          >
            <label className="setup__label">Team {i + 1}</label>
            <input
              className="setup__input"
              value={teams[id].name}
              maxLength={16}
              placeholder={i === 0 ? 'Us' : 'Them'}
              onChange={(e) => set(id, { name: e.target.value })}
              onFocus={(e) => e.currentTarget.select()}
              aria-label={`Name for team ${i + 1}`}
            />
            <div className="swatches">
              {COLORS.map((c) => (
                <button
                  key={c.key}
                  className={cx('swatch', teams[id].color === c.key && 'swatch--on')}
                  style={{ background: c.hex }}
                  onClick={() => {
                    buzz()
                    set(id, { color: c.key as ColorKey })
                  }}
                  aria-label={`${c.key} for ${teams[id].name || `team ${i + 1}`}`}
                  aria-pressed={teams[id].color === c.key}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="screen__foot">
        {state.current && state.current.rounds.length > 0 && (
          <p className="note note--warn">
            Starting a new game files the current one ({state.current.rounds.length}{' '}
            {state.current.rounds.length === 1 ? 'round' : 'rounds'}) into History.
          </p>
        )}
        <button className="btn btn--primary" onClick={start}>
          Start Game
        </button>
        {hasHistory && (
          <button className="btn btn--ghost" onClick={onHistory}>
            History
          </button>
        )}
      </div>
    </div>
  )
}
