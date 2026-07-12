import type { Planet } from './planet';

export interface PresentationHooks {
  /** Pause the engine loop for pacing. Implementations may scale or skip. */
  sleep(milliseconds: number): Promise<void>;
  /** A rocket flies between two planets; resolves when it lands. */
  rocket(from: Planet, to: Planet, color: string): Promise<void>;
  /** An explosion on a planet. */
  boom(planet: Planet): void;
  /** A short floating text over a planet. */
  floatText(planet: Planet, txt: string, color: string): void;
}
