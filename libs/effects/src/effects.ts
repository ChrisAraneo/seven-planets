import type { EffectEvent, GameState } from '@seven-planets/game';

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

export interface EffectsSink {
  enqueue(anim: Anim): void;
  isFastMode(): boolean;
}

let sink: EffectsSink | null = null;
let playedSeq = 0;

const FAST_MODE_SPEED = 0.3;

const ROCKET_DURATION = 1000;
const ROCKET_MIN_DURATION = 50;
const ROCKET_SETTLE_GAP = 60;
const BOOM_DURATION = 600;
const BOOM_MIN_DURATION = 200;
const TEXT_DURATION = 1500;
const TEXT_MIN_DURATION = 400;

function speedMult(): number {
  return sink?.isFastMode() ? FAST_MODE_SPEED : 1;
}

function now(): number {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}

function enqueue(anim: Anim, delay: number): void {
  if (delay > 0) {
    setTimeout(() => sink?.enqueue({ ...anim, t0: now() }), delay);
    return;
  }
  sink?.enqueue(anim);
}

export function installEffects(effectsSink: EffectsSink): void {
  sink = effectsSink;
  playedSeq = 0;
}

export function playNewEffects(state: GameState): void {
  if (!sink) {
    return;
  }
  if (state.effectSeq < playedSeq) {
    playedSeq = 0;
  }
  const fresh = state.effects.filter((event) => event.seq > playedSeq);
  playedSeq = state.effectSeq;
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
