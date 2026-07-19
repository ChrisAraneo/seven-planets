import type {
  InfluenceOptions,
  InfluenceType,
  Player,
} from '@seven-planets/game';
import { match } from 'ts-pattern';

import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
import { getAiState } from '../state';
import { chain } from '../utils/chain';
import { nullish } from '../utils/p';
import { computeAverageStrength } from './compute-average-strength';
import { computeImmediateFallProbability } from './compute-immediate-fall-probability';
import { computePlayerStrength } from './compute-player-strength';
import { getBestCoupTarget } from './get-best-coup-target';
import { getOwnedPlanets } from './get-owned-planets';
import { getPlan } from './get-plan';
import { getSkipTarget } from './get-skip-target';
import { hasBuilding } from './has-building';
import { isImminentAttacker } from './is-imminent-attacker';

interface InfluencePlay {
  type: InfluenceType;
  options: InfluenceOptions;
  ev: number;
}

const getCoupPlay = (player: Player): InfluencePlay | null =>
  match((player.hand.COUP || 0) < 1)
    .with(true, () => null)
    .otherwise(() =>
      match(getBestCoupTarget(player))
        .with(nullish, () => null)
        .when(
          (coupTarget) =>
            coupTarget.value < getAiState().weights.coupValueFloor,
          () => null,
        )
        .otherwise(
          (coupTarget): InfluencePlay => ({
            type: 'COUP',
            options: { planet: coupTarget.planet },
            ev: coupTarget.value,
          }),
        ),
    );

const getPeacePlay = (player: Player): InfluencePlay | null =>
  match((player.hand.PEACE || 0) < 1)
    .with(true, () => null)
    .otherwise(() =>
      match(
        Math.max(
          0,
          ...getOwnedPlanets(player).map((planet) =>
            computeImmediateFallProbability(player, planet),
          ),
        ),
      )
        .when(
          (worstFall) => worstFall < getAiState().weights.peaceThreatFloor,
          () => null,
        )
        .otherwise(
          (worstFall): InfluencePlay => ({
            type: 'PEACE',
            options: {},
            ev: worstFall * 10,
          }),
        ),
    );

const getSkipPlay = (player: Player): InfluencePlay | null =>
  chain(computeAverageStrength())
    .thru(
      (averageStrength) =>
        (
          [
            'SKIP_ARMY',
            'SKIP_PLANETS',
            'SKIP_TECH',
            'SKIP_INFLUENCE',
          ] as InfluenceType[]
        )
          .filter((influenceType) => (player.hand[influenceType] || 0) >= 1)
          .flatMap((influenceType) =>
            match(getSkipTarget(player, influenceType))
              .with(nullish, (): InfluencePlay[] => [])
              .when(
                (target) =>
                  computePlayerStrength(target) >= averageStrength * 1.15 ||
                  isImminentAttacker(player, target) ||
                  getAlivePlayers().length === 2,
                (): InfluencePlay[] => [
                  { type: influenceType, options: {}, ev: 3 },
                ],
              )
              .otherwise((): InfluencePlay[] => []),
          )
          .at(0) ?? null,
    )
    .value();

const byDescendingStrength = (
  firstRival: Player,
  secondRival: Player,
): number =>
  computePlayerStrength(secondRival) - computePlayerStrength(firstRival);

const getWantedCardSteal = (
  player: Player,
  rivals: Player[],
): InfluencePlay | null =>
  chain(computeAverageStrength())
    .thru(
      (averageStrength) =>
        (
          [
            ...match(
              hasBuilding(player, 'BARRACKS') &&
                (player.hand.RECRUIT || 0) === 0,
            )
              .with(true, (): ('RECRUIT' | 'TRADE')[] => ['RECRUIT'])
              .otherwise((): ('RECRUIT' | 'TRADE')[] => []),
            ...match(
              hasBuilding(player, 'EMBASSY') && (player.hand.TRADE || 0) === 0,
            )
              .with(true, (): ('RECRUIT' | 'TRADE')[] => ['TRADE'])
              .otherwise((): ('RECRUIT' | 'TRADE')[] => []),
          ] as ('RECRUIT' | 'TRADE')[]
        )
          .flatMap((wantedCardType) =>
            match(
              rivals
                .filter(
                  (rival) =>
                    (rival.hand[wantedCardType] || 0) > 0 &&
                    computePlayerStrength(rival) >= averageStrength,
                )
                .toSorted(byDescendingStrength)
                .at(0),
            )
              .with(nullish, (): InfluencePlay[] => [])
              .otherwise((holder): InfluencePlay[] => [
                {
                  type: 'STEAL_ACTION',
                  options: { target: holder, cardType: wantedCardType },
                  ev: 2,
                },
              ]),
          )
          .at(0) ?? null,
    )
    .value();

const getStealPlay = (player: Player): InfluencePlay | null =>
  match((player.hand.STEAL_ACTION || 0) < 1)
    .with(true, () => null)
    .otherwise(() =>
      chain({
        plan: getPlan(player),
        rivals: getAlivePlayers().filter((rival) => rival.id !== player.id),
      })
        .thru(({ plan, rivals }) =>
          match(
            rivals
              .filter((rival) => isImminentAttacker(player, rival))
              .toSorted(byDescendingStrength)
              .at(0),
          )
            .with(nullish, () =>
              match(
                (plan.kind === 'STRIKE' || plan.kind === 'MILITARIZE') &&
                  (player.hand.ATTACK || 0) === 0 &&
                  hasBuilding(player, 'SILO'),
              )
                .with(false, () => getWantedCardSteal(player, rivals))
                .otherwise(() =>
                  match(
                    rivals
                      .filter((rival) => (rival.hand.ATTACK || 0) > 0)
                      .toSorted(byDescendingStrength)
                      .at(0),
                  )
                    .with(nullish, () => getWantedCardSteal(player, rivals))
                    .otherwise(
                      (holder): InfluencePlay => ({
                        type: 'STEAL_ACTION',
                        options: { target: holder, cardType: 'ATTACK' },
                        ev: 2.5,
                      }),
                    ),
                ),
            )
            .otherwise(
              (dangerousRival): InfluencePlay => ({
                type: 'STEAL_ACTION',
                options: { target: dangerousRival, cardType: 'ATTACK' },
                ev: 3,
              }),
            ),
        )
        .value(),
    );

export const getInfluencePlay = (player: Player): InfluencePlay | null =>
  getCoupPlay(player) ??
  getPeacePlay(player) ??
  getSkipPlay(player) ??
  getStealPlay(player);
