import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
import { playerStrength } from './player-strength';

export function avgStrength(): number {
  const all = getAlivePlayers().map((player) => playerStrength(player));
  return (
    all.reduce((first, building) => first + building, 0) / (all.length || 1)
  );
}
