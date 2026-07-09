import type { Player } from '@/game/types';

// KAMIKAZE targeting rule: a kamikaze may only strike the human, and every
// Other AI pretends kamikazes do not exist.
export function mayTarget(att: Player, owner: Player): boolean {
  if (att.kamikaze) {
    return owner.isHuman;
  }
  if (owner.kamikaze) {
    return false;
  }
  return true;
}
