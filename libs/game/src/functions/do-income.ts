import { match, P } from 'ts-pattern';

import {
  BUILD_ORDER,
  BUILDINGS,
  computeIncomeAmount,
  formatCards,
  PACIFIST_INFLUENCE,
} from '../config/constants';
import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';
import { chain } from '../utils/chain';
import { log } from './log';
import { updatePlayers } from './update-players';

const { number, string } = P;

interface IncomeTally {
  handAdd: Partial<Record<number, Record<string, number>>>;
  infAdd: Partial<Record<number, number>>;
  gains: Partial<Record<number, Record<string, number>>>;
  moveGains: Partial<Record<number, number>>;
  infGains: Partial<Record<number, number>>;
  pacGains: Partial<Record<number, number>>;
}

const SPACEPORT_MOVE_PERIOD = 3;

export function doIncome(state: GameState): GameState {
  return chain(
    state.planets.reduce<IncomeTally>(
      (tally, planet) => addPlanetIncome(tally, state, planet),
      {
        handAdd: {},
        infAdd: {},
        gains: {},
        moveGains: {},
        infGains: {},
        pacGains: {},
      },
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
        .thru((acc) => addBuildingIncome(acc, owner.id, planet))
        .thru((acc) => addSpaceportPerk(acc, state.turn, owner.id, planet))
        .thru((acc) => addEmbassyPerk(acc, owner.id, planet))
        .thru((acc) => addPacifistPerk(acc, owner))
        .value(),
    );
}

function addBuildingIncome(
  tally: IncomeTally,
  ownerId: number,
  planet: Planet,
): IncomeTally {
  return BUILD_ORDER.reduce(
    (acc, buildingType) =>
      match({
        level: planet.buildings[buildingType],
        income: BUILDINGS[buildingType].income,
      })
        .with(
          { level: number.positive(), income: string },
          ({ level, income }) =>
            chain(computeIncomeAmount(buildingType, level))
              .thru((amount) => ({
                ...acc,
                handAdd: bumpNested(acc.handAdd, ownerId, income, amount),
                gains: bumpNested(acc.gains, ownerId, income, amount),
              }))
              .value(),
        )
        .otherwise(() => acc),
    tally,
  );
}

function addSpaceportPerk(
  tally: IncomeTally,
  turn: number,
  ownerId: number,
  planet: Planet,
): IncomeTally {
  return match(planet.buildings.SPACEPORT || 0)
    .when(
      (level) => level >= 2 && turn % SPACEPORT_MOVE_PERIOD === 0,
      () => ({
        ...tally,
        handAdd: bumpNested(tally.handAdd, ownerId, 'MOVE', 1),
        moveGains: bump(tally.moveGains, ownerId, 1),
      }),
    )
    .otherwise(() => tally);
}

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
    .thru((current) =>
      Object.entries(tally.gains).reduce(
        (acc, [id, produced]) =>
          log(
            acc,
            `⚙️ ${acc.players[Number(id)].name} produces ${formatCards(produced ?? {})}`,
            'draft',
          ),
        current,
      ),
    )
    .thru((current) =>
      Object.entries(tally.moveGains).reduce(
        (acc, [id, count]) =>
          log(
            acc,
            `🛰️ ${acc.players[Number(id)].name} receives +${count}🛸 Move (L2 Spaceport)`,
            'draft',
          ),
        current,
      ),
    )
    .thru((current) =>
      Object.entries(tally.infGains).reduce(
        (acc, [id, count]) =>
          log(
            acc,
            `⭐ ${acc.players[Number(id)].name} gains +${count} Influence (L2 Embassy)`,
            'draft',
          ),
        current,
      ),
    )
    .thru((current) =>
      Object.entries(tally.pacGains).reduce(
        (acc, [id, count]) =>
          log(
            acc,
            `☮️ ${acc.players[Number(id)].name} gains +${count} Influence (Pacifist)`,
            'draft',
          ),
        current,
      ),
    )
    .value();
}

function bump(
  record: Partial<Record<number, number>>,
  id: number,
  amount: number,
): Partial<Record<number, number>> {
  return { ...record, [id]: (record[id] || 0) + amount };
}

function bumpNested(
  record: Partial<Record<number, Record<string, number>>>,
  id: number,
  key: string,
  amount: number,
): Partial<Record<number, Record<string, number>>> {
  return {
    ...record,
    [id]: { ...record[id], [key]: (record[id]?.[key] || 0) + amount },
  };
}
