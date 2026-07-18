import { match } from 'ts-pattern';

import type { Action } from '../actions/action';
import { applyStart } from '../functions/apply-start';
import type { GameState } from '../interfaces/game-state';
import { applyAttackPlanet } from './attack-planet/apply-attack-planet';
import { applyEndTurn } from './end-turn/end-turn';
import { applyMakeOffer } from './make-offer/apply-make-offer';
import { applyMoveTroops } from './move-troops/apply-move-troops';
import { applyPickCard } from './pick-card/pick-card';
import { applyRecruitTroops } from './recruit-troops/apply-recruit-troops';
import { applyResolveOffer } from './resolve-offer/apply-resolve-offer';
import { applySetPlanetLayout } from './set-planet-layout/set-planet-layout';
import { applyUseInfluence } from './use-influence/apply-use-influence';

export const applyAction = (state: GameState, action: Action): GameState =>
  match(action)
    .with({ kind: 'START_GAME' }, () => applyStart(state))
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
