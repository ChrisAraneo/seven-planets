export type Difficulty = 'casual' | 'easy' | 'normal' | 'hard' | 'impossible';

export interface AiHandicap {
  randomPickChance: number;
  minConquerProbMult: number;
  planHorizonDelta: number;
  denialWeightMult: number;
}

export interface DifficultyDef {
  id: Difficulty;
  name: string;
  icon: string;
  blurb: string;
  ai: AiHandicap;
  kamikazeCount: number;
}

const NO_HANDICAP: AiHandicap = {
  randomPickChance: 0,
  minConquerProbMult: 1,
  planHorizonDelta: 0,
  denialWeightMult: 1,
};

export const DIFFICULTIES: DifficultyDef[] = [
  {
    id: 'casual',
    name: 'Peaceful',
    icon: '🧸',
    blurb: 'No pressure.',
    ai: {
      ...NO_HANDICAP,
      randomPickChance: 0.8,
      minConquerProbMult: 1.25,
      planHorizonDelta: -4,
      denialWeightMult: 0.05,
    },
    kamikazeCount: 0,
  },
  {
    id: 'easy',
    name: 'Easy',
    icon: '🌱',
    blurb: 'Best for new players.',
    ai: {
      ...NO_HANDICAP,
      randomPickChance: 0.6,
      minConquerProbMult: 0.82,
      planHorizonDelta: -3,
      denialWeightMult: 0.35,
    },
    kamikazeCount: 0,
  },
  {
    id: 'normal',
    name: 'Normal',
    icon: '⚔️',
    blurb: 'The standard challenge.',
    ai: {
      ...NO_HANDICAP,
      randomPickChance: 0.2,
      minConquerProbMult: 0.875,
      planHorizonDelta: -2,
      denialWeightMult: 0.5,
    },
    kamikazeCount: 0,
  },
  {
    id: 'hard',
    name: 'Hard',
    icon: '🔥',
    blurb: 'Good luck commander!',
    ai: NO_HANDICAP,
    kamikazeCount: 0,
  },
  {
    id: 'impossible',
    name: 'Impossible',
    icon: '🖤',
    blurb: 'There is no hope.',
    ai: NO_HANDICAP,
    kamikazeCount: 1,
  },
];

export const DEFAULT_DIFFICULTY: Difficulty = 'normal';

export const getDifficulty = (id: Difficulty): DifficultyDef =>
  DIFFICULTIES.find((difficultyDef) => difficultyDef.id === id) ??
  DIFFICULTIES.find(
    (difficultyDef) => difficultyDef.id === DEFAULT_DIFFICULTY,
  ) ??
  DIFFICULTIES[0];
