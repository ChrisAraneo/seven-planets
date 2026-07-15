/* The engine's position as plain data on the state — the machine-readable
   counterpart of `GameState.phase`. After any emission the cursor alone says
   exactly where the game is, which makes every snapshot serializable,
   resumable and inspectable (no suspended call stacks anywhere). */
export type EngineCursor =
  | { phase: 'setup' } // Before the 'start' intent
  | {
      phase: 'draft';
      /** Snapshot of getDraftOrder (player ids), taken when the draft starts. */
      seatQueue: number[];
      /** Index into seatQueue. */
      seatIdx: number;
      /** Which owned planet drafts (owned planets are re-resolved live per slot). */
      slot: number;
      /** Pick counter within the slot. */
      pick: number;
      /** Captured getMainPicks(...) at slot entry; -1 while the slot is unentered. */
      picksTotal: number;
    }
  | {
      phase: 'action';
      /** Snapshot of getTurnOrder (player ids), taken when the action phase
          starts. An exhausted queue (seatIdx past the end) is the
          between-turns position: advance starts the next turn prelude
          from it. */
      seatQueue: number[];
      seatIdx: number;
    }
  | { phase: 'done' }; // Game over or turn cap
