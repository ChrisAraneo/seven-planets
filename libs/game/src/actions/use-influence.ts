import type { GameState } from '../interfaces/game-state';
import type { InfluenceOpts } from '../interfaces/influence-opts';
import type { InfluenceType } from '../interfaces/influence-type';

import {
  ACTION_TYPES,
  CARD_TYPES,
  CARDS,
  CONQUEST_TRUCE,
  fmtCards,
  INFLUENCE_CARDS,
  INFLUENCE_TYPES,
  NO_PRESENTATION,
  PEACE_TRUCE,
  SKIP_TURNS,
} from '../config/constants';
import { cloneDeep } from 'lodash-es';
import { influenceTarget } from '../functions/influence-target';
import { checkWin } from '../functions/check-win';
import { coupTargets } from '../functions/coup-targets';
import { handSize } from '../functions/hand-size';
import { homePlanet } from '../functions/home-planet';
import { log } from '../functions/log';
import { ownedPlanets } from '../functions/owned-planets';
import { stealCards } from '../functions/steal-cards';
import { getGameState, setGameState } from '../game-state';
import type { PresentationHooks } from '../interfaces/presentation-hooks';

export interface UseInfluencePayload {
  playerId: number;
  type: InfluenceType;
  opts?: InfluenceOpts;
}

export async function useInfluence(
  payload: UseInfluencePayload,
  hooks: PresentationHooks = NO_PRESENTATION,
): Promise<void> {
  const state = cloneDeep(getGameState());
  const { playerId, type, opts } = payload;

  if (playerId !== state.activeId || state.over) {
    return;
  }

  f(state, playerId, type, opts ?? {}, hooks);

  setGameState(state);
}

// Applies pure engine results onto the private clone via Object.assign and reads
// entities by id (opts carry frozen selector clones — we use only their ids), so the
// whole play resolves consistently on the state that gets written back.
function f(
  state: GameState,
  playerId: number,
  influenceType: InfluenceType,
  opts: InfluenceOpts = {},
  hooks: PresentationHooks = NO_PRESENTATION,
): boolean {
  if ((state.players[playerId].hand[influenceType] || 0) < 1) {
    return false;
  }

  const C = INFLUENCE_CARDS[influenceType];

  if (influenceType.startsWith('SKIP_')) {
    const target = influenceTarget(
      state,
      state.players[playerId],
      influenceType,
    );
    if (!target) {
      return false;
    }
    state.players[playerId].hand[influenceType]--;
    Object.assign(
      state,
      log(
        state,
        `⭐ ${state.players[playerId].name} plays ${CARDS[influenceType].icon} ${C.name}`,
        'sys',
      ),
    );
    state.players[target.id].skipTurns += SKIP_TURNS;
    Object.assign(
      state,
      log(
        state,
        `⏭️ ${state.players[target.id].name} is paralysed — they skip their next ${SKIP_TURNS} turn${SKIP_TURNS === 1 ? '' : 's'}!`,
        'war',
      ),
    );
    hooks.floatText(
      homePlanet(state, state.players[target.id]),
      '⏭️ SKIPPED',
      '#ffb0d8',
    );
  } else {
    switch (influenceType) {
      case 'STEAL_ACTION': {
        const { cardType } = opts;
        const target = opts.target && state.players[opts.target.id];
        if (
          !target ||
          !target.isAlive ||
          !cardType ||
          !ACTION_TYPES.includes(cardType) ||
          (target.hand[cardType] || 0) < 1
        ) {
          return false;
        }
        state.players[playerId].hand[influenceType]--;
        state.players[target.id].hand[cardType]--;
        state.players[playerId].hand[cardType]++;
        Object.assign(
          state,
          log(
            state,
            `⭐ ${state.players[playerId].name} plays ${CARDS[influenceType].icon} ${C.name} — takes 1 ${CARDS[cardType].icon} ${CARDS[cardType].name} card from ${state.players[target.id].name}!`,
            'war',
          ),
        );
        hooks.floatText(
          homePlanet(state, state.players[target.id]),
          `−1${CARDS[cardType].icon}`,
          '#ffb0d8',
        );

        break;
      }
      case 'COUP': {
        const pl = opts.planet && state.planets[opts.planet.id];
        if (!pl || !coupTargets(state, state.players[playerId]).includes(pl)) {
          return false;
        }
        const defId = pl.ownerId;
        state.players[playerId].hand[influenceType]--;
        Object.assign(
          state,
          log(
            state,
            `⭐ ${state.players[playerId].name} plays ${CARDS[influenceType].icon} ${C.name}`,
            'sys',
          ),
        );
        pl.ownerId = playerId;
        pl.troops = Math.max(1, Math.floor(pl.troops / 2)); // Half disbands, the rest defect
        pl.protectedUntil = state.turn + CONQUEST_TRUCE;
        hooks.boom(pl);
        hooks.floatText(pl, '👑 COUP!', '#ffb0d8');
        Object.assign(
          state,
          log(
            state,
            `👑 ${pl.name} defects to ${state.players[playerId].name} — half of ${state.players[defId].name}'s garrison disbands, ${pl.troops}🪖 defect! Under truce for ${CONQUEST_TRUCE} turns.`,
            'war',
          ),
        );
        if (ownedPlanets(state, state.players[defId]).length === 0) {
          const lootN = Math.min(6, handSize(state.players[defId]));
          if (lootN > 0) {
            const { state: looted, taken } = stealCards(
              state,
              defId,
              playerId,
              lootN,
            );
            Object.assign(state, looted);
            Object.assign(
              state,
              log(
                state,
                `💰 ${state.players[playerId].name} salvages ${fmtCards(taken)} from the toppled regime!`,
                'war',
              ),
            );
          }
          for (const ct of CARD_TYPES) {
            state.players[defId].hand[ct] = 0;
          }
          for (const ct of INFLUENCE_TYPES) {
            state.players[defId].hand[ct] = 0;
          }
          state.players[defId].isAlive = false;
          Object.assign(
            state,
            log(
              state,
              `☠️ ${state.players[defId].name} has been wiped from the galaxy — overthrown without a shot!`,
              'war',
            ),
          );
          Object.assign(state, checkWin(state));
        }

        break;
      }
      case 'PEACE': {
        state.players[playerId].hand[influenceType]--;
        Object.assign(
          state,
          log(
            state,
            `⭐ ${state.players[playerId].name} plays ${CARDS[influenceType].icon} ${C.name}`,
            'sys',
          ),
        );
        for (const pl of ownedPlanets(state, state.players[playerId])) {
          pl.protectedUntil = Math.max(
            pl.protectedUntil,
            state.turn + PEACE_TRUCE,
          );
        }
        Object.assign(
          state,
          log(
            state,
            `🕊️ ${state.players[playerId].name}'s planets are under truce for ${PEACE_TRUCE} turn${PEACE_TRUCE === 1 ? '' : 's'} — no attacks allowed!`,
            'sys',
          ),
        );

        break;
      }
      default: {
        return false;
      }
    }
  }

  return true;
}
