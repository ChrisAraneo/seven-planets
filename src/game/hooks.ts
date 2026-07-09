/* =====================================================================
   SEVEN PLANETS — presentation hooks.

   The core rules signal the moments a presentation layer may want to
   animate or pace (rocket flights, explosions, floating text, delays)
   through this bridge. The defaults are no-ops, so headless runs
   (simulation, tuning, tests) execute at full speed with zero UI
   dependency; the app installs real implementations from src/effects
   at startup. The game directory itself contains no graphics code.
   ===================================================================== */

import type { Planet } from './types';

export interface PresentationHooks {
  /** Pause the engine loop for pacing. Implementations may scale or skip. */
  sleep(ms: number): Promise<void>;
  /** A rocket flies between two planets; resolves when it lands. */
  rocket(from: Planet, to: Planet, color: string): Promise<void>;
  /** An explosion on a planet. */
  boom(planet: Planet): void;
  /** A short floating text over a planet. */
  floatText(planet: Planet, txt: string, color: string): void;
}

const NO_PRESENTATION: PresentationHooks = {
  sleep: () => Promise.resolve(),
  rocket: () => Promise.resolve(),
  boom: () => {},
  floatText: () => {},
};

let hooks: PresentationHooks = NO_PRESENTATION;

/** Install a presentation layer (called once by the app; never by the engine). */
export function setPresentationHooks(h: PresentationHooks): void {
  hooks = h;
}

/* Thin call-through helpers so engine call sites stay terse. */

export function sleep(ms: number): Promise<void> {
  return hooks.sleep(ms);
}

export function animateRocket(
  from: Planet,
  to: Planet,
  color: string,
): Promise<void> {
  return hooks.rocket(from, to, color);
}

export function boom(planet: Planet): void {
  hooks.boom(planet);
}

export function floatText(planet: Planet, txt: string, color: string): void {
  hooks.floatText(planet, txt, color);
}
