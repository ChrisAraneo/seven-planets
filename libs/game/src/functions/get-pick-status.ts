import { match } from 'ts-pattern';

import type { GameState } from '../interfaces/game-state';
import { getExtraTurnSuffix } from './get-extra-turn-suffix';

interface PickProgress {
  picks: number;
  counter: number;
  slot: number;
}

export const getPickStatus = (
  state: GameState,
  seatId: number,
  planetId: number,
  { picks, counter, slot }: PickProgress,
  isHumanControlled: boolean,
): string =>
  match(isHumanControlled)
    .with(
      true,
      () =>
        `YOUR PICK — ${state.planets[planetId].name} drafts card ${counter + 1} of ${picks}${getExtraTurnSuffix(slot)}`,
    )
    .otherwise(
      () =>
        `${state.players[seatId].name} is drafting for ${state.planets[planetId].name}…`,
    );
