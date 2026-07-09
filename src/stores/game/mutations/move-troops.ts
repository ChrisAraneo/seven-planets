import { ENGINE } from '@/game/engine/engine';
import type { GameModuleState } from '../game';
import type { MoveTroopsPayload } from '@/game/engine/move-troops/move-troops';
import { cloneDeep } from 'lodash-es';

export async function moveTroops(
  gameModuleState: GameModuleState,
  payload: MoveTroopsPayload,
) {
  gameModuleState.state = await ENGINE.moveTroops(
    cloneDeep(gameModuleState.state),
    payload,
  );
}
