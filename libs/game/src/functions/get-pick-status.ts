import { match } from 'ts-pattern';

import type { GameState } from '../interfaces/game-state';

// The status line shown while a draft pick is parked awaiting its answer.
export function getPickStatus(
  state: GameState,
  seatId: number,
  planetId: number,
  picks: number,
  counter: number,
  slot: number,
  isHumanControlled: boolean,
): string {
  return match(isHumanControlled)
    .with(
      true,
      () =>
        `YOUR PICK — ${state.planets[planetId].name} drafts card ${counter + 1} of ${picks}${getExtraTurnSuffix(slot)}`,
    )
    .otherwise(
      () =>
        `${state.players[seatId].name} is drafting for ${state.planets[planetId].name}…`,
    );
}

function getExtraTurnSuffix(slot: number): string {
  return match(slot)
    .when(
      (count) => count > 0,
      () => ' (extra planet turn)',
    )
    .otherwise(() => '');
}
