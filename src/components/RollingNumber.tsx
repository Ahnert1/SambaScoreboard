import { motion } from 'framer-motion'
import { cx, fmt } from '../utils'

/**
 * Odometer-style number. Each digit is a 10-cell column that slides to the
 * right row, so a score change physically rolls instead of snapping.
 */
export function RollingNumber({
  value,
  className,
  signed = false,
}: {
  value: number
  className?: string
  signed?: boolean
}) {
  const body = fmt(Math.abs(value))
  const prefix = signed ? (value < 0 ? '−' : '+') : value < 0 ? '−' : ''
  const text = prefix + body
  const chars = text.split('')

  return (
    <span className={cx('roll', className)} role="text" aria-label={text}>
      {chars.map((ch, i) =>
        /\d/.test(ch) ? (
          // Key includes the length so a digit-count change remounts cleanly
          // rather than animating a digit into a different place value.
          <Digit key={`${chars.length}:${i}`} digit={Number(ch)} />
        ) : (
          <span key={`${chars.length}:${i}`} className="roll__sep">
            {ch}
          </span>
        ),
      )}
    </span>
  )
}

const CELLS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

function Digit({ digit }: { digit: number }) {
  return (
    <span className="roll__d">
      <motion.span
        className="roll__col"
        // The column is 10 cells tall, so one cell === 10% of its own height.
        animate={{ y: `${-digit * 10}%` }}
        initial={false}
        transition={{ type: 'spring', stiffness: 220, damping: 26, mass: 0.7 }}
      >
        {CELLS.map((d) => (
          <span key={d} className="roll__c">
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  )
}
