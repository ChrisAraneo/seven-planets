import { match } from 'ts-pattern';

import type { Action } from '../actions/action';
import { applyStart } from '../functions/apply-start';
import type { GameState } from '../interfaces/game-state';
import { chain } from '../utils/chain';
import { actionStep } from './action-step';
import { applyAttackPlanet } from './attack-planet/attack-planet';
import { draftStep } from './draft-step';
import { applyEndTurn } from './end-turn/end-turn';
import { applyMakeOffer } from './make-offer/make-offer';
import { applyMoveTroops } from './move-troops/move-troops';
import { applyPickCard } from './pick-card/pick-card';
import { applyRecruitTroops } from './recruit-troops/recruit-troops';
import { applyResolveOffer } from './resolve-offer/resolve-offer';
import { applySetPlanetLayout } from './set-planet-layout/set-planet-layout';
import { finishGame } from './turn-flow';
import { applyUseInfluence } from './use-influence/use-influence';

export const reduce = (state: GameState, action: Action): GameState =>
  chain(applyAction(state, action)).thru(advance).value();

function applyAction(state: GameState, action: Action): GameState {
  return match(action)
    .with({ kind: 'START' }, () => applyStart(state))
    .with({ kind: 'PICK_CARD' }, ({ playerId, index }) =>
      applyPickCard(state, { playerId, index }),
    )
    .with({ kind: 'END_TURN' }, ({ payload }) => applyEndTurn(state, payload))
    .with({ kind: 'ATTACK_PLANET' }, ({ payload }) =>
      applyAttackPlanet(state, payload),
    )
    .with({ kind: 'MOVE_TROOPS' }, ({ payload }) =>
      applyMoveTroops(state, payload),
    )
    .with({ kind: 'RECRUIT_TROOPS' }, ({ payload }) =>
      applyRecruitTroops(state, payload),
    )
    .with({ kind: 'USE_INFLUENCE' }, ({ payload }) =>
      applyUseInfluence(state, payload),
    )
    .with({ kind: 'MAKE_OFFER' }, ({ payload }) =>
      applyMakeOffer(state, payload),
    )
    .with({ kind: 'RESOLVE_OFFER' }, ({ payload }) =>
      applyResolveOffer(state, payload),
    )
    .with({ kind: 'SET_PLANET_LAYOUT' }, ({ payload }) =>
      applySetPlanetLayout(state, payload),
    )
    .exhaustive();
}

export function advance(state: GameState): GameState {
  return match(state)
    .when(isSettled, () => state)
    .when(() => state.over !== null, finishGame)
    .otherwise(() => advance(stepCursor(state)));
}

function isSettled(state: GameState): boolean {
  return (
    state.isAwaitingPick ||
    state.isAwaitingAction ||
    state.cursor.phase === 'setup' ||
    state.cursor.phase === 'done'
  );
}

function stepCursor(state: GameState): GameState {
  return match(state.cursor)
    .with({ phase: 'draft' }, (cursor) => draftStep(state, cursor))
    .with({ phase: 'action' }, (cursor) => actionStep(state, cursor))
    .otherwise(() => state);
}
