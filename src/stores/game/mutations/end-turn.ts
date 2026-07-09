import { ENGINE } from '@/game/engine/engine';
import type { GameModuleState } from '../game';
import type { EndTurnPayload } from '@/game/engine/end-turn/end-turn';
import { cloneDeep } from 'lodash-es';

export async function endTurn(
  gameModuleState: GameModuleState,
  payload: EndTurnPayload,
) {
  gameModuleState.state = await ENGINE.endTurn(
    cloneDeep(gameModuleState.state),
    payload,
  );
}
