import { negate } from 'lodash-es';
import { match } from 'ts-pattern';

import type { GameState } from '../../interfaces/game-state';
import { enterSlot } from './enter-slot';
import { finishDraft } from './finish-draft';
import { hasPickableCard } from './has-pickable-card';
import { isQueueExhausted } from './is-queue-exhausted';
import { isSeatFinished } from './is-seat-finished';
import { isSlotFinished } from './is-slot-finished';
import { isSlotUnentered } from './is-slot-unentered';
import { nextSeat } from './next-seat';
import { nextSlot } from './next-slot';
import { parkPick } from './park-pick';
import { passAndSkipSlot } from './pass-and-skip-slot';
import type { DraftCursor } from './seat-frame';

export const draftStep = (state: GameState, cursor: DraftCursor): GameState =>
  match({ state, cursor })
    .when(isQueueExhausted, () => finishDraft(state))
    .when(isSeatFinished, nextSeat)
    .when(isSlotFinished, nextSlot)
    .when(isSlotUnentered, enterSlot)
    .when(negate(hasPickableCard), passAndSkipSlot)
    .otherwise(parkPick);
