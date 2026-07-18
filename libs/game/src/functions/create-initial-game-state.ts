import type { GameState } from '../interfaces/game-state';
import { chain } from '../utils/chain';
import { createPlanets } from './create-planets';
import { createPlayers } from './create-players';
import { createSeatDefinitions } from './create-seat-definitions';

export interface SeatDefinition {
  name: string;
  planet: string;
  color: string;
  isHuman: boolean;
  styleIdx: number;
}

export const createInitialGameState = (): GameState =>
  chain(createSeatDefinitions())
    .thru(
      (gameDefs): GameState => ({
        turn: 0,
        phase: 'SETUP',
        cursor: { phase: 'SETUP' },
        over: null,
        pool: [],
        activeId: -1,
        draftPlanetId: -1,
        isSingularityAnnounced: false,
        startIndex: 0,
        players: createPlayers(gameDefs),
        planets: createPlanets(gameDefs),
        log: [],
        effects: [],
        effectSeq: 0,
        status: '—',
        isAwaitingPick: false,
        isAwaitingAction: false,
        inputSeq: 0,
        pendingOffer: null,
      }),
    )
    .value();
