import { fromPairs } from 'lodash-es';

import {
  AI_COLORS,
  AI_NAMES,
  AI_PLANET_NAMES,
  CARD_TYPES,
  INFLUENCE_TYPES,
  PLANET_STYLES,
  shuffleArray,
} from '../config/constants';
import type { GameState } from '../interfaces/game-state';
import type { Hand } from '../interfaces/hand';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';
import { chain } from '../utils/chain';

// Six AI rivals join the single human seat.
const AI_SEATS = 6;

interface SeatDefinition {
  name: string;
  planet: string;
  color: string;
  isHuman: boolean;
  styleIdx: number;
}

// Held influence cards (played later) start at 0 alongside resources/actions.
function createStartingHand(): Hand {
  return fromPairs(
    [...CARD_TYPES, ...INFLUENCE_TYPES].map((cardType) => [cardType, 0]),
  );
}

export function createInitialGameState(): GameState {
  return chain(createSeatDefinitions())
    .thru(
      (gameDefs): GameState => ({
        turn: 0,
        phase: 'setup',
        cursor: { phase: 'setup' },
        maxTurns: 400,
        over: null,
        pool: [],
        activeId: -1,
        // The planet whose draft turn it is (buildings land here)
        draftPlanetId: -1,
        isSingularityAnnounced: false,
        startIdx: 0,
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
}

// Name, homeworld, color and planet style are all randomized,
// So no AI is a fixed character.
function createSeatDefinitions(): SeatDefinition[] {
  return chain({
    names: shuffleArray(AI_NAMES).slice(0, AI_SEATS),
    planetNames: shuffleArray(AI_PLANET_NAMES).slice(0, AI_SEATS),
    colors: shuffleArray(AI_COLORS).slice(0, AI_SEATS),
    // The human owns planet style 0 (Terra Prime); AI draw distinct styles from the rest.
    styles: shuffleArray(
      PLANET_STYLES.map((_, index) => index).filter((index) => index !== 0),
    ).slice(0, AI_SEATS),
  })
    .thru(({ names, planetNames, colors, styles }): SeatDefinition[] => [
      {
        name: 'You',
        planet: 'Terra Prime',
        color: '#3df0ff',
        isHuman: true,
        styleIdx: 0,
      },
      ...names.map((name: string, index: number) => ({
        name,
        planet: planetNames[index],
        color: colors[index],
        styleIdx: styles[index],
        isHuman: false,
      })),
    ])
    .value();
}

function createPlayers(gameDefs: SeatDefinition[]): Player[] {
  return gameDefs.map((definition, index) => ({
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
}

function createPlanets(gameDefs: SeatDefinition[]): Planet[] {
  return gameDefs.map((definition, index) => ({
    id: index,
    name: definition.planet,
    ownerId: index,
    buildings: {},
    troops: 3,
    protectedUntil: 0,
    isShieldUnpowered: false,
    x: 0,
    y: 0,
    r: 30,
    styleIdx: definition.styleIdx,
  }));
}
