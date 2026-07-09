import { ENGINE } from '@/game/engine/engine';
import type { Cost } from '@/game/types';
import type { GameModuleState } from '../game';

export async function tradeResources(
  gameModuleState: GameModuleState,
  payload: { playerId: number; partnerId: number; gives: Cost; gets: Cost },
) {
  await ENGINE.trade(gameModuleState.state, payload);
}
