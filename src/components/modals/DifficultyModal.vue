<script setup lang="ts">
import { useGameStore } from '@/stores/game';
import ModalShell from './ModalShell.vue';
import { DIFFICULTIES, type Difficulty } from '@/game/difficulty';
import { unlockedDifficulties } from '@/game/unlocks';

const store = useGameStore();

// Read once at mount: unlocks only change on a win, which reloads the page.
const unlocked = unlockedDifficulties();

function choose(level: Difficulty): void {
  if (!unlocked.has(level)) return; // locked — earn it by winning the level below
  store.chooseDifficulty(level);
}
</script>

<template>
  <!-- No overlay-close: the human must pick a difficulty to begin. -->
  <ModalShell>
    <h2>🌌 CHOOSE YOUR DIFFICULTY</h2>
    <p class="dimtx">
      Seven worlds, one victor. Select a challenge to begin your conquest.
    </p>
    <div class="difficulty-grid">
      <button
        v-for="d in DIFFICULTIES"
        :key="d.id"
        class="difficulty-card"
        :class="{ locked: !unlocked.has(d.id) }"
        :disabled="!unlocked.has(d.id)"
        @click="choose(d.id)">
        <span class="difficulty-icon">{{
          unlocked.has(d.id) ? d.icon : '🔒'
        }}</span>
        <span class="difficulty-name">{{ d.name }}</span>
        <span class="difficulty-blurb">
          {{ unlocked.has(d.id) ? d.blurb : 'Win the level below to unlock.' }}
        </span>
      </button>
    </div>
  </ModalShell>
</template>

<style scoped>
.difficulty-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 16px;
}
@media (max-width: 520px) {
  .difficulty-grid {
    grid-template-columns: 1fr;
  }
}
.difficulty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
  background: #0c1428;
  border: 1px solid rgba(61, 240, 255, 0.35);
  color: #cfe3ff;
  border-radius: 8px;
  padding: 18px 12px;
  cursor: pointer;
  font-family: inherit;
  transition:
    background 0.15s,
    box-shadow 0.15s,
    transform 0.1s;
}
.difficulty-card:hover:not(.locked) {
  background: #14274a;
  box-shadow: 0 0 14px rgba(61, 240, 255, 0.35);
  transform: translateY(-2px);
}
.difficulty-card.locked {
  border-color: rgba(90, 123, 173, 0.25);
  opacity: 0.5;
  cursor: not-allowed;
}
.difficulty-card.locked .difficulty-name {
  color: #5a7bad;
}
.difficulty-icon {
  font-size: 30px;
}
.difficulty-name {
  color: #3df0ff;
  font-size: 15px;
  letter-spacing: 2px;
}
.difficulty-blurb {
  color: #5a7bad;
  font-size: 11.5px;
  line-height: 1.4;
}
</style>
