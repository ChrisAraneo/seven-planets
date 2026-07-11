import { NO_PRESENTATION, type PresentationHooks } from '@seven-planets/game';
import type { Planet } from '@seven-planets/game';

/* =====================================================================
   SEVEN PLANETS — graphical effects (canvas animations + pacing).

   Implements the game core's presentation hooks: the engine signals
   rockets / explosions / floating text and pacing pauses, and this
   layer hands canvas animations to the sink the app injected (the
   browser's effects store, drained by the GameBoard render loop) and
   scales delays by the fast-animations toggle. Headless runs never
   install this layer, so they pay no delays and queue no animations.
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

/** What the app must provide: somewhere to queue animations and the
    fast-animations toggle. This lib knows nothing about any store. */
export interface EffectsSink {
  enqueue(anim: Anim): void;
  isFastMode(): boolean;
}

let sink: EffectsSink | null = null;
let installedHooks: PresentationHooks = NO_PRESENTATION;

// Animation speed multiplier (the fast-animations toggle).
function speedMult(): number {
  return sink?.isFastMode() ? 0.3 : 1;
}

function now(): number {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}

function enqueue(anim: Anim): void {
  sink?.enqueue(anim);
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
    Called once at app startup (main.ts) with the app's animation sink. */
export function installEffects(effectsSink: EffectsSink): void {
  sink = effectsSink;
  installedHooks = { sleep, rocket, boom, floatText };
}

/** Returns the installed presentation hooks. Returns NO_PRESENTATION before
    installEffects is called (headless / test environments). */
export function getEffectsHooks(): PresentationHooks {
  return installedHooks;
}
