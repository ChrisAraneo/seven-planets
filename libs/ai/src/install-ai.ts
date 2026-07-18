import type { GameState } from '@seven-planets/game';
import {
  getGameState,
  getGameStateLastValue,
  getIsOver,
  getPlayers,
  IS_AUTO_HUMAN,
} from '@seven-planets/game';
import { canPickCard } from '@seven-planets/game';
import { getHomePlanet } from '@seven-planets/game';
import {
  createAttackPlanetAction,
  createEndTurnAction,
  createUseInfluenceAction,
  dispatch,
  makeOffer,
  moveTroops,
  pickCard,
  recruitTroops,
  resolveOffer,
} from '@seven-planets/game';
import { assign, noop } from 'lodash-es';
import { distinctUntilChanged, distinctUntilKeyChanged, map } from 'rxjs';
import { match } from 'ts-pattern';

import { getPlayerByIndex } from '../../game/src/getters/get-player-by-index';
import { computeMastermindDraftPick } from './functions/compute-mastermind-draft-pick';
import { getMastermindDecision } from './functions/get-mastermind-decision';
import { shouldAcceptTrade } from './functions/should-accept-trade';
import { chain } from './utils/chain';
import { nullish } from './utils/p';

const IS_PACED = typeof document !== 'undefined';

const TURN_START_DELAY = 350;
const BETWEEN_ACTIONS_DELAY = 320;
const PICK_DELAY = 300;

export const isAiSeat = (seatId: number): boolean =>
  chain(getPlayers())
    .thru((players) =>
      match(seatId < 0 || seatId >= players.length)
        .with(true, () => false)
        .otherwise(() => !players[seatId].isHuman || IS_AUTO_HUMAN),
    )
    .value();

type Decision = NonNullable<ReturnType<typeof getMastermindDecision>>;

const performDecision = (playerId: number, decision: Decision): void =>
  match(decision)
    .with({ kind: 'influence' }, ({ type, options }) =>
      dispatch(createUseInfluenceAction({ playerId, type, options })),
    )
    .with({ kind: 'attack' }, ({ source, target, n }) =>
      dispatch(
        createAttackPlanetAction({
          playerId,
          sourceId: source.id,
          targetId: target.id,
          troops: n,
        }),
      ),
    )
    .with({ kind: 'recruit' }, ({ planet }) =>
      recruitTroops({ playerId, planetId: planet.id }),
    )
    .with({ kind: 'move' }, ({ from, to, n }) =>
      moveTroops({ playerId, fromId: from.id, toId: to.id, troops: n }),
    )
    .with({ kind: 'trade' }, ({ partner, gives, gets }) =>
      makeOffer({ playerId, partnerId: partner.id, gives, gets }),
    )
    .exhaustive();

const aiPickCard = (playerId: number): void =>
  chain(getGameStateLastValue())
    .thru((state) => ({
      state,
      player: state.players[playerId],
      planet:
        state.planets[state.draftPlanetId] ??
        getHomePlanet(state, state.players[playerId]),
    }))
    .thru(({ state, player, planet }) => ({
      player,
      planet,
      pickable: state.pool.map((poolType) =>
        canPickCard(state, player, poolType, planet),
      ),
    }))
    .thru(({ player, planet, pickable }) =>
      chain(computeMastermindDraftPick(player, planet, pickable))
        .thru((index) =>
          match(index < 0 || !pickable[index])
            .with(true, () => pickable.indexOf(true))
            .otherwise(() => index),
        )
        .value(),
    )
    .thru((index) => pickCard({ playerId, index }))
    .thru(noop)
    .value();

const take1Action = (playerId: number): boolean =>
  !getIsOver() &&
  match(getPlayerByIndex(playerId))
    .with(nullish, () => false)
    .otherwise((player) =>
      match(getMastermindDecision(player))
        .with(nullish, () => false)
        .otherwise((decision) =>
          chain(decision)
            .tap((mastermindDecision) =>
              performDecision(playerId, mastermindDecision),
            )
            .thru(() => true)
            .value(),
        ),
    );

const HEADLESS_ACTION_BUDGET = 12;
const HEADLESS = { turnKey: -1, actionsLeft: 0 };

const tryHeadlessAction = (snapshot: GameState): boolean =>
  match(HEADLESS.actionsLeft > 0)
    .with(false, () => false)
    .otherwise(() =>
      chain(assign(HEADLESS, { actionsLeft: HEADLESS.actionsLeft - 1 }))
        .thru(() => take1Action(snapshot.activeId))
        .value(),
    );

const headlessTurnStep = (snapshot: GameState): void =>
  match(snapshot)
    .when(
      () =>
        IS_PACED ||
        !snapshot.isAwaitingAction ||
        !isAiSeat(snapshot.activeId) ||
        Boolean(snapshot.pendingOffer),
      noop,
    )
    .when(
      () => Boolean(snapshot.over),
      () => dispatch(createEndTurnAction({ playerId: snapshot.activeId })),
    )
    .otherwise(() =>
      chain(snapshot)
        .tap(() =>
          match(snapshot.inputSeq !== HEADLESS.turnKey)
            .with(true, () =>
              assign(HEADLESS, {
                turnKey: snapshot.inputSeq,
                actionsLeft: HEADLESS_ACTION_BUDGET,
              }),
            )
            .otherwise(noop),
        )
        .thru(() =>
          match(tryHeadlessAction(snapshot))
            .with(true, noop)
            .otherwise(() =>
              dispatch(createEndTurnAction({ playerId: snapshot.activeId })),
            ),
        )
        .value(),
    );

const aiTakeTurnPaced = (playerId: number, remaining = 12): void =>
  chain(
    setTimeout(
      () =>
        match(remaining > 0 && take1Action(playerId))
          .with(true, () => aiTakeTurnPaced(playerId, remaining - 1))
          .otherwise(() => dispatch(createEndTurnAction({ playerId }))),
      match(remaining === 12)
        .with(true, () => TURN_START_DELAY)
        .otherwise(() => BETWEEN_ACTIONS_DELAY),
    ),
  )
    .thru(noop)
    .value();

const aiConsiderOffer = (playerId: number): void =>
  chain(getGameStateLastValue())
    .thru((state) => ({ state, offer: state.pendingOffer }))
    .thru(({ state, offer }) =>
      match(offer)
        .with(nullish, noop)
        .when((candidate) => candidate.toId !== playerId, noop)
        .otherwise((candidate) =>
          resolveOffer({
            playerId,
            isAccepted: shouldAcceptTrade(
              state.players[playerId],
              candidate.gets,
              candidate.gives,
              state.players[candidate.fromId],
            ),
          }),
        ),
    )
    .thru(noop)
    .value();

const respond = (snapshot: GameState): void =>
  match(snapshot)
    .when(() => Boolean(snapshot.over) || !isAiSeat(snapshot.activeId), noop)
    .when(
      () => snapshot.isAwaitingPick,
      () =>
        match(IS_PACED)
          .with(true, () =>
            chain(setTimeout(() => aiPickCard(snapshot.activeId), PICK_DELAY))
              .thru(noop)
              .value(),
          )
          .otherwise(() => aiPickCard(snapshot.activeId)),
    )
    .otherwise(() =>
      match(snapshot.isAwaitingAction && IS_PACED)
        .with(true, () => aiTakeTurnPaced(snapshot.activeId))
        .otherwise(noop),
    );

export const installAi = (): void =>
  chain(getGameState())
    .tap((state$) =>
      state$.pipe(distinctUntilKeyChanged('inputSeq')).subscribe(respond),
    )
    .tap((state$) =>
      state$
        .pipe(
          map((snapshot) => snapshot.pendingOffer),
          distinctUntilChanged(),
        )
        .subscribe((offer) =>
          match(offer)
            .with(nullish, noop)
            .when((candidate) => !isAiSeat(candidate.toId), noop)
            .otherwise((candidate) => aiConsiderOffer(candidate.toId)),
        ),
    )
    .tap((state$) => state$.subscribe(headlessTurnStep))
    .thru(noop)
    .value();
