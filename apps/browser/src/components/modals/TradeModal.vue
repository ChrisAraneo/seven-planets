<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { makeOffer } from '@seven-planets/game';
import { useGameStore, useUiStore } from '@/stores';
import ModalShell from './ModalShell.vue';
import { CARDS, RESOURCE_TYPES } from '@seven-planets/game';
import { filterAlivePlayers } from '@seven-planets/game';
import { hasActionCard } from '@seven-planets/game';
import type { Cost } from '@seven-planets/game';

const game = useGameStore();
const ui = useUiStore();

const human = game.state.players[0];

const partners = filterAlivePlayers(game.state).filter(
  (player) => !player.isHuman,
);
const partnerId = ref(partners[0].id);
const partner = computed(() => game.state.players[partnerId.value]);

const give = reactive<Record<string, number>>({});
const get = reactive<Record<string, number>>({});
for (const t of RESOURCE_TYPES) {
  give[t] = 0;
  get[t] = 0;
}

const note = ref<{ msg: string; cls: 'info' | 'ok' | 'warn' }>({
  msg: 'Adjust the offer, then transmit it. An accepted deal spends one 🔁 Trade card and earns you +1 ⭐ Influence.',
  cls: 'info',
});

/** Snapshot of the human's influence taken just before sending an offer,
    used to detect whether the partner accepted (influence goes up by 1). */
const offerPending = ref(false);
const influenceSnapshot = ref(0);

watch(
  () => game.state.pendingOffer,
  (offer) => {
    if (offerPending.value && offer === null) {
      offerPending.value = false;
      const accepted =
        game.state.players[0].influence > influenceSnapshot.value;
      if (accepted) {
        for (const t of RESOURCE_TYPES) {
          give[t] = 0;
          get[t] = 0;
        }
        note.value = {
          msg: `${partner.value.name} accepts the deal!`,
          cls: 'ok',
        };
      } else {
        note.value = {
          msg: `${partner.value.name} scoffs at your offer.`,
          cls: 'warn',
        };
      }
    }
  },
);

function changePartner(id: number): void {
  partnerId.value = id;
  for (const t of RESOURCE_TYPES)
    get[t] = Math.min(get[t], partner.value.hand[t]);
  note.value = { msg: 'Adjust the offer, then transmit it.', cls: 'info' };
}

function step(side: 'give' | 'get', t: string, delta: number): void {
  if (side === 'give')
    give[t] = Math.max(0, Math.min(human.hand[t], give[t] + delta));
  else get[t] = Math.max(0, Math.min(partner.value.hand[t], get[t] + delta));
}

function propose(): void {
  const gives: Cost = {};
  const gets: Cost = {};
  for (const t of RESOURCE_TYPES) {
    if (give[t] > 0) gives[t] = give[t];
    if (get[t] > 0) gets[t] = get[t];
  }
  if (!Object.keys(gives).length && !Object.keys(gets).length) {
    note.value = { msg: 'The offer is empty.', cls: 'info' };
    return;
  }
  if (!hasActionCard(human, 'TRADE')) {
    note.value = { msg: 'You have no 🔁 Trade cards left.', cls: 'warn' };
    return;
  }
  const influenceBefore = game.state.players[0].influence;
  makeOffer({
    playerId: 0,
    partnerId: partnerId.value,
    gives,
    gets,
  });
  // If the AI responded synchronously the offer is already resolved.
  if (game.state.pendingOffer === null) {
    const accepted = game.state.players[0].influence > influenceBefore;
    if (accepted) {
      for (const t of RESOURCE_TYPES) {
        give[t] = 0;
        get[t] = 0;
      }
      note.value = {
        msg: `${partner.value.name} accepts the deal!`,
        cls: 'ok',
      };
    } else {
      note.value = {
        msg: `${partner.value.name} scoffs at your offer.`,
        cls: 'warn',
      };
    }
  } else {
    // Human partner — watch will fire when they respond via TradeOfferModal.
    offerPending.value = true;
    influenceSnapshot.value = influenceBefore;
    note.value = {
      msg: `Offer sent — waiting for ${partner.value.name}\u2026`,
      cls: 'ok',
    };
  }
}
</script>

<template>
  <ModalShell @close="ui.closeModal()">
    <h2>🔁 TRADE NEGOTIATION</h2>
    <p>
      Partner:
      <select
        class="btn"
        :value="partnerId"
        @change="changePartner(+($event.target as HTMLSelectElement).value)">
        <option v-for="player in partners" :key="player.id" :value="player.id">
          {{ player.name }}
        </option>
      </select>
    </p>
    <table class="ttable">
      <thead>
        <tr>
          <th />
          <th>YOU GIVE</th>
          <th>YOU RECEIVE</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="resourceType in RESOURCE_TYPES" :key="resourceType">
          <td>{{ CARDS[resourceType].icon }} {{ CARDS[resourceType].name }}</td>
          <td>
            <span class="stepper">
              <button @click="step('give', resourceType, -1)">−</button
              ><span class="sval">{{ give[resourceType] }}</span
              ><button @click="step('give', resourceType, 1)">+</button>
            </span>
            <span class="dimtx">/ {{ human.hand[resourceType] }}</span>
          </td>
          <td>
            <span class="stepper">
              <button @click="step('get', resourceType, -1)">−</button
              ><span class="sval">{{ get[resourceType] }}</span
              ><button @click="step('get', resourceType, 1)">+</button>
            </span>
            <span class="dimtx">/ {{ partner.hand[resourceType] }}</span>
          </td>
        </tr>
      </tbody>
    </table>
    <div
      class="mnote"
      :class="{ warn: note.cls === 'warn' }"
      :style="note.cls === 'ok' ? { color: '#7dff8a' } : {}">
      {{ note.msg }}
    </div>
    <div class="mbtns">
      <button class="btn" @click="propose">📡 Transmit Offer</button>
      <button class="btn" @click="ui.closeModal()">Close</button>
    </div>
  </ModalShell>
</template>
