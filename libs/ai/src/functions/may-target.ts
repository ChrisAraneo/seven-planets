import type { Player } from '@seven-planets/game';

// KAMIKAZE targeting rule: a kamikaze may only strike the human, and every
// Other AI pretends kamikazes do not exist.
export function mayTarget(att: Player, owner: Player): boolean {
  if (att.isKamikaze) {
    return owner.isHuman;
  }
  if (owner.isKamikaze) {
    return false;
  }
  return true;
}
