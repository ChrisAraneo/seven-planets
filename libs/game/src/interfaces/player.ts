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
  lastAttackTurn: number;
  hasPacifistStatus: boolean;
  hasForfeitedPacifism: boolean;
  isKamikaze: boolean;
}
