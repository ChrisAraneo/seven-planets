/* =====================================================================
   The engine coroutine driver.

   The game runs as ONE plain (non-async) generator (see run-game.ts)
   that suspends whenever the seat in play must answer — a pool pick
   during the draft, or the end of an action turn. The driver holds NO
   callbacks and notifies nobody: the engine's only output is the game
   state itself. When it parks it raises `awaitingPick`/`awaitingAction`
   and bumps `inputSeq` on the state; whoever reacts to state changes
   (the human UI via computeds, the AI via `watch` on inputSeq — exactly
   like the effects player watches effectSeq) answers by dispatching the
   matching action (`pickCard` / `endTurn`), which advances the engine
   synchronously through `resumeEngine` to its next suspension.

   startEngine returns a promise that settles when the game finishes —
   the one orchestration handle headless runs await; the browser ignores
   it. Game state and actions themselves stay fully synchronous.
   ===================================================================== */

/** What the engine yields when it needs the active seat to answer. */
export type InputRequest = { kind: 'pick' } | { kind: 'action' };

/** What is fed back to resume it: a pool-pick index, or nothing (an
    action turn is simply un-parked by `endTurn`). */
export type InputAnswer = number | undefined;

/** An engine coroutine: yields input requests, may return a value R,
    and is resumed with the seat's answer. */
export type EngineGen<R = void> = Generator<InputRequest, R, InputAnswer>;

let engine: EngineGen | null = null;
// True while the drive loop is advancing the engine (guards re-entrancy).
let driving = false;
// An answer delivered while the loop is advancing is held here (one slot —
// the flag gating in pickCard/endTurn admits at most one pending answer).
let pending: { answer: InputAnswer } | null = null;
let finish: (() => void) | null = null;

/** Install a fresh engine and run it forward to its first suspension.
    Resolves when the whole game finishes (game over or the turn cap). */
export function startEngine(build: () => EngineGen): Promise<void> {
  engine = build();
  pending = { answer: undefined };
  const done = new Promise<void>((resolve) => {
    finish = resolve;
  });
  drive();
  return done;
}

/** Feed the seat's answer to the suspended engine and advance it
    synchronously to its next suspension (or to completion). */
export function resumeEngine(answer: InputAnswer): void {
  if (!engine) {
    return;
  }
  pending = { answer };
  drive();
}

/** Drop the running engine (a fresh game state was installed). */
export function resetEngine(): void {
  engine = null;
  pending = null;
  finish?.();
  finish = null;
}

/* The trampoline: consume answers in a flat loop rather than recursing,
   so an answer arriving synchronously mid-drive (via resumeEngine, which
   only stores it) is picked up without stack growth. */
function drive(): void {
  if (driving) {
    return;
  }
  driving = true;
  try {
    while (engine && pending) {
      const { answer } = pending;
      pending = null;
      const step = engine.next(answer);
      if (step.done) {
        engine = null;
        finish?.();
        finish = null;
      }
    }
  } finally {
    driving = false;
  }
}
