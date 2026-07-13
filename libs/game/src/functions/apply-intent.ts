import { match } from 'ts-pattern';

import { applyAttackPlanet } from '../actions/attack-planet';
import { applyEndTurn } from '../actions/end-turn/end-turn';
import { applyMakeOffer } from '../actions/make-offer';
import { applyMoveTroops } from '../actions/move-troops';
import { applyPickCard } from '../actions/pick-card/pick-card';
import { applyRecruitTroops } from '../actions/recruit-troops';
import { applyResolveOffer } from '../actions/resolve-offer';
import { applySetPlanetLayout } from '../actions/set-planet-layout/set-planet-layout';
import { applyUseInfluence } from '../actions/use-influence';
import type { GameIntent } from '../intents';
import type { GameState } from '../interfaces/game-state';
import { applyStart } from './apply-start';

/* The intent's own semantics — one branch per intent kind, each a transplant
   of the old action body: validate, clone, mutate, return. An illegal intent
   reduces to the unchanged state (no-op), never a throw. Advancing the game
   afterwards is advance()'s job (see reduce.ts). */
export function applyIntent(state: GameState, intent: GameIntent): GameState {
  return match(intent)
    .with({ kind: 'start' }, () => applyStart(state))
    .with({ kind: 'pick' }, ({ playerId, idx }) =>
      applyPickCard(state, { playerId, idx }),
    )
    .with({ kind: 'endTurn' }, ({ playerId }) =>
      applyEndTurn(state, { playerId }),
    )
    .with({ kind: 'attack' }, ({ payload }) =>
      applyAttackPlanet(state, payload),
    )
    .with({ kind: 'move' }, ({ payload }) => applyMoveTroops(state, payload))
    .with({ kind: 'recruit' }, ({ payload }) =>
      applyRecruitTroops(state, payload),
    )
    .with({ kind: 'influence' }, ({ payload }) =>
      applyUseInfluence(state, payload),
    )
    .with({ kind: 'offer' }, ({ payload }) => applyMakeOffer(state, payload))
    .with({ kind: 'resolveOffer' }, ({ payload }) =>
      applyResolveOffer(state, payload),
    )
    .with({ kind: 'layout' }, ({ payload }) =>
      applySetPlanetLayout(state, payload),
    )
    .exhaustive();
}
