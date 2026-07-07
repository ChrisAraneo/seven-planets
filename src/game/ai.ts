/* =====================================================================
   SEVEN PLANETS — MASTERMIND: the advanced planning AI.

   Pure decision-making: every function here READS the game state and
   returns a decision; the engine executes it. No side effects, no engine
   imports — which keeps the module cycle-free and unit-testable.

   What it does beyond the personality AIs:
   · exact battle math (win probability, minimum force to conquer,
     expected survivors) derived from constants.COMBAT
   · a retention forecast: before attacking, it computes the probability
     the conquered planet is TAKEN BACK within the next `holdHorizon`
     (>= 5) turns, modelling every rival's projected strike force
   · a rolling 5-10 turn strategy plan (develop / militarize / strike /
     fortify / bank influence for a Coup) with hysteresis
   · ROI-based build planning: is a building worth it, and what is the
     probability its card appears AND we can pay within the horizon?
   · hate-drafting: denying rivals the cards their own plans need
   · influence cards timed by expected value, not reflex

   All core numbers come straight from constants.ts, so game-balance
   changes re-tune the AI automatically. The residual judgment knobs live
   in ai-weights.ts and can be recalibrated with `npm run tune`.
   ===================================================================== */

import { AI_WEIGHTS, type AiWeights } from './ai-weights';
import {
  ACTION_CARDS_FROM_TURN,
  ADVANCED_FROM_TURN,
  BASE_ROCKET_CAP,
  BUILD_ORDER,
  buildingCost,
  BUILDINGS,
  canAfford,
  CARDS,
  COMBAT,
  CONQUEST_TRUCE,
  handValue,
  HOME_FIELD,
  incomeAmount,
  INFLUENCE_CARDS,
  maxLevel,
  MOVE_CARDS_FROM_TURN,
  PACIFIST_DEF_BONUS,
  PACIFIST_INFLUENCE,
  PRIORITIES,
  RESOURCE_TYPES,
  SHIELD_DEFENSE,
  SILO_HIT_BONUS,
  SINGULARITY_DEF_BONUS,
} from './constants';
import type {
  ActionType,
  BuildingType,
  Cost,
  GameState,
  Hand,
  InfluenceOpts,
  InfluenceType,
  Planet,
  Player,
  PoolType,
} from './types';

/* ============================ WEIGHTS ============================ */

// `tuned` is the STANDARD (full-strength) weight set — the strength the tuner
// Optimizes and the human always plays at. `W` is the ACTIVE weight set for the
// Player currently deciding: it equals `tuned` for the human seat (or whenever no
// Difficulty is set) and the handicapped derivation for AI opponents. It is
// Re-selected at every mastermind entry by activateWeightsFor.
let tuned: AiWeights = { ...AI_WEIGHTS };
let W: AiWeights = { ...AI_WEIGHTS };
let difficulty: AiDifficulty | null = null;
let randomPickChance = 0;

/** Override the tuned (standard) weights at runtime (used by the tuner). */
export function setAiWeights(patch: Partial<AiWeights>): void {
  tuned = { ...tuned, ...patch };
}
export function getAiWeights(): AiWeights {
  return { ...tuned };
}
export function resetAiWeights(): void {
  tuned = { ...AI_WEIGHTS };
  W = { ...AI_WEIGHTS };
  difficulty = null;
  randomPickChance = 0;
}

/* ============================ DIFFICULTY ============================ */

// A difficulty handicap weakens the AI OPPONENTS only — never the human seat, who
// Always plays at full `tuned` strength. In a real game the human isn't a
// Mastermind at all, so this only ever affects the AI; in headless simulation
// Seat 0 is a standard-strength mastermind standing in for the human, so it too
// Keeps `tuned` while its rivals are handicapped.
export interface AiDifficulty {
  /** Chance [0..1] a draft pick is made at random instead of by plan (dumber). */
  randomPickChance?: number;
  /** Multiplies the base conquer-probability threshold (lower ⇒ more reckless). */
  minConquerProbMult?: number;
  /** Added to the base strategy look-ahead window (negative ⇒ shorter sight). */
  planHorizonDelta?: number;
  /** Multiplies the base hate-draft weight (lower ⇒ rarely denies rivals cards). */
  denialWeightMult?: number;
}

/** Set the difficulty handicap applied to AI opponents. Called once at game start
    (see store.chooseDifficulty). The handicap is derived per-decision, so the
    human seat is never affected and repeated calls never compound. */
export function setAiDifficulty(d: AiDifficulty): void {
  difficulty = d;
}

/** Select the active weights for the player about to make a mastermind decision:
    full `tuned` strength for the human seat (or when no difficulty is set), the
    handicapped derivation for AI opponents. Called at every mastermind entry. */
function activateWeightsFor(p: Player): void {
  if (difficulty && !p.isHuman) {
    W = {
      ...tuned,
      planHorizon: Math.max(
        1,
        tuned.planHorizon + (difficulty.planHorizonDelta ?? 0),
      ),
      minConquerProb:
        tuned.minConquerProb * (difficulty.minConquerProbMult ?? 1),
      denialWeight: tuned.denialWeight * (difficulty.denialWeightMult ?? 1),
    };
    randomPickChance = Math.max(
      0,
      Math.min(1, difficulty.randomPickChance ?? 0),
    );
  } else {
    W = tuned;
    randomPickChance = 0;
  }
}

// One star (⭐) is worth roughly this many card-value units — anchored on the
// 20⭐ Coup seizing a mid-game planet worth ~16 value.
const STAR_VALUE = 0.8;

/* ============================ STATE HELPERS ============================ */
// The engine keeps these on its own module state; the mastermind re-derives
// Them from the state object it is handed, so ./ai never imports ./engine.

function alive(s: GameState): Player[] {
  return s.players.filter((p) => p.alive);
}
// KAMIKAZE targeting rule (mirrors engine.aiMayTarget; kept local so ./ai stays
// Engine-free): a kamikaze may only strike the human, and every other AI
// Pretends kamikazes do not exist.
function mayTarget(att: Player, owner: Player): boolean {
  if (att.kamikaze) {
    return owner.isHuman;
  }
  if (owner.kamikaze) {
    return false;
  }
  return true;
}
function owned(s: GameState, p: Player): Planet[] {
  return p.planets.map((id) => s.planets[id]);
}
function totalTroops(s: GameState, p: Player): number {
  return owned(s, p).reduce((sum, pl) => sum + pl.troops, 0);
}
function hasB(s: GameState, p: Player, id: BuildingType): boolean {
  return owned(s, p).some((pl) => pl.buildings[id]);
}
function underTruce(s: GameState, pl: Planet): boolean {
  return s.turn <= pl.protectedUntil;
}
function rocketCap(pl: Planet): number {
  const lvl = pl.buildings.SILO || 0;
  return lvl >= 3 ? Infinity : BASE_ROCKET_CAP * 2 ** lvl;
}
function siloBonus(pl: Planet): number {
  return SILO_HIT_BONUS * (pl.buildings.SILO || 0);
}
// A planet with every non-Singularity building maxed and a level-3 Singularity is
// FULLY BUILT — owning one lifts the player to TECHNOLOGY 4 (mirrors engine).
function isFullyBuilt(pl: Planet): boolean {
  return BUILD_ORDER.every((b) =>
    b === 'SINGULARITY'
      ? (pl.buildings.SINGULARITY || 0) >= 3
      : (pl.buildings[b] || 0) >= maxLevel(b),
  );
}
function techLevel(s: GameState, p: Player): number {
  if (owned(s, p).some(isFullyBuilt)) {
    return 4;
  }
  const sings = owned(s, p).filter((pl) => pl.buildings.SINGULARITY).length;
  return sings >= 2 ? 3 : sings >= 1 ? 2 : 1;
}
/** A level-4 Singularity's flat +8 planet defense (mirrors engine.singularityDefBonus). */
function singularityDefBonus(pl: Planet): number {
  return (pl.buildings.SINGULARITY || 0) >= 4 ? SINGULARITY_DEF_BONUS : 0;
}
/** Highest Singularity level buildable on `pl`: L4's Lab requirement is a maxed Lab. */
function singularityLabOk(pl: Planet, nextLevel: number): boolean {
  return (pl.buildings.LAB || 0) >= Math.min(nextLevel, maxLevel('LAB'));
}
function recruitYieldOf(pl: Planet): number {
  const lvl = pl.buildings.BARRACKS || 0;
  return lvl >= 3 ? 4 : lvl;
}
function handAfterCost(hand: Hand, cost: Cost): Hand {
  const after: Hand = { ...hand };
  let relics = 0;
  for (const t in cost) {
    const use = Math.min(after[t] || 0, cost[t]);
    after[t] = (after[t] || 0) - use;
    relics += cost[t] - use;
  }
  after.RELIC = (after.RELIC || 0) - relics;
  return after;
}

/* ============================ COMBAT ANALYTICS ============================ */

/** Exact P(attack wins) given both sides' pre-roll scores — the attacker must
    end strictly higher after both add their uniform random battle rolls. */
export function battleWinProb(attackBase: number, defenseBase: number): number {
  const aR = COMBAT.attackRoll;
  const dR = COMBAT.defenseRoll;
  let wins = 0;
  for (let a = 0; a <= aR; a++) {
    for (let d = 0; d <= dR; d++) {
      if (attackBase + a > defenseBase + d) {
        wins++;
      }
    }
  }
  return wins / ((aR + 1) * (dR + 1));
}

export function attackBaseOf(n: number, source: Planet): number {
  return COMBAT.attackPerTroop * n + siloBonus(source);
}

export function defenseBaseOf(
  s: GameState,
  pl: Planet,
  troops = pl.troops,
): number {
  const pac = s.players[pl.ownerId]?.pacifistStatus ? PACIFIST_DEF_BONUS : 0;
  return (
    COMBAT.defensePerTroop * troops +
    (pl.buildings.SHIELD || 0) * SHIELD_DEFENSE +
    pac +
    singularityDefBonus(pl) +
    HOME_FIELD
  );
}

/** Smallest strike force whose VICTORY wipes the whole garrison. Winners kill
    ceil(n·num/den) defenders, so conquest is deterministic given n. */
export function minTroopsToConquer(defTroops: number): number {
  if (defTroops <= 0) {
    return 1;
  }
  const { num, den } = COMBAT.winDefLoss;
  return Math.floor(((defTroops - 1) * den) / num) + 1;
}

/** Troops left to garrison the planet after a winning strike of n. */
export function survivorsAfterWin(n: number): number {
  return n - Math.floor((n * COMBAT.winAttLoss.num) / COMBAT.winAttLoss.den);
}

function lossesOnDefeat(n: number): number {
  return Math.ceil((n * COMBAT.loseAttLoss.num) / COMBAT.loseAttLoss.den);
}

/* ============================ ECONOMY ANALYTICS ============================ */

/** Per-turn resource income of a player, derived from its income buildings. */
function incomePerTurn(s: GameState, p: Player): Cost {
  const inc: Cost = {};
  for (const pl of owned(s, p)) {
    for (const b of BUILD_ORDER) {
      const res = BUILDINGS[b].income;
      if (res && pl.buildings[b]) {
        inc[res] = (inc[res] || 0) + incomeAmount(b, pl.buildings[b]);
      }
    }
  }
  return inc;
}

/** Average value of one drafted resource card, weighted by deal weights —
    prices the Singularity's extra picks. (Spice is Harvester-only, like the
    engine's drawResourceCard.) */
function avgResourceCardValue(): number {
  const types = RESOURCE_TYPES.filter((t) => t !== 'SPICE');
  let w = 0;
  let v = 0;
  for (const t of types) {
    w += CARDS[t].weight;
    v += CARDS[t].weight * CARDS[t].value;
  }
  return w ? v / w : 1;
}

/** Expected copies of an action card type in a fresh turn-pool (the engine
    deals 6 action slots from turn ACTION_CARDS_FROM_TURN). */
function expectedActionCopies(s: GameState, t: ActionType): number {
  if (s.turn < ACTION_CARDS_FROM_TURN) {
    return 0;
  }
  const types: ActionType[] = ['ATTACK', 'RECRUIT', 'TRADE'];
  if (s.turn >= MOVE_CARDS_FROM_TURN) {
    types.push('MOVE');
  }
  if (!types.includes(t)) {
    return 0;
  }
  const total = types.reduce((x, a) => x + CARDS[a].weight, 0);
  return (6 * CARDS[t].weight) / total;
}

/** P(a player who wants one drafts >= 1 such action card this turn). */
function actionDrawProb(s: GameState, t: ActionType): number {
  return Math.min(0.85, expectedActionCopies(s, t) * 0.6);
}

/** Stars (⭐) flowing to this player each turn: L2 embassies, pacifist
    planets, plus a small allowance for trade-initiator bonuses. */
function influenceIncome(s: GameState, p: Player): number {
  let inc = 0;
  for (const pl of owned(s, p)) {
    if ((pl.buildings.EMBASSY || 0) >= 2) {
      inc += 1;
    }
    if (p.pacifistStatus) {
      inc += PACIFIST_INFLUENCE;
    }
  }
  if (hasB(s, p, 'EMBASSY')) {
    inc += 0.25;
  }
  return inc;
}

/* ============================ THREAT MODEL ============================ */

/** Composite strength score — same shape as the engine's, so the mastermind
    reasons about the same leaderboard the other AIs act on. */
export function playerStrength(s: GameState, p: Player): number {
  const resources = handValue(p.hand);
  const military = totalTroops(s, p) * 1.5;
  const territory = p.planets.length * 8;
  const income = owned(s, p).reduce(
    (sum, pl) =>
      sum +
      BUILD_ORDER.filter((b) => pl.buildings[b] && BUILDINGS[b].income).length *
        3,
    0,
  );
  return resources + military + territory + income;
}

function avgStrength(s: GameState): number {
  const all = alive(s).map((x) => playerStrength(s, x));
  return all.reduce((a, b) => a + b, 0) / (all.length || 1);
}

const AGGRESSIVE = new Set([
  'aggressor',
  'militarist',
  'blitzer',
  'expansionist',
  'opportunist',
]);
const DEFENSIVE = new Set([
  'fortifier',
  'trader',
  'rusher',
  'hoarder',
  'economist',
  'builder',
]);

/** How readily this rival marches its army out (personalities are public —
    the UI shows every commander's archetype tag). */
function aggression(p: Player): number {
  if (p.pacifistStatus || p.personality === 'pacifist') {
    return 0;
  }
  if (AGGRESSIVE.has(p.personality)) {
    return W.willAggressive;
  }
  if (DEFENSIVE.has(p.personality)) {
    return W.willDefensive;
  }
  return W.willNeutral;
}

/** Troops/turn a player can realistically add: barracks yield capped by ore
    flow, discounted by how often a Recruit card reaches their hand. */
export function recruitRate(s: GameState, p: Player): number {
  let bestYield = 0;
  for (const pl of owned(s, p)) {
    bestYield = Math.max(bestYield, recruitYieldOf(pl));
  }
  if (!bestYield) {
    return 0;
  }
  const oreFlow = (incomePerTurn(s, p).ORE || 0) + (p.hand.ORE || 0) / 4;
  const cardFlow =
    (p.hand.RECRUIT || 0) > 0 ? 0.9 : actionDrawProb(s, 'RECRUIT');
  return Math.min(bestYield, Math.max(0, oreFlow)) * cardFlow;
}

/** Largest strike force rival `r` could send `turnsAhead` turns from now
    (recruit growth optimistically massed on their best silo planet). */
function projectedStrike(
  s: GameState,
  r: Player,
  turnsAhead: number,
  excludePlanetId = -1,
): { n: number; bonus: number } {
  let best = { n: 0, bonus: 0 };
  const growth = recruitRate(s, r) * turnsAhead;
  for (const pl of owned(s, r)) {
    if (pl.id === excludePlanetId || !pl.buildings.SILO) {
      continue;
    }
    const n = Math.min(rocketCap(pl), Math.floor(pl.troops + growth) - 1);
    if (n > best.n) {
      best = { n, bonus: siloBonus(pl) };
    }
  }
  return best;
}

/** P(`owner` still holds `planet` after the next `horizon` turns, garrisoned
    by `garrison` troops and shielded by a truce until `protectedUntil`).
    This is the "will it be taken back within 5 turns?" oracle the attack
    planner consults BEFORE launching: for every rival it projects the peak
    strike force across the window, requires it to be conquest-capable
    (a raid cannot flip a planet), and gates it by the chance they hold or
    draw an Attack card and by how willing their archetype is to strike. */
export function holdProbability(
  s: GameState,
  owner: Player,
  planet: Planet,
  garrison: number,
  protectedUntil: number = planet.protectedUntil,
  horizon: number = W.holdHorizon,
): number {
  let pHold = 1;
  // Local Barracks means fast reinforcement; otherwise only Move cards help.
  const reinforce =
    recruitRate(s, owner) * (planet.buildings.BARRACKS ? 0.7 : 0.25);
  const shield =
    (planet.buildings.SHIELD || 0) * SHIELD_DEFENSE +
    singularityDefBonus(planet);
  const pacBonus = owner.pacifistStatus ? PACIFIST_DEF_BONUS : 0;
  for (const r of alive(s)) {
    if (r.id === owner.id || r.pacifistStatus) {
      continue;
    }
    if (!mayTarget(r, owner)) {
      continue;
    } // A rival that would never strike this owner is no threat
    let peak = 0;
    for (let t = 1; t <= horizon; t++) {
      if (s.turn + t <= protectedUntil) {
        continue;
      } // Truce still shields us
      const g = Math.round(garrison + reinforce * t);
      const strike = projectedStrike(s, r, t, planet.id);
      if (strike.n < 2 || strike.n < minTroopsToConquer(g)) {
        continue;
      }
      const def = COMBAT.defensePerTroop * g + shield + pacBonus + HOME_FIELD;
      const atk = COMBAT.attackPerTroop * strike.n + strike.bonus;
      peak = Math.max(peak, battleWinProb(atk, def));
    }
    if (peak <= 0) {
      continue;
    }
    const window = Math.max(1, horizon - Math.max(0, protectedUntil - s.turn));
    const pCard =
      (r.hand.ATTACK || 0) > 0
        ? 0.95
        : 1 - (1 - actionDrawProb(s, 'ATTACK')) ** window;
    pHold *= 1 - peak * pCard * aggression(r);
  }
  return pHold;
}

/** P(this planet falls to an attack THIS coming turn) — only rivals already
    holding an Attack card and owning a Silo can strike immediately. */
export function immediateFallProb(
  s: GameState,
  ownerP: Player,
  planet: Planet,
): number {
  if (underTruce(s, planet)) {
    return 0;
  }
  let pSafe = 1;
  for (const r of alive(s)) {
    if (r.id === ownerP.id || r.pacifistStatus || (r.hand.ATTACK || 0) < 1) {
      continue;
    }
    if (!mayTarget(r, ownerP)) {
      continue;
    } // Kamikaze-aware: this rival would never strike us
    const strike = projectedStrike(s, r, 0, planet.id);
    if (strike.n < minTroopsToConquer(planet.troops)) {
      continue;
    }
    const pWin = battleWinProb(
      COMBAT.attackPerTroop * strike.n + strike.bonus,
      defenseBaseOf(s, planet),
    );
    pSafe *= 1 - pWin * aggression(r);
  }
  return 1 - pSafe;
}

/** How much acquiring (or keeping) this planet is worth, in card-value units:
    territory itself (the win condition), building levels, income stream. */
export function planetValue(s: GameState, pl: Planet): number {
  let v = 6;
  for (const b of BUILD_ORDER) {
    const lvl = pl.buildings[b] || 0;
    if (!lvl) {
      continue;
    }
    v += lvl * 1.5;
    const inc = BUILDINGS[b].income;
    if (inc) {
      v += incomeAmount(b, lvl) * CARDS[inc].value * 3;
    }
  }
  v += (pl.buildings.SINGULARITY || 0) * 4 + (pl.buildings.LAB ? 2 : 0);
  return v;
}

/* ============================ ATTACK PLANNING ============================ */

export interface AttackPlan {
  source: Planet;
  target: Planet;
  n: number;
  pWin: number;
  conquers: boolean; // Wiping the garrison is deterministic given n
  survivors: number;
  holdProb: number; // P(we keep it for the next holdHorizon turns)
  value: number;
  score: number;
}

/** Conquest bar, loosening as the game drags on (conquest is the only way to
    win) and in a final duel. Kamikazes accept riskier odds by design. */
function effMinConquerProb(s: GameState, p?: Player): number {
  const duel = alive(s).length === 2 ? 0.1 : 0;
  const reckless = p?.kamikaze ? KAMIKAZE_RISK : 0;
  return Math.max(
    0.25,
    W.minConquerProb - s.turn * W.aggressionRamp - duel - reckless,
  );
}

// How much a kamikaze lowers its own attack thresholds — "a little more risky".
const KAMIKAZE_RISK = 0.12;

/** Every attack worth considering, best first. Each plan prices the risk
    (exact win probability), runs the conquest test, counts the survivors
    left to garrison, and forecasts the chance of KEEPING the planet. */
export function evaluateAttacks(s: GameState, p: Player): AttackPlan[] {
  if (p.pacifistStatus) {
    return [];
  }
  const avgStr = avgStrength(s);
  const minWin = effMinConquerProb(s, p);
  const plans: AttackPlan[] = [];
  for (const target of s.planets) {
    if (target.ownerId === p.id) {
      continue;
    }
    const defOwner = s.players[target.ownerId];
    if (!defOwner.alive || underTruce(s, target)) {
      continue;
    }
    if (!mayTarget(p, defOwner)) {
      continue;
    } // Kamikaze hits only the human; others skip kamikazes
    const def = defenseBaseOf(s, target);
    for (const source of owned(s, p)) {
      if (!source.buildings.SILO) {
        continue;
      }
      const maxN = Math.min(rocketCap(source), source.troops - W.reserveTroops);
      if (maxN < 2) {
        continue;
      }
      const nConq = minTroopsToConquer(target.troops);
      if (maxN >= nConq) {
        const value =
          planetValue(s, target) +
          (defOwner.planets.length === 1 ? 10 : 0) + // Elimination: loot + one fewer rival
          (playerStrength(s, defOwner) > 1.25 * avgStr ? 4 : 0); // Cutting down the leader
        // Candidate force sizes: the leanest that clears the win bar, the full
        // Committable force, and a midpoint — bigger strikes both win AND hold
        // The conquest more often, at the price of more troops at risk.
        let lean = nConq;
        while (
          lean < maxN &&
          battleWinProb(attackBaseOf(lean, source), def) < minWin
        ) {
          lean++;
        }
        let best: AttackPlan | null = null;
        for (const n of new Set([lean, Math.ceil((lean + maxN) / 2), maxN])) {
          const pWin = battleWinProb(attackBaseOf(n, source), def);
          const surv = survivorsAfterWin(n);
          const hold = holdProbability(
            s,
            p,
            target,
            surv,
            s.turn + CONQUEST_TRUCE,
          );
          const eLoss = pWin * (n - surv) + (1 - pWin) * lossesOnDefeat(n);
          const plan: AttackPlan = {
            source,
            target,
            n,
            pWin,
            conquers: true,
            survivors: surv,
            holdProb: hold,
            value,
            score: pWin * hold * value - eLoss * W.troopValue,
          };
          if (!best || plan.score > best.score) {
            best = plan;
          }
        }
        plans.push(best!);
      } else {
        // RAID — cannot flip the planet, but a winning raid trades a third of
        // The strike force for HALF the garrison: profitable softening before
        // A later conquest, and doubly so against a runaway leader.
        const n = maxN;
        const pWin = battleWinProb(attackBaseOf(n, source), def);
        const defLoss = Math.min(
          target.troops,
          Math.ceil((n * COMBAT.winDefLoss.num) / COMBAT.winDefLoss.den),
        );
        const eLoss =
          pWin * (n - survivorsAfterWin(n)) + (1 - pWin) * lossesOnDefeat(n);
        // Kamikazes harass the human even when they can't hold ground; others
        // Only raid a runaway leader.
        const zeal = p.kamikaze
          ? 1.5
          : playerStrength(s, defOwner) > 1.3 * avgStr
            ? 1.4
            : 1.05;
        plans.push({
          source,
          target,
          n,
          pWin,
          conquers: false,
          survivors: survivorsAfterWin(n),
          holdProb: 0,
          value: defLoss,
          score: pWin * defLoss * W.troopValue * zeal - eLoss * W.troopValue,
        });
      }
    }
  }
  return plans.sort((a, b) => b.score - a.score);
}

/** The best attack the player can actually launch RIGHT NOW (card in hand,
    win + retention thresholds met) — or null when patience wins. */
export function bestAttackNow(s: GameState, p: Player): AttackPlan | null {
  if ((p.hand.ATTACK || 0) < 1) {
    return null;
  }
  // Kamikazes barely care about holding the ground they take — they just want
  // To bleed the human.
  const holdFloor = p.kamikaze ? 0.05 : 0.2;
  const minHold = Math.max(
    holdFloor,
    W.minHoldProb * (p.kamikaze ? 0.5 : 1) - s.turn * W.aggressionRamp * 0.5,
  );
  for (const plan of evaluateAttacks(s, p)) {
    if (plan.score <= 0) {
      break;
    }
    if (plan.conquers) {
      if (plan.pWin >= effMinConquerProb(s, p) && plan.holdProb >= minHold) {
        return plan;
      }
    } else if (plan.score > 2) {
      return plan; // Profitable raid (leader-bleeding, or a kamikaze harassing the human)
    }
  }
  return null;
}

/* ============================ BUILD PLANNING ============================ */

export interface BuildCandidate {
  id: BuildingType;
  planet: Planet;
  level: number;
  cost: Cost;
  worth: number; // Net value over buildRoiHorizon, already minus cost
  pComplete: number; // P(the card appears AND we can pay, within the horizon)
}

/** Next buildable level of `id` on `planet` (0 = blocked by max/tech/lab). */
function nextLevelAllowed(
  s: GameState,
  p: Player,
  planet: Planet,
  id: BuildingType,
): number {
  const next = (planet.buildings[id] || 0) + 1;
  if (next > maxLevel(id)) {
    return 0;
  }
  if (next > techLevel(s, p)) {
    return 0;
  }
  if (id === 'SINGULARITY' && !singularityLabOk(planet, next)) {
    return 0;
  }
  return next;
}

/** Net worth of building `id` level `level` on `planet`: gross value over the
    ROI horizon minus the cost. Enablers (first Barracks/Silo/Embassy/...) are
    priced by what they unlock; Shields by the value they protect. */
export function buildingWorth(
  s: GameState,
  p: Player,
  id: BuildingType,
  planet: Planet,
  level: number,
): number {
  const H = W.buildRoiHorizon;
  const costVal = handValue(buildingCost(id, level));
  let gross = 0;
  const inc = BUILDINGS[id].income;
  if (inc) {
    // Income is worth its resource's value over the horizon — but SPICE is
    // Nearly illiquid (only the Lab / Singularity / Harvester-upgrade consume
    // It), so a Harvester must not out-rank the Barracks or the income basics.
    const liquidity = inc === 'SPICE' ? (hasB(s, p, 'LAB') ? 0.6 : 0.3) : 1;
    gross +=
      (incomeAmount(id, level) - incomeAmount(id, level - 1)) *
      CARDS[inc].value *
      H *
      liquidity;
  }
  switch (id) {
    case 'BARRACKS': {
      // Recruiting is existential — without it there is no defense and no army.
      if (!hasB(s, p, 'BARRACKS')) {
        gross += H + 6;
      } else if (level === 1) {
        gross += 3;
      } // A local recruiting ground on another planet
      else {
        // Higher levels multiply recruit throughput (troops per action card).
        const delta =
          recruitYieldOf({ ...planet, buildings: { BARRACKS: level } }) -
          recruitYieldOf(planet);
        gross += delta * H * 0.5;
      }
      if (planet.buildings.SILO) {
        gross += 3;
      } // Recruits muster where the rockets are
      break;
    }
    case 'SILO': {
      if (p.pacifistStatus) {
        break;
      } // Can never attack again — worthless
      // Conquest is the ONLY win condition; the first silo grows more urgent
      // As the game matures and rivals arm up.
      gross += hasB(s, p, 'SILO')
        ? 2 + SILO_HIT_BONUS * 0.8 + level
        : H * 0.7 + s.turn / 10;
      if (planet.buildings.BARRACKS) {
        gross += 3;
      } // Co-locate with the recruiting ground
      // Capacity unlock: this upgrade doubles the rocket (L1:6 L2:12 L3:∞). If
      // Our current rocket can't even carry a conquering force at the softest
      // Reachable target, a bigger silo is precisely what turns an idle army
      // Into a conquest.
      if (hasB(s, p, 'SILO')) {
        let minNeed = Infinity;
        for (const tp of s.planets) {
          if (
            tp.ownerId === p.id ||
            !s.players[tp.ownerId].alive ||
            underTruce(s, tp)
          ) {
            continue;
          }
          minNeed = Math.min(minNeed, minTroopsToConquer(tp.troops));
        }
        const newCap = level >= 3 ? Infinity : BASE_ROCKET_CAP * 2 ** level;
        if (
          minNeed !== Infinity &&
          rocketCap(planet) < minNeed &&
          newCap >= minNeed
        ) {
          gross += 7;
        }
      }
      break;
    }
    case 'SHIELD': {
      const risk = 1 - holdProbability(s, p, planet, planet.troops);
      gross += SHIELD_DEFENSE * 0.35 + risk * planetValue(s, planet) * 0.6;
      break;
    }
    case 'SPACEPORT': {
      gross += p.planets.length >= 2 ? (level === 1 ? 4 : 2.5) : 0.5;
      // An army stranded off the silo planet can defend but never conquer —
      // The Spaceport is what lets it board the rockets.
      if (!hasB(s, p, 'SPACEPORT') && p.planets.length >= 2) {
        const silos = owned(s, p).filter((pl) => pl.buildings.SILO);
        if (silos.length > 0) {
          const staged = silos.reduce((x, pl) => Math.max(x, pl.troops), 0);
          gross += Math.min(6, (totalTroops(s, p) - staged) * 0.4);
        }
      }
      break;
    }
    case 'EMBASSY': {
      gross += level === 1 ? 3.5 : STAR_VALUE * H * 0.7; // L2: +1⭐ every turn
      break;
    }
    case 'LAB': {
      // Gateway to the Singularity (which can never outlevel the Lab).
      gross += level <= maxLevel('SINGULARITY') ? 6 + level : 1;
      break;
    }
    case 'SINGULARITY': {
      gross += avgResourceCardValue() * H + 5; // Extra pick/turn + technology (draft priority, level caps)
      if (level >= 4) {
        gross += SINGULARITY_DEF_BONUS * 0.6;
      } // The apex also hardens the planet (+8 def)
      break;
    }
  }
  return gross - costVal;
}

/** Mirrors the engine's singularityInPlay: the card is only dealt while someone
    can still build/upgrade a Singularity within their tech and Lab. */
function singularityLive(s: GameState): boolean {
  return alive(s).some((p) =>
    owned(s, p).some((pl) => {
      const next = (pl.buildings.SINGULARITY || 0) + 1;
      return (
        next <= maxLevel('SINGULARITY') &&
        next <= techLevel(s, p) &&
        singularityLabOk(pl, next)
      );
    }),
  );
}

/** P(this building's card shows up in the pool within `withinTurns` turns) —
    the engine deals 5 unique building cards per turn from the eligible set. */
function cardAppearProb(
  s: GameState,
  id: BuildingType,
  withinTurns: number,
): number {
  const eligible = BUILD_ORDER.filter((b) =>
    b === 'LAB'
      ? s.turn >= ADVANCED_FROM_TURN
      : b === 'SINGULARITY'
        ? singularityLive(s)
        : true,
  );
  if (!eligible.includes(id)) {
    return 0.15;
  } // Could unlock later — small hope
  const per = Math.min(1, 5 / eligible.length);
  return 1 - (1 - per) ** Math.max(1, withinTurns);
}

/** Turns until hand + per-turn income covers `cost` (relics plug gaps). */
function affordEta(s: GameState, p: Player, cost: Cost): number {
  const inc = incomePerTurn(s, p);
  let wildcards = (p.hand.RELIC || 0) - (cost.RELIC || 0);
  let eta = 0;
  for (const t of Object.keys(cost)) {
    let short = cost[t] - (p.hand[t] || 0);
    if (short <= 0) {
      continue;
    }
    const useWild = Math.min(Math.max(0, wildcards), short);
    wildcards -= useWild;
    short -= useWild;
    if (short <= 0) {
      continue;
    }
    const flow = (inc[t] || 0) + 0.35; // ~0.35/turn of a wanted resource arrives via drafting
    eta = Math.max(eta, short / flow);
  }
  return eta;
}

/** Every worthwhile build, best first, deduplicated to one planet per type. */
export function buildCandidates(s: GameState, p: Player): BuildCandidate[] {
  const all: BuildCandidate[] = [];
  for (const planet of owned(s, p)) {
    for (const id of BUILD_ORDER) {
      const level = nextLevelAllowed(s, p, planet, id);
      if (!level) {
        continue;
      }
      const cost = buildingCost(id, level);
      const worth = buildingWorth(s, p, id, planet, level);
      if (worth <= 0) {
        continue;
      }
      const eta = affordEta(s, p, cost);
      const pComplete =
        cardAppearProb(s, id, W.planHorizon) *
        Math.max(0.1, Math.min(1, 1.2 - eta / W.planHorizon));
      all.push({ id, planet, level, cost, worth, pComplete });
    }
  }
  all.sort((a, b) => b.worth * b.pComplete - a.worth * a.pComplete);
  const queue: BuildCandidate[] = [];
  for (const c of all) {
    if (!queue.some((q) => q.id === c.id)) {
      queue.push(c);
    }
    if (queue.length >= 5) {
      break;
    }
  }
  return queue;
}

/* ============================ STRATEGY PLANNER ============================ */

export type StrategyKind =
  | 'DEVELOP'
  | 'MILITARIZE'
  | 'STRIKE'
  | 'FORTIFY'
  | 'COUP_BANK';

export interface Plan {
  kind: StrategyKind;
  computedTurn: number;
  buildQueue: BuildCandidate[];
  strike: AttackPlan | null; // Ready-now strike (STRIKE)
  targetId: number | null; // Planet we're stacking an army against (MILITARIZE)
  stagingId: number | null; // Silo planet where the invasion force gathers
  troopsNeeded: number;
  threat: number; // Value at risk across our planets (FORTIFY driver)
  scores: Record<StrategyKind, number>;
}

// One plan per player per game; recomputed once per turn, sticky across turns.
const planCache = new WeakMap<GameState, Map<number, Plan>>();

export function planFor(s: GameState, p: Player): Plan {
  let per = planCache.get(s);
  if (!per) {
    per = new Map();
    planCache.set(s, per);
  }
  const prev = per.get(p.id);
  if (prev && prev.computedTurn === s.turn) {
    return prev;
  }
  const plan = computePlan(s, p, prev?.kind ?? null);
  per.set(p.id, plan);
  return plan;
}

function computePlan(
  s: GameState,
  p: Player,
  prevKind: StrategyKind | null,
): Plan {
  let queue = buildCandidates(s, p);

  // Tempo: economy compounds early, but conquest is the ONLY way to win —
  // Military plans gain weight as the game matures.
  const tempo = Math.min(1.8, 0.8 + s.turn / 50);
  const ecoTempo = Math.max(0.45, 1.15 - s.turn / 90);

  // DEVELOP — land the best builds the horizon allows.
  const develop =
    queue.slice(0, 3).reduce((x, c) => x + c.worth * c.pComplete, 0) *
    0.45 *
    ecoTempo;

  // STRIKE — a conquest we can launch right now.
  const strike = bestAttackNow(s, p);
  const strikeScore =
    strike && strike.conquers ? strike.score * 1.25 * tempo : 0;

  // MILITARIZE — stack recruits toward the highest-value reachable conquest.
  let militarize = 0;
  let targetId: number | null = null;
  let troopsNeeded = 0;
  const silos = owned(s, p).filter((pl) => pl.buildings.SILO);
  const staging =
    silos.length > 0
      ? silos.reduce((a, b) =>
          rocketCap(b) > rocketCap(a) ||
          (rocketCap(b) === rocketCap(a) && b.troops > a.troops)
            ? b
            : a,
        )
      : null;
  if (!p.pacifistStatus) {
    const rr = Math.max(0.4, recruitRate(s, p));
    const bonus = staging ? siloBonus(staging) : 0;
    for (const target of s.planets) {
      if (target.ownerId === p.id) {
        continue;
      }
      const defOwner = s.players[target.ownerId];
      if (!defOwner.alive) {
        continue;
      }
      if (!mayTarget(p, defOwner)) {
        continue;
      } // Kamikaze musters only against the human
      // Project the defense ~3 turns out — armies are not standing still.
      const futureDef = Math.round(
        target.troops + recruitRate(s, defOwner) * 3,
      );
      let need = minTroopsToConquer(futureDef);
      const defB =
        COMBAT.defensePerTroop * futureDef +
        (target.buildings.SHIELD || 0) * SHIELD_DEFENSE +
        (defOwner.pacifistStatus ? PACIFIST_DEF_BONUS : 0) +
        singularityDefBonus(target) +
        HOME_FIELD;
      while (
        need < 80 &&
        battleWinProb(COMBAT.attackPerTroop * need + bonus, defB) <
          effMinConquerProb(s)
      ) {
        need++;
      }
      // An L2 silo is one upgrade away from unlimited capacity; below that the
      // Rocket simply cannot carry the force.
      if (
        staging &&
        rocketCap(staging) < need &&
        (staging.buildings.SILO || 0) < 2
      ) {
        continue;
      }
      const have = staging ? staging.troops : 0;
      const eta =
        Math.max(0, Math.ceil((need + W.reserveTroops - have) / rr)) +
        (staging ? 0 : 4);
      if (eta > W.planHorizon + 4) {
        continue;
      }
      const hold = holdProbability(
        s,
        p,
        target,
        survivorsAfterWin(need),
        s.turn + CONQUEST_TRUCE,
      );
      const value =
        planetValue(s, target) + (defOwner.planets.length === 1 ? 10 : 0);
      const sc =
        (value * 0.75 * hold * 0.9 ** eta - need * W.troopValue * 0.3) * tempo;
      if (sc > militarize) {
        militarize = sc;
        targetId = target.id;
        troopsNeeded = need + W.reserveTroops;
      }
    }
  }

  // FORTIFY — how much of our value is at risk over the hold horizon.
  // Losing the LAST planet is elimination, so it weighs far more than its
  // Face value: survival trumps development.
  let threat = 0;
  for (const pl of owned(s, p)) {
    threat +=
      (1 - holdProbability(s, p, pl, pl.troops)) *
      planetValue(s, pl) *
      (p.planets.length === 1 ? 3 : 0.6);
  }
  const fortify = threat * 0.9;

  // COUP_BANK — bank ⭐ toward a 20⭐ Coup d'Etat.
  const coupCost = INFLUENCE_CARDS.COUP.cost;
  const coupTgt = bestCoupTarget(s, p);
  let coupBank = 0;
  if (coupTgt && s.turn >= ACTION_CARDS_FROM_TURN) {
    const starIncome = influenceIncome(s, p);
    const turnsTo =
      p.influence >= coupCost
        ? 0
        : starIncome > 0.05
          ? (coupCost - p.influence) / starIncome
          : 99;
    if (turnsTo <= W.planHorizon * 2) {
      coupBank = coupTgt.value * 0.92 ** turnsTo * 0.8;
    }
    // Banking is a long, PASSIVE plan: it only pays if we survive the ~20 turns
    // It takes to afford the Coup. A small or threatened empire that commits to
    // It instead of arming dies before the payoff — so discount hard until the
    // Stars are nearly in hand.
    if (p.influence < coupCost) {
      if (p.planets.length <= 1) {
        coupBank *= 0.35;
      }
      coupBank *= Math.max(0.3, 1 - threat * 0.08);
    }
  }

  const scores: Record<StrategyKind, number> = {
    DEVELOP: develop,
    STRIKE: strikeScore,
    MILITARIZE: militarize,
    FORTIFY: fortify,
    COUP_BANK: coupBank,
  };
  if (prevKind) {
    scores[prevKind] *= W.planStickiness;
  } // Hysteresis against thrashing
  let kind: StrategyKind = 'DEVELOP';
  for (const k of Object.keys(scores) as StrategyKind[]) {
    if (scores[k] > scores[kind]) {
      kind = k;
    }
  }

  // A plan pulls its key enablers to the head of the queue: a military plan
  // Needs Barracks + Silo; a defensive plan wants Barracks (to recruit) and a
  // Shield to blunt the incoming rocket.
  const enabler =
    kind === 'MILITARIZE' || kind === 'STRIKE'
      ? (c: BuildCandidate) =>
          (c.id === 'BARRACKS' && !hasB(s, p, 'BARRACKS')) ||
          (c.id === 'SILO' && !hasB(s, p, 'SILO'))
      : kind === 'FORTIFY'
        ? (c: BuildCandidate) =>
            (c.id === 'BARRACKS' && !hasB(s, p, 'BARRACKS')) ||
            c.id === 'SHIELD'
        : null;
  if (enabler) {
    queue = [...queue.filter(enabler), ...queue.filter((c) => !enabler(c))];
  }

  return {
    kind,
    computedTurn: s.turn,
    buildQueue: queue,
    strike,
    targetId,
    stagingId: staging?.id ?? null,
    troopsNeeded,
    threat,
    scores,
  };
}

/* ============================ DRAFTING ============================ */

/** Replicates the engine's influenceTarget: whom would this skip card hit? */
function skipTarget(s: GameState, p: Player, t: InfluenceType): Player | null {
  const rivals = alive(s).filter((x) => x.id !== p.id);
  if (rivals.length === 0) {
    return null;
  }
  if (t === 'SKIP_ARMY') {
    return rivals.reduce((a, b) =>
      totalTroops(s, b) > totalTroops(s, a) ? b : a,
    );
  }
  if (t === 'SKIP_PLANETS') {
    return rivals.reduce((a, b) =>
      b.planets.length > a.planets.length ? b : a,
    );
  }
  if (t === 'SKIP_INFLUENCE') {
    return rivals.reduce((a, b) => (b.influence < a.influence ? b : a));
  }
  if (t === 'SKIP_TECH') {
    return rivals.reduce((a, b) => (techLevel(s, b) > techLevel(s, a) ? b : a));
  }
  return null;
}

/** The juiciest Coup target (not ours, owner alive, no truce), or null. A rival's
    LAST planet is coup-proof unless we are a Pacifist (mirrors engine.coupTargets). */
function bestCoupTarget(
  s: GameState,
  p: Player,
): { planet: Planet; value: number } | null {
  if (p.kamikaze) {
    return null;
  } // A kamikaze hunts the human with rockets — never a Coup
  const mayTakeLast = p.pacifistStatus || p.personality === 'pacifist';
  let best: { planet: Planet; value: number } | null = null;
  for (const pl of s.planets) {
    const owner = s.players[pl.ownerId];
    if (pl.ownerId === p.id || !owner.alive || underTruce(s, pl)) {
      continue;
    }
    if (!mayTarget(p, owner)) {
      continue;
    } // Kamikaze coups only the human; others skip kamikazes
    if (!mayTakeLast && owner.planets.length === 1) {
      continue;
    } // Last planet is coup-proof
    const value = planetValue(s, pl) + (owner.planets.length === 1 ? 10 : 0);
    if (!best || value > best.value) {
      best = { planet: pl, value };
    }
  }
  return best;
}

/** The building a rival's own personality priorities would build next —
    what we would be denying them (mirrors the engine's currentGoal). */
function rivalGoalBuilding(
  s: GameState,
  r: Player,
): { id: BuildingType; cost: Cost } | null {
  const prio = PRIORITIES[r.personality] || PRIORITIES.balanced;
  const tech = techLevel(s, r);
  for (const id of prio) {
    if (id === 'SINGULARITY') {
      continue;
    }
    const cap = Math.min(maxLevel(id), tech);
    const pl = owned(s, r).find((x) => (x.buildings[id] || 0) < cap);
    if (pl) {
      return { id, cost: buildingCost(id, (pl.buildings[id] || 0) + 1) };
    }
  }
  return null;
}

/** Does this rival own a planet where a Singularity can be built/upgraded? */
function singularityReadyFor(s: GameState, r: Player): boolean {
  const cap = Math.min(maxLevel('SINGULARITY'), techLevel(s, r));
  return owned(s, r).some((pl) => {
    const next = (pl.buildings.SINGULARITY || 0) + 1;
    return next <= cap && singularityLabOk(pl, next);
  });
}

/** How much taking this card away hurts the rivals — the hate-draft signal.
    Weighted by each rival's strength (denying the leader matters most). */
export function denialValue(s: GameState, p: Player, t: PoolType): number {
  const avg = avgStrength(s);
  let worst = 0;
  const def = CARDS[t];
  for (const r of alive(s)) {
    if (r.id === p.id) {
      continue;
    }
    const w = Math.min(
      2,
      Math.max(0.3, playerStrength(s, r) / Math.max(1, avg)),
    );
    let gain = 0;
    if (def.building) {
      const id = t as BuildingType;
      if (id === 'SINGULARITY' && singularityReadyFor(s, r)) {
        gain = 5;
      } // Deny the draft engine
      else if (rivalGoalBuilding(s, r)?.id === id) {
        gain = 2.5;
      }
    } else if (def.influenceCard) {
      if (r.influence >= INFLUENCE_CARDS[t as InfluenceType].cost) {
        gain = t === 'COUP' ? 6 : 1.5;
      } // A rich rival + a Coup card is an emergency
    } else if (t === 'ATTACK') {
      if (
        !r.pacifistStatus &&
        hasB(s, r, 'SILO') &&
        aggression(r) >= W.willNeutral
      ) {
        gain = 1.4;
      }
    } else if (RESOURCE_TYPES.includes(t as never)) {
      const goal = rivalGoalBuilding(s, r);
      if (goal && (goal.cost[t] || 0) > (r.hand[t] || 0)) {
        gain = 0.7;
      }
    }
    worst = Math.max(worst, gain * w);
  }
  return worst;
}

/** ⭐ price of drafting an influence card now vs its expected value. */
function influenceDraftValue(
  s: GameState,
  p: Player,
  t: InfluenceType,
  plan: Plan,
): number {
  const { cost } = INFLUENCE_CARDS[t];
  // Opportunity cost of the stars — steep while we're saving toward a Coup.
  const starCost =
    cost * (plan.kind === 'COUP_BANK' && t !== 'COUP' ? 1.2 : 0.35);
  let v = 0;
  switch (t) {
    case 'COUP': {
      const tgt = bestCoupTarget(s, p);
      // We can already pay (pickable ⇒ influence ≥ cost) — if the target is
      // Worth it, this IS the card the bank was saving for. Never haggle here.
      if (tgt && tgt.value >= W.coupValueFloor) {
        return 12 - ((p.hand.COUP || 0) > 0 ? 6 : 0);
      }
      v = -2;

      break;
    }
    case 'STEAL_ACTION': {
      const loot = alive(s).some(
        (x) =>
          x.id !== p.id &&
          (['ATTACK', 'RECRUIT', 'MOVE', 'TRADE'] as ActionType[]).some(
            (a) => (x.hand[a] || 0) > 0,
          ),
      );
      v = loot ? 1.5 : -2;

      break;
    }
    case 'PEACE': {
      v = 1 + plan.threat * 0.4;

      break;
    }
    default: {
      const target = skipTarget(s, p, t);
      if (!target) {
        return -2;
      }
      v = 1 + (playerStrength(s, target) / Math.max(1, avgStrength(s))) * 1.5;
    }
  }
  if ((p.hand[t] || 0) > 0) {
    v -= 1.5;
  } // One copy in hand is usually enough
  return v - starCost;
}

/** Value of this card TO US, in card-value units, given the current plan. */
function ownDraftValue(
  s: GameState,
  p: Player,
  draftPlanet: Planet,
  t: PoolType,
  plan: Plan,
): number {
  const def = CARDS[t];
  if (def.building) {
    const id = t as BuildingType;
    const level = nextLevelAllowed(s, p, draftPlanet, id);
    if (!level) {
      return -1;
    } // Pickable[] should already exclude this
    const worth = buildingWorth(s, p, id, draftPlanet, level);
    let v = 1.5 + worth / 6;
    if (plan.buildQueue[0]?.id === id) {
      v += 2;
    } else if (plan.buildQueue.some((c) => c.id === id)) {
      v += 1;
    }
    // A side-build must not strip the resources saved for the queue head.
    const head = plan.buildQueue[0];
    if (head && head.id !== id && canAfford(p.hand, head.cost)) {
      const after = handAfterCost(p.hand, buildingCost(id, level));
      if (!canAfford(after, head.cost)) {
        v -= 2;
      }
    }
    return v;
  }
  if (def.influenceCard) {
    return influenceDraftValue(s, p, t as InfluenceType, plan);
  }
  if (t === 'ATTACK') {
    if (p.pacifistStatus) {
      return -1;
    }
    let v = 1.2;
    if (
      (plan.kind === 'STRIKE' || plan.kind === 'MILITARIZE') &&
      hasB(s, p, 'SILO')
    ) {
      v += 1.6;
    }
    if (
      (p.hand.ATTACK || 0) === 0 &&
      hasB(s, p, 'SILO') &&
      totalTroops(s, p) >= 4
    ) {
      v += 1;
    }
    return v - (p.hand.ATTACK || 0) * 0.5;
  }
  if (t === 'RECRUIT') {
    let v = 1.3;
    // Troops are the only defense that scales — under threat or below the
    // Garrison floor, Recruit cards outrank yet another resource card.
    if (
      hasB(s, p, 'BARRACKS') &&
      owned(s, p).some((pl) => pl.troops < garrisonFloor(s))
    ) {
      v += 1.5;
    }
    v += Math.min(2.5, plan.threat * 0.4);
    if (plan.kind === 'MILITARIZE' || plan.kind === 'STRIKE') {
      v += 1.6;
    }
    return v - (p.hand.RECRUIT || 0) * 0.4;
  }
  if (t === 'MOVE') {
    let v = 0.8;
    if (p.planets.length >= 2 && hasB(s, p, 'SPACEPORT')) {
      v += 0.8;
    }
    return v - (p.hand.MOVE || 0) * 0.6;
  }
  if (t === 'TRADE') {
    let v = 1;
    if (hasB(s, p, 'EMBASSY')) {
      v += 0.6;
    }
    return v - (p.hand.TRADE || 0) * 0.5;
  }
  // Resource card: base value, boosted when the plan is short of it, decaying
  // As the stockpile grows (a glutted resource buys nothing extra).
  let v = def.value;
  const head = plan.buildQueue[0];
  if (head && (head.cost[t] || 0) > (p.hand[t] || 0)) {
    v += 1.6;
  }
  if ((plan.kind === 'MILITARIZE' || plan.kind === 'STRIKE') && t === 'ORE') {
    v += 0.8;
  } // Recruit fuel
  if (t === 'RELIC') {
    v += 0.3;
  } // Wildcard flexibility
  return v - Math.min(1.5, (p.hand[t] || 0) * 0.08);
}

/** Draft pick for `draftPlanet`'s turn. `pickable[i]` mirrors the engine's
    canPickCard for pool slot i. Returns -1 to pass. */
export function mastermindDraftPick(
  s: GameState,
  p: Player,
  draftPlanet: Planet,
  pickable: boolean[],
): number {
  activateWeightsFor(p); // Human seat → standard; AI opponents → difficulty handicap
  // Difficulty handicap (easy mode): occasionally draft a random pickable card
  // Instead of the planned best one.
  if (randomPickChance > 0 && Math.random() < randomPickChance) {
    const options: number[] = [];
    for (let i = 0; i < s.pool.length; i++) {
      if (pickable[i]) {
        options.push(i);
      }
    }
    if (options.length > 0) {
      return options[Math.floor(Math.random() * options.length)];
    }
  }
  const plan = planFor(s, p);
  let bestIdx = -1;
  let bestScore = -Infinity;
  for (let i = 0; i < s.pool.length; i++) {
    if (!pickable[i]) {
      continue;
    }
    const t = s.pool[i];
    const copies = s.pool.filter((x) => x === t).length; // Last copies deny harder
    const score =
      ownDraftValue(s, p, draftPlanet, t, plan) +
      (denialValue(s, p, t) / copies) * W.denialWeight +
      Math.random() * 0.05; // Tie-break jitter
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  // Better to pass than to burn 20⭐ on a pointless Coup or similar.
  return bestScore < -1 ? -1 : bestIdx;
}

/* ============================ INFLUENCE PLAY ============================ */

/** Is rival `r` in a position to launch a conquest against us right now? */
function imminentAttacker(s: GameState, us: Player, r: Player): boolean {
  if (r.pacifistStatus || (r.hand.ATTACK || 0) < 1) {
    return false;
  }
  if (!mayTarget(r, us)) {
    return false;
  } // A rival that would never strike us is no threat
  for (const pl of owned(s, us)) {
    if (underTruce(s, pl)) {
      continue;
    }
    const strike = projectedStrike(s, r, 0, pl.id);
    if (strike.n < minTroopsToConquer(pl.troops)) {
      continue;
    }
    const pWin = battleWinProb(
      COMBAT.attackPerTroop * strike.n + strike.bonus,
      defenseBaseOf(s, pl),
    );
    if (pWin >= 0.35) {
      return true;
    }
  }
  return false;
}

/** Decide whether (and how) to play a held influence card this action. */
export function influencePlay(
  s: GameState,
  p: Player,
): { type: InfluenceType; opts: InfluenceOpts; ev: number } | null {
  const plan = planFor(s, p);
  // 👑 Coup — fire once the best target's value clears the bar.
  if ((p.hand.COUP || 0) > 0) {
    const tgt = bestCoupTarget(s, p);
    if (tgt && tgt.value >= W.coupValueFloor) {
      return { type: 'COUP', opts: { planet: tgt.planet }, ev: tgt.value };
    }
  }
  // 🕊️ Peace — a planet is likely to fall this turn and defense can't fix it.
  if ((p.hand.PEACE || 0) > 0) {
    const worst = Math.max(
      0,
      ...owned(s, p).map((pl) => immediateFallProb(s, p, pl)),
    );
    if (worst >= W.peaceThreatFloor) {
      return { type: 'PEACE', opts: {}, ev: worst * 10 };
    }
  }
  // ⏭️ Skip — paralyse the biggest threat, if the card actually hits them.
  const avg = avgStrength(s);
  for (const t of [
    'SKIP_ARMY',
    'SKIP_PLANETS',
    'SKIP_TECH',
    'SKIP_INFLUENCE',
  ] as InfluenceType[]) {
    if ((p.hand[t] || 0) < 1) {
      continue;
    }
    const target = skipTarget(s, p, t);
    if (!target) {
      continue;
    }
    const scary =
      playerStrength(s, target) >= avg * 1.15 ||
      imminentAttacker(s, p, target) ||
      alive(s).length === 2;
    if (scary) {
      return { type: t, opts: {}, ev: 3 };
    }
  }
  // 🎭 Extortion — strip the Attack card from whoever is about to use it on
  // Us, or grab the card our own plan is missing.
  if ((p.hand.STEAL_ACTION || 0) > 0) {
    const rivals = alive(s).filter((x) => x.id !== p.id);
    const byStrength = (a: Player, b: Player) =>
      playerStrength(s, b) - playerStrength(s, a);
    const danger = rivals
      .filter((r) => imminentAttacker(s, p, r))
      .sort(byStrength);
    if (danger.length > 0) {
      return {
        type: 'STEAL_ACTION',
        opts: { target: danger[0], cardType: 'ATTACK' },
        ev: 3,
      };
    }
    if (
      (plan.kind === 'STRIKE' || plan.kind === 'MILITARIZE') &&
      (p.hand.ATTACK || 0) === 0 &&
      hasB(s, p, 'SILO')
    ) {
      const holder = rivals
        .filter((r) => (r.hand.ATTACK || 0) > 0)
        .sort(byStrength)[0];
      if (holder) {
        return {
          type: 'STEAL_ACTION',
          opts: { target: holder, cardType: 'ATTACK' },
          ev: 2.5,
        };
      }
    }
    // Otherwise: take a card we can use from a strong rival (gain + denial).
    const wants: ActionType[] = [];
    if (hasB(s, p, 'BARRACKS') && (p.hand.RECRUIT || 0) === 0) {
      wants.push('RECRUIT');
    }
    if (hasB(s, p, 'EMBASSY') && (p.hand.TRADE || 0) === 0) {
      wants.push('TRADE');
    }
    for (const a of wants) {
      const holder = rivals
        .filter((r) => (r.hand[a] || 0) > 0 && playerStrength(s, r) >= avg)
        .sort(byStrength)[0];
      if (holder) {
        return {
          type: 'STEAL_ACTION',
          opts: { target: holder, cardType: a },
          ev: 2,
        };
      }
    }
  }
  return null;
}

/* ============================ ACTION DECISIONS ============================ */

export type MastermindDecision =
  | { kind: 'influence'; type: InfluenceType; opts: InfluenceOpts }
  | { kind: 'attack'; source: Planet; target: Planet; n: number }
  | { kind: 'recruit'; planet: Planet }
  | { kind: 'move'; from: Planet; to: Planet; n: number }
  | { kind: 'trade'; partner: Player; gives: Cost; gets: Cost };

/** Minimum garrison a planet should keep as a floor (how many to leave behind
    when moving troops away). Rises slowly over the game. */
function garrisonFloor(s: GameState): number {
  return 2 + Math.min(8, Math.floor(s.turn / 4));
}

/** How many troops we actually WANT on a planet: a healthy defensive garrison
    that rises with the game clock and, crucially, with the local threat — so
    the mastermind is never the softest seat a blitzer picks off. Idle Recruit
    cards get spent toward this, since troops are cheap survival insurance. */
function desiredGarrison(s: GameState, p: Player, planet: Planet): number {
  let want = 4 + Math.min(11, Math.floor(s.turn / 3));
  if (p.planets.length === 1) {
    want += 4;
  } // The last planet has no fallback — hold it hard
  if (planet.buildings.SILO) {
    want += 4;
  } // Launch pad wants a striking reserve
  // Local threat: how likely this planet is retaken over the hold horizon.
  const risk = 1 - holdProbability(s, p, planet, planet.troops);
  want += Math.round(risk * 10);
  return want;
}

/** One action for the mastermind's turn; null ends the turn. The engine
    validates and executes; each decision spends a card, so this terminates. */
export function mastermindAction(
  s: GameState,
  p: Player,
): MastermindDecision | null {
  activateWeightsFor(p); // Human seat → standard; AI opponents → difficulty handicap
  const plan = planFor(s, p);
  const pls = owned(s, p);

  // 1. Influence cards — already paid for at draft; play at peak EV.
  const inf = influencePlay(s, p);
  if (inf) {
    return { kind: 'influence', type: inf.type, opts: inf.opts };
  }

  // 2. Strike — the planner already checked win odds AND the 5-turn hold.
  if ((p.hand.ATTACK || 0) > 0) {
    const atk = bestAttackNow(s, p);
    if (atk) {
      return {
        kind: 'attack',
        source: atk.source,
        target: atk.target,
        n: atk.n,
      };
    }
  }

  // 3. Recruit — defense first, then stack the invasion force, then top up to
  //    The desired garrison. Idle Recruit cards are pure waste, so a held card
  //    Is almost always spent on troops (cheap survival insurance).
  if ((p.hand.RECRUIT || 0) > 0) {
    const affordable = (pl: Planet) =>
      (pl.buildings.BARRACKS || 0) > 0 &&
      canAfford(p.hand, { ORE: recruitYieldOf(pl) });
    // (a) A planet in immediate danger gets reinforced first.
    const danger = pls
      .filter((pl) => affordable(pl) && immediateFallProb(s, p, pl) >= 0.2)
      .sort((a, b) => immediateFallProb(s, p, b) - immediateFallProb(s, p, a));
    if (danger.length > 0) {
      return { kind: 'recruit', planet: danger[0] };
    }
    // (b) Stack the strike force whenever we hold the means to use it.
    const stacking =
      plan.kind === 'MILITARIZE' ||
      plan.kind === 'STRIKE' ||
      ((p.hand.ATTACK || 0) > 0 && plan.stagingId != null);
    const staging = plan.stagingId == null ? null : s.planets[plan.stagingId];
    if (
      stacking &&
      staging &&
      staging.ownerId === p.id &&
      staging.troops <
        Math.max(plan.troopsNeeded, desiredGarrison(s, p, staging))
    ) {
      if (affordable(staging)) {
        return { kind: 'recruit', planet: staging };
      }
      const any = pls
        .filter(affordable)
        .sort(
          (a, b) => (b.buildings.BARRACKS || 0) - (a.buildings.BARRACKS || 0),
        )[0];
      if (any) {
        return { kind: 'recruit', planet: any };
      } // Move it to staging later
    }
    // (c) Bring any under-garrisoned planet up to its desired strength — this
    //     Is what stops the mastermind being the field's softest target.
    const thin = pls
      .filter((pl) => affordable(pl) && pl.troops < desiredGarrison(s, p, pl))
      .sort(
        (a, b) =>
          a.troops -
          desiredGarrison(s, p, a) -
          (b.troops - desiredGarrison(s, p, b)),
      )[0];
    if (thin) {
      return { kind: 'recruit', planet: thin };
    }
  }

  // 4. Move — rescue a threatened planet, or mass the strike force.
  if (
    (p.hand.MOVE || 0) > 0 &&
    hasB(s, p, 'SPACEPORT') &&
    p.planets.length >= 2
  ) {
    const floor = garrisonFloor(s);
    const inDanger = pls
      .filter((pl) => immediateFallProb(s, p, pl) >= 0.3)
      .sort((a, b) => immediateFallProb(s, p, b) - immediateFallProb(s, p, a));
    for (const dest of inDanger) {
      const donor = pls
        .filter(
          (pl) =>
            pl !== dest &&
            pl.troops > floor + 2 &&
            immediateFallProb(s, p, pl) < 0.2,
        )
        .sort((a, b) => b.troops - a.troops)[0];
      if (donor) {
        const n = Math.min(rocketCap(donor), donor.troops - floor);
        if (n >= 1) {
          return { kind: 'move', from: donor, to: dest, n };
        }
      }
    }
    // Mass the army on the silo planet whenever it runs below what the plan
    // (or a healthy launch pad) needs — troops on silo-less planets can
    // Defend, but they can never conquer.
    const staging = plan.stagingId == null ? null : s.planets[plan.stagingId];
    if (
      staging &&
      staging.ownerId === p.id &&
      staging.troops < Math.max(plan.troopsNeeded, floor + 4)
    ) {
      const donor = pls
        .filter((pl) => pl !== staging && pl.troops > floor + 2)
        .sort((a, b) => b.troops - a.troops)[0];
      if (donor) {
        const n = Math.min(rocketCap(donor), donor.troops - floor);
        if (n >= 2) {
          return { kind: 'move', from: donor, to: staging, n };
        }
      }
    }
  }

  // 5. Trade — convert surplus into what the plan is missing.
  if (!p.tradedThisTurn && (p.hand.TRADE || 0) > 0 && hasB(s, p, 'EMBASSY')) {
    const offer = planTradeOffer(s, p, plan);
    if (offer) {
      return { kind: 'trade', ...offer };
    }
  }
  return null;
}

/* ============================ TRADING ============================ */

function planTradeOffer(
  s: GameState,
  p: Player,
  plan: Plan,
): { partner: Player; gives: Cost; gets: Cost } | null {
  const head = plan.buildQueue[0];
  let want: string | null = null;
  if (head) {
    want =
      RESOURCE_TYPES.find(
        (t) => t !== 'RELIC' && (head.cost[t] || 0) > (p.hand[t] || 0),
      ) ?? null;
  }
  if (
    !want &&
    (plan.kind === 'MILITARIZE' || plan.kind === 'STRIKE') &&
    (p.hand.ORE || 0) < 3
  ) {
    want = 'ORE';
  }
  if (!want) {
    return null;
  }
  // Surplus = hand beyond what the queue head still needs (never give relics).
  const reserved: Cost = {};
  if (head) {
    for (const t in head.cost) {
      reserved[t] = head.cost[t];
    }
  }
  const surplus: string[] = [];
  for (const t of RESOURCE_TYPES) {
    if (t === 'RELIC' || t === want) {
      continue;
    }
    const spare = (p.hand[t] || 0) - (reserved[t] || 0);
    for (let i = 0; i < spare; i++) {
      surplus.push(t);
    }
  }
  surplus.sort((a, b) => CARDS[a].value - CARDS[b].value); // Give the cheap stuff first
  const gives: Cost = {};
  let v = 0;
  const targetV = CARDS[want].value * 1.25; // Sweeten: partners only take deals worth >1x
  for (const t of surplus) {
    if (v >= targetV) {
      break;
    }
    gives[t] = (gives[t] || 0) + 1;
    v += CARDS[t].value;
  }
  if (v < targetV) {
    return null;
  }
  const avg = avgStrength(s);
  const partners = alive(s)
    .filter((x) => x.id !== p.id && (x.hand[want] || 0) > 0)
    .sort((a, b) => playerStrength(s, a) - playerStrength(s, b)); // Feed the weak, not the leader
  const partner =
    partners.find((x) => playerStrength(s, x) < avg * 1.3) ?? partners[0];
  if (!partner) {
    return null;
  }
  return { partner, gives, gets: { [want]: 1 } };
}

/** Evaluate an incoming trade offer (gives/gets from the mastermind's own
    perspective). The engine has already validated resource-only legality. */
export function mastermindEvaluateTrade(
  s: GameState,
  ai: Player,
  gives: Cost,
  gets: Cost,
  proposer: Player | null,
): boolean {
  activateWeightsFor(ai); // Human seat → standard; AI opponents → difficulty handicap
  const plan = planFor(s, ai);
  const head = plan.buildQueue[0];
  let vIn = 0;
  let vOut = 0;
  for (const t in gets) {
    vIn +=
      gets[t] *
      CARDS[t].value *
      (head && (head.cost[t] || 0) > (ai.hand[t] || 0) ? 1.35 : 1);
  }
  for (const t in gives) {
    vOut += gives[t] * CARDS[t].value;
  }
  if (head && canAfford(ai.hand, head.cost)) {
    const after: Hand = { ...ai.hand };
    for (const t in gives) {
      after[t] = (after[t] || 0) - gives[t];
    }
    for (const t in gets) {
      after[t] = (after[t] || 0) + gets[t];
    }
    if (!canAfford(after, head.cost)) {
      vOut *= 1.6;
    } // Would un-afford our next build
  }
  // Anti-kingmaker: the leader pays a premium for our cooperation.
  if (
    proposer &&
    proposer.id !== ai.id &&
    playerStrength(s, proposer) > avgStrength(s) * 1.25
  ) {
    return vIn >= vOut * 1.5;
  }
  return vIn >= vOut * W.tradeAcceptRatio;
}
