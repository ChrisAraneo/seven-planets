import type { EffectEvent, GameState } from '@seven-planets/game';

/* =====================================================================
   SEVEN PLANETS — graphical effects (canvas animations).

   The game core is fully synchronous and never waits for animations.
   Instead it appends EffectEvents to the game state as it mutates it;
   this layer CONSUMES those events in response to the state change
   (the browser watches `state.effectSeq` and calls playNewEffects) and
   hands canvas animations to the sink the app injected (the browser's
   effects store, drained by the GameBoard render loop).

   Sequencing is presentation-side: events that follow a rocket in the
   same batch are delayed by the rocket's flight time, so the boom still
   lands when the rocket arrives even though the game state resolved the
   battle instantly. Headless runs never install this layer — events
   just accumulate in the state's capped tail and cost nothing.
   ===================================================================== */

export interface Anim {
  type: 'rocket' | 'boom' | 'text';
  t0: number;
  dur: number;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
  tx?: number;
  ty?: number;
  color?: string;
  txt?: string;
}

/** What the app must provide: somewhere to queue animations and the
    fast-animations toggle. This lib knows nothing about any store. */
export interface EffectsSink {
  enqueue(anim: Anim): void;
  isFastMode(): boolean;
}

let sink: EffectsSink | null = null;
// The last event seq already played, so each call only plays new events.
let playedSeq = 0;

// Fast-animations toggle: everything plays at 30% duration.
const FAST_MODE_SPEED = 0.3;

// Base/minimum animation durations (ms) and the gap after a rocket lands.
const ROCKET_DURATION = 1000;
const ROCKET_MIN_DURATION = 50;
const ROCKET_SETTLE_GAP = 60;
const BOOM_DURATION = 600;
const BOOM_MIN_DURATION = 200;
const TEXT_DURATION = 1500;
const TEXT_MIN_DURATION = 400;

// Animation speed multiplier (the fast-animations toggle).
function speedMult(): number {
  return sink?.isFastMode() ? FAST_MODE_SPEED : 1;
}

function now(): number {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}

function enqueue(anim: Anim, delay: number): void {
  if (delay > 0) {
    // Re-stamp t0 at fire time so the animation starts when it appears.
    setTimeout(() => sink?.enqueue({ ...anim, t0: now() }), delay);
    return;
  }
  sink?.enqueue(anim);
}

/** Install the graphical effects layer. Called once at app startup
    (main.ts) with the app's animation sink. */
export function installEffects(effectsSink: EffectsSink): void {
  sink = effectsSink;
  playedSeq = 0;
}

/** Play every effect event newer than the last call. The browser calls
    this in response to the game state changing (watching `effectSeq`). */
export function playNewEffects(state: GameState): void {
  if (!sink) {
    return;
  }
  // A fresh game restarts the seq from zero.
  if (state.effectSeq < playedSeq) {
    playedSeq = 0;
  }
  const fresh = state.effects.filter((event) => event.seq > playedSeq);
  playedSeq = state.effectSeq;
  // Delay accumulates across the batch: effects emitted after a rocket
  // Play once the rocket lands.
  fresh.reduce((delay, event) => playEffect(state, event, delay), 0);
}

function playEffect(
  state: GameState,
  event: EffectEvent,
  delay: number,
): number {
  switch (event.kind) {
    case 'rocket': {
      return playRocket(state, event, delay);
    }
    case 'boom': {
      return playBoom(state, event, delay);
    }
    case 'floatText': {
      return playFloatText(state, event, delay);
    }
    default: {
      return delay;
    }
  }
}

function playRocket(
  state: GameState,
  event: Extract<EffectEvent, { kind: 'rocket' }>,
  delay: number,
): number {
  const from = state.planets[event.fromId];
  const to = state.planets[event.toId];
  const dur = Math.max(ROCKET_MIN_DURATION, ROCKET_DURATION * speedMult());
  enqueue(
    {
      type: 'rocket',
      fx: from.x,
      fy: from.y,
      tx: to.x,
      ty: to.y,
      color: event.color,
      t0: now(),
      dur,
    },
    delay,
  );
  return delay + dur + ROCKET_SETTLE_GAP;
}

function playBoom(
  state: GameState,
  event: Extract<EffectEvent, { kind: 'boom' }>,
  delay: number,
): number {
  const planet = state.planets[event.planetId];
  enqueue(
    {
      type: 'boom',
      x: planet.x,
      y: planet.y,
      t0: now(),
      dur: Math.max(BOOM_MIN_DURATION, BOOM_DURATION * speedMult()),
    },
    delay,
  );
  return delay;
}

function playFloatText(
  state: GameState,
  event: Extract<EffectEvent, { kind: 'floatText' }>,
  delay: number,
): number {
  const planet = state.planets[event.planetId];
  enqueue(
    {
      type: 'text',
      x: planet.x,
      y: planet.y - planet.r,
      txt: event.text,
      color: event.color,
      t0: now(),
      dur: Math.max(TEXT_MIN_DURATION, TEXT_DURATION * speedMult()),
    },
    delay,
  );
  return delay;
}
