import { chain, fromPairs } from 'lodash-es';
import {
  CARD_TYPES,
  INFLUENCE_TYPES,
  shuffleArray,
  AI_NAMES,
  AI_PLANET_NAMES,
  AI_COLORS,
  PLANET_STYLES,
} from '../config/constants';
import type { Hand } from '../interfaces/hand';
import type { GameState } from '../interfaces/game-state';

// Held influence cards (played later) start at 0 alongside resources/actions.
function startingHand(): Hand {
  return fromPairs(
    [...CARD_TYPES, ...INFLUENCE_TYPES].map((cardType) => [cardType, 0]),
  );
}

export function initializeState(): GameState {
  // Name, homeworld, color and planet style are all randomized,
  // so no AI is a fixed character.
  return chain({
    names: shuffleArray(AI_NAMES).slice(0, 6),
    planetNames: shuffleArray(AI_PLANET_NAMES).slice(0, 6),
    colors: shuffleArray(AI_COLORS).slice(0, 6),
    // The human owns planet style 0 (Terra Prime); AI draw distinct styles from the rest.
    styles: shuffleArray(
      PLANET_STYLES.map((_, index) => index).filter((index) => index !== 0),
    ).slice(0, 6),
  })
    .thru(({ names, planetNames, colors, styles }) => [
      {
        name: 'You',
        planet: 'Terra Prime',
        color: '#3df0ff',
        human: true,
        styleIdx: 0,
      },
      ...names.map((name: string, index: number) => ({
        name,
        planet: planetNames[index],
        color: colors[index],
        styleIdx: styles[index],
        human: false,
      })),
    ])
    .thru(
      (gameDefs): GameState => ({
        turn: 0,
        phase: 'setup',
        over: null,
        pool: [],
        activeId: -1,
        draftPlanetId: -1, // The planet whose draft turn it is (buildings land here)
        singularityAnnounced: false,
        startIdx: 0,
        busy: false,
        players: gameDefs.map((definition, index) => ({
          id: index,
          name: definition.name,
          color: definition.color,
          isHuman: Boolean(definition.human),
          hand: startingHand(),
          influence: 0,
          skipTurns: 0,
          skippedNow: false,
          isAlive: true,
          hasTradedCurrentTurn: false,
          lastAttackTurn: 0,
          hasPacifistStatus: false,
          pacifismForfeited: false,
          isKamikaze: false,
        })),
        planets: gameDefs.map((definition, index) => ({
          id: index,
          name: definition.planet,
          ownerId: index,
          buildings: {},
          troops: 3,
          protectedUntil: 0,
          x: 0,
          y: 0,
          r: 30,
          styleIdx: definition.styleIdx,
        })),
        log: [],
        status: '—',
        awaitingPick: false,
        awaitingAction: false,
        pendingOffer: null,
      }),
    )
    .value();
}
