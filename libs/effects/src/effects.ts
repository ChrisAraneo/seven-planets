import type { EffectsModuleState } from './effects-module';
import { setPresentationHooks } from '@seven-planets/game';
import type { Planet } from '@seven-planets/game';
import { getStore } from '@seven-planets/game';

/* =====================================================================
   SEVEN PLANETS — graphical effects (canvas animations + pacing).

   Implements the game core's presentation hooks: the engine signals
   rockets / explosions / floating text and pacing pauses, and this
   layer enqueues canvas animations into the store's effects module
   (drained by the GameBoard render loop) and scales delays by the
   fast-animations toggle. Headless runs never install this layer, so
   they pay no delays and queue no animations.
   ===================================================================== */

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

// Animation speed multiplier (the fast-animations toggle).
function speedMult(): number {
  return (getStore().state as unknown as { effects: EffectsModuleState }).effects.fastMode ? 0.3 : 1;
}

function now(): number {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}

function enqueue(anim: Anim): void {
  getStore().commit('effects/enqueue', anim);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms * speedMult()));
}

function rocket(from: Planet, to: Planet, color: string): Promise<void> {
  const dur = Math.max(50, 1000 * speedMult());
  enqueue({
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

function boom(planet: Planet): void {
  enqueue({
    type: 'boom',
    x: planet.x,
    y: planet.y,
    t0: now(),
    dur: Math.max(200, 600 * speedMult()),
  });
}

function floatText(planet: Planet, txt: string, color: string): void {
  enqueue({
    type: 'text',
    x: planet.x,
    y: planet.y - planet.r,
    txt,
    color,
    t0: now(),
    dur: Math.max(400, 1500 * speedMult()),
  });
}

/** Install the graphical effects as the game core's presentation layer.
    Called once at app startup (main.ts). */
export function installEffects(): void {
  setPresentationHooks({ sleep, rocket, boom, floatText });
}
