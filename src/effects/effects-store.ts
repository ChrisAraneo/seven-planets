import { store } from '@/stores';

/* Component-facing view of the effects module: the GameBoard render
   loop drains the animation queue (the array reference is stable). */
export function useEffectsStore() {
  return store.state.effects;
}
