<script setup lang="ts">
import { useGameStore } from '@/stores/game.ts';
import ModalShell from './ModalShell.vue';
import {
  ACTION_CARDS_FROM_TURN,
  ADVANCED_FROM_TURN,
  BUILD_ORDER,
  BUILDINGS,
  BUILDINGS_FROM_TURN,
  CONQUEST_TRUCE,
  costLabel,
  PACIFIST_TURNS,
  PACIFIST_DEF_BONUS,
  PACIFIST_INFLUENCE,
  INFLUENCE_CARDS,
  INFLUENCE_CARDS_FROM_TURN,
  INFLUENCE_TYPES,
  maxLevel,
  MOVE_CARDS_FROM_TURN,
} from '@/game/config/constants.ts';

const store = useGameStore();
</script>

<template>
  <ModalShell @close="store.closeModal()">
    <h2>❓ HOW TO PLAY</h2>
    <ul class="rules">
      <li>
        <b>WIN by conquering every other player.</b> That is the only victory —
        the last empire standing rules the galaxy. You <b>LOSE</b> when your
        last planet falls.
      </li>
      <li>
        <b>Draft phase:</b> each turn a fresh pool enters the galaxy.
        <ul class="rules">
          <li>
            <b>Turns 1–5:</b> 14 random resource cards only — no buildings or
            actions yet.
          </li>
          <li>
            <b>Turn {{ BUILDINGS_FROM_TURN }}+:</b> 5 unique building cards + 11
            resource cards = <b>16 total</b>, plus 1 extra random card per total
            🌀 Singularity level in play.
          </li>
          <li>
            <b>Turn {{ ACTION_CARDS_FROM_TURN }}+:</b> 6 of the resource slots
            become <b>action cards</b> (⚔️ Attack, 🪖 Recruit, 🔁 Trade).
          </li>
          <li>
            <b>Turn {{ MOVE_CARDS_FROM_TURN }}+:</b> 🛸 <b>Move</b> joins the
            action deck.
          </li>
          <li>
            <b>Turn {{ INFLUENCE_CARDS_FROM_TURN }}+:</b> 2 ⭐
            <b>influence cards</b> join every pool.
          </li>
        </ul>
        Each building type appears at most once per pool.
        <b>Higher TECHNOLOGY drafts first:</b> tech-3 players pick before tech-2
        players, who pick before tech-1 players (ties are broken by a random
        rotation each turn). Your <b>main planet picks 2 cards</b> (+1 per 🌀
        <b>Singularity</b> level you own), and each extra planet grants an
        additional draft turn worth 1 card.
      </li>
      <li>
        <b>🔬 TECHNOLOGY:</b> most buildings have up to <b>3 levels</b> —
        picking a card again <b>upgrades it</b>. Level N costs
        <b>N× the base cost</b> (level 2 is twice as expensive as level 1). A
        building's level can never exceed your tech level:
        <ul class="rules">
          <li>
            <b>Tech 1</b> — where everyone starts: level-1 buildings only.
          </li>
          <li>
            <b>Tech 2</b> — own a 🌀 <b>Singularity</b>: level-2 upgrades
            unlock.
          </li>
          <li>
            <b>Tech 3</b> — own <b>two Singularities</b> on two planets (conquer
            another player!): level-3 unlocks.
          </li>
          <li>
            <b>Tech 4</b> — own a <b>FULLY BUILT planet</b> (every building
            maxed, Singularity at L3): unlocks the <b>level-4 Singularity</b>.
          </li>
        </ul>
        The 🌀 Singularity requires a 🔬 <b>Research Lab</b> on the same planet,
        and its level can never exceed that Lab's level — Singularity L2 needs a
        <b>Lab L2</b> (the L4 apex needs a maxed Lab). A
        <b>level-4 Singularity</b> keeps all the usual bonuses
        <b>and</b> hardens its planet with <b>+8 defense</b>.
      </li>
      <li>
        <b>Building cards</b> appear in the pool with name, cost and bonus.
        <b>Picking one builds or upgrades it instantly</b> on the drafting
        planet — cost paid from hand at pick time. The 🔬 Research Lab only
        appears from turn {{ ADVANCED_FROM_TURN }}; the 🌀 Singularity only once
        someone owns a Lab outleveling its Singularity.
      </li>
      <li>
        <b>Action cards</b> go to your hand and can be used on <b>any turn</b>.
        To pick them from the pool: ⚔️ needs a 🚀 <b>Rocket Silo</b> and ≥1
        soldier, 🛸 needs a 🛰️ <b>Spaceport</b> and 2+ planets, 🪖 needs a 🎖️
        <b>Barracks</b>, 🔁 needs a 🤝 <b>Embassy</b>. No card, no action.
      </li>
      <li>
        <b>Armies belong to planets:</b> each planet garrisons its own troops.
        <b>Recruiting requires a 🎖️ Barracks</b> on the planet, yields troops
        equal to its yield (1/2/4 at L1/L2/L3) and costs
        <b>1⛏️ Ore per troop</b> (no energy). 🛸 Move redeploys troops between
        your planets.
      </li>
      <li>
        <b>Combat:</b> <b>attacking requires a 🚀 Rocket Silo</b> — rockets
        launch only from your Silo planets, using that planet's own army. Rocket
        capacity = 3, <b>doubled per Silo level</b> (L1 → 6, L3 → unlimited).
        Strike = 2×troops (+2 per Silo level) + luck. Defense = 2×troops
        (+4/+8/+12 per 🛡️ Shield level) + luck.
        <b>Buildings are never destroyed.</b>
      </li>
      <li>
        <b>☮️ Pacifism:</b> launch
        <b>no attack for {{ PACIFIST_TURNS }} turns</b> and you become a
        <b>Pacifist</b> — every planet you own gains
        <b>+{{ PACIFIST_DEF_BONUS }} defense</b> and produces
        <b>+{{ PACIFIST_INFLUENCE }} ⭐ Influence every turn</b> (marked ☮️,
        distinct from the 🕊️ truce). You <b>may still attack</b>, but the first
        strike <b>breaks the vow for good</b>: you lose the bonuses and can
        <b>never regain Pacifist status</b>. Until then, a Coup is your conquest
        of choice.
      </li>
      <li>
        <b>Spoils of war:</b> winning a battle grants <b>no loot</b>. Wiping the
        garrison conquers the planet — survivors garrison it,
        <b>under truce for {{ CONQUEST_TRUCE }} turns</b> (🕊️), and the
        conqueror salvages part of the loser's hand. All buildings serve the new
        owner — and a second planet is the road to a second Singularity and
        <b>Tech 3</b>.
      </li>
      <li>
        <b>Trading requires a 🤝 Embassy.</b> Propose <b>resource-only</b> swaps
        to any rival — <b>action cards cannot be traded</b>; the initiator
        spends a 🔁 Trade card and
        <b>earns +1 ⭐ Influence per accepted deal</b>. AI rivals will openly
        announce what resource they seek and will only accept your offer freely
        if it provides that resource — for anything else they demand very
        favourable terms. Rivals are
        <b>less willing to trade with the current leader.</b>
      </li>
      <li>
        <b>⭐ INFLUENCE</b> is a separate track (not a hand card): earn +1 per
        trade you initiate and +1 per turn from an <b>L2 🤝 Embassy</b>. From
        <b>turn {{ INFLUENCE_CARDS_FROM_TURN }}</b
        >, 2 <b>influence cards</b> join every pool — picking one pays its ⭐
        cost and puts the card <b>in your hand</b>; play it for free on
        <b>any of your action turns</b> (⭐ Influence button):
        <ul class="rules">
          <li v-for="k in INFLUENCE_TYPES" :key="k">
            {{ INFLUENCE_CARDS[k].icon }} <b>{{ INFLUENCE_CARDS[k].name }}</b>
            <span class="dimtx">({{ INFLUENCE_CARDS[k].cost }}⭐)</span> —
            {{ INFLUENCE_CARDS[k].desc }}
          </li>
        </ul>
        Skip cards never target you — they hit the qualifying <b>rival</b>,
        determined when the card is <b>played</b>; a skipped player misses their
        draft and action phases (income still flows). Influence cards cannot be
        traded or stolen.
      </li>
      <li>
        <b>🔮 Relics</b> are wildcards — substitute for any missing resource
        when paying a cost.
      </li>
      <li>
        <b>Buildings</b> (built/upgraded instantly when picked from the pool):
        <ul class="rules">
          <li v-for="id in BUILD_ORDER" :key="id">
            {{ BUILDINGS[id].icon }} <b>{{ BUILDINGS[id].name }}</b>
            <span class="dimtx"
              >({{ costLabel(BUILDINGS[id].cost) }} at L1 — level N costs N×
              that, max L{{ maxLevel(id) }})</span
            >
            — {{ BUILDINGS[id].desc }}
          </li>
        </ul>
      </li>
    </ul>
    <div class="mbtns">
      <button class="btn" @click="store.closeModal()">Close</button>
    </div>
  </ModalShell>
</template>
