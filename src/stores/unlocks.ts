import type { Difficulty } from '@/game/config/difficulty';

import { store } from './index';

/* Component-facing view of the unlocks module (see modules/unlocks.ts). */
export function useUnlocksStore() {
  return {
    /** The set of difficulties available to pick right now. */
    unlocked: store.state.unlocks.unlocked,
    isUnlocked(id: Difficulty): boolean {
      return store.getters['unlocks/isUnlocked'](id) as boolean;
    },
  };
}
