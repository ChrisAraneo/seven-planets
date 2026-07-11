// One star (⭐) is worth roughly this many card-value units.
export const STAR_VALUE = 0.8;

// How much a kamikaze lowers its own attack thresholds. Kamikazes exist only
// to hurt the human, so they accept conquest odds far below what any sane AI
// would take.
export const KAMIKAZE_RISK = 0.4;

// Floor for a kamikaze's effective minimum conquest probability — it will
// launch near-hopeless strikes rather than sit idle when its chances are low.
export const KAMIKAZE_MIN_CONQUER_FLOOR = 0.05;
