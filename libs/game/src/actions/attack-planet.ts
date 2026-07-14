export type AttackPlanetAction = {
  kind: 'ATTACK_PLANET';
  payload: AttackPlanetPayload;
};

export interface AttackPlanetPayload {
  playerId: number;
  sourceId: number;
  targetId: number;
  troops: number;
}

export const createAttackPlanetAction = (
  payload: AttackPlanetPayload,
): AttackPlanetAction => ({ kind: 'ATTACK_PLANET', payload });
