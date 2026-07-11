import {
  BUILD_ORDER,
  BUILDINGS,
  fmtCards,
  incomeAmount,
  PACIFIST_INFLUENCE,
} from '../config/constants';
import type { GameState } from '../interfaces/game-state';

import { log } from './log';
import { updatePlayers } from './update-players';

// Grant every alive owner their per-turn production. Pure: accumulate each player's
// hand/influence deltas, apply them in one structural-sharing pass, then log.
export function doIncome(state: GameState): GameState {
  const gains: Record<number, Record<string, number>> = {};
  const moveGains: Record<number, number> = {}; // L2 Spaceport: free Move card every 3 turns
  const infGains: Record<number, number> = {}; // L2 Embassy: +1 ⭐ Influence every turn
  const pacGains: Record<number, number> = {}; // Pacifist: +PACIFIST_INFLUENCE ⭐ per planet
  const handAdd: Record<number, Record<string, number>> = {};
  const infAdd: Record<number, number> = {};
  for (const pl of state.planets) {
    const owner = state.players[pl.ownerId];
    if (!owner.alive) {
      continue;
    }
    for (const b of BUILD_ORDER) {
      const inc = BUILDINGS[b].income;
      if (pl.buildings[b] && inc) {
        const amount = incomeAmount(b, pl.buildings[b]); // Scales with level (Mine L2: 3)
        handAdd[owner.id] ??= {};
        handAdd[owner.id][inc] = (handAdd[owner.id][inc] || 0) + amount;
        gains[owner.id] ??= {};
        gains[owner.id][inc] = (gains[owner.id][inc] || 0) + amount;
      }
    }
    // L2 Spaceport perk: grant 1 free Move card every 3rd turn
    if ((pl.buildings.SPACEPORT || 0) >= 2 && state.turn % 3 === 0) {
      handAdd[owner.id] ??= {};
      handAdd[owner.id].MOVE = (handAdd[owner.id].MOVE || 0) + 1;
      moveGains[owner.id] = (moveGains[owner.id] || 0) + 1;
    }
    // L2 Embassy perk: +1 Influence per turn
    if ((pl.buildings.EMBASSY || 0) >= 2) {
      infAdd[owner.id] = (infAdd[owner.id] || 0) + 1;
      infGains[owner.id] = (infGains[owner.id] || 0) + 1;
    }
    // Pacifist perk: every planet radiates extra influence every turn.
    if (owner.pacifistStatus) {
      infAdd[owner.id] = (infAdd[owner.id] || 0) + PACIFIST_INFLUENCE;
      pacGains[owner.id] = (pacGains[owner.id] || 0) + PACIFIST_INFLUENCE;
    }
  }
  let s = updatePlayers(state, (p) => {
    const ha = handAdd[p.id];
    const ia = infAdd[p.id];
    if (!ha && !ia) {
      return p;
    }
    const hand = { ...p.hand };
    for (const k in ha) {
      hand[k] = (hand[k] || 0) + ha[k];
    }
    return { ...p, hand, influence: p.influence + (ia || 0) };
  });
  for (const id in gains) {
    s = log(
      s,
      `⚙️ ${s.players[id].name} produces ${fmtCards(gains[id])}`,
      'draft',
    );
  }
  for (const id in moveGains) {
    s = log(
      s,
      `🛰️ ${s.players[id].name} receives +${moveGains[id]}🛸 Move (L2 Spaceport)`,
      'draft',
    );
  }
  for (const id in infGains) {
    s = log(
      s,
      `⭐ ${s.players[id].name} gains +${infGains[id]} Influence (L2 Embassy)`,
      'draft',
    );
  }
  for (const id in pacGains) {
    s = log(
      s,
      `☮️ ${s.players[id].name} gains +${pacGains[id]} Influence (Pacifist)`,
      'draft',
    );
  }
  return s;
}
