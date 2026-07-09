import { ENGINE } from '@/game/engine/engine';
import type { PickCardPayload } from '@/game/engine/pick-card/pick-card';
import type { GameModuleState } from '../game';

export async function pickCard(
  gameModuleState: GameModuleState,
  payload: PickCardPayload,
) {
  gameModuleState.state = await ENGINE.pick(gameModuleState.state, payload);
}
