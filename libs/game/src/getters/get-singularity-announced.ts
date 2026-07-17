import { getGameStateLastValue } from '../get-game-state-last-value';

export const getSingularityAnnounced = (): boolean =>
  getGameStateLastValue().isSingularityAnnounced;
