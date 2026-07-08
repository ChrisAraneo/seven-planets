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
import { boom, floatText } from '@/game/effects';
import type {
  GameState,
  InfluenceOpts,
  InfluenceType,
  Player,
} from '@/game/types';
import { checkWin } from './check-win';
import { coupTargets } from './coup-targets';
import { handSize } from './hand-size';
import { homePlanet } from './home-planet';
import { influenceTarget } from './influence-target';
import { log } from './log';
import { ownedPlanets } from './owned-planets';
import { stealCards } from './steal-cards';

// Play a HELD influence card during the owner's action turn.
export function useInfluenceCard(
  state: GameState,
  p: Player,
  t: InfluenceType,
  opts: InfluenceOpts = {},
): boolean {
  if ((p.hand[t] || 0) < 1) {
    return false;
  }
  const C = INFLUENCE_CARDS[t];
  if (t.startsWith('SKIP_')) {
    const target = influenceTarget(state, p, t);
    if (!target) {
      return false;
    }
    p.hand[t]--;
    log(state, `⭐ ${p.name} plays ${CARDS[t].icon} ${C.name}`, 'sys');
    target.skipTurns += SKIP_TURNS;
    log(
      state,
      `⏭️ ${target.name} is paralysed — they skip their next ${SKIP_TURNS} turn${SKIP_TURNS === 1 ? '' : 's'}!`,
      'war',
    );
    floatText(homePlanet(state, target), '⏭️ SKIPPED', '#ffb0d8');
  } else {
    switch (t) {
      case 'STEAL_ACTION': {
        const { target, cardType } = opts;
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
          state,
          `⭐ ${p.name} plays ${CARDS[t].icon} ${C.name} — takes 1 ${CARDS[cardType].icon} ${CARDS[cardType].name} card from ${target.name}!`,
          'war',
        );
        floatText(
          homePlanet(state, target),
          `−1${CARDS[cardType].icon}`,
          '#ffb0d8',
        );

        break;
      }
      case 'COUP': {
        const pl = opts.planet;
        if (!pl || !coupTargets(state, p).includes(pl)) {
          return false;
        }
        const def = state.players[pl.ownerId];
        p.hand[t]--;
        log(state, `⭐ ${p.name} plays ${CARDS[t].icon} ${C.name}`, 'sys');
        def.planets = def.planets.filter((id) => id !== pl.id);
        p.planets.push(pl.id);
        pl.ownerId = p.id;
        pl.troops = Math.max(1, Math.floor(pl.troops / 2)); // Half disbands, the rest defect
        pl.protectedUntil = state.turn + CONQUEST_TRUCE;
        boom(pl);
        floatText(pl, '👑 COUP!', '#ffb0d8');
        log(
          state,
          `👑 ${pl.name} defects to ${p.name} — half of ${def.name}'s garrison disbands, ${pl.troops}🪖 defect! Under truce for ${CONQUEST_TRUCE} turns.`,
          'war',
        );
        if (def.planets.length === 0) {
          const lootN = Math.min(6, handSize(def));
          if (lootN > 0) {
            const taken = stealCards(def, p, lootN);
            log(
              state,
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
            state,
            `☠️ ${def.name} has been wiped from the galaxy — overthrown without a shot!`,
            'war',
          );
          checkWin(state);
        }

        break;
      }
      case 'PEACE': {
        p.hand[t]--;
        log(state, `⭐ ${p.name} plays ${CARDS[t].icon} ${C.name}`, 'sys');
        for (const pl of ownedPlanets(state, p)) {
          pl.protectedUntil = Math.max(
            pl.protectedUntil,
            state.turn + PEACE_TRUCE,
          );
        }
        log(
          state,
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
