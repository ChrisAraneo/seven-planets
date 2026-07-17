import { dispatch } from '../dispatch';

export const runGame = (): void => {
  dispatch({ kind: 'START' });
};
