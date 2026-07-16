import type { Player } from '@seven-planets/game';

// KAMIKAZE targeting rule: a kamikaze may only strike the human, and every
// other AI pretends kamikazes do not exist.
export function canTarget(attacker: Player, owner: Player): boolean {
  if (attacker.isKamikaze) {
    return owner.isHuman;
  }
  if (owner.isKamikaze) {
    return false;
  }
  return true;
}
