import { dispatch } from '../../dispatch';

export const startGame = (): void => {
  dispatch({ kind: 'START_GAME' });
};
