import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
import { computePlayerStrength } from './compute-player-strength';

export function computeAverageStrength(): number {
  const strengths = getAlivePlayers().map((player) =>
    computePlayerStrength(player),
  );
  return (
    strengths.reduce((sum, strength) => sum + strength, 0) /
    (strengths.length || 1)
  );
}
