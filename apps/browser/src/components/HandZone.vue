<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '@/stores';
import {
  CARD_TYPES,
  CARDS,
  INFLUENCE_CARDS,
  INFLUENCE_TYPES,
} from '@seven-planets/game';
import type { CardType, InfluenceType } from '@seven-planets/game';
import { match } from 'ts-pattern';

const game = useGameStore();

const human = computed(() => game.state.players[0]);

const toHint = (cardType: CardType): string =>
  match(cardType)
    .with('RELIC', () => ' (wildcard — substitutes any resource)')
    .otherwise(() =>
      match(Boolean(CARDS[cardType].isAction))
        .with(
          true,
          () =>
            ` (action card — spent to ${CARDS[cardType].name.toLowerCase()})`,
        )
        .otherwise(() => ''),
    );

const regular = computed(() =>
  CARD_TYPES.map((cardType) => ({
    cardType,
    count: human.value.hand[cardType],
    icon: CARDS[cardType].icon,
    name: CARDS[cardType].name,
    color: CARDS[cardType].color,
    action: Boolean(CARDS[cardType].isAction),
    title: `${CARDS[cardType].name}${toHint(cardType)}`,
  })),
);

const influence = computed(() =>
  INFLUENCE_TYPES.filter((cardType) => human.value.hand[cardType] > 0).map(
    (cardType: InfluenceType) => ({
      cardType,
      count: human.value.hand[cardType],
      icon: CARDS[cardType].icon,
      name: CARDS[cardType].name,
      color: CARDS[cardType].color,
      title: `${INFLUENCE_CARDS[cardType].name}: ${INFLUENCE_CARDS[cardType].desc} (play it via the ⭐ Influence button on your action turn)`,
    }),
  ),
);
</script>

<template>
  <div id="hand-zone">
    <div class="zone-label">
      YOUR HAND
    </div>
    <div id="hand">
      <div
        v-for="card in regular"
        :key="card.cardType"
        v-tooltip="card.title"
        class="card"
        :class="{ dim: card.count === 0, action: card.action }"
        :style="{ borderColor: card.color }"
      >
        <div class="ic">
          {{ card.icon }}
        </div>
        <div class="nm">
          {{ card.name }}
        </div>
        <div class="ct">
          {{ card.count }}
        </div>
      </div>
      <div
        v-for="card in influence"
        :key="card.cardType"
        v-tooltip="card.title"
        class="card action"
        :style="{ borderColor: card.color }"
      >
        <div class="ic">
          {{ card.icon }}
        </div>
        <div class="nm">
          {{ card.name }}
        </div>
        <div class="ct">
          {{ card.count }}
        </div>
      </div>
    </div>
  </div>
</template>
