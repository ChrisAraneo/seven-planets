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

export function initializeState(): GameState {
  // Name, homeworld, color and planet style are all randomized,
  // so no AI is a fixed character.
  const names = shuffleArray(AI_NAMES).slice(0, 6);
  const planetNames = shuffleArray(AI_PLANET_NAMES).slice(0, 6);
  const colors = shuffleArray(AI_COLORS).slice(0, 6);
  // The human owns planet style 0 (Terra Prime); AI draw distinct styles from the rest.
  const styles = shuffleArray(
    PLANET_STYLES.map((_, i) => i).filter((i) => i !== 0),
  ).slice(0, 6);
  const aiSlots = names.map((name: string, i: number) => ({
    name,
    planet: planetNames[i],
    color: colors[i],
    styleIdx: styles[i],
  }));
  const gameDefs = [
    {
      name: 'You',
      planet: 'Terra Prime',
      color: '#3df0ff',
      human: true,
      styleIdx: 0,
    },
    ...aiSlots.map((r: (typeof aiSlots)[0]) => ({ ...r, human: false })),
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
