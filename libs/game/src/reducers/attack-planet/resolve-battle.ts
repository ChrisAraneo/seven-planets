import { assign } from 'lodash-es';
import { match } from 'ts-pattern';

import { COMBAT, HOME_FIELD, randomInt } from '../../config/constants';
import { checkWin } from '../../functions/check-win';
import { computePacifistDefenseBonus } from '../../functions/compute-pacifist-defense-bonus';
import { computeShieldDefense } from '../../functions/compute-shield-defense';
import { computeSiloBonus } from '../../functions/compute-silo-bonus';
import { computeSingularityDefenseBonus } from '../../functions/compute-singularity-defense-bonus';
import { emitEffect } from '../../functions/emit-effect';
import { log } from '../../functions/log';
import type { GameState } from '../../interfaces/game-state';
import type { Planet } from '../../interfaces/planet';
import { chain } from '../../utils/chain';
import { conquerPlanet } from './conquer-planet';

interface BattleContext {
  source: Planet;
  target: Planet;
  defenderId: number;
  attackPower: number;
  defensePower: number;
  didWin: boolean;
  attLoss: number;
  defLoss: number;
}

// Battle resolution reads every coefficient from constants.COMBAT so the
// Planning AI (./ai) predicts with the exact numbers the dice use.
export function resolveBattle(
  state: GameState,
  attackerId: number,
  sourceId: number,
  targetId: number,
  troops: number,
): void {
  return void chain(computeBattlePowers(state, sourceId, targetId, troops))
    .thru((context) => ({
      ...context,
      didWin: context.attackPower > context.defensePower,
    }))
    .thru(
      (context): BattleContext => ({
        ...context,
        ...computeBattleLosses(context.didWin, troops, context.target.troops),
      }),
    )
    .tap(({ target, defLoss }) =>
      assign(target, { troops: target.troops - defLoss }),
    )
    .tap(() =>
      assign(state, emitEffect(state, { kind: 'boom', planetId: targetId })),
    )
    .tap((battle) =>
      assign(
        state,
        log(state, getBattleLine(state, battle, attackerId), 'war'),
      ),
    )
    .tap((battle) => applyOutcome(state, battle, attackerId, targetId, troops))
    .thru(() => assign(state, checkWin(state)))
    .value();
}

function computeBattlePowers(
  state: GameState,
  sourceId: number,
  targetId: number,
  troops: number,
): Omit<BattleContext, 'didWin' | 'attLoss' | 'defLoss'> {
  return chain({
    source: state.planets[sourceId],
    target: state.planets[targetId],
    defenderId: state.planets[targetId].ownerId,
  })
    .thru(({ source, target, defenderId }) => ({
      source,
      target,
      defenderId,
      attackPower:
        COMBAT.attackPerTroop * troops +
        computeSiloBonus(source) +
        randomInt(0, COMBAT.attackRoll),
      defensePower:
        COMBAT.defensePerTroop * target.troops +
        // 0/+4/+8/+16 (an unpowered L3 gives +8)
        computeShieldDefense(target) +
        computePacifistDefenseBonus(state, target) +
        computeSingularityDefenseBonus(target) +
        HOME_FIELD +
        randomInt(0, COMBAT.defenseRoll),
    }))
    .value();
}

function computeBattleLosses(
  didWin: boolean,
  troops: number,
  targetTroops: number,
): { attLoss: number; defLoss: number } {
  return match(didWin)
    .with(true, () => ({
      defLoss: Math.min(
        targetTroops,
        Math.ceil((troops * COMBAT.winDefLoss.num) / COMBAT.winDefLoss.den),
      ),
      attLoss: Math.floor(
        (troops * COMBAT.winAttLoss.num) / COMBAT.winAttLoss.den,
      ),
    }))
    .otherwise(() => ({
      attLoss: Math.ceil(
        (troops * COMBAT.loseAttLoss.num) / COMBAT.loseAttLoss.den,
      ),
      defLoss: Math.min(
        targetTroops,
        Math.floor((troops * COMBAT.loseDefLoss.num) / COMBAT.loseDefLoss.den),
      ),
    }));
}

function getBattleLine(
  state: GameState,
  {
    target,
    defenderId,
    attackPower,
    defensePower,
    didWin,
    attLoss,
    defLoss,
  }: BattleContext,
  attackerId: number,
): string {
  return `💥 Battle for ${target.name}: attack ${attackPower} vs defense ${defensePower} — ${match(
    didWin,
  )
    .with(true, () => `${state.players[attackerId].name} WINS`)
    .otherwise(
      () => `${state.players[defenderId].name} holds`,
    )}! Losses: ${state.players[attackerId].name} -${attLoss}🪖, ${state.players[defenderId].name} -${defLoss}🪖`;
}

function applyOutcome(
  state: GameState,
  eachBattle: BattleContext,
  attackerId: number,
  targetId: number,
  troops: number,
): void {
  return match(eachBattle)
    .when(
      // No spoils for merely winning a battle — only conquest pays
      ({ didWin, target }) => didWin && target.troops <= 0,
      // The surviving strike force garrisons it
      ({ attLoss }) =>
        conquerPlanet(state, attackerId, targetId, troops - attLoss),
    )
    .when(
      ({ didWin }) => didWin,
      ({ source, target, attLoss }) =>
        void chain(
          // Raiders fly home
          assign(source, { troops: source.troops + (troops - attLoss) }),
        )
          .tap(() =>
            assign(
              state,
              emitEffect(state, {
                kind: 'floatText',
                planetId: target.id,
                text: 'RAIDED!',
                color: '#ff8a97',
              }),
            ),
          )
          .value(),
    )
    .otherwise(
      ({ source, target, attLoss }) =>
        void chain(
          assign(source, { troops: source.troops + (troops - attLoss) }),
        )
          .tap(() =>
            assign(
              state,
              emitEffect(state, {
                kind: 'floatText',
                planetId: target.id,
                text: 'DEFENDED!',
                color: '#7dff8a',
              }),
            ),
          )
          .value(),
    );
}
