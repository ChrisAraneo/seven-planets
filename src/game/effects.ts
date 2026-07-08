/* =====================================================================
   SEVEN PLANETS — presentation effects bridge.
   The engine enqueues canvas animations via these helpers; the GameBoard
   component drains the queue in its render loop. Also owns pacing
   (sleep / speed). All mutable state lives in the Pinia effects store.
   ===================================================================== */

import { getEffectsStore } from '@/stores/effects';

import type { Planet } from './types';

export interface Anim {
  type: 'rocket' | 'boom' | 'text';
  t0: number;
  dur: number;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
  tx?: number;
  ty?: number;
  color?: string;
  txt?: string;
}

/** Headless simulations skip all delays and animations. */
export function setSimMode(v: boolean): void {
  getEffectsStore().simMode = v;
}

// Animation speed multiplier. Headless simulation runs at 0 (no delays).
export function speedMult(): number {
  const fx = getEffectsStore();
  return fx.simMode ? 0 : fx.fastMode ? 0.3 : 1;
}

export function sleep(ms: number): Promise<void> {
  if (speedMult() === 0) {
    return Promise.resolve();
  }
  return new Promise((r) => setTimeout(r, ms * speedMult()));
}

function now(): number {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}

export function animateRocket(
  from: Planet,
  to: Planet,
  color: string,
): Promise<void> {
  const fx = getEffectsStore();
  if (fx.simMode) {
    return Promise.resolve();
  }
  const dur = Math.max(50, 1000 * speedMult());
  fx.anims.push({
    type: 'rocket',
    fx: from.x,
    fy: from.y,
    tx: to.x,
    ty: to.y,
    color,
    t0: now(),
    dur,
  });
  return new Promise((r) => setTimeout(r, dur + 60));
}

export function boom(planet: Planet): void {
  const fx = getEffectsStore();
  if (fx.simMode) {
    return;
  }
  fx.anims.push({
    type: 'boom',
    x: planet.x,
    y: planet.y,
    t0: now(),
    dur: Math.max(200, 600 * speedMult()),
  });
}

export function floatText(planet: Planet, txt: string, color: string): void {
  const fx = getEffectsStore();
  if (fx.simMode) {
    return;
  }
  fx.anims.push({
    type: 'text',
    x: planet.x,
    y: planet.y - planet.r,
    txt,
    color,
    t0: now(),
    dur: Math.max(400, 1500 * speedMult()),
  });
}
