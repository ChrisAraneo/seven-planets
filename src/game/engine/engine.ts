import { attackPlanet } from './attack-planet/attack-planet';
import { endTurn } from './end-turn/end-turn';
import { initializeState } from './initialize-state/initialize-state';
import { moveTroops } from './move-troops/move-troops';
import { pick } from './pick-card/pick-card';
import { recruitTroops } from './recruit-troops/recruit-troops';
import { makeOffer } from './make-offer/make-offer';
import { useInfluence } from './use-influence/use-influence';
import { resolveOffer } from './resolve-offer/resolve-offer';

export const ENGINE = {
  attackPlanet,
  endTurn,
  initializeState,
  moveTroops,
  pick,
  recruitTroops,
  resolveOffer,
  makeOffer,
  useInfluence,
};
