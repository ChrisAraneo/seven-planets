import { assign, fromPairs, mapValues } from 'lodash-es';
import { match } from 'ts-pattern';

import type { ActionType } from '../interfaces/action-type';
import type { BuildingDefinition } from '../interfaces/building-definition';
import type { BuildingType } from '../interfaces/building-type';
import type { CardDefinition } from '../interfaces/card-definition';
import type { CardType } from '../interfaces/card-type';
import type { Cost } from '../interfaces/cost';
import type { Hand } from '../interfaces/hand';
import type { InfluenceCardDefinition } from '../interfaces/influence-card-definition';
import type { InfluenceType } from '../interfaces/influence-type';
import type { PlanetStyle } from '../interfaces/planet-style';
import type { PoolType } from '../interfaces/pool-type';
import type { ResourceType } from '../interfaces/resource-type';
import { chain } from '../utils/chain';

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

export const BUILDINGS_FROM_TURN = 6;
export const ACTION_CARDS_FROM_TURN = 10;
export const MOVE_CARDS_FROM_TURN = 20;
export const ADVANCED_FROM_TURN = 10;
export const INFLUENCE_CARDS_FROM_TURN = 30;

export const CARDS: Record<string, CardDefinition> = {
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
  RECRUIT: {
    name: 'Recruit',
    icon: '🪖',
    color: '#8fb4e8',
    weight: 30,
    value: 1.2,
    isAction: true,
  },
  ATTACK: {
    name: 'Attack',
    icon: '⚔️',
    color: '#ff5470',
    weight: 10,
    value: 1.4,
    isAction: true,
  },
  MOVE: {
    name: 'Move',
    icon: '🛸',
    color: '#6da2ff',
    weight: 6,
    value: 0.9,
    isAction: true,
  },
  TRADE: {
    name: 'Trade',
    icon: '🔁',
    color: '#ffd23d',
    weight: 18,
    value: 1,
    isAction: true,
  },
};

export const BUILDINGS: Record<BuildingType, BuildingDefinition> = {
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
    desc: 'REQUIRED to recruit on this planet — yields 1/2/4 troops at L1/L2/L3, costing 1⛏️ per troop (short on ⛏️? you recruit as many as you can pay for)',
    cardWeight: 6,
    cardColor: '#ff9e3d',
    short: 'recruit 1/2/4',
  },
  SHIELD: {
    name: 'Shield Generator',
    icon: '🛡️',
    cost: { CRYSTAL: 3, ENERGY: 1 },
    desc: '+4/+8/+16 defense at L1/L2/L3. The L3 shield drains 2💎 upkeep every turn — unpaid, it projects only +8 that turn. Never destroyed by attacks',
    cardWeight: 5,
    cardColor: '#ff9e3d',
    short: '+4/+8/+16 def',
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
    desc: 'ENABLES the 🛸 Move card — troops can only be redeployed FROM a planet that has one. L2: +1 free 🛸 Move card every 3 turns',
    cardWeight: 5,
    cardColor: '#6da2ff',
    short: 'move hub',
  },
  EMBASSY: {
    name: 'Embassy',
    icon: '🤝',
    cost: { ORE: 1, CRYSTAL: 1, ENERGY: 1 },
    desc: 'ENABLES trading. Requires a 🛰️ Spaceport already built on the same planet. L2: +1 ⭐ Influence every turn',
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

const BUILDING_MAX_LEVEL: Partial<Record<BuildingType, number>> = {
  MINE: 2,
  EXTRACTOR: 2,
  SOLAR: 2,
  HARVESTER: 2,
  SPACEPORT: 2,
  EMBASSY: 2,
  SINGULARITY: 4,
};
export function getMaxLevel(id: BuildingType): number {
  return BUILDING_MAX_LEVEL[id] || 3;
}

export function computeBuildingCost(id: BuildingType, level: number): Cost {
  return match(level)
    .when(
      () => level <= 1,
      () => BUILDINGS[id].cost,
    )
    .otherwise(() => mapValues(BUILDINGS[id].cost, (amount) => amount * level));
}

export function computeIncomeAmount(id: BuildingType, lvl: number): number {
  return match({ id, lvl })
    .when(
      (candidate) => candidate.id === 'MINE' && candidate.lvl >= 2,
      (): number => 3,
    )
    .otherwise((candidate) => candidate.lvl);
}

assign(
  CARDS,
  fromPairs(
    BUILD_ORDER.map((buildingType) => [
      buildingType,
      {
        name: BUILDINGS[buildingType].name,
        icon: BUILDINGS[buildingType].icon,
        color: BUILDINGS[buildingType].cardColor,
        weight: BUILDINGS[buildingType].cardWeight,
        value: 0,
        isBuilding: true,
      },
    ]),
  ),
);

export const INFLUENCE_CARDS: Record<InfluenceType, InfluenceCardDefinition> = {
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
export const INFLUENCE_TYPES: InfluenceType[] = [
  'SKIP_ARMY',
  'SKIP_PLANETS',
  'SKIP_INFLUENCE',
  'SKIP_TECH',
  'STEAL_ACTION',
  'COUP',
  'PEACE',
];
assign(
  CARDS,
  fromPairs(
    INFLUENCE_TYPES.map((influenceType) => [
      influenceType,
      {
        name: INFLUENCE_CARDS[influenceType].name,
        icon: INFLUENCE_CARDS[influenceType].icon,
        color: '#ffb0d8',
        weight: 1,
        value: 0,
        isInfluenceCard: true,
      },
    ]),
  ),
);
export const POOL_TYPES: PoolType[] = [
  ...CARD_TYPES,
  ...BUILD_ORDER,
  ...INFLUENCE_TYPES,
];

export const BASE_ROCKET_CAP = 3;
export const SILO_HIT_BONUS = 2;
export const SHIELD_DEFENSE = [0, 4, 8, 16] as const;
export const SHIELD_UPKEEP_LEVEL = 3;
export const SHIELD_UPKEEP_CRYSTAL = 2;
export const SHIELD_UNPOWERED_DEFENSE = 8;
export const HOME_FIELD = 2;
export const SINGULARITY_DEF_BONUS = 8;

export const COMBAT = {
  attackPerTroop: 2,
  defensePerTroop: 2,
  attackRoll: 4,
  defenseRoll: 4,
  winDefLoss: { num: 1, den: 2 },
  winAttLoss: { num: 1, den: 3 },
  loseAttLoss: { num: 3, den: 4 },
  loseDefLoss: { num: 1, den: 4 },
} as const;
export const CONQUEST_TRUCE = 3;
export const PEACE_TRUCE = 1;
export const SKIP_TURNS = 1;

export const PACIFIST_TURNS = 50;
export const PACIFIST_DEF_BONUS = 4;
export const PACIFIST_INFLUENCE = 2;

export const PLANET_STYLES: PlanetStyle[] = [
  { light: '#4fd8c0', dark: '#0e4f63', feature: 'continents' },
  { light: '#f0c070', dark: '#8a4416', feature: 'desert' },
  { light: '#c9d6e8', dark: '#43485e', feature: 'city' },
  { light: '#8fe08a', dark: '#1e5c33', feature: 'moon' },
  { light: '#d8f0ff', dark: '#3a6d94', feature: 'ice' },
  { light: '#ffd76e', dark: '#a33f14', feature: 'rings' },
  { light: '#9a7fd0', dark: '#2a1e4d', feature: 'storm' },
  { light: '#ff8060', dark: '#6a1a05', feature: 'lava' },
  { light: '#60d890', dark: '#105030', feature: 'forest' },
  { light: '#c0e070', dark: '#304010', feature: 'toxic' },
  { light: '#a0c8ff', dark: '#102060', feature: 'crystal' },
  { light: '#f0d090', dark: '#604010', feature: 'bands' },
  { light: '#c0c8f8', dark: '#1a1a40', feature: 'void' },
  { light: '#30c0d8', dark: '#0a3048', feature: 'ocean' },
  { light: '#ffb0d8', dark: '#503060', feature: 'nebula' },
  { light: '#b8ff70', dark: '#204010', feature: 'radiation' },
];

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

export const PRIORITIES: BuildingType[] = [
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
];

export const TAUNTS: string[] = [
  '"Every outcome was computed before you moved."',
  '"You lost this war five turns ago."',
  '"Probability favors the prepared."',
];

export function randomInt(minimum: number, maximum: number): number {
  return minimum + Math.floor(Math.random() * (maximum - minimum + 1));
}
export function choice<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function shuffleArray<T>(items: T[]): T[] {
  return chain(items.map((item) => ({ item, key: Math.random() })))
    .sortBy(({ key }) => key)
    .map(({ item }) => item)
    .value();
}

export function computeHandValue(map: Hand | Cost): number {
  return CARD_TYPES.reduce(
    (sum, cardType) => sum + (map[cardType] || 0) * CARDS[cardType].value,
    0,
  );
}

export function canAfford(hand: Hand, cost: Cost): boolean {
  return (
    Object.entries(cost).reduce(
      (shortfall, [type, amount]) =>
        shortfall + Math.max(0, amount - (hand[type] || 0)),
      0,
    ) <=
    (hand.RELIC || 0) - (cost.RELIC || 0)
  );
}

export function getCostLabel(cost: Cost): string {
  return Object.keys(cost)
    .map((type) => `${cost[type]}${CARDS[type].icon}`)
    .join(' ');
}

export function formatCards(cards: Hand | Cost): string {
  return match(
    CARD_TYPES.filter((cardType) => (cards[cardType] || 0) > 0).map(
      (cardType) => `${cards[cardType]}${CARDS[cardType].icon}`,
    ),
  )
    .when(
      (parts) => parts.length > 0,
      (parts) => parts.join(' '),
    )
    .otherwise(() => 'nothing');
}
