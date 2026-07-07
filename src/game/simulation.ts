/* =====================================================================
   SEVEN PLANETS — difficulty win-rate simulation.

   Measures how a STANDARD "mastermind" — the same full-strength planning
   AI, standing in for a skilled human — fares at every difficulty level.

   Each game seats a standard mastermind at seat 0 (the human seat, never
   handicapped) against six mastermind opponents weakened by the chosen
   difficulty's handicap (and hunted by that difficulty's kamikazes). The
   report is the human proxy's WIN % at each difficulty.

   Run with:  npm run simulation            (default games per difficulty)
              npm run simulation 5000        (custom games per difficulty)

   Headless (no `document`), so every seat is driven by AI logic.
   ===================================================================== */

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { DIFFICULTIES } from './difficulty';
import {
  setAiDifficulty,
  setSimMode,
  simulateGameWithPersonalities,
} from './engine';

setSimMode(true); // no animation delays — pure logic speed

const SEATS = 7; // seat 0 = the human proxy (standard mastermind) + 6 AI opponents
const HUMAN_SEAT = 0;
const DEFAULT_GAMES = 3_000; // games PER difficulty
// Every seat is the standard mastermind; the difficulty handicap (applied to the
// AI seats only) is what varies between opponents and the human proxy.
const LINEUP = Array<string>(SEATS).fill('mastermind');

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = nums.slice().sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function fmt(n: number, dp = 1): string {
  return n.toFixed(dp);
}

interface DiffStat {
  id: string;
  name: string;
  icon: string;
  kamikaze: number;
  games: number;
  humanWins: number; // seat-0 (human proxy) conquest wins
  humanWinTurns: number[]; // turns of each human-proxy win
  decisive: number; // games that ended in a conquest (by anyone)
  allTurns: number[];
}

async function main(): Promise<void> {
  const gamesPer = Math.max(1, Number(process.argv[2]) || DEFAULT_GAMES);
  const totalGames = gamesPer * DIFFICULTIES.length;

  const stats: DiffStat[] = [];
  const t0 = Date.now();
  let done = 0;
  const progressEvery = Math.max(1, Math.floor(totalGames / 40));

  for (const def of DIFFICULTIES) {
    setAiDifficulty(def.ai); // handicaps the AI opponents; the human seat stays standard
    const st: DiffStat = {
      id: def.id,
      name: def.name,
      icon: def.icon,
      kamikaze: def.kamikazeCount,
      games: gamesPer,
      humanWins: 0,
      humanWinTurns: [],
      decisive: 0,
      allTurns: [],
    };

    for (let g = 0; g < gamesPer; g++) {
      const result = await simulateGameWithPersonalities(LINEUP, 400, {
        kamikazeCount: def.kamikazeCount,
      });
      st.allTurns.push(result.turns);
      if (result.reason === 'conquest' && result.winner) {
        st.decisive++;
        if (result.winner.id === HUMAN_SEAT) {
          st.humanWins++;
          st.humanWinTurns.push(result.turns);
        }
      }

      if (++done % progressEvery === 0 || done === totalGames) {
        const pct = ((done / totalGames) * 100).toFixed(0);
        const elapsed = (Date.now() - t0) / 1000;
        const rate = done / elapsed;
        const eta = (totalGames - done) / rate;
        process.stdout.write(
          `\r  ${pct}% — ${done}/${totalGames} games — ${def.name.padEnd(10)} — ${rate.toFixed(0)} games/s — ETA ${eta.toFixed(0)}s   `,
        );
      }
    }
    stats.push(st);
  }
  process.stdout.write('\n');

  const elapsed = (Date.now() - t0) / 1000;
  const summary = { gamesPer, totalGames, elapsed };

  console.log('\n' + buildConsoleReport(stats, summary));

  const stamp = new Date()
    .toISOString()
    .replace(/:/g, '-')
    .replace(/\..+$/, '');
  const reportsDir = resolve(process.cwd(), 'reports');
  mkdirSync(reportsDir, { recursive: true });
  const outPath = resolve(reportsDir, `difficulty-${stamp}.md`);
  writeFileSync(outPath, buildMarkdownReport(stats, summary) + '\n', 'utf8');
  console.log(`\nReport written to ${outPath}`);
}

interface Summary {
  gamesPer: number;
  totalGames: number;
  elapsed: number;
}

/** Render an ASCII table with every column padded to a uniform width. */
function asciiTable(
  headers: string[],
  aligns: ('l' | 'r')[],
  rows: string[][],
): string {
  const widths = headers.map((h, c) =>
    Math.max(h.length, ...rows.map((r) => r[c].length)),
  );
  const pad = (s: string, w: number, a: 'l' | 'r') =>
    a === 'r' ? s.padStart(w) : s.padEnd(w);
  const line = (cells: string[]) =>
    '| ' + cells.map((c, i) => pad(c, widths[i], aligns[i])).join(' | ') + ' |';
  const sep = '|' + widths.map((w) => '-'.repeat(w + 2)).join('|') + '|';
  return [line(headers), sep, ...rows.map(line)].join('\n');
}

function winRate(st: DiffStat): number {
  return st.games ? (st.humanWins / st.games) * 100 : 0;
}

function buildConsoleReport(stats: DiffStat[], sum: Summary): string {
  const { gamesPer, totalGames, elapsed } = sum;
  const L: string[] = [];
  L.push('==================================================================');
  L.push('  SEVEN PLANETS — DIFFICULTY WIN-RATE REPORT');
  L.push('==================================================================');
  L.push('');
  L.push('  A STANDARD mastermind (seat 0, never handicapped) stands in for a');
  L.push(
    '  skilled human. Every difficulty pits it against 6 mastermind rivals',
  );
  L.push(
    '  weakened by that difficulty and its kamikazes. Higher Win% = easier.',
  );
  L.push('');
  L.push(`  Games per difficulty ..... ${gamesPer.toLocaleString('en-US')}`);
  L.push(`  Difficulties ............. ${stats.length}`);
  L.push(`  Total games .............. ${totalGames.toLocaleString('en-US')}`);
  L.push(
    `  Seats per game ........... ${SEATS} (seat 0 = human proxy, standard)`,
  );
  L.push(
    `  Wall-clock time .......... ${fmt(elapsed)}s (${(totalGames / elapsed).toFixed(0)} games/s)`,
  );
  L.push('');
  L.push(
    `  Baseline: with ${SEATS} equal seats, a no-edge player wins ≈ ${fmt(100 / SEATS)}%.`,
  );
  L.push('');
  L.push(
    "  HUMAN-PROXY WIN RATE BY DIFFICULTY (turns cover the proxy's wins only)",
  );
  L.push('');

  const headers = [
    'Difficulty',
    'Kamikaze',
    'Games',
    'Wins',
    'Win%',
    'AvgT',
    'MedT',
  ];
  const aligns: ('l' | 'r')[] = ['l', 'r', 'r', 'r', 'r', 'r', 'r'];
  const body = stats.map((st) => [
    `${st.icon} ${st.name}`,
    String(st.kamikaze),
    st.games.toLocaleString('en-US'),
    st.humanWins.toLocaleString('en-US'),
    fmt(winRate(st)),
    st.humanWins ? fmt(mean(st.humanWinTurns)) : '—',
    st.humanWins ? fmt(median(st.humanWinTurns)) : '—',
  ]);
  L.push(
    asciiTable(headers, aligns, body)
      .split('\n')
      .map((ln) => '  ' + ln)
      .join('\n'),
  );
  L.push('');
  return L.join('\n');
}

function buildMarkdownReport(stats: DiffStat[], sum: Summary): string {
  const { gamesPer, totalGames, elapsed } = sum;
  const L: string[] = [];
  L.push('# Seven Planets — Difficulty Win-Rate Report');
  L.push('');
  L.push(`Generated: ${new Date().toISOString()}`);
  L.push('');
  L.push(
    'A **standard mastermind** (seat 0, never handicapped) stands in for a skilled human. ' +
      'Each difficulty pits it against six mastermind rivals weakened by that difficulty’s ' +
      'handicap and hunted by its kamikazes. A higher win rate means an easier level.',
  );
  L.push('');
  L.push('## Batch summary');
  L.push('');
  L.push(`- **Games per difficulty:** ${gamesPer.toLocaleString('en-US')}`);
  L.push(`- **Difficulties:** ${stats.length}`);
  L.push(`- **Total games:** ${totalGames.toLocaleString('en-US')}`);
  L.push(
    `- **Seats per game:** ${SEATS} (seat 0 = human proxy, standard strength)`,
  );
  L.push(
    `- **Wall-clock time:** ${fmt(elapsed)}s (${(totalGames / elapsed).toFixed(0)} games/s)`,
  );
  L.push('');
  L.push(
    `> Baseline: with ${SEATS} equal seats, a no-edge player wins ≈ ${fmt(100 / SEATS)}% of games.`,
  );
  L.push('');
  L.push('## Human-proxy win rate by difficulty');
  L.push('');
  L.push('"Turns to win" covers only the human proxy’s victories.');
  L.push('');
  L.push(
    '| Difficulty | Kamikaze | Games | Wins | Win rate | Avg turns | Median turns |',
  );
  L.push('| :--- | ---: | ---: | ---: | ---: | ---: | ---: |');
  for (const st of stats) {
    L.push(
      `| ${st.icon} ${st.name} | ${st.kamikaze} | ${st.games.toLocaleString('en-US')} | ${st.humanWins.toLocaleString('en-US')} | ${fmt(winRate(st))}% | ${st.humanWins ? fmt(mean(st.humanWinTurns)) : '—'} | ${st.humanWins ? fmt(median(st.humanWinTurns)) : '—'} |`,
    );
  }
  L.push('');
  return L.join('\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
