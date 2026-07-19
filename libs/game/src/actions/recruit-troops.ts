import { dispatch } from '../dispatch';

export interface RecruitTroopsPayload {
  playerId: number;
  planetId: number;
}

export const recruitTroops = (payload: RecruitTroopsPayload): void => {
  dispatch({ kind: 'RECRUIT_TROOPS', payload });
};
