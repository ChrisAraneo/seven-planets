import { match } from 'ts-pattern';

import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import { chain } from '../utils/chain';
import { addBuildingIncome } from './add-building-income';
import { addEmbassyPerk } from './add-embassy-perk';
import { addPacifistPerk } from './add-pacifist-perk';
import { addSpaceportPerk } from './add-spaceport-perk';
import type { IncomeTally } from './do-income';

export const addPlanetIncome = (
  tally: IncomeTally,
  state: GameState,
  planet: Planet,
): IncomeTally =>
  match(state.players[planet.ownerId])
    .when(
      (owner) => !owner.isAlive,
      () => tally,
    )
    .otherwise((owner) =>
      chain(tally)
        .thru((acc) => addBuildingIncome(acc, owner.id, planet))
        .thru((acc) => addSpaceportPerk(acc, state.turn, owner.id, planet))
        .thru((acc) => addEmbassyPerk(acc, owner.id, planet))
        .thru((acc) => addPacifistPerk(acc, owner))
        .value(),
    );
