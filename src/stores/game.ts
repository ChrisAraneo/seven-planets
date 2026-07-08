import { defineStore, storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';

import { setAiDifficulty } from '@/game/ai/functions/set-ai-difficulty';
import {
  DEFAULT_DIFFICULTY,
  type Difficulty,
  getDifficulty,
} from '@/game/difficulty';
import { aiEvaluateTrade } from '@/game/engine/functions/ai-evaluate-trade';
import { assignKamikazes } from '@/game/engine/functions/assign-kamikazes';
import { AUTO_HUMAN } from '@/game/engine/functions/auto-human';
import { doAttack } from '@/game/engine/functions/do-attack';
import { endHumanTurn } from '@/game/engine/functions/end-human-turn';
import { execTrade } from '@/game/engine/functions/exec-trade';
import { humanPoolClick } from '@/game/engine/functions/human-pool-click';
import { moveTroops } from '@/game/engine/functions/move-troops';
import { recruit as engineRecruit } from '@/game/engine/functions/recruit';
import { resolveOffer as engineResolveOffer } from '@/game/engine/functions/resolve-offer';
import { runGame } from '@/game/engine/functions/run-game';
import { setBusy } from '@/game/engine/functions/set-busy';
import { useInfluenceCard } from '@/game/engine/functions/use-influence-card';
import type { Cost, InfluenceOpts, InfluenceType } from '@/game/types';

import { useEffectsStore } from './effects';
import { useGameStateStore } from './game-state';
import { useUnlocksStore } from './unlocks';

export type ModalName =
  | 'help'
  | 'attack'
  | 'recruit'
  | 'move'
  | 'trade'
  | 'influence'
  | null;

/* UI-facing orchestration store: composes the game-state, effects and
   unlocks stores and exposes the human's interactions to components.
   The engine/AI functions it calls read the game state from the
   game-state store themselves. */
export const useGameStore = defineStore('game', () => {
  const gameState = useGameStateStore();
  const effects = useEffectsStore();
  const unlocks = useUnlocksStore();

  // The single reactive game state, owned by the game-state store. New Game /
  // Play Again reload the page (matching the original), so it is never
  // Rebuilt during the app's lifetime.
  const { state } = storeToRefs(gameState);

  const modal = ref<ModalName>(null);
  const started = ref(false);
  const fastMode = computed(() => effects.fastMode);
  // The human's chosen difficulty. Null until picked — the game loop waits for
  // The choice (see start / chooseDifficulty). All levels currently behave
  // Identically; the selection is threaded through for future tuning.
  const difficulty = ref<Difficulty | null>(null);

  const human = computed(() => state.value.players[0]);
  const isHumanTurn = computed(
    () => state.value.awaitingAction && !state.value.busy && !state.value.over,
  );
  const isPicking = computed(
    () => state.value.awaitingPick && !state.value.over,
  );

  // When the human wins, unlock the next difficulty rung and persist it. Fires
  // Once per game (state.over is set exactly once).
  watch(
    () => state.value.over,
    (over) => {
      if (over?.winner?.isHuman && difficulty.value) {
        unlocks.recordWin(difficulty.value);
      }
    },
  );

  /** Called from the root component on mount. In demo mode ("?auto"/headless)
      the game starts immediately; otherwise it waits for the human to pick a
      difficulty via the opening DifficultyModal (see chooseDifficulty). */
  function start(): void {
    if (started.value) {
      return;
    }
    // Demo mode ("?auto") runs at full tilt with no difficulty prompt.
    if (AUTO_HUMAN) {
      setFast(true);
      chooseDifficulty(DEFAULT_DIFFICULTY);
    }
  }

  /** The human picked a difficulty on the opening screen — boot the game loop.
      (Every level is currently identical; the choice is stored for later use.) */
  function chooseDifficulty(level: Difficulty): void {
    if (started.value) {
      return;
    }
    difficulty.value = level;
    const def = getDifficulty(level);
    // Apply this level's handicap to every mastermind AI before the loop runs,
    // Then assign its kamikazes (Hard mode: 2 AI that hunt only the human).
    setAiDifficulty(def.ai);
    assignKamikazes(def.kamikazeCount);
    started.value = true;
    void runGame();
  }

  function newGame(): void {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  function setFast(v: boolean): void {
    effects.fastMode = v;
  }

  function openModal(name: ModalName): void {
    modal.value = name;
  }
  function closeModal(): void {
    modal.value = null;
  }

  /* ---------------- human interactions ---------------- */

  function pickCard(idx: number): void {
    humanPoolClick(idx);
  }

  function endTurn(): void {
    endHumanTurn();
  }

  function recruit(planetId: number): void {
    closeModal();
    engineRecruit(human.value, state.value.planets[planetId]);
  }

  async function attack(
    sourceId: number,
    targetId: number,
    n: number,
  ): Promise<void> {
    closeModal();
    setBusy(true);
    await doAttack(
      human.value,
      state.value.planets[sourceId],
      state.value.planets[targetId],
      n,
    );
    setBusy(false);
  }

  async function move(fromId: number, toId: number, n: number): Promise<void> {
    closeModal();
    setBusy(true);
    await moveTroops(
      human.value,
      state.value.planets[fromId],
      state.value.planets[toId],
      n,
    );
    setBusy(false);
  }

  /** Evaluate + (if accepted) execute a human-initiated trade. Returns acceptance. */
  function proposeTrade(partnerId: number, gives: Cost, gets: Cost): boolean {
    const partner = state.value.players[partnerId];
    const accept = aiEvaluateTrade(partner, gets, gives, human.value);
    if (accept) {
      execTrade(human.value, partner, gives, gets);
    }
    return accept;
  }

  function playInfluence(type: InfluenceType, opts: InfluenceOpts = {}): void {
    closeModal();
    useInfluenceCard(human.value, type, opts);
  }

  function resolveOffer(accept: boolean): void {
    engineResolveOffer(accept);
  }

  return {
    // Reactive state
    state,
    modal,
    fastMode,
    difficulty,
    // Derived
    human,
    isHumanTurn,
    isPicking,
    // Lifecycle
    start,
    chooseDifficulty,
    newGame,
    setFast,
    // Modal control
    openModal,
    closeModal,
    // Interactions
    pickCard,
    endTurn,
    recruit,
    attack,
    move,
    proposeTrade,
    playInfluence,
    resolveOffer,
  };
});
