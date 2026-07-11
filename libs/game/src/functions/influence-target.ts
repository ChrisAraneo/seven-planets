import { match } from 'ts-pattern';
import { maxBy, minBy } from 'lodash-es';
import type { GameState } from '../interfaces/game-state';
import type { InfluenceType } from '../interfaces/influence-type';
import type { Player } from '../interfaces/player';

import { filterAlivePlayers } from './filter-alive-players';
import { getTechLevel } from './get-tech-level';
import { ownedPlanets } from './owned-planets';
import { totalTroops } from './total-troops';

// Whom would this skip card hit? Always a RIVAL — the caster is never a target.
export function influenceTarget(
  state: GameState,
  p: Player,
  t: InfluenceType,
): Player | null {
  return match(filterAlivePlayers(state).filter((x) => x.id !== p.id))
    .when(
      (rivals) => rivals.length === 0,
      (): Player | null => null,
    )
    .otherwise((rivals) =>
      match(t)
        .with(
          'SKIP_ARMY',
          () => maxBy(rivals, (x) => totalTroops(state, x)) ?? null,
        )
        .with(
          'SKIP_PLANETS',
          () => maxBy(rivals, (x) => ownedPlanets(state, x).length) ?? null,
        )
        .with('SKIP_INFLUENCE', () => minBy(rivals, (x) => x.influence) ?? null)
        .with(
          'SKIP_TECH',
          () => maxBy(rivals, (x) => getTechLevel(state, x)) ?? null,
        )
        .otherwise((): Player | null => null),
    );
}
