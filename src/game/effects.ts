/* =====================================================================
   SEVEN PLANETS — presentation effects bridge.
   The engine enqueues canvas animations here; the GameBoard component
   drains the queue in its render loop. Also owns pacing (sleep / speed).
   ===================================================================== */

import type { Planet } from './types'

export interface Anim {
  type: 'rocket' | 'boom' | 'text'
  t0: number
  dur: number
  x?: number
  y?: number
  fx?: number
  fy?: number
  tx?: number
  ty?: number
  color?: string
  txt?: string
}

/** Live animation queue, drained by the GameBoard render loop. */
export const anims: Anim[] = []

let fastMode = false
let simMode = false // headless simulations skip all delays and animations

export function setFastMode(v: boolean): void {
  fastMode = v
}
export function getFastMode(): boolean {
  return fastMode
}
export function setSimMode(v: boolean): void {
  simMode = v
}

// Animation speed multiplier. Headless simulation runs at 0 (no delays).
export function speedMult(): number {
  return simMode ? 0 : fastMode ? 0.3 : 1
}

export function sleep(ms: number): Promise<void> {
  if (simMode || speedMult() === 0) return Promise.resolve()
  return new Promise((r) => setTimeout(r, ms * speedMult()))
}

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

export function animateRocket(from: Planet, to: Planet, color: string): Promise<void> {
  if (simMode) return Promise.resolve()
  const dur = Math.max(50, 1000 * speedMult())
  anims.push({ type: 'rocket', fx: from.x, fy: from.y, tx: to.x, ty: to.y, color, t0: now(), dur })
  return new Promise((r) => setTimeout(r, dur + 60))
}

export function boom(planet: Planet): void {
  if (simMode) return
  anims.push({ type: 'boom', x: planet.x, y: planet.y, t0: now(), dur: Math.max(200, 600 * speedMult()) })
}

export function floatText(planet: Planet, txt: string, color: string): void {
  if (simMode) return
  anims.push({ type: 'text', x: planet.x, y: planet.y - planet.r, txt, color, t0: now(), dur: Math.max(400, 1500 * speedMult()) })
}
