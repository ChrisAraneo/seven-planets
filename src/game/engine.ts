/* =====================================================================
   SEVEN PLANETS — game engine (ported from the original game.js).

   Pure game logic + AI. All rendering is handled by Vue components that
   read the reactive `state`; the engine only mutates state, writes log
   entries, and enqueues canvas animations through ./effects.

   Human interaction is promise-based: the engine parks on a promise that
   the store/components resolve (humanPoolClick / endHumanTurn / resolveOffer).
   ===================================================================== */

import {
  ACTION_CARDS_FROM_TURN,
  ACTION_TYPES,
  ADVANCED_FROM_TURN,
  AI_NAMES,
  AI_PLANET_NAMES,
  AI_COLORS,
  AI_PERSONALITIES,
  AI_LINEUP,
  RANDOM_SEAT,
  PLANET_STYLES,
  BUILD_ORDER,
  BUILDINGS,
  BUILDINGS_FROM_TURN,
  buildingCost,
  canAfford,
  CARD_TYPES,
  CARDS,
  choice,
  COMBAT,
  CONQUEST_TRUCE,
  PEACE_TRUCE,
  SKIP_TURNS,
  PACIFIST_TURNS,
  PACIFIST_DEF_BONUS,
  PACIFIST_INFLUENCE,
  HOME_FIELD,
  incomeAmount,
  INFLUENCE_CARDS,
  INFLUENCE_CARDS_FROM_TURN,
  INFLUENCE_TYPES,
  BASE_ROCKET_CAP,
  fmtCards,
  handValue,
  maxLevel,
  MOVE_CARDS_FROM_TURN,
  PRIORITIES,
  RESOURCE_TYPES,
  randInt,
  SHIELD_DEFENSE,
  shuffleArr,
  SILO_HIT_BONUS,
  TAUNTS,
} from './constants'
import { animateRocket, boom, floatText, setSimMode, sleep } from './effects'
import { mastermindAction, mastermindDraftPick, mastermindEvaluateTrade } from './ai'
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
  TradeOffer,
} from './types'

const HAS_DOM = typeof document !== 'undefined'
// Headless (Node) or "?auto" in the URL: the human seat is played by AI (demo/test mode).
const AUTO_HUMAN = !HAS_DOM || (typeof location !== 'undefined' && /[?&]auto/.test(location.search))

export { AUTO_HUMAN }

/* ============================ STATE ============================ */

let state: GameState = null as unknown as GameState

export function getState(): GameState {
  return state
}
export function setState(s: GameState): void {
  state = s
}

function startingHand(): Hand {
  const h: Hand = {}
  for (const t of CARD_TYPES) h[t] = 0
  for (const t of INFLUENCE_TYPES) h[t] = 0 // held influence cards (played later)
  return h
}

export function buildState(): GameState {
  // The 6 AI seats come from the AI_LINEUP config (constants.ts) — edit that
  // one array to change opponents. A 'RANDOM' entry resolves to a random
  // non-mastermind personality; anything else is used verbatim.
  const otherPersonalities = AI_PERSONALITIES.filter((p) => p !== 'mastermind')
  const aiPersonalities = shuffleArr(
    AI_LINEUP.map((seat) => (seat === RANDOM_SEAT ? choice(otherPersonalities) : seat)),
  )
  // Task 3: name, homeworld, color and planet style are all randomized
  // INDEPENDENTLY of personality, so no AI is a fixed character any more.
  const names = shuffleArr(AI_NAMES).slice(0, 6)
  const planetNames = shuffleArr(AI_PLANET_NAMES).slice(0, 6)
  const colors = shuffleArr(AI_COLORS).slice(0, 6)
  // The human owns planet style 0 (Terra Prime); AI draw distinct styles from the rest.
  const styles = shuffleArr(PLANET_STYLES.map((_, i) => i).filter((i) => i !== 0)).slice(0, 6)
  const aiSlots = aiPersonalities.map((personality, i) => ({
    name: names[i],
    planet: planetNames[i],
    color: colors[i],
    personality,
    styleIdx: styles[i],
  }))
  const gameDefs = [
    {
      name: 'You',
      planet: 'Terra Prime',
      color: '#3df0ff',
      human: true,
      personality: 'human',
      styleIdx: 0,
    },
    ...aiSlots.map((r) => ({ ...r, human: false })),
  ]
  return {
    turn: 0,
    phase: 'setup',
    over: null,
    pool: [],
    activeId: -1,
    draftPlanetId: -1, // the planet whose draft turn it is (buildings land here)
    singularityAnnounced: false,
    startIdx: 0,
    busy: false,
    players: gameDefs.map((d, i) => ({
      id: i,
      name: d.name,
      color: d.color,
      isHuman: !!d.human,
      personality: d.personality,
      hand: startingHand(),
      influence: 0,
      skipTurns: 0,
      skippedNow: false,
      alive: true,
      planets: [i],
      tradedThisTurn: false,
      lastAttackTurn: 0,
      pacifistStatus: false,
    })),
    planets: gameDefs.map((d, i) => ({
      id: i,
      name: d.planet,
      ownerId: i,
      buildings: {},
      troops: 3,
      protectedUntil: 0,
      x: 0,
      y: 0,
      r: 30,
      styleIdx: d.styleIdx,
    })),
    log: [],
    status: '—',
    awaitingPick: false,
    awaitingAction: false,
    pendingOffer: null,
  }
}

/* ============================ UTILS ============================ */

// The Singularity card is only dealt while someone owns a Research Lab planet
// whose Singularity is still below the Lab's level (a build/upgrade is possible).
function singularityInPlay(): boolean {
  return alivePlayers().some((p) =>
    ownedPlanets(p).some(
      (pl) =>
        (pl.buildings.SINGULARITY || 0) < Math.min(maxLevel('SINGULARITY'), pl.buildings.LAB || 0),
    ),
  )
}

// Draw one resource card weighted by card weight (Spice excluded — Harvester only).
function drawResourceCard(): PoolType {
  const types = RESOURCE_TYPES.filter((t) => t !== 'SPICE')
  let total = 0
  for (const t of types) total += CARDS[t].weight
  let r = Math.random() * total
  for (const t of types) {
    r -= CARDS[t].weight
    if (r < 0) return t
  }
  return 'ORE'
}

// Draw one action card. Attack/Recruit/Trade from turn 10; Move from turn 20.
function drawActionCard(): PoolType {
  const types: ActionType[] = ['ATTACK', 'RECRUIT', 'TRADE']
  if (state.turn >= MOVE_CARDS_FROM_TURN) types.push('MOVE')
  let total = 0
  for (const t of types) total += CARDS[t].weight
  let r = Math.random() * total
  for (const t of types) {
    r -= CARDS[t].weight
    if (r < 0) return t
  }
  return 'ATTACK'
}

// Sum of all Singularity levels across every planet the player owns (stacks).
function singularityTotal(p: Player): number {
  return ownedPlanets(p).reduce((s, pl) => s + (pl.buildings.SINGULARITY || 0), 0)
}

// Main planet drafts 2 cards, +1 per total Singularity level across owned planets.
function mainPicks(p: Player): number {
  return 2 + singularityTotal(p)
}

function makePool(): PoolType[] {
  // Turns 1–5: pure resource draft, 14 random resource cards.
  if (state.turn < BUILDINGS_FROM_TURN) {
    const pool: PoolType[] = []
    for (let i = 0; i < 14; i++) pool.push(drawResourceCard())
    return pool
  }

  // Turn 6+: 5 unique buildings + 11 other cards = 16 total.
  const eligibleBuildings = BUILD_ORDER.filter((b) => {
    if (b === 'LAB' && state.turn < ADVANCED_FROM_TURN) return false
    if (b === 'SINGULARITY') return singularityInPlay()
    return true
  })
  const buildingSlots = shuffleArr([...eligibleBuildings]).slice(0, 5)
  const actionCount = state.turn >= ACTION_CARDS_FROM_TURN ? 6 : 0
  const resourceSlots = Array.from({ length: 11 - actionCount }, () => drawResourceCard())
  const actionSlots = Array.from({ length: actionCount }, () => drawActionCard())

  // From turn 30: 2 random influence cards join every pool.
  const influenceSlots: PoolType[] =
    state.turn >= INFLUENCE_CARDS_FROM_TURN
      ? Array.from({ length: 2 }, () => choice(Object.keys(INFLUENCE_CARDS) as InfluenceType[]))
      : []

  // Each Singularity level across all alive players adds 1 extra random card.
  const singBonus = alivePlayers().reduce((s, p) => s + singularityTotal(p), 0)
  const bonusSlots = Array.from({ length: singBonus }, () =>
    Math.random() < 0.55 ? drawResourceCard() : drawActionCard(),
  )

  return shuffleArr([
    ...buildingSlots,
    ...resourceSlots,
    ...actionSlots,
    ...influenceSlots,
    ...bonusSlots,
  ])
}

export function handSize(p: Player): number {
  return CARD_TYPES.reduce((s, t) => s + p.hand[t], 0)
}

// Recruiting costs 1 Ore PER TROOP (no energy) — yield depends on Barracks level.
export function recruitYield(planet: Planet): number {
  const lvl = planet.buildings.BARRACKS || 0
  return lvl >= 3 ? 4 : lvl // L1=1, L2=2, L3=4
}
export function recruitCost(planet: Planet): Cost {
  return { ORE: recruitYield(planet) }
}

// TECHNOLOGY LEVEL — caps how far any building can be upgraded.
export function techLevel(p: Player): number {
  const sings = ownedPlanets(p).filter((pl) => pl.buildings.SINGULARITY).length
  return sings >= 2 ? 3 : sings >= 1 ? 2 : 1
}

function payCost(player: Player, cost: Cost): void {
  let relicsNeeded = 0
  for (const t in cost) {
    const use = Math.min(player.hand[t], cost[t])
    player.hand[t] -= use
    relicsNeeded += cost[t] - use
  }
  player.hand.RELIC -= relicsNeeded
}

export function persOf(p: Player): string {
  return PRIORITIES[p.personality] ? p.personality : 'balanced'
}
export function alivePlayers(): Player[] {
  return state.players.filter((p) => p.alive)
}
export function ownedPlanets(p: Player): Planet[] {
  return p.planets.map((id) => state.planets[id])
}
export function homePlanet(p: Player): Planet {
  return state.planets[p.planets[0]]
}
export function hasBuilding(p: Player, id: BuildingType): boolean {
  return ownedPlanets(p).some((pl) => pl.buildings[id])
}
export function totalTroops(p: Player): number {
  return ownedPlanets(p).reduce((s, pl) => s + pl.troops, 0)
}
// Rockets launch from a specific planet: every silo level MULTIPLIES capacity by 2.
export function rocketCap(planet: Planet): number {
  const lvl = planet.buildings.SILO || 0
  if (lvl >= 3) return Infinity // L3: unlimited — all troops can board
  return BASE_ROCKET_CAP * Math.pow(2, lvl) // 3 → 6 → 12
}
export function siloBonus(planet: Planet): number {
  return SILO_HIT_BONUS * (planet.buildings.SILO || 0)
}
export function underTruce(planet: Planet): boolean {
  return state.turn <= planet.protectedUntil
}
// Has this player earned permanent PACIFIST status (no attacks for PACIFIST_TURNS)?
export function isPacifist(p: Player): boolean {
  return p.pacifistStatus
}
// Extra flat defense every pacifist owner's planet enjoys.
export function pacifistDefBonus(planet: Planet): number {
  return state.players[planet.ownerId]?.pacifistStatus ? PACIFIST_DEF_BONUS : 0
}
// Promote any player who has gone PACIFIST_TURNS without attacking. Permanent.
function updatePacifistStatus(): void {
  for (const p of state.players) {
    if (!p.alive || p.pacifistStatus) continue
    if (state.turn - p.lastAttackTurn >= PACIFIST_TURNS) {
      p.pacifistStatus = true
      log(
        `☮️ ${p.name} has forsworn war for ${PACIFIST_TURNS} turns and becomes a PACIFIST — never able to attack again, but every planet gains +${PACIFIST_DEF_BONUS} defense and +${PACIFIST_INFLUENCE}⭐ per turn.`,
        'sys',
      )
      for (const pl of ownedPlanets(p)) floatText(pl, '☮️ PACIFIST', '#8affc0')
    }
  }
}
// The owned planet where the Singularity can still be built or upgraded.
function singularityReadyPlanet(p: Player): Planet | undefined {
  const cap = Math.min(maxLevel('SINGULARITY'), techLevel(p))
  return ownedPlanets(p).find((pl) => {
    const next = (pl.buildings.SINGULARITY || 0) + 1
    return next <= cap && next <= (pl.buildings.LAB || 0)
  })
}
export function buildingCount(p: Player): number {
  return ownedPlanets(p).reduce(
    (s, pl) => s + Object.values(pl.buildings).reduce((a, b) => a + b, 0),
    0,
  )
}

// Composite strength score used for anti-kingmaker trade logic and opportunist targeting.
function playerStrength(p: Player): number {
  const resources = handValue(p.hand)
  const military = totalTroops(p) * 1.5
  const territory = p.planets.length * 8
  const income = ownedPlanets(p).reduce(
    (s, pl) => s + BUILD_ORDER.filter((b) => pl.buildings[b] && BUILDINGS[b].income).length * 3,
    0,
  )
  return resources + military + territory + income
}
// Every action requires (and spends) its matching action card.
export function hasActionCard(p: Player, t: ActionType): boolean {
  return (p.hand[t] || 0) > 0
}
function spendActionCard(p: Player, t: ActionType): void {
  p.hand[t] = Math.max(0, (p.hand[t] || 0) - 1)
}

// Can this player take pool card `t` during `planet`'s draft turn?
export function canPickCard(p: Player, t: PoolType, planet: Planet | undefined): boolean {
  if (CARDS[t].building) {
    if (!planet) return false
    const bt = t as BuildingType
    const next = (planet.buildings[bt] || 0) + 1
    if (next > maxLevel(bt)) return false
    if (next > techLevel(p)) return false // upgrades are gated by technology
    if (bt === 'SINGULARITY' && next > (planet.buildings.LAB || 0)) return false
    return canAfford(p.hand, buildingCost(bt, next))
  }
  // Influence cards cost ⭐ at pick time and go to hand; targets resolved later.
  if (CARDS[t].influenceCard) return p.influence >= INFLUENCE_CARDS[t as InfluenceType].cost
  if (t === 'ATTACK') return !p.pacifistStatus && hasBuilding(p, 'SILO') && totalTroops(p) >= 1
  if (t === 'MOVE')
    return hasBuilding(p, 'SPACEPORT') && p.planets.length >= 2 && totalTroops(p) >= 1
  if (t === 'RECRUIT') return hasBuilding(p, 'BARRACKS')
  if (t === 'TRADE') return hasBuilding(p, 'EMBASSY')
  return true
}

// Whom would this skip card hit? Always a RIVAL — the caster is never a target.
export function influenceTarget(p: Player, t: InfluenceType): Player | null {
  const rivals = alivePlayers().filter((x) => x.id !== p.id)
  if (!rivals.length) return null
  if (t === 'SKIP_ARMY') return rivals.reduce((a, b) => (totalTroops(b) > totalTroops(a) ? b : a))
  if (t === 'SKIP_PLANETS')
    return rivals.reduce((a, b) => (b.planets.length > a.planets.length ? b : a))
  if (t === 'SKIP_INFLUENCE') return rivals.reduce((a, b) => (b.influence < a.influence ? b : a))
  if (t === 'SKIP_TECH') return rivals.reduce((a, b) => (techLevel(b) > techLevel(a) ? b : a))
  return null
}

// Can this planet be seized by a 👑 Coup played by `p`? Only a truce protects it.
export function coupTargets(p: Player): Planet[] {
  return state.planets.filter(
    (pl) => pl.ownerId !== p.id && state.players[pl.ownerId].alive && !underTruce(pl),
  )
}

// Play a HELD influence card during the owner's action turn.
export function useInfluenceCard(p: Player, t: InfluenceType, opts: InfluenceOpts = {}): boolean {
  if ((p.hand[t] || 0) < 1) return false
  const C = INFLUENCE_CARDS[t]
  if (t.startsWith('SKIP_')) {
    const target = influenceTarget(p, t)
    if (!target) return false
    p.hand[t]--
    log(`⭐ ${p.name} plays ${CARDS[t].icon} ${C.name}`, 'sys')
    target.skipTurns += SKIP_TURNS
    log(
      `⏭️ ${target.name} is paralysed — they skip their next ${SKIP_TURNS} turn${SKIP_TURNS === 1 ? '' : 's'}!`,
      'war',
    )
    floatText(homePlanet(target), '⏭️ SKIPPED', '#ffb0d8')
  } else if (t === 'STEAL_ACTION') {
    const { target, cardType } = opts
    if (
      !target ||
      !target.alive ||
      !cardType ||
      !ACTION_TYPES.includes(cardType) ||
      (target.hand[cardType] || 0) < 1
    )
      return false
    p.hand[t]--
    target.hand[cardType]--
    p.hand[cardType]++
    log(
      `⭐ ${p.name} plays ${CARDS[t].icon} ${C.name} — takes 1 ${CARDS[cardType].icon} ${CARDS[cardType].name} card from ${target.name}!`,
      'war',
    )
    floatText(homePlanet(target), `−1${CARDS[cardType].icon}`, '#ffb0d8')
  } else if (t === 'COUP') {
    const pl = opts.planet
    if (!pl || !coupTargets(p).includes(pl)) return false
    const def = state.players[pl.ownerId]
    p.hand[t]--
    log(`⭐ ${p.name} plays ${CARDS[t].icon} ${C.name}`, 'sys')
    def.planets = def.planets.filter((id) => id !== pl.id)
    p.planets.push(pl.id)
    pl.ownerId = p.id
    pl.troops = Math.max(1, Math.floor(pl.troops / 2)) // half disbands, the rest defect
    pl.protectedUntil = state.turn + CONQUEST_TRUCE
    boom(pl)
    floatText(pl, '👑 COUP!', '#ffb0d8')
    log(
      `👑 ${pl.name} defects to ${p.name} — half of ${def.name}'s garrison disbands, ${pl.troops}🪖 defect! Under truce for ${CONQUEST_TRUCE} turns.`,
      'war',
    )
    if (def.planets.length === 0) {
      const lootN = Math.min(6, handSize(def))
      if (lootN > 0) {
        const taken = stealCards(def, p, lootN)
        log(`💰 ${p.name} salvages ${fmtCards(taken)} from the toppled regime!`, 'war')
      }
      for (const ct of CARD_TYPES) def.hand[ct] = 0
      for (const ct of INFLUENCE_TYPES) def.hand[ct] = 0
      def.alive = false
      log(`☠️ ${def.name} has been wiped from the galaxy — overthrown without a shot!`, 'war')
      checkWin()
    }
  } else if (t === 'PEACE') {
    p.hand[t]--
    log(`⭐ ${p.name} plays ${CARDS[t].icon} ${C.name}`, 'sys')
    for (const pl of ownedPlanets(p)) {
      pl.protectedUntil = Math.max(pl.protectedUntil, state.turn + PEACE_TRUCE)
    }
    log(
      `🕊️ ${p.name}'s planets are under truce for ${PEACE_TRUCE} turn${PEACE_TRUCE === 1 ? '' : 's'} — no attacks allowed!`,
      'sys',
    )
  } else {
    return false
  }
  return true
}

function stealCards(from: Player, to: Player, n: number): Hand {
  const taken: Hand = {}
  for (let i = 0; i < n; i++) {
    const avail = CARD_TYPES.filter((t) => from.hand[t] > 0)
    if (!avail.length) break
    // weight by count so the loot reflects the victim's stash
    const flat: string[] = []
    for (const t of avail) for (let k = 0; k < from.hand[t]; k++) flat.push(t)
    const t = choice(flat)
    from.hand[t]--
    to.hand[t]++
    taken[t] = (taken[t] || 0) + 1
  }
  return taken
}

/* ============================ LOG ============================ */

export function log(msg: string, cls = 'sys'): void {
  state.log.push({ msg, cls })
  while (state.log.length > 250) state.log.shift()
}

function setStatus(msg: string): void {
  state.status = msg
}

/* ============================ GAME FLOW ============================ */

export async function runGame(): Promise<void> {
  log('SEVEN PLANETS — seven worlds, one victor.', 'sys')
  log(
    'WIN by conquering every other planet. Research technology, upgrade buildings, raise armies.',
    'sys',
  )
  while (!state.over && state.turn < 400) {
    await playTurn()
  }
  state.activeId = -1
}

export async function playTurn(): Promise<void> {
  state.turn++
  for (const p of state.players) {
    p.tradedThisTurn = false
    // Influence skip cards: paralysed players sit out draft AND action phases.
    p.skippedNow = p.alive && p.skipTurns > 0
    if (p.skipTurns > 0) {
      p.skipTurns--
      if (p.alive)
        log(
          `⏭️ ${p.name} is paralysed and sits this turn out${p.skipTurns > 0 ? ` (${p.skipTurns} more)` : ''}`,
          'sys',
        )
    }
  }
  updatePacifistStatus()
  doIncome()
  if (!state.singularityAnnounced && singularityInPlay()) {
    state.singularityAnnounced = true
    log(
      '🌀 A Research Lab stands complete somewhere — the SINGULARITY card (technology + extra draft picks) can now appear in the pool!',
      'sys',
    )
  }
  state.pool = makePool()
  const alive = alivePlayers()
  const starter = choice(alive)
  state.startIdx = starter.id
  const first = draftOrder()[0]
  const flavor =
    state.turn >= ACTION_CARDS_FROM_TURN
      ? ' · 🃏 5 buildings · 5 resources · 6 actions'
      : state.turn >= BUILDINGS_FROM_TURN
        ? ' · 🃏 5 buildings · 11 resources'
        : ''
  log(`— TURN ${state.turn} — ${first.name} drafts first${flavor}`, 'sys')
  if (state.turn === BUILDINGS_FROM_TURN) {
    log(
      '🏗️ Building cards have entered the pool — pick one to construct it on the drafting planet!',
      'sys',
    )
  }
  if (state.turn === ACTION_CARDS_FROM_TURN) {
    log(
      '⚡ Action cards have entered the pool — ⚔️ Attack, 🪖 Recruit and 🔁 Trade can now be drafted!',
      'sys',
    )
  }
  if (state.turn === MOVE_CARDS_FROM_TURN) {
    log(
      '🛸 Move cards have entered the pool — troops can now be redeployed (Spaceport required)!',
      'sys',
    )
  }
  if (state.turn === ADVANCED_FROM_TURN) {
    log('🔬 Advanced blueprints unlocked — the 🔬 Research Lab can now appear in the pool!', 'sys')
  }

  await runDraft()
  if (state.over) return
  // Nobody can hold an action card before they exist, so skip the action phase.
  if (state.turn < ACTION_CARDS_FROM_TURN) {
    log(
      `🛰️ Fleets hold position — action cards reach the sector on turn ${ACTION_CARDS_FROM_TURN}.`,
      'sys',
    )
    return
  }
  await runActionPhase()
}

function doIncome(): void {
  const gains: Record<number, Hand> = {}
  const moveGains: Record<number, number> = {} // L2 Spaceport: free Move card every 3 turns
  const infGains: Record<number, number> = {} // L2 Embassy: +1 ⭐ Influence every turn
  const pacGains: Record<number, number> = {} // Pacifist: +PACIFIST_INFLUENCE ⭐ per planet
  for (const pl of state.planets) {
    const owner = state.players[pl.ownerId]
    if (!owner.alive) continue
    for (const b of BUILD_ORDER) {
      const inc = BUILDINGS[b].income
      if (pl.buildings[b] && inc) {
        const amount = incomeAmount(b, pl.buildings[b]) // scales with level (Mine L2: 3)
        owner.hand[inc] += amount
        if (!gains[owner.id]) gains[owner.id] = {}
        gains[owner.id][inc] = (gains[owner.id][inc] || 0) + amount
      }
    }
    // L2 Spaceport perk: grant 1 free Move card every 3rd turn
    if ((pl.buildings.SPACEPORT || 0) >= 2 && state.turn % 3 === 0) {
      owner.hand.MOVE++
      moveGains[owner.id] = (moveGains[owner.id] || 0) + 1
    }
    // L2 Embassy perk: +1 Influence per turn
    if ((pl.buildings.EMBASSY || 0) >= 2) {
      owner.influence++
      infGains[owner.id] = (infGains[owner.id] || 0) + 1
    }
    // Pacifist perk: every planet radiates extra influence every turn.
    if (owner.pacifistStatus) {
      owner.influence += PACIFIST_INFLUENCE
      pacGains[owner.id] = (pacGains[owner.id] || 0) + PACIFIST_INFLUENCE
    }
  }
  for (const id in gains) {
    log(`⚙️ ${state.players[id].name} produces ${fmtCards(gains[id])}`, 'draft')
  }
  for (const id in moveGains) {
    log(`🛰️ ${state.players[id].name} receives +${moveGains[id]}🛸 Move (L2 Spaceport)`, 'draft')
  }
  for (const id in infGains) {
    log(`⭐ ${state.players[id].name} gains +${infGains[id]} Influence (L2 Embassy)`, 'draft')
  }
  for (const id in pacGains) {
    log(`☮️ ${state.players[id].name} gains +${pacGains[id]} Influence (Pacifist)`, 'draft')
  }
}

function turnOrder(): Player[] {
  const n = state.players.length
  const order: Player[] = []
  for (let i = 0; i < n; i++) order.push(state.players[(state.startIdx + i) % n])
  return order.filter((p) => p.alive)
}

// Draft priority: higher TECHNOLOGY drafts first. Ties keep the rotation order.
function draftOrder(): Player[] {
  return turnOrder().sort((a, b) => techLevel(b) - techLevel(a))
}

/* ---------------- draft phase ---------------- */

async function runDraft(): Promise<void> {
  state.phase = 'draft'

  for (const p of draftOrder()) {
    if (p.skippedNow) continue // paralysed by an influence card
    for (let s = 0; s < p.planets.length; s++) {
      if (state.over) return
      if (!p.alive || state.pool.length === 0) continue
      const planet = state.planets[p.planets[s]]
      const picks = s === 0 ? mainPicks(p) : 1
      state.activeId = p.id
      state.draftPlanetId = planet.id
      for (let k = 0; k < picks && state.pool.length > 0; k++) {
        let idx: number
        if (p.isHuman && !AUTO_HUMAN) {
          if (!state.pool.some((t) => canPickCard(p, t, planet))) {
            setStatus(`No card you can take — ${planet.name} passes.`)
            log(`🃏 ${p.name} passes (nothing pickable for ${planet.name})`, 'draft')
            await sleep(600)
            continue
          }
          setStatus(
            `YOUR PICK — ${planet.name} drafts card ${k + 1} of ${picks}${s > 0 ? ' (extra planet turn)' : ''}`,
          )
          idx = await waitHumanPoolPick()
        } else {
          setStatus(`${p.name} is drafting for ${planet.name}…`)
          await sleep(300)
          idx = aiDraftPick(p, planet)
          if (idx < 0) {
            log(`🃏 ${p.name} passes (nothing pickable for ${planet.name})`, 'draft')
            continue
          }
        }
        if (state.over) return
        const type = state.pool.splice(idx, 1)[0]
        if (CARDS[type].building) {
          buildBuilding(p, planet, type as BuildingType) // pays cost from hand, may win the game
          if (state.over) return
        } else if (CARDS[type].influenceCard) {
          const it = type as InfluenceType
          p.influence -= INFLUENCE_CARDS[it].cost
          p.hand[it]++
          log(
            `⭐ ${p.name} drafts ${CARDS[it].icon} ${CARDS[it].name} (−${INFLUENCE_CARDS[it].cost}⭐) — holds it for a later action turn`,
            'draft',
          )
        } else {
          p.hand[type]++
          log(
            `🃏 ${p.name} drafts ${CARDS[type].icon} ${CARDS[type].name}${s > 0 ? ` (${planet.name}'s turn)` : ''}`,
            'draft',
          )
        }
      }
    }
  }
  state.draftPlanetId = -1
}

let poolResolve: ((idx: number) => void) | null = null
function waitHumanPoolPick(): Promise<number> {
  return new Promise((res) => {
    poolResolve = res
    state.awaitingPick = true
  })
}
export function humanPoolClick(idx: number): void {
  if (!poolResolve || state.phase !== 'draft') return
  const human = state.players[0]
  const planet = state.planets[state.draftPlanetId] || homePlanet(human)
  if (idx < 0 || idx >= state.pool.length || !canPickCard(human, state.pool[idx], planet)) return
  const r = poolResolve
  poolResolve = null
  state.awaitingPick = false
  r(idx)
}

/* ---------------- action phase ---------------- */

async function runActionPhase(): Promise<void> {
  state.phase = 'action'
  for (const p of turnOrder()) {
    if (state.over) return
    if (!p.alive || p.skippedNow) continue
    state.activeId = p.id
    if (p.isHuman && !AUTO_HUMAN) {
      setStatus('YOUR TURN — recruit, attack or trade. End turn when done.')
      await humanActionTurn()
    } else {
      setStatus(`${p.name} is taking actions…`)
      await aiActionTurn(p)
    }
    if (state.over) return
  }
}

let humanResolve: (() => void) | null = null
function humanActionTurn(): Promise<void> {
  return new Promise((res) => {
    humanResolve = res
    state.awaitingAction = true
  })
}
export function endHumanTurn(): void {
  if (!humanResolve) return
  const r = humanResolve
  humanResolve = null
  state.awaitingAction = false
  r()
}
export function isHumanTurn(): boolean {
  return humanResolve !== null && !state.busy && !state.over
}
export function setBusy(v: boolean): void {
  state.busy = v
}

/* ---------------- actions ---------------- */

// Called from the draft when a building card is picked: pay the cost, then
// build or upgrade it (validated in canPickCard).
function buildBuilding(p: Player, planet: Planet, id: BuildingType): void {
  const techBefore = techLevel(p)
  const lvl = (planet.buildings[id] || 0) + 1
  payCost(p, buildingCost(id, lvl))
  planet.buildings[id] = lvl
  const verb =
    lvl > 1
      ? `upgrades ${BUILDINGS[id].icon} ${BUILDINGS[id].name} to level ${lvl}`
      : `builds ${BUILDINGS[id].icon} ${BUILDINGS[id].name}`
  log(`🏗️ ${p.name} ${verb} on ${planet.name}`, 'build')
  floatText(
    planet,
    `${BUILDINGS[id].icon} ${BUILDINGS[id].name}${lvl > 1 ? ` L${lvl}` : ''}`,
    '#7dff8a',
  )
  const techAfter = techLevel(p)
  if (techAfter > techBefore)
    log(
      `🔬 ${p.name} reaches TECHNOLOGY ${techAfter} — level-${techAfter} upgrades unlocked, and they now draft before lower-tech rivals!`,
      'sys',
    )
}

// Recruiting REQUIRES a Barracks on the target planet.
export function recruit(p: Player, planet: Planet): void {
  if (!planet.buildings.BARRACKS) return // no barracks, no army
  if (!canAfford(p.hand, recruitCost(planet))) return
  spendActionCard(p, 'RECRUIT')
  payCost(p, recruitCost(planet))
  const n = recruitYield(planet)
  planet.troops += n
  log(
    `🪖 ${p.name} recruits ${n} troop${n > 1 ? 's' : ''} on ${planet.name} (garrison now ${planet.troops})`,
    'build',
  )
  floatText(planet, `+${n}🪖`, '#7fd9ff')
}

// Redeploy troops between two planets of the same player (spends a Move card).
export async function moveTroops(p: Player, from: Planet, to: Planet, n: number): Promise<void> {
  if (!hasBuilding(p, 'SPACEPORT')) return
  spendActionCard(p, 'MOVE')
  from.troops -= n
  log(
    `🛸 ${p.name} redeploys ${n} troop${n > 1 ? 's' : ''} from ${from.name} to ${to.name}`,
    'build',
  )
  await animateRocket(from, to, p.color)
  to.troops += n
  floatText(to, `+${n}🪖`, '#7fd9ff')
}

// An attack launches from one of the attacker's planets, using THAT planet's army.
export async function doAttack(
  att: Player,
  source: Planet,
  target: Planet,
  n: number,
): Promise<void> {
  if (att.pacifistStatus) return // pacifists have forsworn war for good
  if (underTruce(target)) return // freshly conquered planets cannot be attacked
  if (!source.buildings.SILO) return // no silo, no rockets
  spendActionCard(att, 'ATTACK')
  att.lastAttackTurn = state.turn // resets the pacifist countdown
  const def = state.players[target.ownerId]
  source.troops -= n
  log(
    `🚀 ${att.name} launches a rocket with ${n} troops from ${source.name} at ${target.name} (${def.name})!`,
    'war',
  )
  if (!att.isHuman && TAUNTS[persOf(att)] && Math.random() < 0.4) {
    log(`   ${att.name}: ${choice(TAUNTS[persOf(att)])}`, 'war')
  }
  await animateRocket(source, target, att.color)

  // Battle resolution reads every coefficient from constants.COMBAT so the
  // planning AI (./ai) predicts with the exact numbers the dice use.
  const shieldDef = (target.buildings.SHIELD || 0) * SHIELD_DEFENSE // shields stack
  const ap = COMBAT.attackPerTroop * n + siloBonus(source) + randInt(0, COMBAT.attackRoll)
  const dp =
    COMBAT.defensePerTroop * target.troops +
    shieldDef +
    pacifistDefBonus(target) +
    HOME_FIELD +
    randInt(0, COMBAT.defenseRoll)
  const win = ap > dp

  let attLoss: number, defLoss: number
  if (win) {
    defLoss = Math.min(target.troops, Math.ceil((n * COMBAT.winDefLoss.num) / COMBAT.winDefLoss.den))
    attLoss = Math.floor((n * COMBAT.winAttLoss.num) / COMBAT.winAttLoss.den)
  } else {
    attLoss = Math.ceil((n * COMBAT.loseAttLoss.num) / COMBAT.loseAttLoss.den)
    defLoss = Math.min(
      target.troops,
      Math.floor((n * COMBAT.loseDefLoss.num) / COMBAT.loseDefLoss.den),
    )
  }
  const survivors = n - attLoss
  target.troops -= defLoss
  boom(target)
  log(
    `💥 Battle for ${target.name}: attack ${ap} vs defense ${dp} — ${win ? att.name + ' WINS' : def.name + ' holds'}! Losses: ${att.name} -${attLoss}🪖, ${def.name} -${defLoss}🪖`,
    'war',
  )

  if (win) {
    // no spoils for merely winning a battle — only conquest pays
    if (target.troops <= 0) {
      conquerPlanet(att, target, survivors) // the surviving strike force garrisons it
    } else {
      source.troops += survivors // raiders fly home
      floatText(target, 'RAIDED!', '#ff8a97')
    }
  } else {
    source.troops += survivors
    floatText(target, 'DEFENDED!', '#7dff8a')
  }
  checkWin()
}

function conquerPlanet(att: Player, target: Planet, garrison: number): void {
  const def = state.players[target.ownerId]
  target.ownerId = att.id
  def.planets = def.planets.filter((id) => id !== target.id)
  att.planets.push(target.id)
  target.troops = garrison // the winners left after battle hold the planet
  target.protectedUntil = state.turn + CONQUEST_TRUCE // truce
  floatText(target, 'CONQUERED!', '#ff9e3d')
  log(
    `🏴 ${att.name} CONQUERS ${target.name} — ${garrison}🪖 garrison it! Under truce for ${CONQUEST_TRUCE} turns.`,
    'war',
  )
  // Invasions burn most of the spoils — only part of the victim's stash survives.
  if (def.planets.length === 0) {
    const lootN = Math.min(6, handSize(def))
    if (lootN > 0) {
      const taken = stealCards(def, att, lootN)
      log(`💰 ${att.name} salvages ${fmtCards(taken)} from the ruins!`, 'war')
    }
    for (const t of CARD_TYPES) def.hand[t] = 0
    for (const t of INFLUENCE_TYPES) def.hand[t] = 0
    def.alive = false
    log(`☠️ ${def.name} has been wiped from the galaxy!`, 'war')
  } else {
    const lootN = Math.min(5, Math.ceil(handSize(def) / 2))
    if (lootN > 0) {
      const taken = stealCards(def, att, lootN)
      log(`💰 ${att.name} seizes ${fmtCards(taken)} from the fleeing ${def.name}!`, 'war')
    }
  }
}

// `a` is the initiator and pays the TRADE action card.
export function execTrade(a: Player, b: Player, aGives: Cost, bGives: Cost): void {
  spendActionCard(a, 'TRADE')
  for (const t in aGives) {
    a.hand[t] -= aGives[t]
    b.hand[t] += aGives[t]
  }
  for (const t in bGives) {
    b.hand[t] -= bGives[t]
    a.hand[t] += bGives[t]
  }
  a.influence++
  log(
    `🔁 ${a.name} trades ${fmtCards(aGives)} to ${b.name} for ${fmtCards(bGives)}  [+1⭐ influence]`,
    'trade',
  )
}

/* ---------------- win / game over ---------------- */

function checkWin(): void {
  if (state.over) return
  const alive = alivePlayers()
  if (alive.length === 1) {
    triggerGameOver(alive[0], 'conquest')
    return
  }
  if (!AUTO_HUMAN && !state.players[0].alive) triggerGameOver(null, 'eliminated')
}

function triggerGameOver(winner: Player | null, reason: 'conquest' | 'eliminated'): void {
  if (state.over) return
  state.over = { winner, reason }
  if (reason === 'conquest' && winner)
    log(`🏴 ${winner.name} rules all seven planets! The galaxy has one master.`, 'win')
  if (reason === 'eliminated')
    log('☠️ Your homeworld has fallen. The galaxy forgets Terra Prime.', 'win')
  setStatus(
    winner
      ? `GAME OVER — ${winner.name} wins by ${reason}.`
      : 'GAME OVER — your homeworld has fallen.',
  )
  if (humanResolve) endHumanTurn()
  if (poolResolve) {
    const r = poolResolve
    poolResolve = null
    state.awaitingPick = false
    r(0)
  }
  if (state.pendingOffer) resolveOffer(false)
}

/* ============================ AI ============================ */

// The next thing this player is saving for (used for drafting, trading, refusals).
function currentGoal(p: Player): { id: BuildingType; planet: Planet; cost: Cost } | null {
  const readyPl = singularityReadyPlanet(p)
  if (readyPl)
    return {
      id: 'SINGULARITY',
      planet: readyPl,
      cost: buildingCost('SINGULARITY', (readyPl.buildings.SINGULARITY || 0) + 1),
    }
  const tech = techLevel(p)
  for (const id of PRIORITIES[persOf(p)]) {
    if (id === 'SINGULARITY') continue // handled above — needs a Lab of the same level
    const cap = Math.min(maxLevel(id), tech)
    const pl = ownedPlanets(p).find((x) => (x.buildings[id] || 0) < cap)
    if (pl) return { id, planet: pl, cost: buildingCost(id, (pl.buildings[id] || 0) + 1) }
  }
  return null
}

// Pick for `planet`'s draft turn. Returns -1 when nothing in the pool is pickable.
function aiDraftPick(p: Player, planet: Planet): number {
  // MASTERMIND: the advanced planner in ./ai scores every pickable card
  // (own value + denial value) against its rolling multi-turn plan.
  if (persOf(p) === 'mastermind') {
    const pickable = state.pool.map((t) => canPickCard(p, t, planet))
    return mastermindDraftPick(state, p, planet, pickable)
  }
  // Random strategy: pick any pickable card uniformly at random.
  if (persOf(p) === 'random') {
    const pickable: number[] = []
    for (let i = 0; i < state.pool.length; i++) {
      if (canPickCard(p, state.pool[i], planet)) pickable.push(i)
    }
    return pickable.length ? pickable[Math.floor(Math.random() * pickable.length)] : -1
  }
  const goal = currentGoal(p)
  const missing: Cost = {}
  if (goal) {
    for (const t in goal.cost) {
      const short = goal.cost[t] - p.hand[t]
      if (short > 0) missing[t] = short
    }
  }
  let bestIdx = -1
  let bestScore = -Infinity
  for (let i = 0; i < state.pool.length; i++) {
    const t = state.pool[i]
    if (!canPickCard(p, t, planet)) continue
    let score: number
    if (CARDS[t].building) {
      const pr = PRIORITIES[persOf(p)].indexOf(t as BuildingType)
      score = 3.2 - pr * 0.22 + Math.random() * 0.5
      if (goal && t === goal.id) score += 3
      if (t === 'BARRACKS' && !hasBuilding(p, 'BARRACKS')) score += 2.5 // can't recruit without one
      if (t === 'LAB' && !hasBuilding(p, 'LAB')) score += 1.5 // opens the road to the Singularity
      if (t === 'SILO' && !hasBuilding(p, 'SILO')) score += 2.0 // can't attack without one
      if (t === 'SILO' && p.hand.ATTACK >= 3) score += 2.5 // attacks piling up — need bigger rockets
      if (
        t === 'EMBASSY' &&
        !hasBuilding(p, 'EMBASSY') &&
        (persOf(p) === 'hoarder' || persOf(p) === 'trader' || persOf(p) === 'pacifist')
      )
        score += 1.5
      if (t === 'SPACEPORT' && !hasBuilding(p, 'SPACEPORT') && p.planets.length >= 2) score += 1.2 // multi-planet empires need Move
      if (t === 'SINGULARITY') score += 5 // raises TECHNOLOGY and grows the draft engine
    } else if (CARDS[t].influenceCard) {
      const it = t as InfluenceType
      const pers = persOf(p)
      score = 2 + Math.random() * 0.6
      if (it.startsWith('SKIP_')) {
        const target = influenceTarget(p, it)
        const allStr = alivePlayers().map((x) => playerStrength(x))
        const avgStr = allStr.reduce((a, b) => a + b, 0) / (allStr.length || 1)
        score = target ? 1.5 + (playerStrength(target) / Math.max(1, avgStr)) * 1.5 : 1
        if (pers === 'opportunist') score += 1.5 // their whole game plan
        if (pers === 'aggressor' || pers === 'militarist' || pers === 'blitzer') score += 1 // paralyse rivals before striking
        if (pers === 'expansionist') score += 0.5
      } else if (it === 'STEAL_ACTION') {
        const loot = alivePlayers().some(
          (x) => x.id !== p.id && ACTION_TYPES.some((a) => x.hand[a] > 0),
        )
        score += loot ? 0.8 : -3
        if (pers === 'opportunist' || pers === 'trader') score += 1
        if (pers === 'militarist' || pers === 'aggressor' || pers === 'blitzer') score += 0.8 // deny rivals their attack cards
      } else if (it === 'COUP') {
        score = aiPickCoupTarget(p) ? 7 : -3
        if (aiPickCoupTarget(p)) {
          // A pacifist can never attack, so a Coup is its ONLY road to conquest —
          // and its extra influence income makes the 20⭐ price affordable.
          if (pers === 'pacifist' || isPacifist(p)) score += 5
          else if (pers === 'expansionist') score += 2 // more planets, no battle
          else if (pers === 'opportunist') score += 1.5 // topple the leader outright
          else if (pers === 'militarist' || pers === 'aggressor') score += 1
        }
      } else if (it === 'PEACE') {
        const weak = ownedPlanets(p).some((pl) => pl.troops <= 3 && !underTruce(pl))
        score += weak ? 2 : -1
        if (pers === 'pacifist' || pers === 'fortifier' || pers === 'rusher') score += 1
        if (pers === 'economist' || pers === 'hoarder' || pers === 'builder') score += 0.5 // shield the economy
      }
      // Pacifists bank every ⭐ for the 20-cost Coup — they refuse cheaper cards.
      if ((pers === 'pacifist' || isPacifist(p)) && it !== 'COUP') score -= 4
      if (p.hand[it] > 0) score -= 1.5 // one copy in hand is usually enough
    } else {
      const pers = persOf(p)
      score = CARDS[t].value + Math.random() * 0.4
      if (missing[t]) score += 2.5
      if (t === 'RECRUIT') {
        if (p.hand.RECRUIT === 0 && ownedPlanets(p).some((pl) => pl.troops < troopTarget(p)))
          score += 1.6
        if (pers === 'militarist' || pers === 'blitzer') score += 1.4
      } else if (t === 'ATTACK') {
        if (pers === 'aggressor') score += 1.2
        if (pers === 'militarist') score += 2.0
        if (pers === 'blitzer') score += 1.8
        if (pers === 'expansionist' || pers === 'opportunist') score += 0.8
        if (pers === 'rusher' || pers === 'fortifier' || pers === 'trader' || pers === 'pacifist')
          score -= 2.0
        if (p.hand.ATTACK === 0 && totalTroops(p) >= 4) score += 1.0
      } else if (t === 'MOVE') {
        if (p.hand.MOVE === 0 && p.planets.length >= 2) score += 1.0
      } else if (t === 'TRADE') {
        if (pers === 'hoarder' && p.hand.TRADE === 0) score += 0.8
        if ((pers === 'rusher' || pers === 'economist') && p.hand.TRADE === 0) score += 1.2
        if (
          (pers === 'trader' || pers === 'pacifist' || pers === 'opportunist') &&
          p.hand.TRADE === 0
        )
          score += 2.5
      } else if (t === 'ORE' || t === 'ENERGY') {
        if (pers === 'aggressor' || pers === 'militarist' || pers === 'blitzer') score += 0.6 // troop-cost resources
      } else if (t === 'SPICE' || t === 'CRYSTAL') {
        if (pers === 'rusher' || pers === 'trader') score += 0.4 // high-value Singularity inputs
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestIdx = i
    }
  }
  return bestIdx
}

// Desired garrison per planet.
//
// Aggressive personalities stack troops to fuel INVASIONS; the defensive
// (non-aggressive) personalities keep a strong garrison purely to DEFEND — they
// still buy an army, they just never march it out (their aiPickAttack margins are
// so high, or forbidden outright for pacifists, that the troops only ever hold).
function troopTarget(p: Player): number {
  const pers = persOf(p)
  const base = 2 + Math.min(8, Math.floor(state.turn / 3))
  // ── aggressive: army is for attacking ──
  if (pers === 'militarist') return base + 4
  if (pers === 'aggressor' || pers === 'expansionist') return base + 2
  // ── defensive: army is for holding the line ──
  if (pers === 'fortifier') return base + 3 // the dedicated turtle
  if (pers === 'pacifist' || isPacifist(p)) return base + 3 // never attacks — pure defense
  if (
    pers === 'hoarder' ||
    pers === 'economist' ||
    pers === 'builder' ||
    pers === 'trader' ||
    pers === 'balanced'
  )
    return base + 2 // economic turtles: enough garrison to not be easy prey
  if (pers === 'rusher') return base + 1 // leaner, but still keeps defenders
  return base
}

// The non-aggressive personalities: they raise an army purely to DEFEND, and
// only ever march it out to finish a nearly-dead rival or pre-empt a runaway
// leader (see aiPickAttack). Pacifists never attack at all; 'random' stays
// chaotic and is deliberately left out.
const DEFENSIVE_PERSONALITIES = new Set([
  'builder',
  'hoarder',
  'economist',
  'fortifier',
  'trader',
  'rusher',
  'balanced',
])

function aiPickAttack(p: Player): { source: Planet; target: Planet; n: number } | null {
  const pers = persOf(p)
  if (isPacifist(p)) return null // forsworn war permanently
  if (!hasActionCard(p, 'ATTACK')) return null
  const earlyTurn =
    pers === 'aggressor' || pers === 'militarist' || pers === 'blitzer'
      ? ACTION_CARDS_FROM_TURN
      : pers === 'expansionist'
        ? ACTION_CARDS_FROM_TURN + 1
        : ACTION_CARDS_FROM_TURN + 2
  if (state.turn < earlyTurn) return null
  const reserve =
    pers === 'militarist' || pers === 'blitzer'
      ? 1
      : pers === 'aggressor' || pers === 'expansionist'
        ? 2
        : 3
  // launch from the SILO planet that can field the LARGEST strike force
  let source: Planet | null = null
  let n = 0
  for (const pl of ownedPlanets(p)) {
    if (!pl.buildings.SILO) continue
    const nEff = Math.min(rocketCap(pl), pl.troops - reserve)
    if (nEff > n) {
      n = nEff
      source = pl
    }
  }
  if (!source || n < 2) return null
  const myBonus = siloBonus(source)
  let needMargin =
    pers === 'militarist' || pers === 'aggressor'
      ? 0
      : pers === 'blitzer'
        ? state.turn <= 15
          ? -2
          : 5 // all-in early, selective later
        : pers === 'opportunist'
          ? 4
          : pers === 'expansionist'
            ? 2
            : pers === 'hoarder' || pers === 'builder'
              ? 7
              : pers === 'economist'
                ? 9
                : pers === 'rusher' || pers === 'fortifier' || pers === 'trader'
                  ? 14
                  : pers === 'pacifist'
                    ? 999
                    : 4 // pacifist truly never attacks
  // Conquest is the ONLY road to victory: everyone (except the pacifist) grows bolder over time.
  if (pers !== 'pacifist') {
    needMargin -= Math.floor(state.turn / 8) + (alivePlayers().length === 2 ? 3 : 0)
    needMargin = Math.max(-6, needMargin)
  }

  const defensive = DEFENSIVE_PERSONALITIES.has(pers)
  const myStr = playerStrength(p)
  let best: { source: Planet; target: Planet; n: number } | null = null
  let bestScore = -Infinity
  for (const pl of state.planets) {
    if (pl.ownerId === p.id) continue
    if (underTruce(pl)) continue // freshly conquered planets are off-limits
    const d = state.players[pl.ownerId]
    // Defend-first personalities never attack for expansion — they only strike to
    // FINISH a nearly-dead rival, or to pre-empt one who has grown into a threat.
    if (defensive) {
      const eliminates = d.planets.length === 1 // taking this planet ends them
      const threatening = playerStrength(d) > myStr * 1.35 // a runaway leader
      if (!eliminates && !threatening) continue
    }
    const defense =
      COMBAT.defensePerTroop * pl.troops +
      (pl.buildings.SHIELD || 0) * SHIELD_DEFENSE +
      pacifistDefBonus(pl) +
      HOME_FIELD
    const margin = COMBAT.attackPerTroop * n + myBonus - defense
    if (margin < needMargin) continue
    let score = margin + handSize(d) * 0.6 + d.planets.length * 2
    if (pers === 'expansionist') score += d.planets.length * 2 // prefer multi-planet targets
    if (pers === 'opportunist') score += playerStrength(d) * 0.15 // target the current leader
    if (pl.buildings.SINGULARITY) score += 3 * pl.buildings.SINGULARITY // deny the draft engine
    if (hasBuilding(d, 'LAB')) score += 4 // slow their technology
    if (d.planets.length === 1 && pl.troops <= 2) score += 8 // finish off the weak
    if (score > bestScore) {
      bestScore = score
      best = { source, target: pl, n }
    }
  }
  return best
}

// ai = the player being ASKED to accept. gives/gets are from ai's perspective.
export function aiEvaluateTrade(
  ai: Player,
  gives: Cost,
  gets: Cost,
  proposer: Player | null = null,
): boolean {
  // Only resource cards may be traded
  for (const t in gives)
    if (!RESOURCE_TYPES.includes(t as never) && (gives[t] || 0) > 0) return false
  for (const t in gets) if (!RESOURCE_TYPES.includes(t as never) && (gets[t] || 0) > 0) return false
  for (const t in gives) if ((ai.hand[t] || 0) < gives[t]) return false
  // MASTERMIND weighs offers against its own build plan (see ./ai).
  if (persOf(ai) === 'mastermind') return mastermindEvaluateTrade(state, ai, gives, gets, proposer)
  const vOut = handValue(gives)
  const vIn = handValue(gets)
  const goal = currentGoal(ai)
  if (goal) {
    for (const t in gives) {
      const kept = ai.hand[t] - gives[t]
      if (kept < (goal.cost[t] || 0) && vIn < vOut * 1.4) return false
    }
  }
  // Anti-kingmaker: refuse or demand strongly better terms when trading with the leader.
  if (proposer && proposer.id !== ai.id) {
    const allStr = alivePlayers().map((x) => playerStrength(x))
    const avgStr = allStr.reduce((a, b) => a + b, 0) / (allStr.length || 1)
    if (playerStrength(proposer) > avgStr * 1.3) {
      if (vIn < vOut * 1.6) return false
    }
  }
  // Resource selectivity: accept readily only when receiving a needed resource.
  const needed = goal ? RESOURCE_TYPES.filter((t) => (goal.cost[t] || 0) > (ai.hand[t] || 0)) : []
  const receivingNeeded =
    needed.length > 0 && Object.keys(gets).some((t) => needed.includes(t as never))
  const persAI = persOf(ai)
  const baseThreshold =
    persAI === 'militarist'
      ? 1.2
      : persAI === 'hoarder'
        ? 1.1
        : persAI === 'fortifier'
          ? 1.05
          : persAI === 'rusher' || persAI === 'economist'
            ? 0.85
            : 0.95
  const threshold = receivingNeeded ? baseThreshold : Math.max(1.9, baseThreshold * 1.7)
  return vIn >= vOut * threshold
}

function aiPlanTrade(p: Player): TradeOffer | null {
  if (!hasActionCard(p, 'TRADE') || !hasBuilding(p, 'EMBASSY')) return null
  const goal = currentGoal(p)
  if (!goal) return null
  const missing = RESOURCE_TYPES.filter((t) => (goal.cost[t] || 0) > p.hand[t])
  if (!missing.length) return null
  const want = missing[0]

  // surplus = resources beyond what the goal needs (relics/action cards never given)
  const surplus: string[] = []
  for (const t of RESOURCE_TYPES) {
    if (t === 'RELIC') continue
    const spare = p.hand[t] - (goal.cost[t] || 0)
    for (let i = 0; i < spare; i++) surplus.push(t)
  }
  surplus.sort((a, b) => CARDS[a].value - CARDS[b].value)

  const gives: Cost = {}
  let v = 0
  const targetV = CARDS[want].value
  for (const t of surplus) {
    if (v >= targetV) break
    gives[t] = (gives[t] || 0) + 1
    v += CARDS[t].value
  }
  if (v < targetV) return null

  const partners = alivePlayers()
    .filter((x) => x.id !== p.id && x.hand[want] > 0)
    .sort((a, b) => b.hand[want] - a.hand[want])
  if (!partners.length) return null
  let partner = partners[0]
  const persP = persOf(p)
  if (persP !== 'trader' && partner.isHuman && !AUTO_HUMAN && Math.random() < 0.5) {
    partner = partners[1] || partner // don't pester the human every turn
  }
  // Opportunist prefers trading with the weakest player.
  if (persP === 'opportunist') {
    const weakest = [...partners].sort((a, b) => playerStrength(a) - playerStrength(b))[0]
    if (weakest && weakest.hand[want] > 0) partner = weakest
  }
  return { partner, gives, gets: { [want]: 1 } }
}

async function proposeTrade(p: Player, offer: TradeOffer): Promise<boolean> {
  const partner = offer.partner
  const wantKey = Object.keys(offer.gets)[0]
  if (wantKey && RESOURCE_TYPES.includes(wantKey as never)) {
    log(
      `📡 ${p.name} opens a trade channel — seeking ${CARDS[wantKey].icon} ${CARDS[wantKey].name}`,
      'trade',
    )
  }
  let accept: boolean
  if (partner.isHuman && !AUTO_HUMAN) {
    setStatus(`${p.name} is hailing you with a trade offer…`)
    accept = await askHumanOffer(p, offer)
  } else {
    accept = aiEvaluateTrade(partner, offer.gets, offer.gives, p)
  }
  if (state.over) return false
  if (accept) {
    execTrade(p, partner, offer.gives, offer.gets)
    return true
  }
  log(`🔁 ${partner.name} declines ${p.name}'s trade offer.`, 'trade')
  return false
}

// The juiciest planet a Coup could seize. Returns null when nothing is worth it.
function aiPickCoupTarget(p: Player): Planet | null {
  // A Coup is the pacifist's ONLY way to conquer, so it accepts weaker targets
  // and leans harder on eliminations to thin the field toward a full conquest.
  const pac = persOf(p) === 'pacifist' || isPacifist(p)
  let best: Planet | null = null
  let bestScore = -Infinity
  for (const pl of coupTargets(p)) {
    const bLevels = Object.values(pl.buildings).reduce((a, b) => a + b, 0)
    let score = bLevels + 2 * (pl.buildings.SINGULARITY || 0) + pl.troops * 0.5
    if (state.players[pl.ownerId].planets.length === 1) score += pac ? 12 : 8 // elimination!
    if (score > bestScore) {
      bestScore = score
      best = pl
    }
  }
  return bestScore >= (pac ? 2 : 3) ? best : null
}

// Decide whether (and how) to play a held influence card this action.
function aiPickInfluencePlay(p: Player): (InfluenceOpts & { type: InfluenceType }) | null {
  const allStr = alivePlayers().map((x) => playerStrength(x))
  const avgStr = allStr.reduce((a, b) => a + b, 0) / (allStr.length || 1)
  // Coup: seize the most developed rival planet as soon as one is worth it.
  if ((p.hand.COUP || 0) >= 1) {
    const planet = aiPickCoupTarget(p)
    if (planet) return { type: 'COUP', planet }
  }
  // Skip cards: unleash on a rival pulling ahead (or anyone in a final duel).
  for (const t of ['SKIP_ARMY', 'SKIP_PLANETS', 'SKIP_TECH', 'SKIP_INFLUENCE'] as InfluenceType[]) {
    if ((p.hand[t] || 0) < 1) continue
    const target = influenceTarget(p, t)
    if (!target) continue
    if (playerStrength(target) >= avgStr || alivePlayers().length === 2) return { type: t }
  }
  // Extortion: grab a card this player can use — or deny the strongest rival their Attack cards.
  if ((p.hand.STEAL_ACTION || 0) >= 1) {
    const rivals = alivePlayers().filter((x) => x.id !== p.id)
    const wants = ACTION_TYPES.filter((a) =>
      a === 'ATTACK'
        ? hasBuilding(p, 'SILO')
        : a === 'RECRUIT'
          ? hasBuilding(p, 'BARRACKS')
          : a === 'MOVE'
            ? hasBuilding(p, 'SPACEPORT') && p.planets.length >= 2
            : hasBuilding(p, 'EMBASSY'),
    )
    if (!wants.includes('ATTACK')) wants.push('ATTACK') // pure denial
    for (const a of wants) {
      const holders = rivals
        .filter((x) => x.hand[a] > 0)
        .sort((x, y) => playerStrength(y) - playerStrength(x))
      if (holders.length) return { type: 'STEAL_ACTION', target: holders[0], cardType: a }
    }
  }
  // Peace Treaty: pop it when a garrison runs dangerously thin.
  if ((p.hand.PEACE || 0) >= 1 && ownedPlanets(p).some((pl) => pl.troops <= 2 && !underTruce(pl))) {
    return { type: 'PEACE' }
  }
  return null
}

// Execute one MASTERMIND decision — the brain (./ai) decides, the engine acts.
async function mastermindOneAction(p: Player): Promise<boolean> {
  const d = mastermindAction(state, p)
  if (!d) return false
  switch (d.kind) {
    case 'influence':
      return useInfluenceCard(p, d.type, d.opts)
    case 'attack':
      if (!hasActionCard(p, 'ATTACK')) return false
      await doAttack(p, d.source, d.target, d.n)
      return true
    case 'recruit':
      if (!hasActionCard(p, 'RECRUIT')) return false
      recruit(p, d.planet)
      return true
    case 'move':
      if (!hasActionCard(p, 'MOVE')) return false
      await moveTroops(p, d.from, d.to, d.n)
      return true
    case 'trade': {
      if (p.tradedThisTurn || !hasActionCard(p, 'TRADE')) return false
      p.tradedThisTurn = true
      return await proposeTrade(p, { partner: d.partner, gives: d.gives, gets: d.gets })
    }
  }
}

async function aiOneAction(p: Player): Promise<boolean> {
  if (persOf(p) === 'mastermind') return mastermindOneAction(p)
  // 0. influence cards — already paid for at draft; play when the moment is right
  const infPlay = aiPickInfluencePlay(p)
  if (infPlay && useInfluenceCard(p, infPlay.type, infPlay)) return true
  const readyPl = singularityReadyPlanet(p)
  const wantTroops = troopTarget(p)
  const pers = persOf(p)
  // The invasion staging site: the planet whose silo can launch the most troops.
  const staging = ownedPlanets(p).reduce((a, b) =>
    rocketCap(b) > rocketCap(a) || (rocketCap(b) === rocketCap(a) && b.troops > a.troops) ? b : a,
  )
  const stagingCap = rocketCap(staging)
  const invasionNeed =
    pers !== 'pacifist' &&
    !isPacifist(p) &&
    p.hand.ATTACK > 0 &&
    hasBuilding(p, 'SILO') &&
    (stagingCap === Infinity ? staging.troops < wantTroops + 4 : staging.troops < stagingCap + 3)

  // 1. recruit — ONLY possible on a Barracks planet the player can afford
  if (hasActionCard(p, 'RECRUIT')) {
    const barracksPls = ownedPlanets(p).filter(
      (pl) => pl.buildings.BARRACKS && canAfford(p.hand, recruitCost(pl)),
    )
    if (
      barracksPls.length &&
      (invasionNeed || ownedPlanets(p).some((pl) => pl.troops < wantTroops))
    ) {
      const best = barracksPls.reduce((a, b) =>
        b.buildings.BARRACKS > a.buildings.BARRACKS ||
        (b.buildings.BARRACKS === a.buildings.BARRACKS && b.troops < a.troops)
          ? b
          : a,
      )
      recruit(p, best)
      return true
    }
  }

  // 2. attack — limited by the Attack cards in hand
  const atk = aiPickAttack(p)
  if (atk) {
    await doAttack(p, atk.source, atk.target, atk.n)
    return true
  }

  // 3. move — needs a Spaceport; concentrate the invasion force on the staging planet…
  const canMove = hasActionCard(p, 'MOVE') && hasBuilding(p, 'SPACEPORT') && p.planets.length >= 2
  if (canMove && invasionNeed) {
    const donors = ownedPlanets(p).filter((pl) => pl !== staging && pl.troops > 4)
    if (donors.length) {
      const donor = donors.reduce((a, b) => (a.troops >= b.troops ? a : b))
      const n = Math.min(rocketCap(donor), donor.troops - 3)
      if (n >= 2) {
        await moveTroops(p, donor, staging, n)
        return true
      }
    }
  }
  // …or shuttle troops from the strongest garrison to where defense is needed
  if (canMove) {
    const pls = ownedPlanets(p)
    const strongest = pls.reduce((a, b) => (a.troops >= b.troops ? a : b))
    const dest =
      readyPl && readyPl !== strongest
        ? readyPl
        : pls.reduce((a, b) => (a.troops <= b.troops ? a : b))
    if (dest !== strongest && strongest.troops - dest.troops >= 4) {
      const n = Math.min(rocketCap(strongest), Math.floor((strongest.troops - dest.troops) / 2))
      if (n >= 1) {
        await moveTroops(p, strongest, dest, n)
        return true
      }
    }
  }

  // 4. trade — requires a Trade card (spent only if the deal goes through)
  const tradeEager = pers === 'trader' || pers === 'pacifist'
  if (!p.tradedThisTurn && hasActionCard(p, 'TRADE') && (tradeEager || Math.random() < 0.55)) {
    p.tradedThisTurn = true
    const offer = aiPlanTrade(p)
    if (offer) return await proposeTrade(p, offer)
  }
  return false
}

async function aiActionTurn(p: Player): Promise<void> {
  await sleep(350)
  for (let i = 0; i < 12; i++) {
    if (state.over) return
    const did = await aiOneAction(p)
    if (!did) break
    await sleep(320)
  }
}

/* ---------------- human trade offer bridge ---------------- */

let offerResolve: ((accept: boolean) => void) | null = null
function askHumanOffer(from: Player, offer: TradeOffer): Promise<boolean> {
  return new Promise((res) => {
    offerResolve = res
    state.pendingOffer = { fromId: from.id, gives: offer.gives, gets: offer.gets }
  })
}
export function resolveOffer(accept: boolean): void {
  if (!offerResolve) return
  const r = offerResolve
  offerResolve = null
  state.pendingOffer = null
  r(accept)
}

/* ============================ HEADLESS SIM ============================ */

export async function simulateGameWithPersonalities(personalities: string[], maxTurns = 400) {
  setState(buildState())
  for (let i = 0; i < state.players.length && i < personalities.length; i++) {
    state.players[i].personality = personalities[i]
  }
  while (!state.over && state.turn < maxTurns) {
    await playTurn()
  }
  return {
    turns: state.turn,
    winner:
      state.over && state.over.winner
        ? {
            id: state.over.winner.id,
            name: state.over.winner.name,
            personality: state.over.winner.personality,
          }
        : null,
    reason: state.over ? state.over.reason : 'timeout',
  }
}

export { setSimMode }
