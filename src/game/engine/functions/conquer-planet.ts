import {
  CARD_TYPES,
  CONQUEST_TRUCE,
  fmtCards,
  INFLUENCE_TYPES,
} from '@/game/constants';
import { floatText } from '@/game/hooks';
import type { Planet, Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { checkWin } from './check-win';
import { handSize } from './hand-size';
import { log } from './log';
import { stealCards } from './steal-cards';

export function conquerPlanet(
  att: Player,
  target: Planet,
  garrison: number,
): void {
  const state = getGameState();
  const def = state.players[target.ownerId];
  target.ownerId = att.id;
  def.planets = def.planets.filter((id) => id !== target.id);
  att.planets.push(target.id);
  target.troops = garrison; // The winners left after battle hold the planet
  target.protectedUntil = state.turn + CONQUEST_TRUCE; // Truce
  floatText(target, 'CONQUERED!', '#ff9e3d');
  log(
    `🏴 ${att.name} CONQUERS ${target.name} — ${garrison}🪖 garrison it! Under truce for ${CONQUEST_TRUCE} turns.`,
    'war',
  );
  // Invasions burn most of the spoils — only part of the victim's stash survives.
  if (def.planets.length === 0) {
    const lootN = Math.min(6, handSize(def));
    if (lootN > 0) {
      const taken = stealCards(def, att, lootN);
      log(`💰 ${att.name} salvages ${fmtCards(taken)} from the ruins!`, 'war');
    }
    for (const t of CARD_TYPES) {
      def.hand[t] = 0;
    }
    for (const t of INFLUENCE_TYPES) {
      def.hand[t] = 0;
    }
    def.alive = false;
    log(`☠️ ${def.name} has been wiped from the galaxy!`, 'war');
  } else {
    const lootN = Math.min(5, Math.ceil(handSize(def) / 2));
    if (lootN > 0) {
      const taken = stealCards(def, att, lootN);
      log(
        `💰 ${att.name} seizes ${fmtCards(taken)} from the fleeing ${def.name}!`,
        'war',
      );
    }
  }
  checkWin();
}
