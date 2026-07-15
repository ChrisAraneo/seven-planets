import { match } from 'ts-pattern';
import { maxBy, minBy } from 'lodash-es';
import type { GameState } from '../interfaces/game-state';
import type { InfluenceType } from '../interfaces/influence-type';
import type { Player } from '../interfaces/player';

import { filterAlivePlayers } from './filter-alive-players';
import { getTechLevel } from './get-tech-level';
import { getOwnedPlanets } from './get-owned-planets';
import { computeTotalTroops } from './compute-total-troops';

// Whom would this skip card hit? Always a RIVAL — the caster is never a target.
export function getInfluenceTarget(
  state: GameState,
  player: Player,
  influenceType: InfluenceType,
): Player | null {
  return match(
    filterAlivePlayers(state).filter((player) => player.id !== player.id),
  )
    .when(
      (rivals) => rivals.length === 0,
      (): Player | null => null,
    )
    .otherwise((rivals) =>
      match(influenceType)
        .with(
          'SKIP_ARMY',
          () =>
            maxBy(rivals, (player) => computeTotalTroops(state, player)) ??
            null,
        )
        .with(
          'SKIP_PLANETS',
          () =>
            maxBy(rivals, (player) => getOwnedPlanets(state, player).length) ??
            null,
        )
        .with(
          'SKIP_INFLUENCE',
          () => minBy(rivals, (player) => player.influence) ?? null,
        )
        .with(
          'SKIP_TECH',
          () => maxBy(rivals, (player) => getTechLevel(state, player)) ?? null,
        )
        .otherwise((): Player | null => null),
    );
}
