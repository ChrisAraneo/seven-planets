import { ENGINE } from '@/game/engine/engine';
import type { UseInfluencePayload } from '@/game/engine/use-influence/use-influence';
import type { GameModuleState } from '../game';

export async function useInfluence(
  gameModuleState: GameModuleState,
  payload: UseInfluencePayload,
) {
  gameModuleState.state = await ENGINE.useInfluence(
    gameModuleState.state,
    payload,
  );
}
