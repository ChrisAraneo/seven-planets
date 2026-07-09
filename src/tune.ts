/* =====================================================================
   SEVEN PLANETS — MASTERMIND weight tuner.

   Run this after changing the game's numbers (constants.ts): the mastermind
   AI derives its core math from those constants automatically, and this
   script recalibrates the residual judgment weights (ai/weights.ts) so its
   risk appetite matches the new balance.

   Method: coordinate descent. For every tunable weight it tries a step up
   and a step down, measures the mastermind's win rate over a batch of
   headless games against random personality line-ups, and keeps any change
   that beats the incumbent by more than sampling noise. The winner is
   written back to src/ai/weights.ts plus a markdown report.

   Run with:  npm run tune              (240 games/candidate, 2 passes)
              npm run tune 500 3        (custom games-per-eval, passes)
   ===================================================================== */

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { installAi } from '@/ai/agent';
import { getAiWeights } from '@/ai/functions/get-ai-weights';
import { setAiWeights } from '@/ai/functions/set-ai-weights';
import type { Weights as AiWeights } from '@/ai/weights';
import { PRIORITIES } from '@/game/config/constants';
import { simulateGameWithPersonalities } from '@/stores/game/functions/simulate-game-with-personalities';
// The game state lives in the Vuex store — importing it creates the store
// and installs the accessor every engine/AI function reads it through.
import '@/stores';

// Seat the AI agent; no presentation layer is installed, so the engine's
// pacing/animation hooks are no-ops and games run at pure logic speed.
installAi();

const SEATS = 7;
const DEFAULT_GAMES = 240;
const DEFAULT_PASSES = 2;

// Opponents are drawn from every personality EXCEPT the mastermind itself.
const OTHERS = Object.keys(PRIORITIES).filter((s) => s !== 'mastermind');

interface ParamSpec {
  key: keyof AiWeights;
  step: number; // absolute step size tried in both directions
  min: number;
  max: number;
  int?: boolean; // keep the value an integer (turn counts, troop counts)
}

// The search space. holdHorizon stays >= 5 by design: the retention forecast
// must always look at least 5 turns ahead.
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

function fisherYates<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** Win rate of one mastermind seated among 6 random rival personalities. */
async function winRate(weights: AiWeights, games: number): Promise<number> {
  setAiWeights(weights);
  let wins = 0;
  for (let g = 0; g < games; g++) {
    const lineup = fisherYates([
      'mastermind',
      ...fisherYates(OTHERS).slice(0, SEATS - 1),
    ]);
    const result = await simulateGameWithPersonalities(lineup);
    if (result.winner?.personality === 'mastermind') wins++;
  }
  return wins / games;
}

/** Regenerate src/ai/weights.ts with the tuned values. */
function weightsFileContent(w: AiWeights): string {
  const doc: Record<keyof AiWeights, string> = {
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
    troopValue:
      'Strategic value of one troop when pricing expected battle losses.',
    coupValueFloor:
      "Minimum planet value that justifies a 20-star Coup d'Etat.",
    peaceThreatFloor:
      'P(losing a planet this coming turn) that triggers a held Peace Treaty.',
    tradeAcceptRatio: 'Accept incoming trades when valueIn >= valueOut * this.',
    willAggressive:
      'How likely an aggressive rival is to actually launch a viable attack.',
    willNeutral:
      '...a neutral/unknown rival (balanced, random, the human player).',
    willDefensive: '...a defensive rival (fortifier, economist, trader, ...).',
  };
  const lines = SPECS.map((spec) => `  ${spec.key}: ${w[spec.key]},`);
  return `/* =====================================================================
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
${SPECS.map((spec) => `  /** ${doc[spec.key]} */\n  ${spec.key}: number`).join('\n')}
}

export const WEIGHTS: Weights = {
${lines.join('\n')}
}
`;
}

async function main(): Promise<void> {
  const games = Math.max(20, Number(process.argv[2]) || DEFAULT_GAMES);
  const passes = Math.max(1, Number(process.argv[3]) || DEFAULT_PASSES);

  let best: AiWeights = getAiWeights();
  const t0 = Date.now();
  const history: string[] = [];

  console.log(
    `MASTERMIND tuner — ${games} games per candidate, ${passes} pass(es)`,
  );
  console.log(
    `Baseline (no-edge) win rate for 1 of ${SEATS} seats: ${(100 / SEATS).toFixed(1)}%\n`,
  );

  let bestRate = await winRate(best, games);
  console.log(
    `baseline weights ................ ${(bestRate * 100).toFixed(1)}%`,
  );
  history.push(`| — | baseline | — | ${(bestRate * 100).toFixed(1)}% | kept |`);

  for (let pass = 1; pass <= passes; pass++) {
    console.log(`\n— pass ${pass}/${passes} —`);
    for (const spec of SPECS) {
      for (const dir of [1, -1]) {
        const raw = best[spec.key] + dir * spec.step;
        const clamped = Math.min(spec.max, Math.max(spec.min, raw));
        const value = spec.int ? Math.round(clamped) : round3(clamped);
        if (value === best[spec.key]) continue;
        const rate = await winRate({ ...best, [spec.key]: value }, games);
        // Only adopt improvements that clear half a standard error of noise.
        const se = Math.sqrt((bestRate * (1 - bestRate)) / games);
        const keep = rate > bestRate + 0.5 * se;
        console.log(
          `${spec.key}: ${best[spec.key]} → ${value} ..... ${(rate * 100).toFixed(1)}% ${keep ? '✓ kept' : '✗'}`,
        );
        history.push(
          `| ${pass} | ${spec.key} | ${best[spec.key]} → ${value} | ${(rate * 100).toFixed(1)}% | ${keep ? 'kept' : 'rejected'} |`,
        );
        if (keep) {
          best = { ...best, [spec.key]: value };
          bestRate = rate;
        }
      }
    }
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(
    `\nDone in ${elapsed}s — final win rate ${(bestRate * 100).toFixed(1)}%`,
  );

  const weightsPath = resolve(process.cwd(), 'src/ai/weights.ts');
  writeFileSync(weightsPath, weightsFileContent(best), 'utf8');
  console.log(`Weights written to ${weightsPath}`);

  const stamp = new Date()
    .toISOString()
    .replace(/:/g, '-')
    .replace(/\..+$/, '');
  const reportsDir = resolve(process.cwd(), 'reports');
  mkdirSync(reportsDir, { recursive: true });
  const reportPath = resolve(reportsDir, `tuning-${stamp}.md`);
  const report = [
    '# Seven Planets — MASTERMIND tuning report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `- **Games per candidate:** ${games}`,
    `- **Passes:** ${passes}`,
    `- **Final win rate:** ${(bestRate * 100).toFixed(1)}% (baseline for a no-edge seat: ${(100 / SEATS).toFixed(1)}%)`,
    `- **Wall-clock time:** ${elapsed}s`,
    '',
    '## Final weights',
    '',
    '```ts',
    ...SPECS.map((spec) => `${spec.key}: ${best[spec.key]}`),
    '```',
    '',
    '## Search history',
    '',
    '| Pass | Weight | Change | Win rate | Verdict |',
    '| ---: | :--- | :--- | ---: | :--- |',
    ...history,
    '',
  ].join('\n');
  writeFileSync(reportPath, report + '\n', 'utf8');
  console.log(`Report written to ${reportPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
