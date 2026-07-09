import { getGameState } from '@/stores/game-state';
import { getActiveId } from '@/stores/game/getters/get-active-id';
import { getOver } from '@/stores/game/getters/get-over';
import type { InfluenceOpts, InfluenceType, Player } from '@/game/types';

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
import type { getTurn } from '@/stores/game/getters/get-turn';
import { checkWin } from '../common/check-win';
import { coupTargets } from '../common/coup-targets';
import { handSize } from '../common/hand-size';
import { homePlanet } from '../common/home-planet';
import { log } from '../common/log';
import { ownedPlanets } from '../common/owned-planets';
import { stealCards } from '../common/steal-cards';

/* The `scheme` store action: play a held influence card (skip, steal,
   coup, peace). The human's InfluenceModal and the AI agent both
   dispatch this. Returns whether the card was actually played. */
export function scheme(payload: {
  playerId: number;
  type: InfluenceType;
  opts?: InfluenceOpts;
}): boolean {
  const { playerId, type, opts } = payload;
  if (playerId !== getActiveId() || getOver()) {
    return false;
  }
  return useInfluenceCard(getGameState().players[playerId], type, opts ?? {});
}

function useInfluenceCard(
  p: Player,
  t: InfluenceType,
  opts: InfluenceOpts = {},
): boolean {
  if ((p.hand[t] || 0) < 1) {
    return false;
  }
  const C = INFLUENCE_CARDS[t];
  if (t.startsWith('SKIP_')) {
    const target = influenceTarget(p, t);
    if (!target) {
      return false;
    }
    p.hand[t]--;
    log(`⭐ ${p.name} plays ${CARDS[t].icon} ${C.name}`, 'sys');
    target.skipTurns += SKIP_TURNS;
    log(
      `⏭️ ${target.name} is paralysed — they skip their next ${SKIP_TURNS} turn${SKIP_TURNS === 1 ? '' : 's'}!`,
      'war',
    );
    floatText(homePlanet(target), '⏭️ SKIPPED', '#ffb0d8');
  } else {
    switch (t) {
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
        p.hand[t]--;
        target.hand[cardType]--;
        p.hand[cardType]++;
        log(
          `⭐ ${p.name} plays ${CARDS[t].icon} ${C.name} — takes 1 ${CARDS[cardType].icon} ${CARDS[cardType].name} card from ${target.name}!`,
          'war',
        );
        floatText(homePlanet(target), `−1${CARDS[cardType].icon}`, '#ffb0d8');

        break;
      }
      case 'COUP': {
        // Opts carry frozen clones from the selectors; act on the live planet.
        const pl = opts.planet && getGameState().planets[opts.planet.id];
        if (!pl || !coupTargets(p).includes(pl)) {
          return false;
        }
        const def = getGameState().players[pl.ownerId];
        p.hand[t]--;
        log(`⭐ ${p.name} plays ${CARDS[t].icon} ${C.name}`, 'sys');
        def.planets = def.planets.filter((id) => id !== pl.id);
        p.planets.push(pl.id);
        pl.ownerId = p.id;
        pl.troops = Math.max(1, Math.floor(pl.troops / 2)); // Half disbands, the rest defect
        pl.protectedUntil = getTurn() + CONQUEST_TRUCE;
        boom(pl);
        floatText(pl, '👑 COUP!', '#ffb0d8');
        log(
          `👑 ${pl.name} defects to ${p.name} — half of ${def.name}'s garrison disbands, ${pl.troops}🪖 defect! Under truce for ${CONQUEST_TRUCE} turns.`,
          'war',
        );
        if (def.planets.length === 0) {
          const lootN = Math.min(6, handSize(def));
          if (lootN > 0) {
            const taken = stealCards(def, p, lootN);
            log(
              `💰 ${p.name} salvages ${fmtCards(taken)} from the toppled regime!`,
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
          checkWin();
        }

        break;
      }
      case 'PEACE': {
        p.hand[t]--;
        log(`⭐ ${p.name} plays ${CARDS[t].icon} ${C.name}`, 'sys');
        for (const pl of ownedPlanets(p)) {
          pl.protectedUntil = Math.max(
            pl.protectedUntil,
            getTurn() + PEACE_TRUCE,
          );
        }
        log(
          `🕊️ ${p.name}'s planets are under truce for ${PEACE_TRUCE} turn${PEACE_TRUCE === 1 ? '' : 's'} — no attacks allowed!`,
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
