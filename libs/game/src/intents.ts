import type { AttackPlanetPayload } from './actions/attack-planet';
import type { MakeOfferPayload } from './actions/make-offer';
import type { MoveTroopsPayload } from './actions/move-troops';
import type { RecruitTroopsPayload } from './actions/recruit-troops';
import type { ResolveOfferPayload } from './actions/resolve-offer';
import type { PlanetLayout } from './actions/set-planet-layout/set-planet-layout';
import type { UseInfluencePayload } from './actions/use-influence';

/* Every player intent, human or AI, is an event on one stream; the whole
   game is a fold over it (see state.ts). The action functions are thin
   event creators for these — call sites never build intents by hand. */
export type GameIntent =
  | { kind: 'start' }
  | { kind: 'pick'; playerId: number; idx: number }
  | { kind: 'endTurn'; playerId: number }
  | { kind: 'attack'; payload: AttackPlanetPayload }
  | { kind: 'move'; payload: MoveTroopsPayload }
  | { kind: 'recruit'; payload: RecruitTroopsPayload }
  | { kind: 'influence'; payload: UseInfluencePayload }
  | { kind: 'offer'; payload: MakeOfferPayload }
  | { kind: 'resolveOffer'; payload: ResolveOfferPayload }
  | { kind: 'layout'; payload: readonly PlanetLayout[] };
