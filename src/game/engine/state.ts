import { cloneDeep } from 'lodash-es';
import {
  AI_COLORS,
  AI_LINEUP,
  AI_NAMES,
  AI_PLANET_NAMES,
  CARD_TYPES,
  INFLUENCE_TYPES,
  PLANET_STYLES,
  shuffleArr,
} from '../constants';
import type { GameState, Hand } from '../types';

let state: GameState = null as unknown as GameState;

export function getState(): GameState {
  return Object.freeze(cloneDeep(state));
}

export function setState(s: GameState): void {
  state = s;
}

function startingHand(): Hand {
  const h: Hand = {};
  for (const t of CARD_TYPES) {
    h[t] = 0;
  }
  for (const t of INFLUENCE_TYPES) {
    h[t] = 0;
  } // Held influence cards (played later)
  return h;
}

export function buildState(): GameState {
  // All 6 AI seats are always mastermind.
  const aiPersonalities = AI_LINEUP;
  // Task 3: name, homeworld, color and planet style are all randomized
  // INDEPENDENTLY of personality, so no AI is a fixed character any more.
  const names = shuffleArr(AI_NAMES).slice(0, 6);
  const planetNames = shuffleArr(AI_PLANET_NAMES).slice(0, 6);
  const colors = shuffleArr(AI_COLORS).slice(0, 6);
  // The human owns planet style 0 (Terra Prime); AI draw distinct styles from the rest.
  const styles = shuffleArr(
    PLANET_STYLES.map((_, i) => i).filter((i) => i !== 0),
  ).slice(0, 6);
  const aiSlots = aiPersonalities.map((personality, i) => ({
    name: names[i],
    planet: planetNames[i],
    color: colors[i],
    personality,
    styleIdx: styles[i],
  }));
  const gameDefs = [
    {
      name: 'You',
      planet: 'Terra Prime',
      color: '#3df0ff',
      human: true,
      personality: 'human',
      styleIdx: 0,
    },
    ...aiSlots.map((r) => ({ ...r, human: false })),
  ];
  return {
    turn: 0,
    phase: 'setup',
    over: null,
    pool: [],
    activeId: -1,
    draftPlanetId: -1, // The planet whose draft turn it is (buildings land here)
    singularityAnnounced: false,
    startIdx: 0,
    busy: false,
    players: gameDefs.map((d, i) => ({
      id: i,
      name: d.name,
      color: d.color,
      isHuman: Boolean(d.human),
      personality: d.personality,
      hand: startingHand(),
      influence: 0,
      skipTurns: 0,
      skippedNow: false,
      alive: true,
      planets: [i],
      tradedThisTurn: false,
      lastAttackTurn: 0,
      pacifistStatus: false,
      pacifismForfeited: false,
      kamikaze: false,
    })),
    planets: gameDefs.map((d, i) => ({
      id: i,
      name: d.planet,
      ownerId: i,
      buildings: {},
      troops: 3,
      protectedUntil: 0,
      x: 0,
      y: 0,
      r: 30,
      styleIdx: d.styleIdx,
    })),
    log: [],
    status: '—',
    awaitingPick: false,
    awaitingAction: false,
    pendingOffer: null,
  };
}
