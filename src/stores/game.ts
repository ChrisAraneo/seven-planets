import { defineStore } from 'pinia';
import { computed, reactive, ref, watch } from 'vue';

import {
  DEFAULT_DIFFICULTY,
  type Difficulty,
  getDifficulty,
} from '@/game/difficulty';
import { getFastMode, setFastMode } from '@/game/effects';
import { setAiDifficulty } from '@/game/ai/functions/set-ai-difficulty';
import { buildState, setState } from '@/game/engine/state';
import { AUTO_HUMAN } from '@/game/engine/functions/auto-human';
import { assignKamikazes } from '@/game/engine/functions/assign-kamikazes';
import { runGame } from '@/game/engine/functions/run-game';
import { humanPoolClick } from '@/game/engine/functions/human-pool-click';
import { endHumanTurn } from '@/game/engine/functions/end-human-turn';
import { recruit as engineRecruit } from '@/game/engine/functions/recruit';
import { setBusy } from '@/game/engine/functions/set-busy';
import { doAttack } from '@/game/engine/functions/do-attack';
import { moveTroops } from '@/game/engine/functions/move-troops';
import { aiEvaluateTrade } from '@/game/engine/functions/ai-evaluate-trade';
import { execTrade } from '@/game/engine/functions/exec-trade';
import { useInfluenceCard } from '@/game/engine/functions/use-influence-card';
import { resolveOffer as engineResolveOffer } from '@/game/engine/functions/resolve-offer';
import type {
  ActionType,
  Cost,
  InfluenceOpts,
  InfluenceType,
} from '@/game/types';
import { recordWin } from '@/game/unlocks';

export type ModalName =
  | 'help'
  | 'attack'
  | 'recruit'
  | 'move'
  | 'trade'
  | 'influence'
  | null;

export const useGameStore = defineStore('game', () => {
  // The single reactive game state. New Game / Play Again reload the page
  // (matching the original), so this object never needs to be rebuilt.
  const state = reactive(buildState());
  setState(state);

  const modal = ref<ModalName>(null);
  const started = ref(false);
  const fastMode = ref(getFastMode());
  // The human's chosen difficulty. Null until picked — the game loop waits for
  // The choice (see start / chooseDifficulty). All levels currently behave
  // Identically; the selection is threaded through for future tuning.
  const difficulty = ref<Difficulty | null>(null);

  const human = computed(() => state.players[0]);
  const isHumanTurn = computed(
    () => state.awaitingAction && !state.busy && !state.over,
  );
  const isPicking = computed(() => state.awaitingPick && !state.over);

  // When the human wins, unlock the next difficulty rung and persist it. Fires
  // Once per game (state.over is set exactly once).
  watch(
    () => state.over,
    (over) => {
      if (over?.winner?.isHuman && difficulty.value) {
        recordWin(difficulty.value);
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
    assignKamikazes(state, def.kamikazeCount);
    started.value = true;
    void runGame(state);
  }

  function newGame(): void {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  function setFast(v: boolean): void {
    fastMode.value = v;
    setFastMode(v);
  }

  function openModal(name: ModalName): void {
    modal.value = name;
  }
  function closeModal(): void {
    modal.value = null;
  }

  /* ---------------- human interactions ---------------- */

  function pickCard(idx: number): void {
    humanPoolClick(state, idx);
  }

  function endTurn(): void {
    endHumanTurn(state);
  }

  function recruit(planetId: number): void {
    closeModal();
    engineRecruit(state, human.value, state.planets[planetId]);
  }

  async function attack(
    sourceId: number,
    targetId: number,
    n: number,
  ): Promise<void> {
    closeModal();
    setBusy(state, true);
    await doAttack(
      state,
      human.value,
      state.planets[sourceId],
      state.planets[targetId],
      n,
    );
    setBusy(state, false);
  }

  async function move(fromId: number, toId: number, n: number): Promise<void> {
    closeModal();
    setBusy(state, true);
    await moveTroops(
      state,
      human.value,
      state.planets[fromId],
      state.planets[toId],
      n,
    );
    setBusy(state, false);
  }

  /** Evaluate + (if accepted) execute a human-initiated trade. Returns acceptance. */
  function proposeTrade(partnerId: number, gives: Cost, gets: Cost): boolean {
    const partner = state.players[partnerId];
    const accept = aiEvaluateTrade(state, partner, gets, gives, human.value);
    if (accept) {
      execTrade(state, human.value, partner, gives, gets);
    }
    return accept;
  }

  function playInfluence(type: InfluenceType, opts: InfluenceOpts = {}): void {
    closeModal();
    useInfluenceCard(state, human.value, type, opts);
  }

  function resolveOffer(accept: boolean): void {
    engineResolveOffer(state, accept);
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
