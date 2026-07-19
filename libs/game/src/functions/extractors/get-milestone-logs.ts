import {
  ACTION_CARDS_FROM_TURN,
  ADVANCED_FROM_TURN,
  BUILDINGS_FROM_TURN,
  MOVE_CARDS_FROM_TURN,
} from '../../config/constants';
import type { GameState } from '../../interfaces/game-state';
import { chain } from '../../utils/chain';
import { logWhenTurnIs } from '../log-when-turn-is';

export const getMilestoneLogs = (state: GameState): GameState =>
  chain(state)
    .thru((current) =>
      logWhenTurnIs(
        current,
        BUILDINGS_FROM_TURN,
        '🏗️ Building cards have entered the pool — pick 1 to construct it on the drafting planet!',
      ),
    )
    .thru((current) =>
      logWhenTurnIs(
        current,
        ACTION_CARDS_FROM_TURN,
        '⚡ Action cards have entered the pool — ⚔️ Attack, 🪖 Recruit and 🔁 Trade can now be drafted!',
      ),
    )
    .thru((current) =>
      logWhenTurnIs(
        current,
        MOVE_CARDS_FROM_TURN,
        '🛸 Move cards have entered the pool — troops can now be redeployed (Spaceport required)!',
      ),
    )
    .thru((current) =>
      logWhenTurnIs(
        current,
        ADVANCED_FROM_TURN,
        '🔬 Advanced blueprints unlocked — the 🔬 Research Lab can now appear in the pool!',
      ),
    )
    .value();
