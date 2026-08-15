import { useState, type ReactElement } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './store'
import { Setup } from './screens/Setup'
import { Scoreboard } from './screens/Scoreboard'
import { RoundEntry } from './screens/RoundEntry'
import { Reveal } from './screens/Reveal'
import { History } from './screens/History'
import { GameDetail } from './screens/GameDetail'

type View =
  | { name: 'setup' }
  | { name: 'board' }
  | { name: 'round'; roundId?: string }
  | { name: 'reveal'; roundId: string }
  | { name: 'history' }
  | { name: 'game'; id: string }

const fade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] as const },
}

export default function App() {
  const { state } = useStore()
  const [view, setView] = useState<View>(() =>
    state.current ? { name: 'board' } : { name: 'setup' },
  )

  const game = state.current

  // If the current game disappears (finished/discarded) while a game-scoped
  // screen is open, fall back to somewhere that still exists.
  const resolved: View =
    !game && (view.name === 'board' || view.name === 'round' || view.name === 'reveal')
      ? state.history.length > 0
        ? { name: 'history' }
        : { name: 'setup' }
      : view

  let screen: ReactElement

  switch (resolved.name) {
    case 'setup':
      screen = (
        <Setup
          hasHistory={state.history.length > 0}
          onStart={() => setView({ name: 'board' })}
          onHistory={() => setView({ name: 'history' })}
          onCancel={game ? () => setView({ name: 'board' }) : undefined}
        />
      )
      break

    case 'board':
      screen = (
        <Scoreboard
          game={game!}
          onEnterRound={() => setView({ name: 'round' })}
          onEditRound={(roundId) => setView({ name: 'round', roundId })}
          onHistory={() => setView({ name: 'history' })}
          onNewGame={() => setView({ name: 'setup' })}
          onFinished={() => setView({ name: 'history' })}
        />
      )
      break

    case 'round':
      screen = (
        <RoundEntry
          game={game!}
          roundId={resolved.roundId}
          onCancel={() => setView({ name: 'board' })}
          onDone={(round, isNew) =>
            setView(isNew ? { name: 'reveal', roundId: round.id } : { name: 'board' })
          }
        />
      )
      break

    case 'reveal': {
      const round = game!.rounds.find((r) => r.id === resolved.roundId)
      screen = round ? (
        <Reveal game={game!} round={round} onDone={() => setView({ name: 'board' })} />
      ) : (
        <Scoreboard
          game={game!}
          onEnterRound={() => setView({ name: 'round' })}
          onEditRound={(roundId) => setView({ name: 'round', roundId })}
          onHistory={() => setView({ name: 'history' })}
          onNewGame={() => setView({ name: 'setup' })}
          onFinished={() => setView({ name: 'history' })}
        />
      )
      break
    }

    case 'history':
      screen = (
        <History
          onBack={() => setView(game ? { name: 'board' } : { name: 'setup' })}
          onOpen={(id) => setView({ name: 'game', id })}
        />
      )
      break

    case 'game': {
      const found = state.history.find((g) => g.id === resolved.id)
      screen = found ? (
        <GameDetail game={found} onBack={() => setView({ name: 'history' })} />
      ) : (
        <History
          onBack={() => setView(game ? { name: 'board' } : { name: 'setup' })}
          onOpen={(id) => setView({ name: 'game', id })}
        />
      )
      break
    }
  }

  return (
    <div className="app">
      <div className="aurora" aria-hidden />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={resolved.name} className="app__view" {...fade}>
          {screen}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
