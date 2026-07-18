import type { Player } from '@seven-planets/game';
import { match } from 'ts-pattern';

export const canTarget = (attacker: Player, owner: Player): boolean =>
  match({ attacker, owner })
    .with({ attacker: { isKamikaze: true } }, () => owner.isHuman)
    .with({ owner: { isKamikaze: true } }, () => false)
    .otherwise(() => true);
