import { attackPlanet } from './attack-planet/attack-planet';
import { endTurn } from './end-turn/end-turn';
import { makeOffer } from './make-offer/make-offer';
import { moveTroops } from './move-troops/move-troops';
import { pick } from './pick-card/pick-card';
import { recruitTroops } from './recruit-troops/recruit-troops';
import { reset } from './reset';
import { resolveOffer } from './resolve-offer/resolve-offer';
import { setState } from './set-state';
import { useInfluence } from './use-influence/use-influence';

export const MUTATIONS = {
  attackPlanet,
  endTurn,
  moveTroops,
  pickCard: pick,
  recruitTroops,
  resolveOffer,
  reset,
  setState,
  tradeResources: makeOffer,
  useInfluence,
};
