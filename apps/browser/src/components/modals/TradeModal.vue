<script setup lang="ts">
import { assign, fromPairs, noop, pickBy } from 'lodash-es';
import { match } from 'ts-pattern';
import { computed, reactive, ref, watch } from 'vue';
import { makeOffer } from '@seven-planets/game';
import { useGameStore, useUiStore } from '@/stores';
import { chain } from '@/utils/chain';
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

const give = reactive<Record<string, number>>(
  fromPairs(RESOURCE_TYPES.map((t) => [t, 0])),
);
const get = reactive<Record<string, number>>(
  fromPairs(RESOURCE_TYPES.map((t) => [t, 0])),
);

const note = ref<{ msg: string; cls: 'info' | 'ok' | 'warn' }>({
  msg: 'Adjust the offer, then transmit it. An accepted deal spends one 🔁 Trade card and earns you +1 ⭐ Influence.',
  cls: 'info',
});

const offerPending = ref(false);
const influenceSnapshot = ref(0);

const noteStyle = computed(() =>
  match(note.value.cls)
    .with('ok', () => ({ color: '#7dff8a' }))
    .otherwise(() => ({})),
);

const resetOffer = (): void =>
  chain(assign(give, fromPairs(RESOURCE_TYPES.map((t) => [t, 0]))))
    .thru(() => assign(get, fromPairs(RESOURCE_TYPES.map((t) => [t, 0]))))
    .thru(noop)
    .value();

const applyOutcome = (accepted: boolean): void =>
  match(accepted)
    .with(true, () =>
      chain(resetOffer())
        .thru(() =>
          assign(note, {
            value: {
              msg: `${partner.value.name} accepts the deal!`,
              cls: 'ok',
            },
          }),
        )
        .thru(noop)
        .value(),
    )
    .otherwise(() =>
      chain(
        assign(note, {
          value: {
            msg: `${partner.value.name} scoffs at your offer.`,
            cls: 'warn',
          },
        }),
      )
        .thru(noop)
        .value(),
    );

watch(
  () => game.state.pendingOffer,
  (offer) =>
    match(offerPending.value && offer === null)
      .with(true, () =>
        chain(assign(offerPending, { value: false }))
          .thru(() =>
            applyOutcome(
              game.state.players[0].influence > influenceSnapshot.value,
            ),
          )
          .value(),
      )
      .otherwise(noop),
);

const changePartner = (id: number): void =>
  chain(assign(partnerId, { value: id }))
    .tap(() =>
      assign(
        get,
        fromPairs(
          RESOURCE_TYPES.map((t) => [
            t,
            Math.min(get[t], partner.value.hand[t]),
          ]),
        ),
      ),
    )
    .thru(() =>
      assign(note, {
        value: { msg: 'Adjust the offer, then transmit it.', cls: 'info' },
      }),
    )
    .thru(noop)
    .value();

const step = (side: 'give' | 'get', t: string, delta: number): void =>
  match(side)
    .with('give', () =>
      chain(
        assign(give, {
          [t]: Math.max(0, Math.min(human.hand[t], give[t] + delta)),
        }),
      )
        .thru(noop)
        .value(),
    )
    .otherwise(() =>
      chain(
        assign(get, {
          [t]: Math.max(0, Math.min(partner.value.hand[t], get[t] + delta)),
        }),
      )
        .thru(noop)
        .value(),
    );

const sendOffer = (gives: Cost, gets: Cost): void =>
  chain(game.state.players[0].influence)
    .tap(() =>
      makeOffer({ playerId: 0, partnerId: partnerId.value, gives, gets }),
    )
    .thru((influenceBefore) =>
      match(game.state.pendingOffer === null)
        .with(true, () =>
          applyOutcome(game.state.players[0].influence > influenceBefore),
        )
        .otherwise(() =>
          chain(assign(offerPending, { value: true }))
            .thru(() => assign(influenceSnapshot, { value: influenceBefore }))
            .thru(() =>
              assign(note, {
                value: {
                  msg: `Offer sent — waiting for ${partner.value.name}…`,
                  cls: 'ok',
                },
              }),
            )
            .thru(noop)
            .value(),
        ),
    )
    .value();

const propose = (): void =>
  chain({
    gives: pickBy({ ...give }, (amount) => amount > 0),
    gets: pickBy({ ...get }, (amount) => amount > 0),
  })
    .thru(({ gives, gets }) =>
      match({
        isEmpty: !Object.keys(gives).length && !Object.keys(gets).length,
        hasTradeCard: hasActionCard(human, 'TRADE'),
      })
        .with({ isEmpty: true }, () =>
          chain(
            assign(note, {
              value: { msg: 'The offer is empty.', cls: 'info' },
            }),
          )
            .thru(noop)
            .value(),
        )
        .with({ hasTradeCard: false }, () =>
          chain(
            assign(note, {
              value: { msg: 'You have no 🔁 Trade cards left.', cls: 'warn' },
            }),
          )
            .thru(noop)
            .value(),
        )
        .otherwise(() => sendOffer(gives, gets)),
    )
    .value();
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
      :style="noteStyle">
      {{ note.msg }}
    </div>
    <div class="mbtns">
      <button class="btn" @click="propose">📡 Transmit Offer</button>
      <button class="btn" @click="ui.closeModal()">Close</button>
    </div>
  </ModalShell>
</template>
