<script setup lang="ts">
import { getOver } from '@/game/getters/get-over';
import { getPendingOffer } from '@/game/getters/get-pending-offer';
import { computed, onMounted } from 'vue';
import { store } from '@/stores';
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

const difficulty = computed(() => store.state.ui.difficulty);
const modal = computed(() => store.state.ui.modal);
const human = computed(() => store.state.game.state.players[0]);

onMounted(() => void store.dispatch('ui/start'));
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

  <!-- The difficulty picker opens the game and blocks all other UI. -->
  <DifficultyModal v-if="!difficulty" />
  <!-- Game over takes precedence over everything else. -->
  <GameOverModal v-else-if="getOver()" />
  <template v-else>
    <HelpModal v-if="modal === 'help'" />
    <AttackModal v-else-if="modal === 'attack'" />
    <RecruitModal v-else-if="modal === 'recruit'" />
    <MoveModal v-else-if="modal === 'move'" />
    <TradeModal v-else-if="modal === 'trade'" />
    <InfluenceModal v-else-if="modal === 'influence'" />
    <!-- Offers between AI seats also pass through pendingOffer now — only
         show the modal for offers addressed to the human seat. -->
    <TradeOfferModal v-if="getPendingOffer()?.toId === human.id" />
  </template>
</template>
