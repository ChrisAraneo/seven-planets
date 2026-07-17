import type { Player } from '@seven-planets/game';

export function canTarget(attacker: Player, owner: Player): boolean {
  if (attacker.isKamikaze) {
    return owner.isHuman;
  }
  if (owner.isKamikaze) {
    return false;
  }
  return true;
}
