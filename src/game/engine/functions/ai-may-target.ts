import type { Player } from '@/game/types';

// Targeting rule shared by every AI (mastermind or personality): may attacker
// `att` attack/coup a planet owned by `owner`? Kamikazes strike only the human;
// Everyone else pretends kamikazes do not exist.
export function aiMayTarget(att: Player, owner: Player): boolean {
  if (att.kamikaze) {
    return owner.isHuman;
  }
  if (owner.kamikaze) {
    return false;
  }
  return true;
}
