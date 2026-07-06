<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useGameStore } from '@/stores/game'
import ModalShell from './ModalShell.vue'
import { CONQUEST_TRUCE, HOME_FIELD, SHIELD_DEFENSE } from '@/game/constants'
import { handSize, ownedPlanets, rocketCap, siloBonus, underTruce } from '@/game/engine'

const store = useGameStore()
const state = store.state
const human = store.human

const siloPls = ownedPlanets(human).filter((pl) => pl.buildings.SILO && pl.troops >= 1)
const srcId = ref(siloPls.reduce((a, b) => (a.troops >= b.troops ? a : b)).id)
const sel = ref(-1)
const n = ref(1)

const source = computed(() => state.planets[srcId.value])
const sources = computed(() => ownedPlanets(human).filter((pl) => pl.buildings.SILO))
const targets = computed(() => state.planets.filter((pl) => pl.ownerId !== 0))
const openTargets = computed(() => targets.value.filter((pl) => !underTruce(pl)))
const cap = computed(() => Math.min(rocketCap(source.value), source.value.troops))

// Keep the selected target valid and the troop count within capacity.
watch(
  [openTargets, srcId],
  () => {
    if (!openTargets.value.some((pl) => pl.id === sel.value)) sel.value = openTargets.value.length ? openTargets.value[0].id : -1
    n.value = Math.max(1, Math.min(n.value, cap.value))
  },
  { immediate: true },
)

const target = computed(() => (sel.value >= 0 ? state.planets[sel.value] : null))
const canLaunch = computed(() => sel.value >= 0 && source.value.troops >= 1)

const preview = computed(() => {
  if (!target.value) return null
  const ap = 2 * n.value + siloBonus(source.value)
  const dp = 2 * target.value.troops + (target.value.buildings.SHIELD || 0) * SHIELD_DEFENSE + HOME_FIELD
  const note = ap > dp + 3 ? 'good' : ap > dp ? 'close' : 'suicide'
  const sendingAll = n.value >= source.value.troops
  return { ap, dp, note, sendingAll }
})

function capFmt(pl = source.value): string {
  const c = rocketCap(pl)
  return c === Infinity ? '∞ (all troops)' : String(c)
}
function selectTarget(pl: { id: number; truce: boolean }): void {
  if (!pl.truce) sel.value = pl.id
}
function dec(): void {
  if (n.value > 1) n.value--
}
function inc(): void {
  if (n.value < cap.value) n.value++
}
function launch(): void {
  if (!canLaunch.value) return
  void store.attack(srcId.value, sel.value, n.value)
}
</script>

<template>
  <ModalShell @close="store.closeModal()">
    <h2>🚀 LAUNCH ATTACK</h2>
    <p class="dimtx">
      Rockets launch only from planets with a 🚀 Rocket Silo, using that planet's own army. Winning a battle grants no
      loot — wipe out the garrison to conquer the planet (then it's safe from attacks for {{ CONQUEST_TRUCE }} turns).
      Spends one ⚔️ Attack card (you have {{ human.hand.ATTACK }}).
    </p>
    <p v-if="sources.length > 1">
      Launch from:
      <button
        v-for="pl in sources"
        :key="pl.id"
        class="tab"
        :class="{ active: pl.id === srcId }"
        @click="srcId = pl.id"
      >
        {{ pl.name }} 🪖{{ pl.troops }}
      </button>
    </p>
    <div
      v-for="pl in targets"
      :key="pl.id"
      class="trow"
      :class="{ sel: pl.id === sel, truce: underTruce(pl) }"
      @click="selectTarget({ id: pl.id, truce: underTruce(pl) })"
    >
      <div class="tinfo">
        <b :style="{ color: state.players[pl.ownerId].color }">{{ pl.name }}</b> — {{ state.players[pl.ownerId].name }}
        <span v-if="underTruce(pl)" class="dimtx">
          🕊️ truce ({{ pl.protectedUntil - state.turn + 1 }} turn{{ pl.protectedUntil - state.turn ? 's' : '' }})
        </span>
      </div>
      <div>🪖{{ pl.troops }} {{ '🛡️'.repeat(pl.buildings.SHIELD || 0) }} 🃏{{ handSize(state.players[pl.ownerId]) }}</div>
    </div>
    <p style="margin-top: 12px">
      Troops aboard:
      <span class="stepper">
        <button @click="dec">−</button><span class="sval">{{ n }}</span><button @click="inc">+</button>
      </span>
      <span class="dimtx">({{ source.name }} garrisons {{ source.troops }}, rocket capacity {{ capFmt() }})</span>
    </p>
    <p>
      <template v-if="preview">
        Your strike {{ preview.ap }} + 🎲0-3 &nbsp;vs&nbsp; defense {{ preview.dp }} + 🎲0-3<br />
        <span v-if="preview.note === 'good'" style="color: #7dff8a">Odds look good.</span>
        <span v-else-if="preview.note === 'close'" style="color: #ffd23d">Close fight — luck decides.</span>
        <span v-else class="warn">Likely suicide.</span>
        <span v-if="preview.sendingAll" class="warn"> Sending everyone leaves {{ source.name }} defenseless!</span>
      </template>
      <span v-else class="warn">All enemy planets are under truce — no valid target.</span>
    </p>
    <div class="mbtns">
      <button class="btn danger" :disabled="!canLaunch" @click="launch">🚀 LAUNCH</button>
      <button class="btn" @click="store.closeModal()">Cancel</button>
    </div>
  </ModalShell>
</template>
