import { computed, reactive, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import * as engine from '@/game/engine'
import { getFastMode, setFastMode } from '@/game/effects'
import { DEFAULT_DIFFICULTY, getDifficulty, type Difficulty } from '@/game/difficulty'
import { recordWin } from '@/game/unlocks'
import type { ActionType, Cost, InfluenceOpts, InfluenceType } from '@/game/types'

export type ModalName = 'help' | 'attack' | 'recruit' | 'move' | 'trade' | 'influence' | null

export const useGameStore = defineStore('game', () => {
  // The single reactive game state. New Game / Play Again reload the page
  // (matching the original), so this object never needs to be rebuilt.
  const state = reactive(engine.buildState())
  engine.setState(state)

  const modal = ref<ModalName>(null)
  const started = ref(false)
  const fastMode = ref(getFastMode())
  // The human's chosen difficulty. Null until picked — the game loop waits for
  // the choice (see start / chooseDifficulty). All levels currently behave
  // identically; the selection is threaded through for future tuning.
  const difficulty = ref<Difficulty | null>(null)

  const human = computed(() => state.players[0])
  const isHumanTurn = computed(
    () => state.awaitingAction && !state.busy && !state.over,
  )
  const isPicking = computed(() => state.awaitingPick && !state.over)

  // When the human wins, unlock the next difficulty rung and persist it. Fires
  // once per game (state.over is set exactly once).
  watch(
    () => state.over,
    (over) => {
      if (over?.winner?.isHuman && difficulty.value) recordWin(difficulty.value)
    },
  )

  /** Called from the root component on mount. In demo mode ("?auto"/headless)
      the game starts immediately; otherwise it waits for the human to pick a
      difficulty via the opening DifficultyModal (see chooseDifficulty). */
  function start(): void {
    if (started.value) return
    // Demo mode ("?auto") runs at full tilt with no difficulty prompt.
    if (engine.AUTO_HUMAN) {
      setFast(true)
      chooseDifficulty(DEFAULT_DIFFICULTY)
    }
  }

  /** The human picked a difficulty on the opening screen — boot the game loop.
      (Every level is currently identical; the choice is stored for later use.) */
  function chooseDifficulty(level: Difficulty): void {
    if (started.value) return
    difficulty.value = level
    const def = getDifficulty(level)
    // Apply this level's handicap to every mastermind AI before the loop runs,
    // then assign its kamikazes (Hard mode: 2 AI that hunt only the human).
    engine.setAiDifficulty(def.ai)
    engine.assignKamikazes(def.kamikazeCount)
    started.value = true
    void engine.runGame()
  }

  function newGame(): void {
    if (typeof window !== 'undefined') window.location.reload()
  }

  function setFast(v: boolean): void {
    fastMode.value = v
    setFastMode(v)
  }

  function openModal(name: ModalName): void {
    modal.value = name
  }
  function closeModal(): void {
    modal.value = null
  }

  /* ---------------- human interactions ---------------- */

  function pickCard(idx: number): void {
    engine.humanPoolClick(idx)
  }

  function endTurn(): void {
    engine.endHumanTurn()
  }

  function recruit(planetId: number): void {
    closeModal()
    engine.recruit(human.value, state.planets[planetId])
  }

  async function attack(sourceId: number, targetId: number, n: number): Promise<void> {
    closeModal()
    engine.setBusy(true)
    await engine.doAttack(human.value, state.planets[sourceId], state.planets[targetId], n)
    engine.setBusy(false)
  }

  async function move(fromId: number, toId: number, n: number): Promise<void> {
    closeModal()
    engine.setBusy(true)
    await engine.moveTroops(human.value, state.planets[fromId], state.planets[toId], n)
    engine.setBusy(false)
  }

  /** Evaluate + (if accepted) execute a human-initiated trade. Returns acceptance. */
  function proposeTrade(partnerId: number, gives: Cost, gets: Cost): boolean {
    const partner = state.players[partnerId]
    const accept = engine.aiEvaluateTrade(partner, gets, gives, human.value)
    if (accept) engine.execTrade(human.value, partner, gives, gets)
    return accept
  }

  function playInfluence(type: InfluenceType, opts: InfluenceOpts = {}): void {
    closeModal()
    engine.useInfluenceCard(human.value, type, opts)
  }

  function resolveOffer(accept: boolean): void {
    engine.resolveOffer(accept)
  }

  return {
    // reactive state
    state,
    modal,
    fastMode,
    difficulty,
    // derived
    human,
    isHumanTurn,
    isPicking,
    // lifecycle
    start,
    chooseDifficulty,
    newGame,
    setFast,
    // modal control
    openModal,
    closeModal,
    // interactions
    pickCard,
    endTurn,
    recruit,
    attack,
    move,
    proposeTrade,
    playInfluence,
    resolveOffer,
  }
})
