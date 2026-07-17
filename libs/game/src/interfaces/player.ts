import type { Hand } from './hand';

export interface Player {
  id: number;
  name: string;
  color: string;
  isHuman: boolean;
  hand: Hand;
  influence: number;
  skipTurns: number;
  isSkippedNow: boolean;
  isAlive: boolean;
  hasTradedCurrentTurn: boolean;
  /** Turn on which this player last launched an attack (0 = never). */
  lastAttackTurn: number;
  /** True while the player holds PACIFIST status (earned after PACIFIST_TURNS with
      no attack): +defense and +⭐ per planet. Attacking breaks the vow — it clears
      this flag and sets hasForfeitedPacifism, so the bonus is lost for good. */
  hasPacifistStatus: boolean;
  /** Once true, the player broke a pacifist vow by attacking and can NEVER become
      a pacifist again (updatePacifistStatus will not re-promote them). */
  hasForfeitedPacifism: boolean;
  /**
   * KAMIKAZE (Hard mode): an AI whose ONLY conquest target is the human player.
   * Every other AI ignores a kamikaze entirely — never attacking or couping it —
   * and a kamikaze attacks far more aggressively and recklessly. Always false
   * outside Hard.
   */
  isKamikaze: boolean;
}
