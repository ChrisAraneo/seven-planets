import { PRIORITIES } from '@/game/constants';
import type { Player } from '@/game/types';

export function persOf(p: Player): string {
  return PRIORITIES[p.personality] ? p.personality : 'balanced';
}
