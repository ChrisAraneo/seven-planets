import { chain } from '../utils/chain';
import { match, P } from 'ts-pattern';
import {
  BUILD_ORDER,
  BUILDINGS,
  formatCards,
  computeIncomeAmount,
  PACIFIST_INFLUENCE,
} from '../config/constants';
import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';

import { log } from './log';
import { updatePlayers } from './update-players';

const { number, string } = P;

interface IncomeTally {
  handAdd: Record<number, Record<string, number>>; // Cards actually added to hands
  infAdd: Record<number, number>; // Influence actually added
  gains: Record<number, Record<string, number>>; // Production, for the log
  moveGains: Record<number, number>; // L2 Spaceport: free Move card every 3 turns
  infGains: Record<number, number>; // L2 Embassy: +1 ⭐ Influence every turn
  pacGains: Record<number, number>; // Pacifist: +PACIFIST_INFLUENCE ⭐ per planet
}

// Grant every alive owner their per-turn production. Pure: accumulate each player's
// hand/influence deltas, apply them in one structural-sharing pass, then log.
export function doIncome(state: GameState): GameState {
  return chain(
    state.planets.reduce(
      (tally, planet) => addPlanetIncome(tally, state, planet),
      {
        handAdd: {},
        infAdd: {},
        gains: {},
        moveGains: {},
        infGains: {},
        pacGains: {},
      } as IncomeTally,
    ),
  )
    .thru((tally) => logIncome(applyIncome(state, tally), tally))
    .value();
}

function addPlanetIncome(
  tally: IncomeTally,
  state: GameState,
  planet: Planet,
): IncomeTally {
  return match(state.players[planet.ownerId])
    .when(
      (owner) => !owner.isAlive,
      () => tally,
    )
    .otherwise((owner) =>
      chain(tally)
        .thru((tally) => addBuildingIncome(tally, owner.id, planet))
        .thru((tally) => addSpaceportPerk(tally, state.turn, owner.id, planet))
        .thru((tally) => addEmbassyPerk(tally, owner.id, planet))
        .thru((tally) => addPacifistPerk(tally, owner))
        .value(),
    );
}

function addBuildingIncome(
  tally: IncomeTally,
  ownerId: number,
  planet: Planet,
): IncomeTally {
  return BUILD_ORDER.reduce(
    (tally, buildingType) =>
      match({
        level: planet.buildings[buildingType],
        income: BUILDINGS[buildingType].income,
      })
        .with(
          { level: number.positive(), income: string },
          ({ level, income }) =>
            // Scales with level (Mine L2: 3)
            chain(computeIncomeAmount(buildingType, level))
              .thru((amount) => ({
                ...tally,
                handAdd: bumpNested(tally.handAdd, ownerId, income, amount),
                gains: bumpNested(tally.gains, ownerId, income, amount),
              }))
              .value(),
        )
        .otherwise(() => tally),
    tally,
  );
}

// L2 Spaceport perk: grant 1 free Move card every 3rd turn
function addSpaceportPerk(
  tally: IncomeTally,
  turn: number,
  ownerId: number,
  planet: Planet,
): IncomeTally {
  return match(planet.buildings.SPACEPORT || 0)
    .when(
      (level) => level >= 2 && turn % 3 === 0,
      () => ({
        ...tally,
        handAdd: bumpNested(tally.handAdd, ownerId, 'MOVE', 1),
        moveGains: bump(tally.moveGains, ownerId, 1),
      }),
    )
    .otherwise(() => tally);
}

// L2 Embassy perk: +1 Influence per turn
function addEmbassyPerk(
  tally: IncomeTally,
  ownerId: number,
  planet: Planet,
): IncomeTally {
  return match(planet.buildings.EMBASSY || 0)
    .when(
      (level) => level >= 2,
      () => ({
        ...tally,
        infAdd: bump(tally.infAdd, ownerId, 1),
        infGains: bump(tally.infGains, ownerId, 1),
      }),
    )
    .otherwise(() => tally);
}

// Pacifist perk: every planet radiates extra influence every turn.
function addPacifistPerk(tally: IncomeTally, owner: Player): IncomeTally {
  return match(owner.hasPacifistStatus)
    .with(true, () => ({
      ...tally,
      infAdd: bump(tally.infAdd, owner.id, PACIFIST_INFLUENCE),
      pacGains: bump(tally.pacGains, owner.id, PACIFIST_INFLUENCE),
    }))
    .otherwise(() => tally);
}

function applyIncome(state: GameState, tally: IncomeTally): GameState {
  return updatePlayers(state, (player) =>
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
}

function logIncome(state: GameState, tally: IncomeTally): GameState {
  return chain(state)
    .thru((state) =>
      Object.entries(tally.gains).reduce(
        (acc, [id, produced]) =>
          log(
            acc,
            `⚙️ ${acc.players[Number(id)].name} produces ${formatCards(produced)}`,
            'draft',
          ),
        state,
      ),
    )
    .thru((state) =>
      Object.entries(tally.moveGains).reduce(
        (acc, [id, count]) =>
          log(
            acc,
            `🛰️ ${acc.players[Number(id)].name} receives +${count}🛸 Move (L2 Spaceport)`,
            'draft',
          ),
        state,
      ),
    )
    .thru((state) =>
      Object.entries(tally.infGains).reduce(
        (acc, [id, count]) =>
          log(
            acc,
            `⭐ ${acc.players[Number(id)].name} gains +${count} Influence (L2 Embassy)`,
            'draft',
          ),
        state,
      ),
    )
    .thru((state) =>
      Object.entries(tally.pacGains).reduce(
        (acc, [id, count]) =>
          log(
            acc,
            `☮️ ${acc.players[Number(id)].name} gains +${count} Influence (Pacifist)`,
            'draft',
          ),
        state,
      ),
    )
    .value();
}

function bump(
  record: Record<number, number>,
  id: number,
  amount: number,
): Record<number, number> {
  return { ...record, [id]: (record[id] || 0) + amount };
}

function bumpNested(
  record: Record<number, Record<string, number>>,
  id: number,
  key: string,
  amount: number,
): Record<number, Record<string, number>> {
  return {
    ...record,
    [id]: { ...record[id], [key]: (record[id]?.[key] || 0) + amount },
  };
}
