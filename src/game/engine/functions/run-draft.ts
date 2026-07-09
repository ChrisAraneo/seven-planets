import { getOver } from '@/stores/game/getters/get-over';
import { CARDS, INFLUENCE_CARDS } from '@/game/constants';
import { getPlayerAgent } from '@/game/engine/agent';
import { sleep } from '@/game/hooks';
import type { BuildingType, InfluenceType } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { AUTO_HUMAN } from '@/game/actions/common/auto-human';
import { buildBuilding } from './build-building';
import { canPickCard } from '@/game/actions/common/can-pick-card';
import { draftOrder } from './draft-order';
import { log } from '@/game/actions/common/log';
import { mainPicks } from './main-picks';
import { setStatus } from '@/game/actions/common/set-status';
import { waitPoolPick } from './wait-pool-pick';

export async function runDraft(): Promise<void> {
  const state = getGameState();
  state.phase = 'draft';

  for (const p of draftOrder()) {
    if (p.skippedNow) {
      continue;
    } // Paralysed by an influence card
    for (let s = 0; s < p.planets.length; s++) {
      if (getOver()) {
        return;
      }
      if (!p.alive || state.pool.length === 0) {
        continue;
      }
      const planet = state.planets[p.planets[s]];
      const picks = s === 0 ? mainPicks(p) : 1;
      state.activeId = p.id;
      state.draftPlanetId = planet.id;
      for (let k = 0; k < picks && state.pool.length > 0; k++) {
        // Every seat picks through the same parked `pick` store action; only
        // The prompt (status line vs agent notification) differs.
        let idx: number;
        if (p.isHuman && !AUTO_HUMAN) {
          if (!state.pool.some((t) => canPickCard(p, t, planet))) {
            setStatus(`No card you can take — ${planet.name} passes.`);
            log(
              `🃏 ${p.name} passes (nothing pickable for ${planet.name})`,
              'draft',
            );
            await sleep(600);
            continue;
          }
          setStatus(
            `YOUR PICK — ${planet.name} drafts card ${k + 1} of ${picks}${s > 0 ? ' (extra planet turn)' : ''}`,
          );
          idx = await waitPoolPick();
        } else {
          setStatus(`${p.name} is drafting for ${planet.name}…`);
          await sleep(300);
          if (!state.pool.some((t) => canPickCard(p, t, planet))) {
            log(
              `🃏 ${p.name} passes (nothing pickable for ${planet.name})`,
              'draft',
            );
            continue;
          }
          // Park FIRST so the agent's dispatched pick finds the resolver.
          const pending = waitPoolPick();
          getPlayerAgent().pickCard(p, planet);
          idx = await pending;
        }
        if (getOver()) {
          return;
        }
        const type = state.pool.splice(idx, 1)[0];
        if (CARDS[type].building) {
          buildBuilding(p, planet, type as BuildingType); // Pays cost from hand, may win the game
          if (getOver()) {
            return;
          }
        } else if (CARDS[type].influenceCard) {
          const it = type as InfluenceType;
          p.influence -= INFLUENCE_CARDS[it].cost;
          p.hand[it]++;
          log(
            `⭐ ${p.name} drafts ${CARDS[it].icon} ${CARDS[it].name} (−${INFLUENCE_CARDS[it].cost}⭐) — holds it for a later action turn`,
            'draft',
          );
        } else {
          p.hand[type]++;
          log(
            `🃏 ${p.name} drafts ${CARDS[type].icon} ${CARDS[type].name}${s > 0 ? ` (${planet.name}'s turn)` : ''}`,
            'draft',
          );
        }
      }
    }
  }
  state.draftPlanetId = -1;
}
