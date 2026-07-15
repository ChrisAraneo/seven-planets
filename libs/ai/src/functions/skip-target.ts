import type { InfluenceType, Player } from '@seven-planets/game';

import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
import { owned } from './owned';
import { techLevel } from './tech-level';
import { computeTotalTroops } from './compute-total-troops';

export function skipTarget(
  player: Player,
  influenceType: InfluenceType,
): Player | null {
  const rivals = getAlivePlayers().filter((player) => player.id !== player.id);
  if (rivals.length === 0) {
    return null;
  }
  if (influenceType === 'SKIP_ARMY') {
    return rivals.reduce((player, eachPlayer) =>
      computeTotalTroops(eachPlayer) > computeTotalTroops(player)
        ? eachPlayer
        : player,
    );
  }
  if (influenceType === 'SKIP_PLANETS') {
    return rivals.reduce((player, eachPlayer) =>
      owned(eachPlayer).length > owned(player).length ? eachPlayer : player,
    );
  }
  if (influenceType === 'SKIP_INFLUENCE') {
    return rivals.reduce((player, eachPlayer) =>
      eachPlayer.influence < player.influence ? eachPlayer : player,
    );
  }
  if (influenceType === 'SKIP_TECH') {
    return rivals.reduce((player, eachPlayer) =>
      techLevel(eachPlayer) > techLevel(player) ? eachPlayer : player,
    );
  }
  return null;
}
