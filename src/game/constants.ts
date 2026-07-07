/* =====================================================================
   SEVEN PLANETS — game data tables and pure (state-independent) helpers.
   Ported from the original vanilla-JS game.js.
   ===================================================================== */

import type {
  ActionType,
  BuildingDef,
  BuildingType,
  CardDef,
  CardType,
  Cost,
  Hand,
  InfluenceCardDef,
  InfluenceType,
  PlanetStyle,
  PoolType,
  ResourceType,
} from './types';

export const RESOURCE_TYPES: ResourceType[] = [
  'ORE',
  'CRYSTAL',
  'ENERGY',
  'SPICE',
  'RELIC',
];
export const ACTION_TYPES: ActionType[] = [
  'RECRUIT',
  'ATTACK',
  'MOVE',
  'TRADE',
];
export const CARD_TYPES: CardType[] = [...RESOURCE_TYPES, ...ACTION_TYPES];

export const BUILDINGS_FROM_TURN = 6; // Turns 1-5 deal only resource cards; buildings join at 6
export const ACTION_CARDS_FROM_TURN = 10; // ⚔️ Attack, 🪖 Recruit & 🔁 Trade cards are dealt from turn 10
export const MOVE_CARDS_FROM_TURN = 20; // 🛸 Move cards join the action deck at turn 20
export const ADVANCED_FROM_TURN = 10; // The Research Lab card is dealt from turn 10
export const INFLUENCE_CARDS_FROM_TURN = 30;

export const CARDS: Record<string, CardDef> = {
  ORE: { name: 'Ore', icon: '⛏️', color: '#c98f5a', weight: 30, value: 1 },
  CRYSTAL: {
    name: 'Crystal',
    icon: '💎',
    color: '#7fd9ff',
    weight: 24,
    value: 1.3,
  },
  ENERGY: {
    name: 'Energy',
    icon: '⚡',
    color: '#ffe066',
    weight: 24,
    value: 1.3,
  },
  SPICE: {
    name: 'Spice',
    icon: '✨',
    color: '#ff9e3d',
    weight: 14,
    value: 2.2,
  },
  RELIC: { name: 'Relic', icon: '🔮', color: '#c77dff', weight: 5, value: 3 },
  // Action cards — performing an action spends the matching card.
  RECRUIT: {
    name: 'Recruit',
    icon: '🪖',
    color: '#8fb4e8',
    weight: 30,
    value: 1.2,
    action: true,
  },
  ATTACK: {
    name: 'Attack',
    icon: '⚔️',
    color: '#ff5470',
    weight: 10,
    value: 1.4,
    action: true,
  },
  MOVE: {
    name: 'Move',
    icon: '🛸',
    color: '#6da2ff',
    weight: 6,
    value: 0.9,
    action: true,
  },
  TRADE: {
    name: 'Trade',
    icon: '🔁',
    color: '#ffd23d',
    weight: 18,
    value: 1,
    action: true,
  },
};

// Every building has up to 3 LEVELS — picking its card again upgrades it.
export const BUILDINGS: Record<BuildingType, BuildingDef> = {
  MINE: {
    name: 'Ore Mine',
    icon: '⚒️',
    cost: { CRYSTAL: 1, ENERGY: 1 },
    desc: '+1 Ore per turn (max L2: +3)',
    income: 'ORE',
    cardWeight: 7,
    cardColor: '#7dff8a',
    short: '+1/+3⛏️',
  },
  EXTRACTOR: {
    name: 'Crystal Extractor',
    icon: '💠',
    cost: { ORE: 1, ENERGY: 1 },
    desc: '+1 Crystal per turn per level (max L2: +2)',
    income: 'CRYSTAL',
    cardWeight: 7,
    cardColor: '#7dff8a',
    short: '+1💎/lvl',
  },
  SOLAR: {
    name: 'Solar Array',
    icon: '🔆',
    cost: { ORE: 1, CRYSTAL: 1 },
    desc: '+1 Energy per turn per level (max L2: +2)',
    income: 'ENERGY',
    cardWeight: 7,
    cardColor: '#7dff8a',
    short: '+1⚡/lvl',
  },
  HARVESTER: {
    name: 'Spice Harvester',
    icon: '🏜️',
    cost: { ORE: 2, CRYSTAL: 1, ENERGY: 1 },
    desc: '+1 Spice per turn per level (max L2: +2)',
    income: 'SPICE',
    cardWeight: 5,
    cardColor: '#7dff8a',
    short: '+1✨/lvl',
  },
  BARRACKS: {
    name: 'Barracks',
    icon: '🎖️',
    cost: { ORE: 1, CRYSTAL: 1, ENERGY: 1 },
    desc: 'REQUIRED to recruit on this planet — yields 1/2/4 troops at L1/L2/L3, costing 1⛏️ per troop',
    cardWeight: 6,
    cardColor: '#ff9e3d',
    short: 'recruit 1/2/4',
  },
  SHIELD: {
    name: 'Shield Generator',
    icon: '🛡️',
    cost: { CRYSTAL: 3, ENERGY: 1 },
    desc: '+4 defense per level (L1: +4 · L2: +8 · L3: +12). Never destroyed by attacks',
    cardWeight: 5,
    cardColor: '#ff9e3d',
    short: '+4/+8/+12 def',
  },
  SILO: {
    name: 'Rocket Silo',
    icon: '🚀',
    cost: { ORE: 4, ENERGY: 2 },
    desc: 'REQUIRED to attack — rockets launch only from Silo planets. Doubles rocket capacity per level (L1: 6 · L2: 12 · L3: unlimited). Adds +2 strike per level',
    cardWeight: 4,
    cardColor: '#ff9e3d',
    short: 'attack · 6/12/∞',
  },
  SPACEPORT: {
    name: 'Spaceport',
    icon: '🛰️',
    cost: { ORE: 1, CRYSTAL: 1, ENERGY: 1 },
    desc: 'ENABLES the 🛸 Move card — troops cannot be redeployed without one. L2: +1 free 🛸 Move card every 3 turns',
    cardWeight: 5,
    cardColor: '#6da2ff',
    short: 'move hub',
  },
  EMBASSY: {
    name: 'Embassy',
    icon: '🤝',
    cost: { ORE: 1, CRYSTAL: 1, ENERGY: 1 },
    desc: 'ENABLES trading. L2: +1 ⭐ Influence every turn',
    cardWeight: 5,
    cardColor: '#ffd23d',
    short: 'trade hub',
  },
  LAB: {
    name: 'Research Lab',
    icon: '🔬',
    cost: { CRYSTAL: 3, ENERGY: 2, SPICE: 3 },
    desc: "Prerequisite for the 🌀 Singularity — a Singularity's level can never exceed the Lab's level on the same planet",
    cardWeight: 5,
    cardColor: '#c77dff',
    short: '🌀 prereq',
  },
  SINGULARITY: {
    name: 'Singularity',
    icon: '🌀',
    cost: { ORE: 4, CRYSTAL: 4, ENERGY: 4, SPICE: 4 },
    desc: 'Raises your TECHNOLOGY: one Singularity = tech 2, two Singularities (on two planets) = tech 3. Each level on any owned planet also grants +1 draft pick AND adds 1 extra random card to the pool each turn. Requires a Research Lab of at least the same level on the same planet (L4 needs a maxed Lab). A LEVEL-4 Singularity — buildable only on a FULLY BUILT planet (TECHNOLOGY 4) — additionally warps space for +8 planet defense. Does NOT win the game',
    cardWeight: 4,
    cardColor: '#3df0ff',
    short: 'tech↑ +pick/lvl',
  },
};

export const BUILD_ORDER: BuildingType[] = [
  'MINE',
  'EXTRACTOR',
  'SOLAR',
  'HARVESTER',
  'BARRACKS',
  'SHIELD',
  'SILO',
  'SPACEPORT',
  'EMBASSY',
  'LAB',
  'SINGULARITY',
];

// Max level per building (default 3). Income buildings, Spaceport and Embassy cap at level 2.
const BUILDING_MAX_LEVEL: Partial<Record<BuildingType, number>> = {
  MINE: 2,
  EXTRACTOR: 2,
  SOLAR: 2,
  HARVESTER: 2,
  SPACEPORT: 2,
  EMBASSY: 2,
  SINGULARITY: 4, // L4 is the apex, unlocked only by TECHNOLOGY 4 (a fully-built planet)
};
export function maxLevel(id: BuildingType): number {
  return BUILDING_MAX_LEVEL[id] || 3;
}

// Level N of a building costs N× its base cost.
export function buildingCost(id: BuildingType, level: number): Cost {
  const base = BUILDINGS[id].cost;
  if (level <= 1) {
    return base;
  }
  const c: Cost = {};
  for (const t in base) {
    c[t] = base[t] * level;
  }
  return c;
}

// Per-turn income of an income building at the given level (Ore Mine L2 yields 3).
export function incomeAmount(id: BuildingType, lvl: number): number {
  return id === 'MINE' && lvl >= 2 ? 3 : lvl;
}

// Building cards live in the pool alongside resources & actions.
for (const b of BUILD_ORDER) {
  CARDS[b] = {
    name: BUILDINGS[b].name,
    icon: BUILDINGS[b].icon,
    color: BUILDINGS[b].cardColor,
    weight: BUILDINGS[b].cardWeight,
    value: 0,
    building: true,
  };
}

// INFLUENCE CARDS — dealt into the pool from turn 30.
export const INFLUENCE_CARDS: Record<InfluenceType, InfluenceCardDef> = {
  SKIP_ARMY: {
    name: 'Sabotage',
    icon: '🕵️',
    cost: 3,
    desc: 'The rival with the LARGEST army skips their next turn',
  },
  SKIP_PLANETS: {
    name: 'Uprising',
    icon: '🔥',
    cost: 3,
    desc: 'The rival with the MOST planets skips their next turn',
  },
  SKIP_INFLUENCE: {
    name: 'Smear Campaign',
    icon: '📰',
    cost: 2,
    desc: 'The rival with the LEAST influence skips their next turn',
  },
  SKIP_TECH: {
    name: 'Espionage',
    icon: '🧪',
    cost: 3,
    desc: 'The rival with the HIGHEST technology skips their next turn',
  },
  STEAL_ACTION: {
    name: 'Extortion',
    icon: '🎭',
    cost: 2,
    desc: 'Take one action card of your choice from a chosen rival (influence cards cannot be taken)',
  },
  COUP: {
    name: "Coup d'État",
    icon: '👑',
    cost: 25,
    desc: "Instantly take control of a chosen enemy planet — half its garrison disbands, the rest defects to you. A rival's LAST planet is coup-proof (you cannot eliminate a player by coup) — UNLESS you are a Pacifist, whose only road to conquest this is. Cannot target a planet under truce",
  },
  PEACE: {
    name: 'Peace Treaty',
    icon: '🕊️',
    cost: 4,
    desc: 'All your planets are under truce for 1 turn',
  },
};
export const INFLUENCE_TYPES = Object.keys(INFLUENCE_CARDS) as InfluenceType[];
for (const k of INFLUENCE_TYPES) {
  CARDS[k] = {
    name: INFLUENCE_CARDS[k].name,
    icon: INFLUENCE_CARDS[k].icon,
    color: '#ffb0d8',
    weight: 1,
    value: 0,
    influenceCard: true,
  };
}
export const POOL_TYPES: PoolType[] = [
  ...CARD_TYPES,
  ...BUILD_ORDER,
  ...INFLUENCE_TYPES,
];

export const BASE_ROCKET_CAP = 3; // Each Silo LEVEL doubles it: 3 → 6 → 12 → 24
export const SILO_HIT_BONUS = 2; // ...and adds +2 strike per level
export const SHIELD_DEFENSE = 4; // Per shield level (L1:+4, L2:+8, L3:+12)
export const HOME_FIELD = 1; // Flat defense bonus for defenders
export const SINGULARITY_DEF_BONUS = 8; // A level-4 Singularity warps local space: +8 planet defense

// COMBAT MATH — the single source of truth for battle resolution, shared by
// The engine (doAttack) and every AI that predicts battle outcomes (./ai).
// Change these numbers and both the game AND the AI's risk calculations
// Follow automatically. Casualty fractions are exact integer num/den pairs.
export const COMBAT = {
  attackPerTroop: 2, // Strike power contributed by each attacking troop
  defensePerTroop: 2, // Defense contributed by each defending troop
  attackRoll: 4, // Attacker adds randInt(0, attackRoll) to the strike (more swing)
  defenseRoll: 4, // Defender adds randInt(0, defenseRoll) to the defense (more swing)
  winDefLoss: { num: 1, den: 2 }, // Win: defenders lose ceil(n/2) — conquest iff this wipes the garrison
  winAttLoss: { num: 1, den: 3 }, // Win: attackers lose floor(n/3)
  loseAttLoss: { num: 3, den: 4 }, // Loss: attackers lose ceil(3n/4)
  loseDefLoss: { num: 1, den: 4 }, // Loss: defenders lose floor(n/4)
} as const;
export const CONQUEST_TRUCE = 3; // A freshly conquered planet cannot be attacked for this many turns
export const PEACE_TRUCE = 1; // Peace Treaty card: planets are under truce for this many turns
export const SKIP_TURNS = 1; // ⏭️ skip influence cards (Sabotage/Uprising/…) paralyse a rival for this many turns

// PACIFIST STATUS — a player who launches no attack for this many turns turns
// Permanently pacifist: they can never attack again, but each of their planets
// Gains a flat defense bonus and produces extra influence every turn.
export const PACIFIST_TURNS = 50;
export const PACIFIST_DEF_BONUS = 4; // Added to every pacifist planet's defense
export const PACIFIST_INFLUENCE = 2; // Extra ⭐ per pacifist planet every turn

export const PLANET_STYLES: PlanetStyle[] = [
  { light: '#4fd8c0', dark: '#0e4f63', feature: 'continents' }, //  0 Terra Prime (human)
  { light: '#f0c070', dark: '#8a4416', feature: 'desert' }, //  1 arid desert world
  { light: '#c9d6e8', dark: '#43485e', feature: 'city' }, //  2 machine city world
  { light: '#8fe08a', dark: '#1e5c33', feature: 'moon' }, //  3 lush moon world
  { light: '#d8f0ff', dark: '#3a6d94', feature: 'ice' }, //  4 frozen world
  { light: '#ffd76e', dark: '#a33f14', feature: 'rings' }, //  5 ringed gas giant
  { light: '#9a7fd0', dark: '#2a1e4d', feature: 'storm' }, //  6 storm world
  { light: '#ff8060', dark: '#6a1a05', feature: 'lava' }, //  7 volcanic world
  { light: '#60d890', dark: '#105030', feature: 'forest' }, //  8 dense jungle world
  { light: '#c0e070', dark: '#304010', feature: 'toxic' }, //  9 toxic swamp world
  { light: '#a0c8ff', dark: '#102060', feature: 'crystal' }, // 10 crystal spire world
  { light: '#f0d090', dark: '#604010', feature: 'bands' }, // 11 sand-band desert
  { light: '#c0c8f8', dark: '#1a1a40', feature: 'void' }, // 12 void / dark matter
  { light: '#30c0d8', dark: '#0a3048', feature: 'ocean' }, // 13 endless ocean world
  { light: '#ffb0d8', dark: '#503060', feature: 'nebula' }, // 14 nebula heart world
  { light: '#b8ff70', dark: '#204010', feature: 'radiation' }, // 15 irradiated world
];

// Full roster of possible AI opponents. Six are drawn at random each game.
// Independent pools: each game randomizes a commander's name, homeworld and
// Color separately (see buildState) — none is tied to any fixed character.
export const AI_NAMES = [
  'Baron Harkan',
  'Feyd Rakeen',
  'Stilgarn',
  'Muad Davar',
  'Jabba Xorn',
  'Grand Moff Sullar',
  'Admiral Thrynn',
  'Darth Nexar',
  'Archon Tessala',
  'Queen Jadis',
  'High King Mirak',
  'Lady Tilda',
  'Aslanis Prime',
  'Queen Zenobii',
  'Overmind-7',
  'Warden Elia',
  'Xeno Praxis',
  'Reverend Mohaim',
  'Duke Atreon',
  'Count Fenring',
  'Emperor Shaddan',
  'Vizier Kthara',
  'Warlord Zorak',
  'Praetor Vandal',
  'Seneschal Vor',
  'Matriarch Sabla',
  'Inquisitor Rael',
  'Chancellor Mott',
  'Oracle Sygne',
  'Regent Calyx',
  'Marshal Dren',
];

export const AI_PLANET_NAMES = [
  'Giedi Secundus',
  'Dunemark',
  'Sietch Tau',
  'Arrakesh Prime',
  'Nar Shaddaa',
  'Mechanon',
  'Umbra Station',
  'Infernus',
  'Coruscantis',
  'Wintermere',
  'Narynthia',
  'Cair Parvel',
  'Ember Glade',
  'Veridia',
  'Kryos',
  'Aegis Prime',
  'Void Nexus',
  'Caladar',
  'Salusa Ridge',
  'Ix Prime',
  'Kaitain',
  'Geonos',
  'Hoth Reach',
  'Endoria',
  'Tarsis Major',
  'Lorwyn',
  'Aethon',
  'Pyrrhia',
  'Zephyra',
  'Obsidia',
  'Halcyon',
];

export const AI_COLORS = [
  '#ff9e3d',
  '#e8a030',
  '#c87030',
  '#d4c060',
  '#e0c050',
  '#ff5470',
  '#b07fff',
  '#c04060',
  '#80b0ff',
  '#c0e8ff',
  '#50d0a0',
  '#f0b0d0',
  '#f0d060',
  '#7dff8a',
  '#6da2ff',
  '#80c0ff',
  '#9070f0',
  '#ff6b9d',
  '#ffb347',
  '#b5e853',
  '#5ad1c8',
  '#a06cd5',
  '#ff8c66',
  '#66d9ff',
  '#d94f70',
  '#8fd14f',
  '#b388eb',
  '#ffcf5c',
  '#4fb0c6',
  '#e07a5f',
  '#f25f5c',
];

export const PERSONALITY_TAG: Record<string, string> = {
  aggressor: 'WARLORD',
  builder: 'ARCHITECT',
  hoarder: 'MERCHANT',
  balanced: 'TACTICIAN',
  human: 'COMMANDER',
  rusher: 'SEEKER',
  militarist: 'CONQUEROR',
  economist: 'MAGNATE',
  fortifier: 'SENTINEL',
  expansionist: 'IMPERIALIST',
  random: 'CHAOTIC',
  trader: 'BROKER',
  opportunist: 'SCHEMER',
  blitzer: 'BLITZ',
  pacifist: 'PACIFIST',
  mastermind: 'MASTERMIND',
};

// Build/upgrade priorities per personality.
export const PRIORITIES: Record<string, BuildingType[]> = {
  aggressor: [
    'BARRACKS',
    'MINE',
    'SOLAR',
    'SILO',
    'EXTRACTOR',
    'LAB',
    'SHIELD',
    'HARVESTER',
    'SINGULARITY',
    'SPACEPORT',
    'EMBASSY',
  ],
  builder: [
    'MINE',
    'EXTRACTOR',
    'SOLAR',
    'LAB',
    'BARRACKS',
    'HARVESTER',
    'EMBASSY',
    'SINGULARITY',
    'SHIELD',
    'SPACEPORT',
    'SILO',
  ],
  hoarder: [
    'EXTRACTOR',
    'MINE',
    'SOLAR',
    'EMBASSY',
    'SHIELD',
    'LAB',
    'BARRACKS',
    'HARVESTER',
    'SINGULARITY',
    'SPACEPORT',
    'SILO',
  ],
  balanced: [
    'MINE',
    'EXTRACTOR',
    'BARRACKS',
    'SOLAR',
    'SILO',
    'SHIELD',
    'LAB',
    'HARVESTER',
    'SINGULARITY',
    'EMBASSY',
    'SPACEPORT',
  ],
  // ── simulation-only strategies ──
  rusher: [
    'LAB',
    'SINGULARITY',
    'MINE',
    'EXTRACTOR',
    'SOLAR',
    'BARRACKS',
    'HARVESTER',
    'SHIELD',
    'EMBASSY',
    'SPACEPORT',
    'SILO',
  ],
  militarist: [
    'BARRACKS',
    'SILO',
    'MINE',
    'SOLAR',
    'LAB',
    'SHIELD',
    'EXTRACTOR',
    'HARVESTER',
    'SINGULARITY',
    'SPACEPORT',
    'EMBASSY',
  ],
  economist: [
    'MINE',
    'EXTRACTOR',
    'SOLAR',
    'HARVESTER',
    'LAB',
    'EMBASSY',
    'BARRACKS',
    'SINGULARITY',
    'SHIELD',
    'SPACEPORT',
    'SILO',
  ],
  fortifier: [
    'SHIELD',
    'MINE',
    'SOLAR',
    'EXTRACTOR',
    'LAB',
    'BARRACKS',
    'HARVESTER',
    'EMBASSY',
    'SINGULARITY',
    'SPACEPORT',
    'SILO',
  ],
  expansionist: [
    'BARRACKS',
    'MINE',
    'SILO',
    'SOLAR',
    'EXTRACTOR',
    'LAB',
    'SPACEPORT',
    'HARVESTER',
    'SINGULARITY',
    'EMBASSY',
    'SHIELD',
  ],
  random: [
    'MINE',
    'EXTRACTOR',
    'SOLAR',
    'HARVESTER',
    'SHIELD',
    'BARRACKS',
    'SILO',
    'SPACEPORT',
    'EMBASSY',
    'LAB',
    'SINGULARITY',
  ],
  trader: [
    'EMBASSY',
    'MINE',
    'EXTRACTOR',
    'SOLAR',
    'LAB',
    'HARVESTER',
    'BARRACKS',
    'SINGULARITY',
    'SPACEPORT',
    'SHIELD',
    'SILO',
  ],
  opportunist: [
    'MINE',
    'EXTRACTOR',
    'BARRACKS',
    'SOLAR',
    'SILO',
    'SHIELD',
    'LAB',
    'HARVESTER',
    'SINGULARITY',
    'EMBASSY',
    'SPACEPORT',
  ],
  blitzer: [
    'BARRACKS',
    'SILO',
    'MINE',
    'SOLAR',
    'EXTRACTOR',
    'SHIELD',
    'LAB',
    'HARVESTER',
    'SINGULARITY',
    'SPACEPORT',
    'EMBASSY',
  ],
  // Pacifist: front-load income + defense (like an economist/hoarder) — Shield
  // And Barracks come early so it can recruit DEFENDERS (recruiting isn't
  // Attacking), and the Embassy fuels the influence it banks for Coups. It never
  // Builds a Silo: its whole plan is to survive and win by Coup (aiPickInfluencePlay).
  pacifist: [
    'MINE',
    'EXTRACTOR',
    'SOLAR',
    'SHIELD',
    'EMBASSY',
    'BARRACKS',
    'HARVESTER',
    'LAB',
    'SINGULARITY',
    'SPACEPORT',
    'SILO',
  ],
  // Mastermind: this static list is only a FALLBACK — the advanced AI (./ai)
  // Plans its builds dynamically by expected return-on-investment every turn.
  mastermind: [
    'MINE',
    'EXTRACTOR',
    'SOLAR',
    'BARRACKS',
    'SILO',
    'LAB',
    'SHIELD',
    'HARVESTER',
    'SINGULARITY',
    'EMBASSY',
    'SPACEPORT',
  ],
};

// The full pool of AI personalities (every key in PRIORITIES).
export const AI_PERSONALITIES = Object.keys(PRIORITIES);

/* =====================================================================
   AI LINEUP — the personalities of the 6 AI opponents in the human game.

   Edit this ONE array to change who you play against. It must have exactly
   6 entries (one per AI seat). Each entry is either:
     · a personality name from PRIORITIES  → that exact personality, or
     · the literal 'RANDOM'                → a random NON-mastermind pick.

   The order does not matter — the seats are shuffled each game.

   Examples:
     6 masterminds (current):     Array(6).fill('mastermind')
     3 masterminds + 3 random:    ['mastermind','mastermind','mastermind','RANDOM','RANDOM','RANDOM']
     all random:                  Array(6).fill('RANDOM')
     a hand-picked rogues' gallery: ['militarist','blitzer','hoarder','trader','fortifier','rusher']
   ===================================================================== */
export const RANDOM_SEAT = 'RANDOM' as const;
export const AI_LINEUP: string[] = Array(6).fill('mastermind');

export const TAUNTS: Record<string, string[]> = {
  aggressor: [
    '"Your planet will burn!"',
    '"Weakness invites the blade."',
    '"The spice throne will be mine!"',
  ],
  builder: [
    '"Progress demands sacrifice."',
    '"You stand in the way of science."',
  ],
  hoarder: [
    '"Nothing personal. Just business."',
    '"Your assets are... undervalued."',
  ],
  balanced: ['"A necessary maneuver."', '"The calculus favors me."'],
  militarist: [
    '"Resistance is futile."',
    '"Overwhelming force is my language."',
    '"Conquest is efficiency."',
  ],
  fortifier: [
    '"You cannot breach these walls."',
    '"My shields will outlast your patience."',
  ],
  rusher: [
    '"Speed is the only constant."',
    '"The stars fall before my ambition."',
  ],
  expansionist: [
    '"Every planet I take multiplies my power."',
    '"Your borders are an invitation."',
  ],
  trader: ['"Everything has its price."', '"I will simply buy your defeat."'],
  pacifist: ['"War is waste."', '"I will outlast you all."'],
  opportunist: [
    '"The strong fall first — count on it."',
    '"I strike when others look away."',
  ],
  blitzer: [
    '"Strike fast. Leave nothing standing."',
    '"Hesitation is defeat."',
  ],
  economist: [
    '"My treasury will outlast your armies."',
    '"Wealth is the only true power."',
  ],
  mastermind: [
    '"Every outcome was computed before you moved."',
    '"You lost this war five turns ago."',
    '"Probability favors the prepared."',
  ],
};

/* ---------------- pure numeric / formatting helpers ---------------- */

export function randInt(a: number, b: number): number {
  return a + Math.floor(Math.random() * (b - a + 1));
}
export function choice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Fisher-Yates shuffle — returns a NEW array, does not mutate input.
export function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function handValue(map: Hand | Cost): number {
  return CARD_TYPES.reduce((s, t) => s + (map[t] || 0) * CARDS[t].value, 0);
}

// Relics are wildcards: they can stand in for any missing resource.
export function canAfford(hand: Hand, cost: Cost): boolean {
  let shortfall = 0;
  for (const t in cost) {
    const miss = cost[t] - (hand[t] || 0);
    if (miss > 0) {
      shortfall += miss;
    }
  }
  return shortfall <= (hand.RELIC || 0) - (cost.RELIC || 0);
}

export function costLabel(cost: Cost): string {
  return Object.keys(cost)
    .map((t) => `${cost[t]}${CARDS[t].icon}`)
    .join(' ');
}

export function fmtCards(map: Hand | Cost): string {
  const parts = CARD_TYPES.filter((t) => (map[t] || 0) > 0).map(
    (t) => `${map[t]}${CARDS[t].icon}`,
  );
  return parts.length > 0 ? parts.join(' ') : 'nothing';
}
