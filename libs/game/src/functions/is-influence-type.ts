import { INFLUENCE_TYPES } from '../config/constants';
import type { InfluenceType } from '../interfaces/influence-type';

const INFLUENCE_TYPE_SET: ReadonlySet<string> = new Set(INFLUENCE_TYPES);

// Is this card key an influence card (⭐-costed, held in hand)?
export function isInfluenceType(value: string): value is InfluenceType {
  return INFLUENCE_TYPE_SET.has(value);
}
