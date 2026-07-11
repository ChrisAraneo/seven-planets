import { chain } from 'lodash-es';
import { match, P } from 'ts-pattern';
import {
  BUILD_ORDER,
  BUILDINGS,
  fmtCards,
  incomeAmount,
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
    state.planets.reduce((tally, pl) => addPlanetIncome(tally, state, pl), {
      handAdd: {},
      infAdd: {},
      gains: {},
      moveGains: {},
      infGains: {},
      pacGains: {},
    } as IncomeTally),
  )
    .thru((tally) => logIncome(applyIncome(state, tally), tally))
    .value();
}

function addPlanetIncome(
  tally: IncomeTally,
  state: GameState,
  pl: Planet,
): IncomeTally {
  return match(state.players[pl.ownerId])
    .when(
      (owner) => !owner.isAlive,
      () => tally,
    )
    .otherwise((owner) =>
      chain(tally)
        .thru((t) => addBuildingIncome(t, owner.id, pl))
        .thru((t) => addSpaceportPerk(t, state.turn, owner.id, pl))
        .thru((t) => addEmbassyPerk(t, owner.id, pl))
        .thru((t) => addPacifistPerk(t, owner))
        .value(),
    );
}

function addBuildingIncome(
  tally: IncomeTally,
  ownerId: number,
  pl: Planet,
): IncomeTally {
  return BUILD_ORDER.reduce(
    (t, b) =>
      match({ level: pl.buildings[b], income: BUILDINGS[b].income })
        .with(
          { level: number.positive(), income: string },
          ({ level, income }) =>
            // Scales with level (Mine L2: 3)
            chain(incomeAmount(b, level))
              .thru((amount) => ({
                ...t,
                handAdd: bumpNested(t.handAdd, ownerId, income, amount),
                gains: bumpNested(t.gains, ownerId, income, amount),
              }))
              .value(),
        )
        .otherwise(() => t),
    tally,
  );
}

// L2 Spaceport perk: grant 1 free Move card every 3rd turn
function addSpaceportPerk(
  tally: IncomeTally,
  turn: number,
  ownerId: number,
  pl: Planet,
): IncomeTally {
  return match(pl.buildings.SPACEPORT || 0)
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
  pl: Planet,
): IncomeTally {
  return match(pl.buildings.EMBASSY || 0)
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
  return updatePlayers(state, (p) =>
    match({ ha: tally.handAdd[p.id], ia: tally.infAdd[p.id] })
      .when(
        ({ ha, ia }) => !ha && !ia,
        () => p,
      )
      .otherwise(({ ha, ia }) => ({
        ...p,
        hand: Object.entries(ha ?? {}).reduce(
          (hand, [k, v]) => ({ ...hand, [k]: (hand[k] || 0) + v }),
          { ...p.hand },
        ),
        influence: p.influence + (ia || 0),
      })),
  );
}

function logIncome(state: GameState, tally: IncomeTally): GameState {
  return chain(state)
    .thru((s) =>
      Object.entries(tally.gains).reduce(
        (acc, [id, produced]) =>
          log(
            acc,
            `⚙️ ${acc.players[Number(id)].name} produces ${fmtCards(produced)}`,
            'draft',
          ),
        s,
      ),
    )
    .thru((s) =>
      Object.entries(tally.moveGains).reduce(
        (acc, [id, n]) =>
          log(
            acc,
            `🛰️ ${acc.players[Number(id)].name} receives +${n}🛸 Move (L2 Spaceport)`,
            'draft',
          ),
        s,
      ),
    )
    .thru((s) =>
      Object.entries(tally.infGains).reduce(
        (acc, [id, n]) =>
          log(
            acc,
            `⭐ ${acc.players[Number(id)].name} gains +${n} Influence (L2 Embassy)`,
            'draft',
          ),
        s,
      ),
    )
    .thru((s) =>
      Object.entries(tally.pacGains).reduce(
        (acc, [id, n]) =>
          log(
            acc,
            `☮️ ${acc.players[Number(id)].name} gains +${n} Influence (Pacifist)`,
            'draft',
          ),
        s,
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
