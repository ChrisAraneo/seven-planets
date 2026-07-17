<script setup lang="ts">
import { INFLUENCE_TYPES } from '@seven-planets/game';
import { hasBuilding } from '@seven-planets/game';
import { getOwnedPlanets } from '@seven-planets/game';
import { computeRecruitableTroops } from '@seven-planets/game';
import { isPacifist } from '@seven-planets/game';
import { hasActionCard } from '@seven-planets/game';
import { filterAlivePlayers } from '@seven-planets/game';
import { createEndTurnAction, dispatch } from '@seven-planets/game';
import { useGameStore, useUiStore } from '@/stores';
import { computed } from 'vue';

const game = useGameStore();
const ui = useUiStore();

const my = computed(() => game.state.isAwaitingAction && !game.state.over);
const human = computed(() => game.state.players[0]);

const hasBarracks = computed(() =>
  hasBuilding(game.state, human.value, 'BARRACKS'),
);
const hasPort = computed(() =>
  hasBuilding(game.state, human.value, 'SPACEPORT'),
);
const hasEmbassy = computed(() =>
  hasBuilding(game.state, human.value, 'EMBASSY'),
);
const canRecruitSomewhere = computed(() =>
  getOwnedPlanets(game.state, human.value).some(
    (pl) =>
      pl.buildings.BARRACKS &&
      computeRecruitableTroops(pl, human.value.hand) >= 1,
  ),
);
const isPeaceful = computed(() => isPacifist(human.value));
const canLaunchSomewhere = computed(() =>
  getOwnedPlanets(game.state, human.value).some(
    (pl) => pl.buildings.SILO && pl.troops >= 1,
  ),
);
const canMoveSomewhere = computed(
  () =>
    getOwnedPlanets(game.state, human.value).length >= 2 &&
    getOwnedPlanets(game.state, human.value).some(
      (pl) => pl.buildings.SPACEPORT && pl.troops >= 1,
    ),
);
const heldInf = computed(() =>
  INFLUENCE_TYPES.reduce((s, t) => s + (human.value.hand[t] || 0), 0),
);

const recruitTitle = computed(() =>
  hasBarracks.value
    ? 'Spends one 🪖 Recruit card + 1⛏️ per troop. Yields troops equal to the Barracks yield (1/2/4) on the chosen planet — short on ⛏️, you recruit as many as you can pay for.'
    : 'Requires a 🎖️ Barracks — you cannot recruit without one.',
);
const attackTitle = computed(() =>
  isPeaceful.value
    ? '☮️ You are a PACIFIST. You MAY attack — but doing so breaks your vow permanently, forfeiting the defense and ⭐ bonuses for good (you can never regain PACIFIST status).'
    : canLaunchSomewhere.value
      ? "Spends one ⚔️ Attack card per rocket launch (uses the launching planet's army)"
      : 'Requires a 🚀 Rocket Silo with troops garrisoned — rockets launch only from Silo planets.',
);
const moveTitle = computed(() =>
  hasPort.value
    ? 'Spends one 🛸 Move card to redeploy troops — only FROM a planet that has a 🛰️ Spaceport. Spaceport L2: +1 free Move card every 3 turns.'
    : 'Requires a 🛰️ Spaceport — troops can only be redeployed from a planet that has one.',
);
const tradeTitle = computed(() =>
  hasEmbassy.value
    ? 'Spends one 🔁 Trade card per accepted deal. Every deal you initiate earns +1 ⭐ Influence. Embassy L2: +1 ⭐ every turn.'
    : 'Requires a 🤝 Embassy — you cannot trade without one.',
);
const influenceTitle = computed(() =>
  heldInf.value
    ? 'Play a held ⭐ influence card (already paid for at draft time).'
    : 'No influence cards in hand — draft them from the pool (turn 30+) by paying their ⭐ cost.',
);

function onRecruit(): void {
  if (canRecruitSomewhere.value) ui.openModal('recruit');
}
</script>

<template>
  <div id="action-zone">
    <div class="zone-label">ACTIONS</div>
    <button
      v-tooltip="recruitTitle"
      class="btn action"
      :disabled="
        !my || !hasActionCard(human, 'RECRUIT') || !canRecruitSomewhere
      "
      @click="onRecruit">
      🪖 Recruit ×{{ human.hand.RECRUIT }}
    </button>
    <button
      v-tooltip="attackTitle"
      class="btn action"
      :disabled="!my || !hasActionCard(human, 'ATTACK') || !canLaunchSomewhere"
      @click="ui.openModal('attack')">
      ⚔️ Attack ×{{ human.hand.ATTACK }}
    </button>
    <button
      v-tooltip="moveTitle"
      class="btn action"
      :disabled="!my || !hasActionCard(human, 'MOVE') || !canMoveSomewhere"
      @click="ui.openModal('move')">
      🛸 Move ×{{ human.hand.MOVE }}
    </button>
    <button
      v-tooltip="tradeTitle"
      class="btn action"
      :disabled="
        !my ||
        !hasActionCard(human, 'TRADE') ||
        !hasEmbassy ||
        filterAlivePlayers(game.state).length < 2
      "
      @click="ui.openModal('trade')">
      🔁 Trade ×{{ human.hand.TRADE }}
    </button>
    <button
      v-tooltip="influenceTitle"
      class="btn action"
      :disabled="!my || heldInf < 1"
      @click="ui.openModal('influence')">
      ⭐ Influence ×{{ heldInf }}
    </button>
    <button
      id="btn-end"
      class="btn action end"
      :disabled="!my"
      @click="dispatch(createEndTurnAction({ playerId: 0 }))">
      ⏭️ End Turn
    </button>
  </div>
</template>
