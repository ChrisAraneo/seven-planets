import { dispatch } from '../state';

export function runGame(): void {
  dispatch({ kind: 'START' });
}
