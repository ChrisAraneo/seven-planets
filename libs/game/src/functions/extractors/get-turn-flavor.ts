import { match } from 'ts-pattern';

import {
  ACTION_CARDS_FROM_TURN,
  BUILDINGS_FROM_TURN,
} from '../../config/constants';

// TODO: Rename?
export const getTurnFlavor = (turn: number): string =>
  match(turn)
    .when(
      (total) => total >= ACTION_CARDS_FROM_TURN,
      () => ' · 🃏 5 buildings · 5 resources · 6 actions',
    )
    .when(
      (total) => total >= BUILDINGS_FROM_TURN,
      () => ' · 🃏 5 buildings · 11 resources',
    )
    .otherwise(() => '');
