/* =====================================================================
   SEVEN PLANETS — headless mass-simulation runner.

   Plays a HUGE batch of AI-vs-AI games (default 25 000) and writes a
   comprehensive report: per-personality win rate and turns-to-win stats.

   Run with:  npm run simulation            (25 000 games)
              npm run simulation 1000        (custom game count)

   In a Node environment there is no `document`, so the engine's AUTO_HUMAN
   is true and every one of the 7 seats is driven by AI logic.
   ===================================================================== */

import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { PERSONALITY_TAG, PRIORITIES } from './constants'
import { setSimMode, simulateGameWithPersonalities } from './engine'

setSimMode(true) // no animation delays — pure logic speed

const SEATS = 7 // "You" + 6 AI, all AI-driven when headless
const DEFAULT_GAMES = 25_000

// Every distinct AI personality the engine knows how to play.
const STRATEGIES = Object.keys(PRIORITIES)

// Short behavioural profile of each personality, grounded in the engine's
// build priorities (constants.PRIORITIES) and combat scoring (engine.ts).
const PERSONALITY_DESC: Record<string, string> = {
  aggressor: 'Barracks first; attacks readily and keeps a thin troop reserve to keep pressing.',
  builder: 'Economy and tech first (mine, extractor, solar, lab); out-develops rivals, fights only when forced.',
  hoarder: 'Stockpiles resources (extractor/mine), values embassy and shields; cautious, defensive attacker.',
  balanced: 'Even mix of economy and military; commits to fights only when the math favours it.',
  rusher: 'Beelines the Singularity win (lab, singularity); shuns combat and races to a tech victory.',
  militarist: 'Maximal military (barracks, silo); largest rocket reserve and attack budget, relentlessly aggressive.',
  economist: 'Pure income engine (mine, extractor, solar, harvester); expands economy, fights opportunistically.',
  fortifier: 'Shields first; turtles up, rarely attacks, and tries to outlast everyone.',
  expansionist: 'Grabs planets (barracks + spaceport); favours multi-planet targets with steady aggression.',
  random: 'No fixed plan — unpredictable build order and target selection.',
  trader: 'Embassy first; leans on trades and deals over war and avoids combat.',
  opportunist: 'Values action/influence cards and strikes the current leader to keep anyone from running away.',
  blitzer: 'Fast military rush (barracks, silo); early overwhelming strikes with a minimal reserve.',
  pacifist: 'Never attacks; pure economy and diplomacy, banking on outlasting the field.',
  mastermind:
    'Planning AI (src/game/ai.ts): exact battle odds, 5-turn retention forecasts before attacking, ROI-based builds, hate-drafting and timed influence plays.',
}

interface Stats {
  appearances: number // games this personality was seated in
  wins: number // games this personality won by conquest
  winTurns: number[] // turn count of each of its wins
}

function fisherYates<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0
  const s = nums.slice().sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

function mean(nums: number[]): number {
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function fmt(n: number, dp = 1): string {
  return n.toFixed(dp)
}

async function main(): Promise<void> {
  const games = Math.max(1, Number(process.argv[2]) || DEFAULT_GAMES)

  const stats: Record<string, Stats> = {}
  for (const s of STRATEGIES) stats[s] = { appearances: 0, wins: 0, winTurns: [] }

  let conquests = 0
  let timeouts = 0
  const allTurns: number[] = []
  const winTurnsAll: number[] = []

  const t0 = Date.now()
  const progressEvery = Math.max(1, Math.floor(games / 20))

  for (let g = 0; g < games; g++) {
    // Fairly sample a distinct line-up so every personality gets, on
    // average, the same number of seats across the whole batch.
    const lineup = fisherYates(STRATEGIES).slice(0, SEATS)
    for (const p of lineup) stats[p].appearances++

    const result = await simulateGameWithPersonalities(lineup)
    allTurns.push(result.turns)

    if (result.reason === 'conquest' && result.winner) {
      conquests++
      winTurnsAll.push(result.turns)
      const w = stats[result.winner.personality]
      if (w) {
        w.wins++
        w.winTurns.push(result.turns)
      }
    } else {
      timeouts++
    }

    if ((g + 1) % progressEvery === 0 || g + 1 === games) {
      const pct = (((g + 1) / games) * 100).toFixed(0)
      const elapsed = (Date.now() - t0) / 1000
      const rate = (g + 1) / elapsed
      const eta = (games - (g + 1)) / rate
      process.stdout.write(
        `\r  ${pct}% — ${g + 1}/${games} games — ${rate.toFixed(0)} games/s — ETA ${eta.toFixed(0)}s   `,
      )
    }
  }
  process.stdout.write('\n')

  const elapsed = (Date.now() - t0) / 1000
  const rows = rankRows(stats)
  const summary = { games, elapsed, conquests, timeouts, allTurns, winTurnsAll }

  // Aligned, fixed-width table for the terminal.
  console.log('\n' + buildConsoleReport(rows, summary))

  // Markdown (portable) for the saved file, under reports/simulation-{timestamp}.md.
  // Colons/dots are illegal in Windows filenames, so use a filesystem-safe stamp.
  const stamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+$/, '')
  const reportsDir = resolve(process.cwd(), 'reports')
  mkdirSync(reportsDir, { recursive: true })
  const outPath = resolve(reportsDir, `simulation-${stamp}.md`)
  writeFileSync(outPath, buildMarkdownReport(rows, summary) + '\n', 'utf8')
  console.log(`\nReport written to ${outPath}`)
}

interface Row {
  p: string
  appearances: number
  wins: number
  winRate: number
  avgTurns: number
  medTurns: number
  minTurns: number
  maxTurns: number
}

interface Summary {
  games: number
  elapsed: number
  conquests: number
  timeouts: number
  allTurns: number[]
  winTurnsAll: number[]
}

/** Rank personalities by win rate (wins / games seated), descending. */
function rankRows(stats: Record<string, Stats>): Row[] {
  return STRATEGIES.map((p) => {
    const s = stats[p]
    return {
      p,
      appearances: s.appearances,
      wins: s.wins,
      winRate: s.appearances ? (s.wins / s.appearances) * 100 : 0,
      avgTurns: mean(s.winTurns),
      medTurns: median(s.winTurns),
      minTurns: s.winTurns.length ? Math.min(...s.winTurns) : 0,
      maxTurns: s.winTurns.length ? Math.max(...s.winTurns) : 0,
    }
  }).sort((a, b) => b.winRate - a.winRate)
}

/** Render an ASCII table with every column padded to a uniform width. */
function asciiTable(headers: string[], aligns: ('l' | 'r')[], rows: string[][]): string {
  const widths = headers.map((h, c) =>
    Math.max(h.length, ...rows.map((r) => r[c].length)),
  )
  const pad = (s: string, w: number, a: 'l' | 'r') =>
    a === 'r' ? s.padStart(w) : s.padEnd(w)
  const line = (cells: string[]) =>
    '| ' + cells.map((c, i) => pad(c, widths[i], aligns[i])).join(' | ') + ' |'
  const sep = '|' + widths.map((w) => '-'.repeat(w + 2)).join('|') + '|'
  return [line(headers), sep, ...rows.map(line)].join('\n')
}

function buildConsoleReport(rows: Row[], sum: Summary): string {
  const { games, elapsed, conquests, timeouts, allTurns, winTurnsAll } = sum
  const L: string[] = []
  L.push('==================================================================')
  L.push('  SEVEN PLANETS — AI SIMULATION REPORT')
  L.push('==================================================================')
  L.push('')
  L.push('  PERSONALITY GUIDE')
  L.push('')
  const nameW = Math.max(...STRATEGIES.map((p) => p.length))
  const tagW = Math.max(...STRATEGIES.map((p) => (PERSONALITY_TAG[p] || '').length))
  for (const p of STRATEGIES) {
    const tag = `(${PERSONALITY_TAG[p] || '—'})`.padEnd(tagW + 2)
    L.push(`  ${p.padEnd(nameW)}  ${tag}  ${PERSONALITY_DESC[p] || ''}`)
  }
  L.push('')
  L.push('------------------------------------------------------------------')
  L.push('')
  L.push(`  Games played .............. ${games.toLocaleString('en-US')}`)
  L.push(`  Seats per game ........... ${SEATS} (all AI-driven, headless)`)
  L.push(`  Personalities in pool .... ${STRATEGIES.length}`)
  L.push(`  Wall-clock time .......... ${fmt(elapsed)}s (${(games / elapsed).toFixed(0)} games/s)`)
  L.push('')
  L.push(`  Decisive (conquest) ...... ${conquests.toLocaleString('en-US')} (${fmt((conquests / games) * 100)}%)`)
  L.push(`  Stalemate (400-turn cap) . ${timeouts.toLocaleString('en-US')} (${fmt((timeouts / games) * 100)}%)`)
  L.push('')
  L.push(`  Avg turns/game (all) ..... ${fmt(mean(allTurns))}`)
  L.push(`  Avg turns/game (decisive)  ${fmt(mean(winTurnsAll))}`)
  L.push(`  Median turns (decisive) .. ${fmt(median(winTurnsAll))}`)
  L.push('')
  L.push(`  Baseline: with ${SEATS} of ${STRATEGIES.length} seats filled, a no-edge personality`)
  L.push(`  would win about ${fmt(100 / SEATS)}% of the games it appears in.`)
  L.push('')
  L.push('  WIN RATE BY PERSONALITY (ranked; turns cover that AI\'s wins only)')
  L.push('')

  const headers = ['#', 'Personality', 'Seated', 'Wins', 'Win%', 'AvgT', 'MedT', 'MinT', 'MaxT']
  const aligns: ('l' | 'r')[] = ['r', 'l', 'r', 'r', 'r', 'r', 'r', 'r', 'r']
  const body = rows.map((r, i) => [
    String(i + 1),
    r.p,
    r.appearances.toLocaleString('en-US'),
    r.wins.toLocaleString('en-US'),
    fmt(r.winRate),
    r.wins ? fmt(r.avgTurns) : '—',
    r.wins ? fmt(r.medTurns) : '—',
    r.wins ? String(r.minTurns) : '—',
    r.wins ? String(r.maxTurns) : '—',
  ])
  L.push(
    asciiTable(headers, aligns, body)
      .split('\n')
      .map((ln) => '  ' + ln)
      .join('\n'),
  )
  L.push('')
  return L.join('\n')
}

function buildMarkdownReport(rows: Row[], sum: Summary): string {
  const { games, elapsed, conquests, timeouts, allTurns, winTurnsAll } = sum
  const L: string[] = []
  L.push('# Seven Planets — AI Simulation Report')
  L.push('')
  L.push(`Generated: ${new Date().toISOString()}`)
  L.push('')
  L.push('## Personalities')
  L.push('')
  L.push('Every AI personality in the simulation pool and how it plays.')
  L.push('')
  L.push('| Personality | Archetype | Play style |')
  L.push('| :--- | :--- | :--- |')
  for (const p of STRATEGIES) {
    L.push(`| ${p} | ${PERSONALITY_TAG[p] || '—'} | ${PERSONALITY_DESC[p] || ''} |`)
  }
  L.push('')
  L.push('## Batch summary')
  L.push('')
  L.push(`- **Games played:** ${games.toLocaleString('en-US')}`)
  L.push(`- **Seats per game:** ${SEATS} (all AI-driven, headless)`)
  L.push(`- **Personalities in pool:** ${STRATEGIES.length}`)
  L.push(`- **Wall-clock time:** ${fmt(elapsed)}s (${(games / elapsed).toFixed(0)} games/s)`)
  L.push('')
  L.push(`- **Decisive (conquest):** ${conquests.toLocaleString('en-US')} (${fmt((conquests / games) * 100)}%)`)
  L.push(`- **Stalemate (400-turn cap):** ${timeouts.toLocaleString('en-US')} (${fmt((timeouts / games) * 100)}%)`)
  L.push('')
  L.push(`- **Avg turns / game (all):** ${fmt(mean(allTurns))}`)
  L.push(`- **Avg turns / game (decisive):** ${fmt(mean(winTurnsAll))}`)
  L.push(`- **Median turns / game (decisive):** ${fmt(median(winTurnsAll))}`)
  L.push('')
  L.push(
    `> Baseline: with ${SEATS} of ${STRATEGIES.length} seats filled per game, a personality with no skill edge would win ≈ ${fmt(100 / SEATS)}% of the games it appears in.`,
  )
  L.push('')
  L.push('## Win rate by personality')
  L.push('')
  L.push('Ranked by win rate (wins ÷ games seated). "Turns to win" covers only that personality\'s victories.')
  L.push('')
  L.push('| Rank | Personality | Games seated | Wins | Win rate | Avg turns | Median | Min | Max |')
  L.push('| ---: | :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |')
  rows.forEach((r, i) => {
    L.push(
      `| ${i + 1} | ${r.p} | ${r.appearances.toLocaleString('en-US')} | ${r.wins.toLocaleString('en-US')} | ${fmt(r.winRate)}% | ${r.wins ? fmt(r.avgTurns) : '—'} | ${r.wins ? fmt(r.medTurns) : '—'} | ${r.wins ? r.minTurns : '—'} | ${r.wins ? r.maxTurns : '—'} |`,
    )
  })
  L.push('')
  return L.join('\n')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
