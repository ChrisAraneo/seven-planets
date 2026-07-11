import { getOver } from '../getters/get-over';
import { CARDS, INFLUENCE_CARDS, NO_PRESENTATION } from '../config/constants';
import type { BuildingType } from '../interfaces/building-type';
import type { InfluenceType } from '../interfaces/influence-type';
import { getGameState } from '../game-state';

import { AUTO_HUMAN } from './auto-human';
import { buildBuilding } from './build-building';
import { canPickCard } from './can-pick-card';
import { draftOrder } from './draft-order';
import { log } from './log';
import { mainPicks } from './main-picks';
import { setStatus } from './set-status';
import { waitPoolPick } from './wait-pool-pick';
import type { PresentationHooks } from '../interfaces/presentation-hooks';

/* Every seat drafts through the same parked `pick` store action. We raise
   `awaitingPick` and wait: the human answers with a pool click; an AI seat
   is answered by the `ai` store module, which watches the flag and dispatches
   the same `pickCard` action. Because the `pickCard` mutation clones and
   replaces the state object, we never hold a state/entity reference across an
   await — everything is re-read from getGameState() by id. */
export async function runDraft(
  hooks: PresentationHooks = NO_PRESENTATION,
): Promise<void> {
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
            Object.assign(
              state,
              setStatus(state, `No card you can take — ${planet.name} passes.`),
            );
          }
          Object.assign(
            state,
            log(
              state,
              `🃏 ${p.name} passes (nothing pickable for ${planet.name})`,
              'draft',
            ),
          );
          await hooks.sleep(humanControlled ? 600 : 300);
          continue;
        }

        Object.assign(
          state,
          setStatus(
            state,
            humanControlled
              ? `YOUR PICK — ${planet.name} drafts card ${k + 1} of ${picks}${s > 0 ? ' (extra planet turn)' : ''}`
              : `${p.name} is drafting for ${planet.name}…`,
          ),
        );
        if (!humanControlled) {
          await hooks.sleep(300); // Let the AI's draft read at a human pace.
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
          // Pays cost from hand, may win the game
          Object.assign(
            state,
            buildBuilding(state, p.id, pl.id, type as BuildingType, hooks),
          );
          if (getOver()) {
            return;
          }
        } else if (CARDS[type].influenceCard) {
          const it = type as InfluenceType;
          p.influence -= INFLUENCE_CARDS[it].cost;
          p.hand[it]++;
          Object.assign(
            state,
            log(
              state,
              `⭐ ${p.name} drafts ${CARDS[it].icon} ${CARDS[it].name} (−${INFLUENCE_CARDS[it].cost}⭐) — holds it for a later action turn`,
              'draft',
            ),
          );
        } else {
          p.hand[type]++;
          Object.assign(
            state,
            log(
              state,
              `🃏 ${p.name} drafts ${CARDS[type].icon} ${CARDS[type].name}${s > 0 ? ` (${planet.name}'s turn)` : ''}`,
              'draft',
            ),
          );
        }
      }
    }
  }
  getGameState().draftPlanetId = -1;
}
