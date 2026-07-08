import { CARDS, INFLUENCE_CARDS } from '@/game/constants';
import { sleep } from '@/game/effects';
import type { BuildingType, GameState, InfluenceType } from '@/game/types';
import { aiDraftPick } from './ai-draft-pick';
import { AUTO_HUMAN } from './auto-human';
import { buildBuilding } from './build-building';
import { canPickCard } from './can-pick-card';
import { draftOrder } from './draft-order';
import { log } from './log';
import { mainPicks } from './main-picks';
import { setStatus } from './set-status';
import { waitHumanPoolPick } from './wait-human-pool-pick';

export async function runDraft(state: GameState): Promise<void> {
  state.phase = 'draft';

  for (const p of draftOrder(state)) {
    if (p.skippedNow) {
      continue;
    } // Paralysed by an influence card
    for (let s = 0; s < p.planets.length; s++) {
      if (state.over) {
        return;
      }
      if (!p.alive || state.pool.length === 0) {
        continue;
      }
      const planet = state.planets[p.planets[s]];
      const picks = s === 0 ? mainPicks(state, p) : 1;
      state.activeId = p.id;
      state.draftPlanetId = planet.id;
      for (let k = 0; k < picks && state.pool.length > 0; k++) {
        let idx: number;
        if (p.isHuman && !AUTO_HUMAN) {
          if (!state.pool.some((t) => canPickCard(state, p, t, planet))) {
            setStatus(state, `No card you can take — ${planet.name} passes.`);
            log(
              state,
              `🃏 ${p.name} passes (nothing pickable for ${planet.name})`,
              'draft',
            );
            await sleep(600);
            continue;
          }
          setStatus(
            state,
            `YOUR PICK — ${planet.name} drafts card ${k + 1} of ${picks}${s > 0 ? ' (extra planet turn)' : ''}`,
          );
          idx = await waitHumanPoolPick(state);
        } else {
          setStatus(state, `${p.name} is drafting for ${planet.name}…`);
          await sleep(300);
          idx = aiDraftPick(state, p, planet);
          if (idx < 0) {
            log(
              state,
              `🃏 ${p.name} passes (nothing pickable for ${planet.name})`,
              'draft',
            );
            continue;
          }
        }
        if (state.over) {
          return;
        }
        const type = state.pool.splice(idx, 1)[0];
        if (CARDS[type].building) {
          buildBuilding(state, p, planet, type as BuildingType); // Pays cost from hand, may win the game
          if (state.over) {
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
  state.draftPlanetId = -1;
}
