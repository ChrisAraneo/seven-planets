import type { EffectEvent, GameState } from '@seven-planets/game';
import { assign, noop } from 'lodash-es';
import { match } from 'ts-pattern';

import { chain } from './utils/chain';
import { nullish } from './utils/p';

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

const EFFECTS_STATE: { sink: EffectsSink | null; playedSeq: number } = {
  sink: null,
  playedSeq: 0,
};

const FAST_MODE_SPEED = 0.3;

const ROCKET_DURATION = 1000;
const ROCKET_MIN_DURATION = 50;
const ROCKET_SETTLE_GAP = 60;
const BOOM_DURATION = 600;
const BOOM_MIN_DURATION = 200;
const TEXT_DURATION = 1500;
const TEXT_MIN_DURATION = 400;

const speedMult = (): number =>
  match(EFFECTS_STATE.sink?.isFastMode())
    .with(true, () => FAST_MODE_SPEED)
    .otherwise(() => 1);

const now = (): number =>
  match(typeof performance)
    .with('undefined', () => Date.now())
    .otherwise(() => performance.now());

const enqueue = (anim: Anim, delay: number): void =>
  match(delay > 0)
    .with(true, () =>
      chain(
        setTimeout(
          () => EFFECTS_STATE.sink?.enqueue({ ...anim, t0: now() }),
          delay,
        ),
      )
        .thru(noop)
        .value(),
    )
    .otherwise(() => EFFECTS_STATE.sink?.enqueue(anim));

export const installEffects = (effectsSink: EffectsSink): void =>
  chain(assign(EFFECTS_STATE, { sink: effectsSink, playedSeq: 0 }))
    .thru(noop)
    .value();

const playRocket = (
  state: GameState,
  event: Extract<EffectEvent, { kind: 'rocket' }>,
  delay: number,
): number =>
  chain({
    from: state.planets[event.fromId],
    to: state.planets[event.toId],
    dur: Math.max(ROCKET_MIN_DURATION, ROCKET_DURATION * speedMult()),
  })
    .tap(({ from, to, dur }) =>
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
      ),
    )
    .thru(({ dur }) => delay + dur + ROCKET_SETTLE_GAP)
    .value();

const playBoom = (
  state: GameState,
  event: Extract<EffectEvent, { kind: 'boom' }>,
  delay: number,
): number =>
  chain(state.planets[event.planetId])
    .tap((planet) =>
      enqueue(
        {
          type: 'boom',
          x: planet.x,
          y: planet.y,
          t0: now(),
          dur: Math.max(BOOM_MIN_DURATION, BOOM_DURATION * speedMult()),
        },
        delay,
      ),
    )
    .thru(() => delay)
    .value();

const playFloatText = (
  state: GameState,
  event: Extract<EffectEvent, { kind: 'floatText' }>,
  delay: number,
): number =>
  chain(state.planets[event.planetId])
    .tap((planet) =>
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
      ),
    )
    .thru(() => delay)
    .value();

const playEffect = (
  state: GameState,
  event: EffectEvent,
  delay: number,
): number =>
  match(event)
    .with({ kind: 'rocket' }, (rocketEvent) =>
      playRocket(state, rocketEvent, delay),
    )
    .with({ kind: 'boom' }, (boomEvent) => playBoom(state, boomEvent, delay))
    .with({ kind: 'floatText' }, (textEvent) =>
      playFloatText(state, textEvent, delay),
    )
    .otherwise(() => delay);

export const playNewEffects = (state: GameState): void =>
  match(EFFECTS_STATE.sink)
    .with(nullish, noop)
    .otherwise(() =>
      chain(
        match(state.effectSeq < EFFECTS_STATE.playedSeq)
          .with(true, () => 0)
          .otherwise(() => EFFECTS_STATE.playedSeq),
      )
        .thru((baseSeq) => state.effects.filter((event) => event.seq > baseSeq))
        .tap(() => assign(EFFECTS_STATE, { playedSeq: state.effectSeq }))
        .thru((fresh) =>
          fresh.reduce((delay, event) => playEffect(state, event, delay), 0),
        )
        .thru(noop)
        .value(),
    );
