import { ENGINE } from '@/game/engine/engine';
import type { GameModuleState } from '../game';

export function resolveOffer(
  _gameModuleState: GameModuleState,
  payload: { playerId: number; accept: boolean },
) {
  ENGINE.resolveOffer(payload);
}
