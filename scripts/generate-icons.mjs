/**
 * Generates the PWA icons into public/ with no image dependencies.
 *
 * The artwork is drawn with signed-distance fields (rounded rects, rotated)
 * and supersampled 3×3, which gives clean antialiasing and lets the neon
 * glow fall off smoothly. PNG encoding uses node's built-in zlib.
 *
 *   npm run icons
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

/* ── tiny PNG encoder ──────────────────────────────────────────────── */

const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = -1
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePNG(width, height, rgba) {
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // filter type: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* ── drawing ───────────────────────────────────────────────────────── */

/** Signed distance to a rotated rounded rectangle. Negative = inside. */
function sdRoundRect(px, py, cx, cy, w, h, r, angle) {
  const c = Math.cos(-angle)
  const s = Math.sin(-angle)
  const dx = px - cx
  const dy = py - cy
  const x = dx * c - dy * s
  const y = dx * s + dy * c
  const qx = Math.abs(x) - (w / 2 - r)
  const qy = Math.abs(y) - (h / 2 - r)
  return (
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r
  )
}

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

const CYAN = [0x22, 0xd3, 0xee]
const MAGENTA = [0xe8, 0x79, 0xf9]

/**
 * @param size    output pixel size
 * @param inset   0..1 fraction of the canvas kept clear around the artwork
 *                (maskable icons need a generous safe zone)
 */
function drawIcon(size, inset) {
  const SS = 3
  const px = Buffer.alloc(size * size * 4)
  const S = size

  // Artwork lives inside this square, centred.
  const art = S * (1 - inset * 2)
  const off = S * inset

  const cards = [
    { dx: -0.11, dy: 0.03, angle: -0.19, color: CYAN },
    { dx: 0.11, dy: -0.03, angle: 0.19, color: MAGENTA },
  ]

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      let r = 0
      let g = 0
      let b = 0

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const fx = x + (sx + 0.5) / SS
          const fy = y + (sy + 0.5) / SS

          // Background: near-black with a soft cyan/magenta wash.
          const nx = (fx / S - 0.5) * 2
          const ny = (fy / S - 0.5) * 2
          const rad = Math.hypot(nx, ny)
          const wash = Math.max(0, 1 - rad * 0.85)
          let cr = 6 + wash * 14
          let cg = 6 + wash * 20
          let cb = 11 + wash * 34

          for (const card of cards) {
            const cx = off + art * (0.5 + card.dx)
            const cy = off + art * (0.5 + card.dy)
            const d = sdRoundRect(
              fx,
              fy,
              cx,
              cy,
              art * 0.4,
              art * 0.56,
              art * 0.075,
              card.angle,
            )

            // Outer glow.
            const glow = Math.exp(-Math.max(d, 0) / (art * 0.075)) * 0.75
            cr += card.color[0] * glow
            cg += card.color[1] * glow
            cb += card.color[2] * glow

            // Card face: dark, with a bright rim.
            const fill = 1 - smoothstep(-1, 1, d)
            const rim = 1 - smoothstep(art * 0.028, art * 0.05, Math.abs(d))
            cr = cr * (1 - fill) + (14 + card.color[0] * 0.1) * fill
            cg = cg * (1 - fill) + (14 + card.color[1] * 0.1) * fill
            cb = cb * (1 - fill) + (20 + card.color[2] * 0.1) * fill
            cr = cr * (1 - rim) + card.color[0] * rim
            cg = cg * (1 - rim) + card.color[1] * rim
            cb = cb * (1 - rim) + card.color[2] * rim
          }

          r += Math.min(255, cr)
          g += Math.min(255, cg)
          b += Math.min(255, cb)
        }
      }

      const n = SS * SS
      const i = (y * S + x) * 4
      px[i] = Math.round(r / n)
      px[i + 1] = Math.round(g / n)
      px[i + 2] = Math.round(b / n)
      px[i + 3] = 255
    }
  }

  return encodePNG(S, S, px)
}

mkdirSync(OUT, { recursive: true })

const targets = [
  ['icon-192.png', 192, 0.1],
  ['icon-512.png', 512, 0.1],
  ['icon-maskable-512.png', 512, 0.22],
  ['apple-touch-icon.png', 180, 0.1],
]

for (const [name, size, inset] of targets) {
  writeFileSync(join(OUT, name), drawIcon(size, inset))
  console.log(`  ${name}  ${size}×${size}`)
}
console.log('icons written to public/')
