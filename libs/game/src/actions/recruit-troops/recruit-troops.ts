import { dispatch } from '../../state';

export interface RecruitTroopsPayload {
  playerId: number;
  planetId: number;
}

export function recruitTroops(payload: RecruitTroopsPayload): void {
  dispatch({ kind: 'RECRUIT_TROOPS', payload });
}
