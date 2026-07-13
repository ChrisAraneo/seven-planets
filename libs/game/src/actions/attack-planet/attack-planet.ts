import { dispatch } from '../../state';

export interface AttackPlanetPayload {
  playerId: number;
  sourceId: number;
  targetId: number;
  troops: number;
}

/** Launch an attack. Event creator: validation and resolution live in the
    reducer (applyAttackPlanet). */
export function attackPlanet(payload: AttackPlanetPayload): void {
  dispatch({ kind: 'attack', payload });
}
