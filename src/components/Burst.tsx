import { motion } from 'framer-motion'

/**
 * Cheap particle burst for the reveal screen — no library, no canvas.
 * Angles/distances are derived from the index so it's deterministic
 * (Math.random in render would re-roll on every re-render).
 */
export function Burst({ color, count = 26 }: { color: string; count?: number }) {
  return (
    <div className="burst" aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + (i % 3) * 0.22
        const distance = 70 + ((i * 37) % 80)
        return (
          <motion.span
            key={i}
            className="burst__p"
            style={{ background: color }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              opacity: 0,
              scale: 0.2,
            }}
            transition={{ duration: 0.85 + (i % 5) * 0.09, ease: 'easeOut' }}
          />
        )
      })}
    </div>
  )
}
