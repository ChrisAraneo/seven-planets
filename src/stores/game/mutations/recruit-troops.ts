import { ENGINE } from '@/game/engine/engine';
import type { RecruitTroopsPayload } from '@/game/engine/recruit-troops/recruit-troops';
import type { GameModuleState } from '../game';

export async function recruitTroops(
  gameModuleState: GameModuleState,
  payload: RecruitTroopsPayload,
) {
  gameModuleState.state = await ENGINE.recruitTroops(
    gameModuleState.state,
    payload,
  );
}
