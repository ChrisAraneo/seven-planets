<script setup lang="ts">
import { onMounted } from 'vue'
import { useGameStore } from '@/stores/game'
import GameHeader from '@/components/GameHeader.vue'
import GameBoard from '@/components/GameBoard.vue'
import PlayersPanel from '@/components/PlayersPanel.vue'
import GameLog from '@/components/GameLog.vue'
import PoolZone from '@/components/PoolZone.vue'
import HandZone from '@/components/HandZone.vue'
import ActionZone from '@/components/ActionZone.vue'
import HelpModal from '@/components/modals/HelpModal.vue'
import AttackModal from '@/components/modals/AttackModal.vue'
import RecruitModal from '@/components/modals/RecruitModal.vue'
import MoveModal from '@/components/modals/MoveModal.vue'
import TradeModal from '@/components/modals/TradeModal.vue'
import InfluenceModal from '@/components/modals/InfluenceModal.vue'
import TradeOfferModal from '@/components/modals/TradeOfferModal.vue'
import GameOverModal from '@/components/modals/GameOverModal.vue'

const store = useGameStore()
onMounted(() => store.start())
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

  <!-- Game over takes precedence over everything else. -->
  <GameOverModal v-if="store.state.over" />
  <template v-else>
    <HelpModal v-if="store.modal === 'help'" />
    <AttackModal v-else-if="store.modal === 'attack'" />
    <RecruitModal v-else-if="store.modal === 'recruit'" />
    <MoveModal v-else-if="store.modal === 'move'" />
    <TradeModal v-else-if="store.modal === 'trade'" />
    <InfluenceModal v-else-if="store.modal === 'influence'" />
    <TradeOfferModal v-if="store.state.pendingOffer" />
  </template>
</template>
