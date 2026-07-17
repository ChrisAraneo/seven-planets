import { match } from 'ts-pattern';

import type { GameState } from '../interfaces/game-state';
import type { IncomeTally } from './do-income';
import { updatePlayers } from './update-players';

export const applyIncome = (state: GameState, tally: IncomeTally): GameState =>
  updatePlayers(state, (player) =>
    match({ ha: tally.handAdd[player.id], ia: tally.infAdd[player.id] })
      .when(
        ({ ha: handAdd, ia: influenceAdd }) => !handAdd && !influenceAdd,
        () => player,
      )
      .otherwise(({ ha: handAdd, ia: influenceAdd }) => ({
        ...player,
        hand: Object.entries(handAdd ?? {}).reduce(
          (hand, [key, value]) => ({
            ...hand,
            [key]: (hand[key] || 0) + value,
          }),
          { ...player.hand },
        ),
        influence: player.influence + (influenceAdd || 0),
      })),
  );
