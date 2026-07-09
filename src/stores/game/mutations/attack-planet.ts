import { ENGINE } from '@/game/engine/engine';
import type { GameModuleState } from '../game';
import type { AttackPlanetPayload } from '@/game/engine/attack-planet/attack-planet';

export async function attackPlanet(
  gameModuleState: GameModuleState,
  payload: AttackPlanetPayload,
) {
  gameModuleState.state = await ENGINE.attackPlanet(
    gameModuleState.state,
    payload,
  );
}
