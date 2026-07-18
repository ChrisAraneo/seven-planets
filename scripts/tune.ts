import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { getAiWeights } from '@seven-planets/ai';
import { setAiWeights } from '@seven-planets/ai';
import type { Weights as AiWeights } from '@seven-planets/ai';
import { simulateGame } from '@seven-planets/game';
import { noop, range, times } from 'lodash-es';
import { match } from 'ts-pattern';
import '@/stores';
import { chain } from '@/utils/chain';

const SEATS = 7;
const DEFAULT_GAMES = 240;
const DEFAULT_PASSES = 2;

interface ParamSpec {
  key: keyof AiWeights;
  step: number;
  min: number;
  max: number;
  int?: boolean;
}

const SPECS: ParamSpec[] = [
  { key: 'planHorizon', step: 2, min: 5, max: 12, int: true },
  { key: 'holdHorizon', step: 1, min: 5, max: 10, int: true },
  { key: 'buildRoiHorizon', step: 3, min: 6, max: 30, int: true },
  { key: 'minConquerProb', step: 0.08, min: 0.3, max: 0.9 },
  { key: 'minHoldProb', step: 0.08, min: 0.1, max: 0.8 },
  { key: 'reserveTroops', step: 1, min: 0, max: 5, int: true },
  { key: 'denialWeight', step: 0.15, min: 0, max: 1.5 },
  { key: 'planStickiness', step: 0.1, min: 1, max: 1.6 },
  { key: 'aggressionRamp', step: 0.001, min: 0, max: 0.01 },
  { key: 'troopValue', step: 0.25, min: 0.5, max: 3 },
  { key: 'coupValueFloor', step: 2, min: 4, max: 24, int: true },
  { key: 'peaceThreatFloor', step: 0.08, min: 0.1, max: 0.8 },
  { key: 'tradeAcceptRatio', step: 0.1, min: 0.8, max: 1.8 },
  { key: 'willAggressive', step: 0.1, min: 0.4, max: 1 },
  { key: 'willNeutral', step: 0.1, min: 0.2, max: 0.9 },
  { key: 'willDefensive', step: 0.1, min: 0.05, max: 0.7 },
];

const WEIGHT_DOCS: Record<keyof AiWeights, string> = {
  planHorizon:
    'Strategy look-ahead window in turns (the "next 5-10 turns" plan).',
  holdHorizon:
    'Retention forecast window — will a conquest be retaken within this many turns?',
  buildRoiHorizon:
    'A build must repay its cost within this many turns to be "worth it".',
  minConquerProb:
    'Never launch a conquest below this win probability (relaxes late game).',
  minHoldProb: '...nor when the retention forecast falls below this.',
  reserveTroops: 'Defenders left at home when a strike launches.',
  denialWeight:
    'How aggressively to hate-draft cards rivals want (0 = never deny).',
  planStickiness:
    'Multiplier protecting the current plan from turn-to-turn thrashing.',
  aggressionRamp:
    'Per-turn loosening of the conquest thresholds (endgame decisiveness).',
  troopValue: 'Strategic value of 1 troop when pricing expected battle losses.',
  coupValueFloor: "Minimum planet value that justifies a 20-star Coup d'Etat.",
  peaceThreatFloor:
    'P(losing a planet this coming turn) that triggers a held Peace Treaty.',
  tradeAcceptRatio: 'Accept incoming trades when valueIn >= valueOut * this.',
  willAggressive:
    'How likely an aggressive rival is to actually launch a viable attack.',
  willNeutral:
    '...a neutral/unknown rival (balanced, random, the human player).',
  willDefensive: '...a defensive rival (fortifier, economist, trader, ...).',
};

interface TuneState {
  best: AiWeights;
  bestRate: number;
  history: string[];
}

const round3 = (n: number): number => Math.round(n * 1000) / 1000;

const countWin = (wins: number, isRivalWin: boolean): number =>
  match(isRivalWin)
    .with(true, () => wins + 1)
    .otherwise(() => wins);

const winRate = (weights: AiWeights, games: number): Promise<number> =>
  chain(setAiWeights(weights))
    .thru(() =>
      times(games, noop).reduce(
        (prev: Promise<number>) =>
          prev.then((wins) =>
            simulateGame().then((result) =>
              countWin(wins, Boolean(result.winner) && !result.winner?.isHuman),
            ),
          ),
        Promise.resolve(0),
      ),
    )
    .thru((totalWins) => totalWins.then((wins) => wins / games))
    .value();

const weightsFileContent = (
  w: AiWeights,
): string => `/* =====================================================================
   SEVEN PLANETS — MASTERMIND AI weights.

   The mastermind AI (./ai.ts) derives its core math (battle odds, build
   costs, income values) directly from constants.ts, so most game-number
   changes propagate to it automatically. The judgment calls that CANNOT
   be derived — risk appetite, look-ahead windows, denial aggressiveness —
   live here.

   Recalibrate after changing game constants with:  npm run tune
   (the tuner rewrites this file with the best weights it finds).

   LAST TUNED: ${new Date().toISOString()} by npm run tune
   ===================================================================== */

export interface Weights {
${SPECS.map((spec) => `  /** ${WEIGHT_DOCS[spec.key]} */\n  ${spec.key}: number`).join('\n')}
}

export const WEIGHTS: Weights = {
${SPECS.map((spec) => `  ${spec.key}: ${w[spec.key]},`).join('\n')}
}
`;

const clampValue = (spec: ParamSpec, raw: number): number =>
  chain(Math.min(spec.max, Math.max(spec.min, raw)))
    .thru((clamped) =>
      match(Boolean(spec.int))
        .with(true, () => Math.round(clamped))
        .otherwise(() => round3(clamped)),
    )
    .value();

const toKeepMark = (keep: boolean): string =>
  match(keep)
    .with(true, () => '✓ kept')
    .otherwise(() => '✗');

const toVerdict = (keep: boolean): string =>
  match(keep)
    .with(true, () => 'kept')
    .otherwise(() => 'rejected');

const applyCandidate = (
  state: TuneState,
  pass: number,
  spec: ParamSpec,
  value: number,
  rate: number,
  games: number,
): TuneState =>
  chain(
    rate >
      state.bestRate +
        0.5 * Math.sqrt((state.bestRate * (1 - state.bestRate)) / games),
  )
    .tap((keep) =>
      console.log(
        `${spec.key}: ${state.best[spec.key]} → ${value} ..... ${(rate * 100).toFixed(1)}% ${toKeepMark(keep)}`,
      ),
    )
    .thru((keep) => ({
      best: match(keep)
        .with(true, () => ({ ...state.best, [spec.key]: value }))
        .otherwise(() => state.best),
      bestRate: match(keep)
        .with(true, () => rate)
        .otherwise(() => state.bestRate),
      history: [
        ...state.history,
        `| ${pass} | ${spec.key} | ${state.best[spec.key]} → ${value} | ${(rate * 100).toFixed(1)}% | ${toVerdict(keep)} |`,
      ],
    }))
    .value();

const evaluateCandidate = (
  state: TuneState,
  pass: number,
  spec: ParamSpec,
  dir: number,
  games: number,
): Promise<TuneState> =>
  chain(clampValue(spec, state.best[spec.key] + dir * spec.step))
    .thru((value) =>
      match(value === state.best[spec.key])
        .with(true, () => Promise.resolve(state))
        .otherwise(() =>
          winRate({ ...state.best, [spec.key]: value }, games).then((rate) =>
            applyCandidate(state, pass, spec, value, rate, games),
          ),
        ),
    )
    .value();

const runPass = (
  statePromise: Promise<TuneState>,
  pass: number,
  passes: number,
  games: number,
): Promise<TuneState> =>
  statePromise.then((state) =>
    chain(console.log(`\n— pass ${pass}/${passes} —`))
      .thru(() =>
        SPECS.flatMap((spec) => [1, -1].map((dir) => ({ spec, dir }))).reduce(
          (prev, { spec, dir }) =>
            prev.then((current) =>
              evaluateCandidate(current, pass, spec, dir, games),
            ),
          Promise.resolve(state),
        ),
      )
      .value(),
  );

const buildReport = (
  state: TuneState,
  games: number,
  passes: number,
  elapsed: string,
): string =>
  [
    '# Seven Planets — MASTERMIND tuning report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `- **Games per candidate:** ${games}`,
    `- **Passes:** ${passes}`,
    `- **Final win rate:** ${(state.bestRate * 100).toFixed(1)}% (baseline for a no-edge seat: ${(100 / SEATS).toFixed(1)}%)`,
    `- **Wall-clock time:** ${elapsed}s`,
    '',
    '## Final weights',
    '',
    '```ts',
    ...SPECS.map((spec) => `${spec.key}: ${state.best[spec.key]}`),
    '```',
    '',
    '## Search history',
    '',
    '| Pass | Weight | Change | Win rate | Verdict |',
    '| ---: | :--- | :--- | ---: | :--- |',
    ...state.history,
    '',
  ].join('\n');

const writeWeights = (best: AiWeights): void =>
  chain(resolve(process.cwd(), 'src/ai/weights.ts'))
    .tap((weightsPath) =>
      writeFileSync(weightsPath, weightsFileContent(best), 'utf8'),
    )
    .tap((weightsPath) => console.log(`Weights written to ${weightsPath}`))
    .thru(noop)
    .value();

const writeReport = (
  state: TuneState,
  games: number,
  passes: number,
  elapsed: string,
): void =>
  chain({
    stamp: new Date().toISOString().replace(/:/g, '-').replace(/\..+$/, ''),
    reportsDir: resolve(process.cwd(), 'reports'),
  })
    .tap(({ reportsDir }) => mkdirSync(reportsDir, { recursive: true }))
    .thru(({ stamp, reportsDir }) => resolve(reportsDir, `tuning-${stamp}.md`))
    .tap((reportPath) =>
      writeFileSync(
        reportPath,
        buildReport(state, games, passes, elapsed) + '\n',
        'utf8',
      ),
    )
    .tap((reportPath) => console.log(`Report written to ${reportPath}`))
    .thru(noop)
    .value();

const writeOutputs = (
  state: TuneState,
  games: number,
  passes: number,
  t0: number,
): void =>
  chain(((Date.now() - t0) / 1000).toFixed(0))
    .tap((elapsed) =>
      console.log(
        `\nD1 in ${elapsed}s — final win rate ${(state.bestRate * 100).toFixed(1)}%`,
      ),
    )
    .tap(() => writeWeights(state.best))
    .tap((elapsed) => writeReport(state, games, passes, elapsed))
    .thru(noop)
    .value();

const toInitialState = (baselineRate: number): TuneState =>
  chain(
    console.log(
      `baseline weights ................ ${(baselineRate * 100).toFixed(1)}%`,
    ),
  )
    .thru(() => ({
      best: getAiWeights(),
      bestRate: baselineRate,
      history: [
        `| — | baseline | — | ${(baselineRate * 100).toFixed(1)}% | kept |`,
      ],
    }))
    .value();

const main = (): Promise<void> =>
  chain({
    games: Math.max(20, Number(process.argv[2]) || DEFAULT_GAMES),
    passes: Math.max(1, Number(process.argv[3]) || DEFAULT_PASSES),
    t0: Date.now(),
  })
    .tap(({ games, passes }) =>
      console.log(
        `MASTERMIND tuner — ${games} games per candidate, ${passes} pass(es)`,
      ),
    )
    .tap(() =>
      console.log(
        `Baseline (no-edge) win rate for 1 of ${SEATS} seats: ${(100 / SEATS).toFixed(1)}%\n`,
      ),
    )
    .thru(({ games, passes, t0 }) =>
      winRate(getAiWeights(), games)
        .then(toInitialState)
        .then((initial) =>
          range(1, passes + 1).reduce(
            (prev, pass) => runPass(prev, pass, passes, games),
            Promise.resolve(initial),
          ),
        )
        .then((finalState) => writeOutputs(finalState, games, passes, t0)),
    )
    .value();

main().catch((err: unknown) =>
  chain(console.error(err))
    .thru(() => process.exit(1))
    .value(),
);
