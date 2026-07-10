import { getOver } from '@/game/getters/get-over';
import { CARDS, INFLUENCE_CARDS } from '@/game/config/constants';
import { sleep } from '@/game/hooks';
import type { BuildingType, InfluenceType } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { AUTO_HUMAN } from '@/game/functions/auto-human';
import { buildBuilding } from './build-building';
import { canPickCard } from '@/game/functions/can-pick-card';
import { draftOrder } from './draft-order';
import { log } from './log';
import { mainPicks } from './main-picks';
import { setStatus } from './set-status';
import { waitPoolPick } from './wait-pool-pick';

/* Every seat drafts through the same parked `pick` store action. We raise
   `awaitingPick` and wait: the human answers with a pool click; an AI seat
   is answered by the `ai` store module, which watches the flag and dispatches
   the same `pickCard` action. Because the `pickCard` mutation clones and
   replaces the state object, we never hold a state/entity reference across an
   await — everything is re-read from getGameState() by id. */
export async function runDraft(): Promise<void> {
  getGameState().phase = 'draft';

  const order = draftOrder(getGameState()).map((pl) => pl.id);
  for (const seatId of order) {
    if (getGameState().players[seatId].skippedNow) {
      continue;
    } // Paralysed by an influence card
    for (let s = 0; s < getGameState().players[seatId].planets.length; s++) {
      if (getOver()) {
        return;
      }
      let p = getGameState().players[seatId];
      if (!p.alive || getGameState().pool.length === 0) {
        continue;
      }
      const planetId = p.planets[s];
      const picks = s === 0 ? mainPicks(getGameState(), p) : 1;
      getGameState().activeId = seatId;
      getGameState().draftPlanetId = planetId;
      for (let k = 0; k < picks && getGameState().pool.length > 0; k++) {
        let state = getGameState();
        p = state.players[seatId];
        const planet = state.planets[planetId];
        const humanControlled = p.isHuman && !AUTO_HUMAN;

        if (!state.pool.some((t) => canPickCard(state, p, t, planet))) {
          if (humanControlled) {
            setStatus(state, `No card you can take — ${planet.name} passes.`);
          }
          log(
            state,
            `🃏 ${p.name} passes (nothing pickable for ${planet.name})`,
            'draft',
          );
          await sleep(humanControlled ? 600 : 300);
          continue;
        }

        setStatus(
          state,
          humanControlled
            ? `YOUR PICK — ${planet.name} drafts card ${k + 1} of ${picks}${s > 0 ? ' (extra planet turn)' : ''}`
            : `${p.name} is drafting for ${planet.name}…`,
        );
        if (!humanControlled) {
          await sleep(300); // Let the AI's draft read at a human pace.
        }
        // Raise awaitingPick and wait for the pick (human click or AI module).
        const idx = await waitPoolPick(getGameState());
        if (getOver()) {
          return;
        }

        // The pick mutation replaced the state object — re-read by id.
        state = getGameState();
        p = state.players[seatId];
        const pl = state.planets[planetId];
        const type = state.pool.splice(idx, 1)[0];
        if (CARDS[type].building) {
          buildBuilding(state, p, pl, type as BuildingType); // Pays cost from hand, may win the game
          if (getOver()) {
            return;
          }
        } else if (CARDS[type].influenceCard) {
          const it = type as InfluenceType;
          p.influence -= INFLUENCE_CARDS[it].cost;
          p.hand[it]++;
          log(
            state,
            `⭐ ${p.name} drafts ${CARDS[it].icon} ${CARDS[it].name} (−${INFLUENCE_CARDS[it].cost}⭐) — holds it for a later action turn`,
            'draft',
          );
        } else {
          p.hand[type]++;
          log(
            state,
            `🃏 ${p.name} drafts ${CARDS[type].icon} ${CARDS[type].name}${s > 0 ? ` (${planet.name}'s turn)` : ''}`,
            'draft',
          );
        }
      }
    }
  }
  getGameState().draftPlanetId = -1;
}
