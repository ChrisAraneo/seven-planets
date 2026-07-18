import type { Planet, Player } from '@seven-planets/game';
import { getTurn } from '@seven-planets/game';
import { COMBAT, HOME_FIELD, PACIFIST_DEF_BONUS } from '@seven-planets/game';
import { computeShieldDefense } from '@seven-planets/game';
import { computeSingularityDefenseBonus } from '@seven-planets/game';
import { range } from 'lodash-es';
import { match } from 'ts-pattern';

import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
import { getAiState } from '../state';
import { chain } from '../utils/chain';
import { canTarget } from './can-target';
import { computeActionDrawProbability } from './compute-action-draw-probability';
import { computeAggression } from './compute-aggression';
import { computeBattleWinProbability } from './compute-battle-win-probability';
import { computeMinimumTroopsToConquer } from './compute-minimum-troops-to-conquer';
import { computeProjectedStrike } from './compute-projected-strike';
import { computeRecruitRate } from './compute-recruit-rate';

interface HoldContext {
  planet: Planet;
  garrison: number;
  protectedUntil: number;
  horizon: number;
  reinforcementRate: number;
  staticDefense: number;
}

const computePeakWinProbability = (
  context: HoldContext,
  attacker: Player,
): number =>
  range(1, context.horizon + 1).reduce(
    (peak, turnsAhead) =>
      match(getTurn() + turnsAhead > context.protectedUntil)
        .with(false, () => peak)
        .otherwise(() =>
          chain({
            defenders: Math.round(
              context.garrison + context.reinforcementRate * turnsAhead,
            ),
            strike: computeProjectedStrike(
              attacker,
              turnsAhead,
              context.planet.id,
            ),
          })
            .thru(({ defenders, strike }) =>
              match(
                strike.n >= 2 &&
                  strike.n >= computeMinimumTroopsToConquer(defenders),
              )
                .with(true, () =>
                  Math.max(
                    peak,
                    computeBattleWinProbability(
                      COMBAT.attackPerTroop * strike.n + strike.bonus,
                      COMBAT.defensePerTroop * defenders +
                        context.staticDefense,
                    ),
                  ),
                )
                .otherwise(() => peak),
            )
            .value(),
        ),
    0,
  );

const computeAttackerThreat = (
  context: HoldContext,
  attacker: Player,
): number =>
  match(computePeakWinProbability(context, attacker))
    .when(
      (peak) => peak <= 0,
      () => 0,
    )
    .otherwise((peakWinProbability) =>
      chain(
        Math.max(
          1,
          context.horizon - Math.max(0, context.protectedUntil - getTurn()),
        ),
      )
        .thru(
          (drawWindow) =>
            peakWinProbability *
            match((attacker.hand.ATTACK || 0) > 0)
              .with(true, () => 0.95)
              .otherwise(
                () =>
                  1 -
                  (1 - computeActionDrawProbability('ATTACK')) ** drawWindow,
              ) *
            computeAggression(attacker),
        )
        .value(),
    );

export const computeHoldProbability = (
  owner: Player,
  planet: Planet,
  garrison: number,
  protectedUntil: number = planet.protectedUntil,
  horizon: number = getAiState().W.holdHorizon,
): number =>
  chain({
    planet,
    garrison,
    protectedUntil,
    horizon,
    reinforcementRate:
      computeRecruitRate(owner) *
      match(planet.buildings.BARRACKS)
        .when(Boolean, () => 0.7)
        .otherwise(() => 0.25),
    staticDefense:
      computeShieldDefense(planet) +
      computeSingularityDefenseBonus(planet) +
      match(owner.hasPacifistStatus)
        .with(true, () => PACIFIST_DEF_BONUS)
        .otherwise(() => 0) +
      HOME_FIELD,
  })
    .thru((context) =>
      getAlivePlayers().reduce(
        (holdProbability, attacker) =>
          holdProbability *
          match(
            attacker.id !== owner.id &&
              !attacker.hasPacifistStatus &&
              canTarget(attacker, owner),
          )
            .with(true, () => 1 - computeAttackerThreat(context, attacker))
            .otherwise(() => 1),
        1,
      ),
    )
    .value();
