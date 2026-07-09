import { getGameState } from '@/stores/game-state';
import type {
  GameState,
  InfluenceOpts,
  InfluenceType,
  Player,
} from '@/game/types';

import {
  ACTION_TYPES,
  CARD_TYPES,
  CARDS,
  CONQUEST_TRUCE,
  fmtCards,
  INFLUENCE_CARDS,
  INFLUENCE_TYPES,
  PEACE_TRUCE,
  SKIP_TURNS,
} from '@/game/constants';
import { influenceTarget } from '../common/influence-target';
import { floatText, boom } from '@/game/hooks';
import { getTurn } from '@/stores/game/getters/get-turn';
import { checkWin } from '../common/check-win';
import { coupTargets } from '../common/coup-targets';
import { handSize } from '../common/hand-size';
import { homePlanet } from '../common/home-planet';
import { log } from '../common/log';
import { ownedPlanets } from '../common/owned-planets';
import { stealCards } from '../common/steal-cards';

export interface UseInfluencePayload {
  playerId: number;
  type: InfluenceType;
  opts?: InfluenceOpts;
}

export async function useInfluence(
  state: GameState,
  payload: UseInfluencePayload,
): Promise<GameState> {
  const { playerId, type, opts } = payload;

  if (playerId !== state.activeId || state.over) {
    return state;
  }

  f(state, state.players[playerId], type, opts ?? {});

  return state;
}

function f(
  state: GameState,
  player: Player,
  influenceType: InfluenceType,
  opts: InfluenceOpts = {},
): boolean {
  if ((player.hand[influenceType] || 0) < 1) {
    return false;
  }

  const C = INFLUENCE_CARDS[influenceType];

  if (influenceType.startsWith('SKIP_')) {
    const target = influenceTarget(player, influenceType);
    if (!target) {
      return false;
    }
    player.hand[influenceType]--;
    log(
      `⭐ ${player.name} plays ${CARDS[influenceType].icon} ${C.name}`,
      'sys',
    );
    target.skipTurns += SKIP_TURNS;
    log(
      `⏭️ ${target.name} is paralysed — they skip their next ${SKIP_TURNS} turn${SKIP_TURNS === 1 ? '' : 's'}!`,
      'war',
    );
    floatText(homePlanet(target), '⏭️ SKIPPED', '#ffb0d8');
  } else {
    switch (influenceType) {
      case 'STEAL_ACTION': {
        const { cardType } = opts;
        // Opts carry frozen clones from the selectors; act on the live seat.
        const target = opts.target && getGameState().players[opts.target.id];
        if (
          !target ||
          !target.alive ||
          !cardType ||
          !ACTION_TYPES.includes(cardType) ||
          (target.hand[cardType] || 0) < 1
        ) {
          return false;
        }
        player.hand[influenceType]--;
        target.hand[cardType]--;
        player.hand[cardType]++;
        log(
          `⭐ ${player.name} plays ${CARDS[influenceType].icon} ${C.name} — takes 1 ${CARDS[cardType].icon} ${CARDS[cardType].name} card from ${target.name}!`,
          'war',
        );
        floatText(homePlanet(target), `−1${CARDS[cardType].icon}`, '#ffb0d8');

        break;
      }
      case 'COUP': {
        // Opts carry frozen clones from the selectors; act on the live planet.
        const pl = opts.planet && getGameState().planets[opts.planet.id];
        if (!pl || !coupTargets(player).includes(pl)) {
          return false;
        }
        const def = getGameState().players[pl.ownerId];
        player.hand[influenceType]--;
        log(
          `⭐ ${player.name} plays ${CARDS[influenceType].icon} ${C.name}`,
          'sys',
        );
        def.planets = def.planets.filter((id) => id !== pl.id);
        player.planets.push(pl.id);
        pl.ownerId = player.id;
        pl.troops = Math.max(1, Math.floor(pl.troops / 2)); // Half disbands, the rest defect
        pl.protectedUntil = getTurn() + CONQUEST_TRUCE;
        boom(pl);
        floatText(pl, '👑 COUP!', '#ffb0d8');
        log(
          `👑 ${pl.name} defects to ${player.name} — half of ${def.name}'s garrison disbands, ${pl.troops}🪖 defect! Under truce for ${CONQUEST_TRUCE} turns.`,
          'war',
        );
        if (def.planets.length === 0) {
          const lootN = Math.min(6, handSize(def));
          if (lootN > 0) {
            const taken = stealCards(def, player, lootN);
            log(
              `💰 ${player.name} salvages ${fmtCards(taken)} from the toppled regime!`,
              'war',
            );
          }
          for (const ct of CARD_TYPES) {
            def.hand[ct] = 0;
          }
          for (const ct of INFLUENCE_TYPES) {
            def.hand[ct] = 0;
          }
          def.alive = false;
          log(
            `☠️ ${def.name} has been wiped from the galaxy — overthrown without a shot!`,
            'war',
          );
          checkWin(state);
        }

        break;
      }
      case 'PEACE': {
        player.hand[influenceType]--;
        log(
          `⭐ ${player.name} plays ${CARDS[influenceType].icon} ${C.name}`,
          'sys',
        );
        for (const pl of ownedPlanets(player)) {
          pl.protectedUntil = Math.max(
            pl.protectedUntil,
            getTurn() + PEACE_TRUCE,
          );
        }
        log(
          `🕊️ ${player.name}'s planets are under truce for ${PEACE_TRUCE} turn${PEACE_TRUCE === 1 ? '' : 's'} — no attacks allowed!`,
          'sys',
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
