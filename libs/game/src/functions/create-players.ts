import type { Player } from '../interfaces/player';
import type { SeatDefinition } from './create-initial-game-state';
import { createStartingHand } from './create-starting-hand';

export const createPlayers = (seatDefinitions: SeatDefinition[]): Player[] =>
  seatDefinitions.map((definition, index) => ({
    id: index,
    name: definition.name,
    color: definition.color,
    isHuman: definition.isHuman,
    hand: createStartingHand(),
    influence: 0,
    skipTurns: 0,
    isSkippedNow: false,
    isAlive: true,
    hasTradedCurrentTurn: false,
    lastAttackTurn: 0,
    hasPacifistStatus: false,
    hasForfeitedPacifism: false,
    isKamikaze: false,
  }));
