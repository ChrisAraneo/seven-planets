import type { AttackPlanetAction } from './attack-planet';
import type { EndTurnAction } from './end-turn';
import type { MakeOfferPayload } from './make-offer/make-offer';
import type { MoveTroopsPayload } from './move-troops/move-troops';
import type { RecruitTroopsPayload } from './recruit-troops/recruit-troops';
import type { ResolveOfferPayload } from './resolve-offer/resolve-offer';
import type { PlanetLayout } from './set-planet-layout/set-planet-layout';
import type { UseInfluenceAction } from './use-influence';

export type Action =
  | { kind: 'START_GAME' }
  | { kind: 'PICK_CARD'; playerId: number; index: number }
  | EndTurnAction
  | AttackPlanetAction
  | { kind: 'MOVE_TROOPS'; payload: MoveTroopsPayload }
  | { kind: 'RECRUIT_TROOPS'; payload: RecruitTroopsPayload }
  | UseInfluenceAction
  | { kind: 'MAKE_OFFER'; payload: MakeOfferPayload }
  | { kind: 'RESOLVE_OFFER'; payload: ResolveOfferPayload }
  | { kind: 'SET_PLANET_LAYOUT'; payload: readonly PlanetLayout[] };
