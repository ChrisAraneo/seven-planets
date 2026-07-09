// AiDifficulty interface — defined here to break the circular dep between
// Ai-state.ts and set-ai-difficulty.ts.
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
