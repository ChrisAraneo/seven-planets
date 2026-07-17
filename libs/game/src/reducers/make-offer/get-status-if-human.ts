import { assign } from 'lodash-es';
import { match } from 'ts-pattern';

import { IS_AUTO_HUMAN } from '../../functions/auto-human';
import { setStatus } from '../../functions/set-status';
import type { GameState } from '../../interfaces/game-state';
import type { Player } from '../../interfaces/player';

export const getStatusIfHuman = (
  state: GameState,
  player: Player,
  partner: Player,
): GameState =>
  match(partner.isHuman && !IS_AUTO_HUMAN)
    .with(true, () =>
      assign(
        state,
        setStatus(state, `${player.name} is hailing you with a trade offer…`),
      ),
    )
    .otherwise(() => state);
