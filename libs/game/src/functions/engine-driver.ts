/* =====================================================================
   The engine coroutine driver — fully SYNCHRONOUS.

   The game runs as ONE plain (non-async) generator (see run-game.ts)
   that suspends whenever the seat in play must answer — a pool pick
   during the draft, or the end of an action turn. There are no promises
   anywhere in the game core: every state transition is synchronous, and
   the public signal of "whose turn, what input is expected" is a set of
   plain flags on GameState (`activeId` + `awaitingPick`/`awaitingAction`).

   The UI and the AI answer by dispatching the matching action
   (`pickCard` / `endTurn`); each dispatch advances the engine
   synchronously through `resumeEngine` to its next suspension. After
   every suspension the driver notifies the registered input listener
   (the AI driver) — when the listener answers synchronously (headless
   runs), the drive loop below consumes the answer without recursion, so
   an entire game can run to completion inside one `startEngine` call.
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
let inputListener: ((request: InputRequest) => void) | null = null;

/** Install a fresh engine and run it forward. In a fully AI-driven
    (headless) game the input listener answers every suspension
    synchronously, so the WHOLE game completes before this returns. */
export function startEngine(build: () => EngineGen): void {
  engine = build();
  pending = { answer: undefined };
  drive();
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
}

/** True while a game is in progress (the engine has not finished). */
export function isEngineActive(): boolean {
  return engine !== null;
}

/** Register the callback fired after every suspension (the AI driver).
    It may answer synchronously by dispatching pickCard/endTurn, or later
    via its own timers — pacing lives entirely in the listener. */
export function setInputListener(
  listener: ((request: InputRequest) => void) | null,
): void {
  inputListener = listener;
}

/* The trampoline: consume answers in a flat loop rather than recursing,
   so a listener that answers synchronously (a headless AI playing a whole
   game) cannot grow the call stack. A resumeEngine arriving mid-loop (from
   the listener) only stores the answer — the loop picks it up. */
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
        break;
      }
      inputListener?.(step.value);
    }
  } finally {
    driving = false;
  }
}
