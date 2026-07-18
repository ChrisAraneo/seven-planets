import { PRIORITIES } from '../../config/constants';
import type { BuildGoal } from '../../interfaces/build-goal';
import type { GameState } from '../../interfaces/game-state';
import type { Player } from '../../interfaces/player';
import { chain } from '../../utils/chain';
import { getBuildGoalFor } from './get-build-goal-for';
import { getTechLevel } from './get-tech-level';

// TODO: OK
export const getNextBuildGoal = (
  state: GameState,
  player: Player,
): BuildGoal | null =>
  chain(getTechLevel(state, player))
    .thru(
      (tech) =>
        PRIORITIES.filter((id) => id !== 'SINGULARITY')
          .map((id) => getBuildGoalFor(state, player, id, tech))
          .find((goal) => goal !== null) ?? null,
    )
    .value();
