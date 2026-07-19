import { match } from 'ts-pattern';

import type { GameState } from '../../../interfaces/game-state';
import type { BattleContext } from './resolve-battle';

export const getBattleLine = (
  state: GameState,
  {
    target,
    defenderId,
    attackPower,
    defensePower,
    didWin,
    attLoss,
    defLoss,
  }: BattleContext,
  attackerId: number,
): string =>
  `💥 Battle for ${target.name}: attack ${attackPower} vs defense ${defensePower} — ${match(
    didWin,
  )
    .with(true, () => `${state.players[attackerId].name} WINS`)
    .otherwise(
      () => `${state.players[defenderId].name} holds`,
    )}! Losses: ${state.players[attackerId].name} -${attLoss}🪖, ${state.players[defenderId].name} -${defLoss}🪖`;
