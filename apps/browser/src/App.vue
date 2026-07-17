<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useGameStore, useUiStore } from '@/stores';
import GameHeader from '@/components/GameHeader.vue';
import GameBoard from '@/components/GameBoard.vue';
import PlayersPanel from '@/components/PlayersPanel.vue';
import GameLog from '@/components/GameLog.vue';
import PoolZone from '@/components/PoolZone.vue';
import HandZone from '@/components/HandZone.vue';
import ActionZone from '@/components/ActionZone.vue';
import HelpModal from '@/components/modals/HelpModal.vue';
import AttackModal from '@/components/modals/AttackModal.vue';
import RecruitModal from '@/components/modals/RecruitModal.vue';
import MoveModal from '@/components/modals/MoveModal.vue';
import TradeModal from '@/components/modals/TradeModal.vue';
import InfluenceModal from '@/components/modals/InfluenceModal.vue';
import TradeOfferModal from '@/components/modals/TradeOfferModal.vue';
import GameOverModal from '@/components/modals/GameOverModal.vue';
import DifficultyModal from '@/components/modals/DifficultyModal.vue';

const ui = useUiStore();
const game = useGameStore();

const difficulty = computed(() => ui.difficulty);
const modal = computed(() => ui.modal);
const human = computed(() => game.state.players[0]);

onMounted(() => ui.start());
</script>

<template>
  <GameHeader />

  <main>
    <GameBoard />
    <aside id="side">
      <PlayersPanel />
      <GameLog />
    </aside>
  </main>

  <footer>
    <PoolZone />
    <HandZone />
    <ActionZone />
  </footer>

  <DifficultyModal v-if="!difficulty" />
  <GameOverModal v-else-if="game.state.over" />
  <template v-else>
    <HelpModal v-if="modal === 'help'" />
    <AttackModal v-else-if="modal === 'attack'" />
    <RecruitModal v-else-if="modal === 'recruit'" />
    <MoveModal v-else-if="modal === 'move'" />
    <TradeModal v-else-if="modal === 'trade'" />
    <InfluenceModal v-else-if="modal === 'influence'" />
    <TradeOfferModal v-if="game.state.pendingOffer?.toId === human.id" />
  </template>
</template>
