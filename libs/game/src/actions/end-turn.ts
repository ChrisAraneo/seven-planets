export type EndTurnAction = {
  kind: 'END_TURN';
  payload: EndTurnPayload;
};

export interface EndTurnPayload {
  playerId: number;
}

export const createEndTurnAction = (
  payload: EndTurnPayload,
): EndTurnAction => ({
  kind: 'END_TURN',
  payload,
});
