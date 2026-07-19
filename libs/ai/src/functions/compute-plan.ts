import type { Player } from '@seven-planets/game';
import { getTurn } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { chain } from '../utils/chain';
import { applyStickiness } from './apply-stickiness';
import { computeBestInvasion } from './compute-best-invasion';
import { computeCoupBankScore } from './compute-coup-bank-score';
import { computeDevelopScore } from './compute-develop-score';
import { computeThreat } from './compute-threat';
import { getBestAttackNow } from './get-best-attack-now';
import { getBuildCandidates } from './get-build-candidates';
import { getStagingPlanet } from './get-staging-planet';
import { pickStrategy } from './pick-strategy';
import type { Plan, StrategyKind } from './plan-types';
import { prioritizeEnablers } from './prioritize-enablers';

export const computePlan = (
  player: Player,
  prevKind: StrategyKind | null,
): Plan =>
  chain({
    tempo: Math.min(1.8, 0.8 + getTurn() / 50),
    queue: getBuildCandidates(player),
    strike: getBestAttackNow(player),
    staging: getStagingPlanet(player),
  })
    .thru(({ tempo, queue, strike, staging }) => ({
      queue,
      strike,
      staging,
      tempo,
      invasion: match(player.hasPacifistStatus)
        .with(true, () => null)
        .otherwise(() => computeBestInvasion(player, staging, tempo)),
      threat: computeThreat(player),
    }))
    .thru(({ queue, strike, staging, tempo, invasion, threat }) =>
      chain(
        applyStickiness(
          {
            DEVELOP: computeDevelopScore(queue),
            STRIKE: match(Boolean(strike?.willConquer))
              .with(true, () => (strike?.score ?? 0) * 1.25 * tempo)
              .otherwise(() => 0),
            MILITARIZE: invasion?.score ?? 0,
            FORTIFY: threat * 0.9,
            COUP_BANK: computeCoupBankScore(player, threat),
          },
          prevKind,
        ),
      )
        .thru((scores) => ({
          kind: pickStrategy(scores),
          computedTurn: getTurn(),
          buildQueue: prioritizeEnablers(queue, pickStrategy(scores), player),
          strike,
          targetId: invasion?.targetId ?? null,
          stagingId: staging?.id ?? null,
          troopsNeeded: invasion?.troopsNeeded ?? 0,
          threat,
          scores,
        }))
        .value(),
    )
    .value();
