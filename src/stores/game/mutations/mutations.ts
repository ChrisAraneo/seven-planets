import { attackPlanet } from './attack-planet';
import { endTurn } from './end-turn';
import { moveTroops } from './move-troops';
import { pickCard } from './pick-card';
import { recruitTroops } from './recruit-troops';
import { resolveOffer } from './resolve-offer';
import { reset } from './reset';
import { tradeResources } from './trade-resources';
import { useInfluence } from './use-influence';

export const MUTATIONS = {
  attackPlanet,
  endTurn,
  moveTroops,
  pickCard,
  recruitTroops,
  resolveOffer,
  reset,
  tradeResources,
  useInfluence,
};
