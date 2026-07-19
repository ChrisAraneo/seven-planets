import type { InfluenceType, Player } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
import { computeTechLevel } from './compute-tech-level';
import { computeTotalTroops } from './compute-total-troops';
import { getOwnedPlanets } from './get-owned-planets';

export const getSkipTarget = (
  player: Player,
  influenceType: InfluenceType,
): Player | null =>
  match(getAlivePlayers().filter((rival) => rival.id !== player.id))
    .when(
      (rivals) => rivals.length === 0,
      () => null,
    )
    .otherwise((rivals) =>
      match(influenceType)
        .with('SKIP_ARMY', () =>
          rivals.reduce((best, rival) =>
            match(computeTotalTroops(rival) > computeTotalTroops(best))
              .with(true, () => rival)
              .otherwise(() => best),
          ),
        )
        .with('SKIP_PLANETS', () =>
          rivals.reduce((best, rival) =>
            match(getOwnedPlanets(rival).length > getOwnedPlanets(best).length)
              .with(true, () => rival)
              .otherwise(() => best),
          ),
        )
        .with('SKIP_INFLUENCE', () =>
          rivals.reduce((best, rival) =>
            match(rival.influence < best.influence)
              .with(true, () => rival)
              .otherwise(() => best),
          ),
        )
        .with('SKIP_TECH', () =>
          rivals.reduce((best, rival) =>
            match(computeTechLevel(rival) > computeTechLevel(best))
              .with(true, () => rival)
              .otherwise(() => best),
          ),
        )
        .otherwise(() => null),
    );
