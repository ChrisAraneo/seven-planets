import { maxBy, minBy } from 'lodash-es';
import { match } from 'ts-pattern';

import type { GameState } from '../../interfaces/game-state';
import type { InfluenceType } from '../../interfaces/influence-type';
import type { Player } from '../../interfaces/player';
import { computeTotalTroops } from '../compute-total-troops';
import { filterAlivePlayers } from '../filter-alive-players';
import { getOwnedPlanets } from './get-owned-planets';
import { getTechLevel } from './get-tech-level';

export const getInfluenceTarget = (
  state: GameState,
  player: Player,
  influenceType: InfluenceType,
): Player | null =>
  match(filterAlivePlayers(state).filter((rival) => rival.id !== player.id))
    .when(
      (rivals) => rivals.length === 0,
      (): Player | null => null,
    )
    .otherwise((rivals) =>
      match(influenceType)
        .with(
          'SKIP_ARMY',
          () =>
            maxBy(rivals, (rival) => computeTotalTroops(state, rival)) ?? null,
        )
        .with(
          'SKIP_PLANETS',
          () =>
            maxBy(rivals, (rival) => getOwnedPlanets(state, rival).length) ??
            null,
        )
        .with(
          'SKIP_INFLUENCE',
          () => minBy(rivals, (rival) => rival.influence) ?? null,
        )
        .with(
          'SKIP_TECH',
          () => maxBy(rivals, (rival) => getTechLevel(state, rival)) ?? null,
        )
        .otherwise((): Player | null => null),
    );
