import { ENGINE } from '@/game/engine/engine';
import type { GameModuleState } from '../game';
import type { AttackPlanetPayload } from '@/game/engine/attack-planet/attack-planet';
import { cloneDeep } from 'lodash-es';

export async function attackPlanet(
  gameModuleState: GameModuleState,
  payload: AttackPlanetPayload,
) {
  gameModuleState.state = await ENGINE.attackPlanet(
    cloneDeep(gameModuleState.state),
    payload,
  );
}
