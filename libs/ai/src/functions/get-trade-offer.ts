import type { Cost, Player } from '@seven-planets/game';
import { CARDS, RESOURCE_TYPES } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
import { chain } from '../utils/chain';
import { nullish } from '../utils/p';
import { computeAverageStrength } from './compute-average-strength';
import { computePlayerStrength } from './compute-player-strength';
import type { BuildCandidate } from './get-build-candidates';
import type { Plan } from './plan-types';

const findWantedResource = (
  player: Player,
  plan: Plan,
  head: BuildCandidate | undefined,
): string | null =>
  match(
    RESOURCE_TYPES.find(
      (resourceType) =>
        resourceType !== 'RELIC' &&
        (head?.cost[resourceType] || 0) > (player.hand[resourceType] || 0),
    ),
  )
    .with(nullish, () =>
      match(
        (plan.kind === 'MILITARIZE' || plan.kind === 'STRIKE') &&
          (player.hand.ORE || 0) < 3,
      )
        .with(true, (): string | null => 'ORE')
        .otherwise(() => null),
    )
    .otherwise((goalShortfall) => goalShortfall);

const collectSurplus = (
  player: Player,
  head: BuildCandidate | undefined,
  wantedResource: string,
): string[] =>
  RESOURCE_TYPES.filter(
    (resourceType) =>
      resourceType !== 'RELIC' && resourceType !== wantedResource,
  )
    .flatMap((resourceType) =>
      Array.from(
        {
          length: Math.max(
            0,
            (player.hand[resourceType] || 0) - (head?.cost[resourceType] || 0),
          ),
        },
        (): string => resourceType,
      ),
    )
    .toSorted(
      (firstType, secondType) =>
        CARDS[firstType].value - CARDS[secondType].value,
    );

const buildGives = (
  player: Player,
  head: BuildCandidate | undefined,
  wantedResource: string,
): Cost | null =>
  chain(CARDS[wantedResource].value * 1.25)
    .thru((targetValue) =>
      chain(
        collectSurplus(player, head, wantedResource).reduce<{
          gives: Cost;
          givenValue: number;
        }>(
          (acc, resourceType) =>
            match(acc.givenValue >= targetValue)
              .with(true, () => acc)
              .otherwise(() => ({
                gives: {
                  ...acc.gives,
                  [resourceType]: (acc.gives[resourceType] || 0) + 1,
                },
                givenValue: acc.givenValue + CARDS[resourceType].value,
              })),
          { gives: {}, givenValue: 0 },
        ),
      )
        .thru(({ gives, givenValue }) =>
          match(givenValue < targetValue)
            .with(true, () => null)
            .otherwise(() => gives),
        )
        .value(),
    )
    .value();

const findPartner = (player: Player, wantedResource: string): Player | null =>
  chain({
    averageStrength: computeAverageStrength(),
    partners: getAlivePlayers()
      .filter(
        (rival) =>
          rival.id !== player.id && (rival.hand[wantedResource] || 0) > 0,
      )
      .toSorted(
        (firstRival, secondRival) =>
          computePlayerStrength(firstRival) -
          computePlayerStrength(secondRival),
      ),
  })
    .thru(
      ({ averageStrength, partners }) =>
        partners.find(
          (rival) => computePlayerStrength(rival) < averageStrength * 1.3,
        ) ??
        partners.at(0) ??
        null,
    )
    .value();

export const getTradeOffer = (
  player: Player,
  plan: Plan,
): { partner: Player; gives: Cost; gets: Cost } | null =>
  chain(plan.buildQueue.at(0))
    .thru((head) =>
      match(findWantedResource(player, plan, head))
        .with(nullish, () => null)
        .otherwise((wantedResource) =>
          match(buildGives(player, head, wantedResource))
            .with(nullish, () => null)
            .otherwise((gives) =>
              match(findPartner(player, wantedResource))
                .with(nullish, () => null)
                .otherwise((partner) => ({
                  partner,
                  gives,
                  gets: { [wantedResource]: 1 },
                })),
            ),
        ),
    )
    .value();
