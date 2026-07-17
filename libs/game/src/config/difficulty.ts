/* =====================================================================
   SEVEN PLANETS — difficulty levels.

   The human picks one of these at the start of every game. Each level carries
   an `ai` handicap block that is applied to EVERY mastermind AI at game start
   (see store.chooseDifficulty → engine.setAiDifficulty). Edit the numbers here
   to retune a level — nothing else needs to change.

   Normal is the baseline (no handicap). Easy weakens the AI; Hard is reserved
   for future buffs (currently identical to Normal).
   ===================================================================== */

export type Difficulty = 'casual' | 'easy' | 'normal' | 'hard' | 'impossible';

/** Per-difficulty handicaps applied to the mastermind AI (see ai.setAiDifficulty). */
export interface AiHandicap {
  /** Chance [0..1] a mastermind drafts a RANDOM pickable card instead of its best. */
  randomPickChance: number;
  /** Multiplies the AI's conquer-probability threshold (lower ⇒ attacks more recklessly). */
  minConquerProbMult: number;
  /** Added to the AI's strategy look-ahead window in turns (negative ⇒ shorter sight). */
  planHorizonDelta: number;
  /** Multiplies the AI's hate-draft weight (lower ⇒ rarely denies rivals the cards they need). */
  denialWeightMult: number;
}

export interface DifficultyDef {
  id: Difficulty;
  name: string;
  icon: string;
  blurb: string;
  ai: AiHandicap;
  /**
   * How many AI are flagged KAMIKAZE at game start (Hard = 2). A kamikaze hunts
   * only the human; every other AI ignores it entirely (see engine.assignKamikazes).
   */
  kamikazeCount: number;
}

// Normal = the untouched baseline the AI was tuned at.
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
      // 80% of AI draft picks are random
      randomPickChance: 0.8,
      // AI attacks only at very high odds
      minConquerProbMult: 1.25,
      // AI barely plans ahead
      planHorizonDelta: -4,
      // Effectively never hate-drafts the cards you need
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
      // 60% of AI draft picks are random
      randomPickChance: 0.6,
      // AI attacks at lower odds
      minConquerProbMult: 0.82,
      // AI plans three turns less far ahead
      planHorizonDelta: -3,
      // Rarely hate-drafts the cards rivals need
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
      // 20% of AI draft picks are random
      randomPickChance: 0.2,
      // AI attacks at lower odds
      minConquerProbMult: 0.875,
      // AI plans one turn less far ahead
      planHorizonDelta: -2,
      // Rarely hate-drafts the cards rivals need
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
    // One AI hunt only the human; every other AI ignores them
    kamikazeCount: 0,
  },
  {
    id: 'impossible',
    name: 'Impossible',
    icon: '🖤',
    blurb: 'There is no hope.',
    ai: NO_HANDICAP,
    // Three AI hunt only the human; every other AI ignores them
    kamikazeCount: 1,
  },
];

export const DEFAULT_DIFFICULTY: Difficulty = 'normal';

/** Look up a difficulty by id (falls back to the default). */
export function getDifficulty(id: Difficulty): DifficultyDef {
  return (
    DIFFICULTIES.find((difficultyDef) => difficultyDef.id === id) ??
    DIFFICULTIES.find(
      (difficultyDef) => difficultyDef.id === DEFAULT_DIFFICULTY,
    ) ??
    DIFFICULTIES[0]
  );
}
