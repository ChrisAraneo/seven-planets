import { CARDS, INFLUENCE_CARDS } from '@/game/constants';
import { sleep } from '@/game/effects';
import type { BuildingType, InfluenceType } from '@/game/types';
import { getState } from '../state';
import { aiDraftPick } from './ai-draft-pick';
import { AUTO_HUMAN } from './auto-human';
import { buildBuilding } from './build-building';
import { canPickCard } from './can-pick-card';
import { draftOrder } from './draft-order';
import { log } from './log';
import { mainPicks } from './main-picks';
import { setStatus } from './set-status';
import { waitHumanPoolPick } from './wait-human-pool-pick';

export async function runDraft(): Promise<void> {
  getState().phase = 'draft';

  for (const p of draftOrder()) {
    if (p.skippedNow) {
      continue;
    } // Paralysed by an influence card
    for (let s = 0; s < p.planets.length; s++) {
      if (getState().over) {
        return;
      }
      if (!p.alive || getState().pool.length === 0) {
        continue;
      }
      const planet = getState().planets[p.planets[s]];
      const picks = s === 0 ? mainPicks(p) : 1;
      getState().activeId = p.id;
      getState().draftPlanetId = planet.id;
      for (let k = 0; k < picks && getState().pool.length > 0; k++) {
        let idx: number;
        if (p.isHuman && !AUTO_HUMAN) {
          if (!getState().pool.some((t) => canPickCard(p, t, planet))) {
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
          idx = await waitHumanPoolPick();
        } else {
          setStatus(`${p.name} is drafting for ${planet.name}…`);
          await sleep(300);
          idx = aiDraftPick(p, planet);
          if (idx < 0) {
            log(
              `🃏 ${p.name} passes (nothing pickable for ${planet.name})`,
              'draft',
            );
            continue;
          }
        }
        if (getState().over) {
          return;
        }
        const type = getState().pool.splice(idx, 1)[0];
        if (CARDS[type].building) {
          buildBuilding(p, planet, type as BuildingType); // Pays cost from hand, may win the game
          if (getState().over) {
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
  getState().draftPlanetId = -1;
}
