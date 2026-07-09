import type { CardType } from './card-type';
import type { BuildingType } from './building-type';
import type { InfluenceType } from './influence-type';

/** Anything that can appear as a card in the draft pool. */
export type PoolType = CardType | BuildingType | InfluenceType;
