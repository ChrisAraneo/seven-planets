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
import { distinctUntilChanged, distinctUntilKeyChanged, map } from 'rxjs';

import { getPlayerByIndex } from '../../game/src/getters/get-player-by-index';
import { computeMastermindDraftPick } from './functions/compute-mastermind-draft-pick';
import { getMastermindDecision } from './functions/get-mastermind-decision';
import { shouldAcceptTrade } from './functions/should-accept-trade';

const IS_PACED = typeof document !== 'undefined';

const TURN_START_DELAY = 350;
const BETWEEN_ACTIONS_DELAY = 320;
const PICK_DELAY = 300;

export const isAiSeat = (seatId: number): boolean => {
  const players = getPlayers();
  if (seatId < 0 || seatId >= players.length) {
    return false;
  }
  return !players[seatId].isHuman || IS_AUTO_HUMAN;
};

type Decision = NonNullable<ReturnType<typeof getMastermindDecision>>;

const performDecision = (playerId: number, decision: Decision): void => {
  switch (decision.kind) {
    case 'influence': {
      dispatch(
        createUseInfluenceAction({
          playerId,
          type: decision.type,
          options: decision.options,
        }),
      );
      return;
    }
    case 'attack': {
      dispatch(
        createAttackPlanetAction({
          playerId,
          sourceId: decision.source.id,
          targetId: decision.target.id,
          troops: decision.n,
        }),
      );
      return;
    }
    case 'recruit': {
      recruitTroops({ playerId, planetId: decision.planet.id });
      return;
    }
    case 'move': {
      moveTroops({
        playerId,
        fromId: decision.from.id,
        toId: decision.to.id,
        troops: decision.n,
      });
      return;
    }
    case 'trade': {
      makeOffer({
        playerId,
        partnerId: decision.partner.id,
        gives: decision.gives,
        gets: decision.gets,
      });
      break;
    }
    default: {
      break;
    }
  }
};

const aiPickCard = (playerId: number): void => {
  const state = getGameStateLastValue();
  const player = state.players[playerId];
  const planet =
    state.planets[state.draftPlanetId] ?? getHomePlanet(state, player);
  const pickable = state.pool.map((poolType) =>
    canPickCard(state, player, poolType, planet),
  );
  let index = computeMastermindDraftPick(player, planet, pickable);
  if (index < 0 || !pickable[index]) {
    index = pickable.indexOf(true);
  }
  pickCard({ playerId, index });
};

const takeOneAction = (playerId: number): boolean => {
  if (getIsOver()) {
    return false;
  }

  const player = getPlayerByIndex(playerId);

  if (!player) {
    return false;
  }

  const mastermindDecision = getMastermindDecision(player);

  if (!mastermindDecision) {
    return false;
  }

  performDecision(playerId, mastermindDecision);

  return true;
};

const HEADLESS_ACTION_BUDGET = 12;
let headlessTurnKey = -1;
let headlessActionsLeft = 0;

const headlessTurnStep = (snapshot: GameState): void => {
  if (IS_PACED || !snapshot.isAwaitingAction || !isAiSeat(snapshot.activeId)) {
    return;
  }
  if (snapshot.pendingOffer) {
    return;
  }
  if (snapshot.over) {
    dispatch(createEndTurnAction({ playerId: snapshot.activeId }));
    return;
  }
  if (snapshot.inputSeq !== headlessTurnKey) {
    headlessTurnKey = snapshot.inputSeq;
    headlessActionsLeft = HEADLESS_ACTION_BUDGET;
  }
  if (headlessActionsLeft > 0) {
    headlessActionsLeft -= 1;
    if (takeOneAction(snapshot.activeId)) {
      return;
    }
  }
  dispatch(createEndTurnAction({ playerId: snapshot.activeId }));
};

const aiTakeTurnPaced = (playerId: number, remaining = 12): void => {
  setTimeout(
    () => {
      const didAct = remaining > 0 && takeOneAction(playerId);
      if (didAct) {
        aiTakeTurnPaced(playerId, remaining - 1);
        return;
      }
      dispatch(createEndTurnAction({ playerId }));
    },
    remaining === 12 ? TURN_START_DELAY : BETWEEN_ACTIONS_DELAY,
  );
};

const aiConsiderOffer = (playerId: number): void => {
  const state = getGameStateLastValue();
  const offer = state.pendingOffer;
  if (!offer || offer.toId !== playerId) {
    return;
  }
  const player = state.players[playerId];
  const proposer = state.players[offer.fromId];
  const isAccepted = shouldAcceptTrade(
    player,
    offer.gets,
    offer.gives,
    proposer,
  );
  resolveOffer({ playerId, isAccepted });
};

const respond = (snapshot: GameState): void => {
  if (snapshot.over || !isAiSeat(snapshot.activeId)) {
    return;
  }
  const seatId = snapshot.activeId;
  if (snapshot.isAwaitingPick) {
    if (IS_PACED) {
      setTimeout(() => aiPickCard(seatId), PICK_DELAY);
    } else {
      aiPickCard(seatId);
    }
    return;
  }
  if (snapshot.isAwaitingAction && IS_PACED) {
    aiTakeTurnPaced(seatId);
  }
};

export const installAi = (): void => {
  getGameState().pipe(distinctUntilKeyChanged('inputSeq')).subscribe(respond);

  getGameState()
    .pipe(
      map((snapshot) => snapshot.pendingOffer),
      distinctUntilChanged(),
    )
    .subscribe((offer) => {
      if (offer && isAiSeat(offer.toId)) {
        aiConsiderOffer(offer.toId);
      }
    });

  getGameState().subscribe(headlessTurnStep);
};
