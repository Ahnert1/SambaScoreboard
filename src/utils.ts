import type { CSSProperties } from 'react'

export const fmt = (n: number) => Math.round(n).toLocaleString('en-US')

export const signed = (n: number) => (n >= 0 ? `+${fmt(n)}` : `−${fmt(Math.abs(n))}`)

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

/** Short haptic tick so counter taps feel physical. No-op where unsupported. */
export const buzz = (ms = 8) => {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* ignore */
  }
}

export const cx = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(' ')

export const dateLabel = (t: number) =>
  new Date(t).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

export const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n))

/** Scopes the `--team` CSS custom property so a subtree paints in team colour. */
export const teamVar = (hex: string): CSSProperties =>
  ({ '--team': hex }) as CSSProperties
