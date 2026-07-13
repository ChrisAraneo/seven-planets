import type { AttackPlanetPayload } from './attack-planet/attack-planet';
import type { MakeOfferPayload } from './make-offer/make-offer';
import type { MoveTroopsPayload } from './move-troops/move-troops';
import type { RecruitTroopsPayload } from './recruit-troops/recruit-troops';
import type { ResolveOfferPayload } from './resolve-offer/resolve-offer';
import type { PlanetLayout } from './set-planet-layout/set-planet-layout';
import type { UseInfluencePayload } from './use-influence/use-influence';

export type Action =
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
