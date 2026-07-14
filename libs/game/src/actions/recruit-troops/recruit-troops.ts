import { dispatch } from '../../state';

export interface RecruitTroopsPayload {
  playerId: number;
  planetId: number;
}

/** Recruit troops. Event creator: validation and resolution live in the
    reducer (applyRecruitTroops). */
export function recruitTroops(payload: RecruitTroopsPayload): void {
  dispatch({ kind: 'RECRUIT_TROOPS', payload });
}
