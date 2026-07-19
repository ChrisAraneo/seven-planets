import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { setAiDifficulty } from '@seven-planets/ai';
import { DIFFICULTIES } from '@seven-planets/game';
import { simulateGame } from '@seven-planets/game';
import type { SimulationResult } from '@seven-planets/game';
import { assign, noop, times } from 'lodash-es';
import { match, P } from 'ts-pattern';
import '@/stores';
import { chain } from '@/utils/chain';

const { nonNullable } = P;

const SEATS = 7;
const HUMAN_SEAT = 0;
const DEFAULT_GAMES = 3_000;

const median = (nums: number[]): number =>
  match(nums.length)
    .with(0, () => 0)
    .otherwise(() =>
      chain(nums.slice().sort((a, b) => a - b))
        .thru((sorted) => ({ sorted, mid: Math.floor(sorted.length / 2) }))
        .thru(({ sorted, mid }) =>
          match(sorted.length % 2)
            .with(0, () => (sorted[mid - 1] + sorted[mid]) / 2)
            .otherwise(() => sorted[mid]),
        )
        .value(),
    );

const mean = (nums: number[]): number =>
  match(nums.length)
    .with(0, () => 0)
    .otherwise((length) => nums.reduce((a, b) => a + b, 0) / length);

const fmt = (n: number, dp = 1): string => n.toFixed(dp);

interface DiffStat {
  id: string;
  name: string;
  icon: string;
  kamikaze: number;
  games: number;
  humanWins: number;
  humanWinTurns: number[];
  decisive: number;
  allTurns: number[];
}

interface Tracker {
  completed: number;
  t0: number;
  progressEvery: number;
}

type DifficultyDef = (typeof DIFFICULTIES)[number];

const createStat = (def: DifficultyDef, gamesPer: number): DiffStat => ({
  id: def.id,
  name: def.name,
  icon: def.icon,
  kamikaze: def.kamikazeCount,
  games: gamesPer,
  humanWins: 0,
  humanWinTurns: [],
  decisive: 0,
  allTurns: [],
});

const applyHumanWin = (st: DiffStat, result: SimulationResult): void =>
  match(result.winner?.id)
    .with(
      HUMAN_SEAT,
      () =>
        void chain(assign(st, { humanWins: st.humanWins + 1 }))
          .tap(() => st.humanWinTurns.push(result.turns))
          .value(),
    )
    .otherwise(noop);

const applyResult = (st: DiffStat, result: SimulationResult): void =>
  chain(st.allTurns.push(result.turns))
    .thru(() =>
      match(result)
        .with({ reason: 'CONQUEST', winner: nonNullable }, () =>
          chain(assign(st, { decisive: st.decisive + 1 }))
            .thru(() => applyHumanWin(st, result))
            .value(),
        )
        .otherwise(noop),
    )
    .value();

const printProgress = (
  tracker: Tracker,
  defName: string,
  totalGames: number,
): void =>
  match(
    tracker.completed % tracker.progressEvery === 0 ||
      tracker.completed === totalGames,
  )
    .with(true, () =>
      chain({
        pct: ((tracker.completed / totalGames) * 100).toFixed(0),
        rate: tracker.completed / ((Date.now() - tracker.t0) / 1000),
      })
        .thru(
          ({ pct, rate }) =>
            void process.stdout.write(
              `\r  ${pct}% — ${tracker.completed}/${totalGames} games — ${defName.padEnd(10)} — ${rate.toFixed(0)} games/s — ETA ${((totalGames - tracker.completed) / rate).toFixed(0)}s   `,
            ),
        )
        .value(),
    )
    .otherwise(noop);

const runGamesFor = (
  def: DifficultyDef,
  st: DiffStat,
  tracker: Tracker,
  totalGames: number,
): Promise<void> =>
  times(st.games, noop).reduce(
    (prev: Promise<void>) =>
      prev
        .then(() => simulateGame(400, { kamikazeCount: def.kamikazeCount }))
        .then((result) =>
          chain(applyResult(st, result))
            .tap(() => assign(tracker, { completed: tracker.completed + 1 }))
            .tap(() => printProgress(tracker, def.name, totalGames))
            .thru(noop)
            .value(),
        ),
    Promise.resolve(),
  );

interface Summary {
  gamesPer: number;
  totalGames: number;
  elapsed: number;
}

const padCell = (s: string, w: number, a: 'l' | 'r'): string =>
  match(a)
    .with('r', () => s.padStart(w))
    .otherwise(() => s.padEnd(w));

const asciiTable = (
  headers: string[],
  aligns: ('l' | 'r')[],
  rows: string[][],
): string =>
  chain(
    headers.map((h, c) => Math.max(h.length, ...rows.map((r) => r[c].length))),
  )
    .thru((widths) => ({
      widths,
      line: (cells: string[]): string =>
        '| ' +
        cells
          .map((cell, i) => padCell(cell, widths[i], aligns[i]))
          .join(' | ') +
        ' |',
    }))
    .thru(({ widths, line }) =>
      [
        line(headers),
        '|' + widths.map((w) => '-'.repeat(w + 2)).join('|') + '|',
        ...rows.map(line),
      ].join('\n'),
    )
    .value();

const winRate = (st: DiffStat): number =>
  match(st.games)
    .with(0, () => 0)
    .otherwise((games) => (st.humanWins / games) * 100);

const toWinTurns = (
  st: DiffStat,
  compute: (nums: number[]) => number,
): string =>
  match(st.humanWins)
    .with(0, () => '—')
    .otherwise(() => fmt(compute(st.humanWinTurns)));

const buildConsoleReport = (stats: DiffStat[], sum: Summary): string =>
  [
    '==================================================================',
    '  SEVEN PLANETS — DIFFICULTY WIN-RATE REPORT',
    '==================================================================',
    '',
    '  A STANDARD mastermind (seat 0, never handicapped) stands in for a',
    '  skilled human. Every difficulty pits it against 6 mastermind rivals',
    '  weakened by that difficulty and its kamikazes. Higher Win% = easier.',
    '',
    `  Games per difficulty ..... ${sum.gamesPer.toLocaleString('en-US')}`,
    `  Difficulties ............. ${stats.length}`,
    `  Total games .............. ${sum.totalGames.toLocaleString('en-US')}`,
    `  Seats per game ........... ${SEATS} (seat 0 = human proxy, standard)`,
    `  Wall-clock time .......... ${fmt(sum.elapsed)}s (${(sum.totalGames / sum.elapsed).toFixed(0)} games/s)`,
    '',
    `  Baseline: with ${SEATS} equal seats, a no-edge player wins ≈ ${fmt(100 / SEATS)}%.`,
    '',
    "  HUMAN-PROXY WIN RATE BY DIFFICULTY (turns cover the proxy's wins only)",
    '',
    asciiTable(
      ['Difficulty', 'Kamikaze', 'Games', 'Wins', 'Win%', 'AvgT', 'MedT'],
      ['l', 'r', 'r', 'r', 'r', 'r', 'r'],
      stats.map((st) => [
        `${st.icon} ${st.name}`,
        String(st.kamikaze),
        st.games.toLocaleString('en-US'),
        st.humanWins.toLocaleString('en-US'),
        fmt(winRate(st)),
        toWinTurns(st, mean),
        toWinTurns(st, median),
      ]),
    )
      .split('\n')
      .map((ln) => '  ' + ln)
      .join('\n'),
    '',
  ].join('\n');

const buildMarkdownReport = (stats: DiffStat[], sum: Summary): string =>
  [
    '# Seven Planets — Difficulty Win-Rate Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    'A **standard mastermind** (seat 0, never handicapped) stands in for a skilled human. ' +
      'Each difficulty pits it against six mastermind rivals weakened by that difficulty’s ' +
      'handicap and hunted by its kamikazes. A higher win rate means an easier level.',
    '',
    '## Batch summary',
    '',
    `- **Games per difficulty:** ${sum.gamesPer.toLocaleString('en-US')}`,
    `- **Difficulties:** ${stats.length}`,
    `- **Total games:** ${sum.totalGames.toLocaleString('en-US')}`,
    `- **Seats per game:** ${SEATS} (seat 0 = human proxy, standard strength)`,
    `- **Wall-clock time:** ${fmt(sum.elapsed)}s (${(sum.totalGames / sum.elapsed).toFixed(0)} games/s)`,
    '',
    `> Baseline: with ${SEATS} equal seats, a no-edge player wins ≈ ${fmt(100 / SEATS)}% of games.`,
    '',
    '## Human-proxy win rate by difficulty',
    '',
    '"Turns to win" covers only the human proxy’s victories.',
    '',
    '| Difficulty | Kamikaze | Games | Wins | Win rate | Avg turns | Median turns |',
    '| :--- | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...stats.map(
      (st) =>
        `| ${st.icon} ${st.name} | ${st.kamikaze} | ${st.games.toLocaleString('en-US')} | ${st.humanWins.toLocaleString('en-US')} | ${fmt(winRate(st))}% | ${toWinTurns(st, mean)} | ${toWinTurns(st, median)} |`,
    ),
    '',
  ].join('\n');

const writeReportFile = (stats: DiffStat[], summary: Summary): void =>
  chain({
    stamp: new Date().toISOString().replace(/:/g, '-').replace(/\..+$/, ''),
    reportsDir: resolve(process.cwd(), 'reports'),
  })
    .tap(({ reportsDir }) => mkdirSync(reportsDir, { recursive: true }))
    .thru(({ stamp, reportsDir }) =>
      resolve(reportsDir, `difficulty-${stamp}.md`),
    )
    .tap((outPath) =>
      writeFileSync(
        outPath,
        buildMarkdownReport(stats, summary) + '\n',
        'utf8',
      ),
    )
    .thru((outPath) => void console.log(`\nReport written to ${outPath}`))
    .value();

const finishReport = (
  stats: DiffStat[],
  gamesPer: number,
  totalGames: number,
  t0: number,
): void =>
  chain({ gamesPer, totalGames, elapsed: (Date.now() - t0) / 1000 })
    .tap(() => process.stdout.write('\n'))
    .tap((summary) => console.log('\n' + buildConsoleReport(stats, summary)))
    .thru((summary) => writeReportFile(stats, summary))
    .value();

const main = (): Promise<void> =>
  chain(Math.max(1, Number(process.argv[2]) || DEFAULT_GAMES))
    .thru((gamesPer) => ({
      gamesPer,
      totalGames: gamesPer * DIFFICULTIES.length,
      tracker: {
        completed: 0,
        t0: Date.now(),
        progressEvery: Math.max(
          1,
          Math.floor((gamesPer * DIFFICULTIES.length) / 40),
        ),
      },
      stats: DIFFICULTIES.map((def) => createStat(def, gamesPer)),
    }))
    .thru(({ gamesPer, totalGames, tracker, stats }) =>
      DIFFICULTIES.reduce(
        (prev, def, index) =>
          prev.then(() =>
            chain(setAiDifficulty(def.ai))
              .thru(() => runGamesFor(def, stats[index], tracker, totalGames))
              .value(),
          ),
        Promise.resolve(),
      ).then(() => finishReport(stats, gamesPer, totalGames, tracker.t0)),
    )
    .value();

main().catch((err: unknown) =>
  chain(console.error(err))
    .thru(() => process.exit(1))
    .value(),
);
