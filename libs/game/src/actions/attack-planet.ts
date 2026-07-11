import { chain, cloneDeep, fromPairs, noop } from 'lodash-es';
import { match } from 'ts-pattern';
import { hasActionCard } from '../functions/has-action-card';
import { setBusy } from '../functions/set-busy';
import type { GameState } from '../interfaces/game-state';
import type { Hand } from '../interfaces/hand';
import type { Planet } from '../interfaces/planet';
import { checkWin } from '../functions/check-win';
import {
  CONQUEST_TRUCE,
  fmtCards,
  CARD_TYPES,
  INFLUENCE_TYPES,
  choice,
  COMBAT,
  HOME_FIELD,
  PACIFIST_DEF_BONUS,
  PACIFIST_INFLUENCE,
  randInt,
  SHIELD_DEFENSE,
  TAUNTS,
  NO_PRESENTATION,
} from '../config/constants';
import { handSize } from '../functions/hand-size';
import { log } from '../functions/log';
import { stealCards } from '../functions/steal-cards';
import { siloBonus } from '../functions/silo-bonus';
import { singularityDefBonus } from '../functions/singularity-def-bonus';
import { isUnderTruce } from '../functions/is-under-truce';
import { ownedPlanets } from '../functions/owned-planets';
import { pacifistDefBonus } from '../functions/pacifist-def-bonus';
import { spendActionCard } from '../functions/spend-action-card';
import { getGameState, setGameState } from '../game-state';
import type { PresentationHooks } from '../interfaces/presentation-hooks';

export interface AttackPlanetPayload {
  playerId: number;
  sourceId: number;
  targetId: number;
  n: number;
}

interface BattleContext {
  source: Planet;
  target: Planet;
  defenderId: number;
  ap: number;
  dp: number;
  win: boolean;
  attLoss: number;
  defLoss: number;
}

export async function attackPlanet(
  payload: AttackPlanetPayload,
  hooks: PresentationHooks = NO_PRESENTATION,
): Promise<void> {
  return match(cloneDeep(getGameState()))
    .when(
      (state) => payload.playerId !== state.activeId || Boolean(state.over),
      noop,
    )
    .when(
      (state) => !hasActionCard(state.players[payload.playerId], 'ATTACK'),
      noop,
    )
    .otherwise((state) =>
      chain(Object.assign(state, setBusy(state, true)))
        .thru((s) =>
          doAttack(s, payload, hooks)
            // The busy flag must clear whether the attack resolves or rejects.
            .finally(() => Object.assign(s, setBusy(s, false)))
            .then(() => setGameState(s)),
        )
        .value(),
    );
}

async function doAttack(
  state: GameState,
  { playerId: attackerId, sourceId, targetId, n }: AttackPlanetPayload,
  hooks: PresentationHooks,
): Promise<void> {
  return match({
    source: state.planets[sourceId],
    target: state.planets[targetId],
  })
    .when(
      // Freshly conquered planets cannot be attacked
      ({ target }) => isUnderTruce(target),
      async (): Promise<void> => undefined,
    )
    .when(
      // No silo, no rockets
      ({ source }) => !source.buildings.SILO,
      async (): Promise<void> => undefined,
    )
    .otherwise(({ source, target }) =>
      chain(state)
        .tap((s) => breakPacifistVow(s, attackerId, hooks))
        .thru((s) => Object.assign(s, spendActionCard(s, attackerId, 'ATTACK')))
        .tap((s) =>
          // Resets the pacifist countdown
          Object.assign(s.players[attackerId], { lastAttackTurn: s.turn }),
        )
        .tap(() => Object.assign(source, { troops: source.troops - n }))
        .tap((s) =>
          Object.assign(
            s,
            log(
              s,
              `🚀 ${s.players[attackerId].name} launches a rocket with ${n} troops from ${source.name} at ${target.name} (${s.players[target.ownerId].name})!`,
              'war',
            ),
          ),
        )
        .tap((s) => maybeTaunt(s, attackerId))
        .thru((s) =>
          hooks
            .rocket(source, target, s.players[attackerId].color)
            .then(() =>
              resolveBattle(s, attackerId, sourceId, targetId, n, hooks),
            ),
        )
        .value(),
    );
}

// Breaking the vow: a PACIFIST may attack, but doing so permanently strips the
// Status and its bonuses — and pacifismForfeited bars them from ever regaining it.
function breakPacifistVow(
  state: GameState,
  attackerId: number,
  hooks: PresentationHooks,
): void {
  return match(state.players[attackerId].hasPacifistStatus)
    .with(
      true,
      () =>
        void chain(
          Object.assign(state.players[attackerId], {
            hasPacifistStatus: false,
            pacifismForfeited: true,
          }),
        )
          .thru(() =>
            Object.assign(
              state,
              log(
                state,
                `⚔️ ${state.players[attackerId].name} breaks their pacifist vow to strike — the +${PACIFIST_DEF_BONUS} defense and +${PACIFIST_INFLUENCE}⭐ per planet are gone for good.`,
                'war',
              ),
            ),
          )
          .tap((s) =>
            ownedPlanets(s, s.players[attackerId]).forEach((pl) =>
              hooks.floatText(pl, '⚔️ VOW BROKEN', '#ff6b6b'),
            ),
          )
          .value(),
    )
    .otherwise(noop);
}

function maybeTaunt(state: GameState, attackerId: number): void {
  return match(!state.players[attackerId].isHuman && Math.random() < 0.4)
    .with(
      true,
      () =>
        void Object.assign(
          state,
          log(
            state,
            `   ${state.players[attackerId].name}: ${choice(TAUNTS)}`,
            'war',
          ),
        ),
    )
    .otherwise(noop);
}

// Battle resolution reads every coefficient from constants.COMBAT so the
// Planning AI (./ai) predicts with the exact numbers the dice use.
function resolveBattle(
  state: GameState,
  attackerId: number,
  sourceId: number,
  targetId: number,
  n: number,
  hooks: PresentationHooks,
): void {
  return void chain({
    source: state.planets[sourceId],
    target: state.planets[targetId],
    defenderId: state.planets[targetId].ownerId,
  })
    .thru(({ source, target, defenderId }) => ({
      source,
      target,
      defenderId,
      ap:
        COMBAT.attackPerTroop * n +
        siloBonus(source) +
        randInt(0, COMBAT.attackRoll),
      dp:
        COMBAT.defensePerTroop * target.troops +
        (target.buildings.SHIELD || 0) * SHIELD_DEFENSE + // Shields stack
        pacifistDefBonus(state, target) +
        singularityDefBonus(target) +
        HOME_FIELD +
        randInt(0, COMBAT.defenseRoll),
    }))
    .thru((ctx) => ({ ...ctx, win: ctx.ap > ctx.dp }))
    .thru(
      (ctx): BattleContext => ({
        ...ctx,
        ...battleLosses(ctx.win, n, ctx.target.troops),
      }),
    )
    .tap(({ target, defLoss }) =>
      Object.assign(target, { troops: target.troops - defLoss }),
    )
    .tap(({ target }) => hooks.boom(target))
    .tap((ctx) =>
      Object.assign(
        state,
        log(state, battleLine(state, ctx, attackerId), 'war'),
      ),
    )
    .tap((ctx) => applyOutcome(state, ctx, attackerId, targetId, n, hooks))
    .thru(() => Object.assign(state, checkWin(state)))
    .value();
}

function battleLosses(
  win: boolean,
  n: number,
  targetTroops: number,
): { attLoss: number; defLoss: number } {
  return match(win)
    .with(true, () => ({
      defLoss: Math.min(
        targetTroops,
        Math.ceil((n * COMBAT.winDefLoss.num) / COMBAT.winDefLoss.den),
      ),
      attLoss: Math.floor((n * COMBAT.winAttLoss.num) / COMBAT.winAttLoss.den),
    }))
    .otherwise(() => ({
      attLoss: Math.ceil((n * COMBAT.loseAttLoss.num) / COMBAT.loseAttLoss.den),
      defLoss: Math.min(
        targetTroops,
        Math.floor((n * COMBAT.loseDefLoss.num) / COMBAT.loseDefLoss.den),
      ),
    }));
}

function battleLine(
  state: GameState,
  { target, defenderId, ap, dp, win, attLoss, defLoss }: BattleContext,
  attackerId: number,
): string {
  return `💥 Battle for ${target.name}: attack ${ap} vs defense ${dp} — ${match(
    win,
  )
    .with(true, () => `${state.players[attackerId].name} WINS`)
    .otherwise(
      () => `${state.players[defenderId].name} holds`,
    )}! Losses: ${state.players[attackerId].name} -${attLoss}🪖, ${state.players[defenderId].name} -${defLoss}🪖`;
}

function applyOutcome(
  state: GameState,
  ctx: BattleContext,
  attackerId: number,
  targetId: number,
  n: number,
  hooks: PresentationHooks,
): void {
  return match(ctx)
    .when(
      // No spoils for merely winning a battle — only conquest pays
      ({ win, target }) => win && target.troops <= 0,
      ({ attLoss }) =>
        // The surviving strike force garrisons it
        conquerPlanet(state, attackerId, targetId, n - attLoss, hooks),
    )
    .when(
      ({ win }) => win,
      ({ source, target, attLoss }) =>
        void chain(
          // Raiders fly home
          Object.assign(source, { troops: source.troops + (n - attLoss) }),
        )
          .tap(() => hooks.floatText(target, 'RAIDED!', '#ff8a97'))
          .value(),
    )
    .otherwise(
      ({ source, target, attLoss }) =>
        void chain(
          Object.assign(source, { troops: source.troops + (n - attLoss) }),
        )
          .tap(() => hooks.floatText(target, 'DEFENDED!', '#7dff8a'))
          .value(),
    );
}

function conquerPlanet(
  state: GameState,
  attackerId: number,
  targetId: number,
  garrison: number,
  hooks: PresentationHooks,
): void {
  return void chain({
    target: state.planets[targetId],
    defenderId: state.planets[targetId].ownerId,
  })
    .tap(({ target }) =>
      Object.assign(target, {
        ownerId: attackerId,
        troops: garrison,
        protectedUntil: state.turn + CONQUEST_TRUCE,
      }),
    )
    .tap(({ target }) => hooks.floatText(target, 'CONQUERED!', '#ff9e3d'))
    .tap(({ target }) =>
      Object.assign(
        state,
        log(
          state,
          `🏴 ${state.players[attackerId].name} CONQUERS ${target.name} — ${garrison}🪖 garrison it! Under truce for ${CONQUEST_TRUCE} turns.`,
          'war',
        ),
      ),
    )
    .tap(({ defenderId }) => resolveDefenderFate(state, attackerId, defenderId))
    .thru(() => Object.assign(state, checkWin(state)))
    .value();
}

function resolveDefenderFate(
  state: GameState,
  attackerId: number,
  defenderId: number,
): void {
  return match(ownedPlanets(state, state.players[defenderId]).length)
    .with(0, () => eliminateDefender(state, attackerId, defenderId))
    .otherwise(
      () =>
        void lootCards(
          state,
          defenderId,
          attackerId,
          Math.min(5, Math.ceil(handSize(state.players[defenderId]) / 2)),
          (taken) =>
            `💰 ${state.players[attackerId].name} seizes ${fmtCards(taken)} from the fleeing ${state.players[defenderId].name}!`,
        ),
    );
}

function eliminateDefender(
  state: GameState,
  attackerId: number,
  defenderId: number,
): void {
  return void chain(state)
    .tap((s) =>
      lootCards(
        s,
        defenderId,
        attackerId,
        Math.min(6, handSize(s.players[defenderId])),
        (taken) =>
          `💰 ${s.players[attackerId].name} salvages ${fmtCards(taken)} from the ruins!`,
      ),
    )
    .tap((s) =>
      Object.assign(s.players[defenderId], {
        hand: {
          ...s.players[defenderId].hand,
          ...fromPairs([...CARD_TYPES, ...INFLUENCE_TYPES].map((t) => [t, 0])),
        },
        isAlive: false,
      }),
    )
    .tap((s) =>
      Object.assign(
        s,
        log(
          s,
          `☠️ ${s.players[defenderId].name} has been wiped from the galaxy!`,
          'war',
        ),
      ),
    )
    .value();
}

function lootCards(
  state: GameState,
  fromId: number,
  toId: number,
  lootN: number,
  message: (taken: Hand) => string,
): void {
  return match(lootN)
    .when((count) => count <= 0, noop)
    .otherwise(
      (count) =>
        void chain(stealCards(state, fromId, toId, count))
          .tap(({ state: looted }) => Object.assign(state, looted))
          .tap(({ taken }) =>
            Object.assign(state, log(state, message(taken), 'war')),
          )
          .value(),
    );
}
