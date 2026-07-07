import {
  BUILD_ORDER,
  BUILDINGS,
  fmtCards,
  incomeAmount,
  PACIFIST_INFLUENCE,
} from '@/game/constants';
import { getState } from '../state';
import { log } from './log';
import { ownedPlanets } from './owned-planets';

export function doIncome(): void {
  const gains: Record<number, Record<string, number>> = {};
  const moveGains: Record<number, number> = {}; // L2 Spaceport: free Move card every 3 turns
  const infGains: Record<number, number> = {}; // L2 Embassy: +1 ⭐ Influence every turn
  const pacGains: Record<number, number> = {}; // Pacifist: +PACIFIST_INFLUENCE ⭐ per planet
  for (const pl of getState().planets) {
    const owner = getState().players[pl.ownerId];
    if (!owner.alive) {
      continue;
    }
    for (const b of BUILD_ORDER) {
      const inc = BUILDINGS[b].income;
      if (pl.buildings[b] && inc) {
        const amount = incomeAmount(b, pl.buildings[b]); // Scales with level (Mine L2: 3)
        owner.hand[inc] += amount;
        if (!gains[owner.id]) {
          gains[owner.id] = {};
        }
        gains[owner.id][inc] = (gains[owner.id][inc] || 0) + amount;
      }
    }
    // L2 Spaceport perk: grant 1 free Move card every 3rd turn
    if ((pl.buildings.SPACEPORT || 0) >= 2 && getState().turn % 3 === 0) {
      owner.hand.MOVE++;
      moveGains[owner.id] = (moveGains[owner.id] || 0) + 1;
    }
    // L2 Embassy perk: +1 Influence per turn
    if ((pl.buildings.EMBASSY || 0) >= 2) {
      owner.influence++;
      infGains[owner.id] = (infGains[owner.id] || 0) + 1;
    }
    // Pacifist perk: every planet radiates extra influence every turn.
    if (owner.pacifistStatus) {
      owner.influence += PACIFIST_INFLUENCE;
      pacGains[owner.id] = (pacGains[owner.id] || 0) + PACIFIST_INFLUENCE;
    }
  }
  for (const id in gains) {
    log(
      `⚙️ ${getState().players[id].name} produces ${fmtCards(gains[id])}`,
      'draft',
    );
  }
  for (const id in moveGains) {
    log(
      `🛰️ ${getState().players[id].name} receives +${moveGains[id]}🛸 Move (L2 Spaceport)`,
      'draft',
    );
  }
  for (const id in infGains) {
    log(
      `⭐ ${getState().players[id].name} gains +${infGains[id]} Influence (L2 Embassy)`,
      'draft',
    );
  }
  for (const id in pacGains) {
    log(
      `☮️ ${getState().players[id].name} gains +${pacGains[id]} Influence (Pacifist)`,
      'draft',
    );
  }
}
