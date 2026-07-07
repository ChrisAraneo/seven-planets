import type { Player } from '@/game/types';
import { getState } from '../state';
import { isPacifist } from './is-pacifist';
import { persOf } from './pers-of';

// Desired garrison per planet.
export function troopTarget(p: Player): number {
  const pers = persOf(p);
  const base = 2 + Math.min(8, Math.floor(getState().turn / 3));
  // ── aggressive: army is for attacking ──
  if (pers === 'militarist') {
    return base + 4;
  }
  if (pers === 'aggressor' || pers === 'expansionist') {
    return base + 2;
  }
  // ── defensive: army is for holding the line ──
  if (pers === 'fortifier') {
    return base + 3;
  } // The dedicated turtle
  if (pers === 'pacifist' || isPacifist(p)) {
    return base + 3;
  } // Never attacks — pure defense
  if (
    pers === 'hoarder' ||
    pers === 'economist' ||
    pers === 'builder' ||
    pers === 'trader' ||
    pers === 'balanced'
  ) {
    return base + 2;
  } // Economic turtles: enough garrison to not be easy prey
  if (pers === 'rusher') {
    return base + 1;
  } // Leaner, but still keeps defenders
  return base;
}
