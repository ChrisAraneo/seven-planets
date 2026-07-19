<script setup lang="ts">
defineProps<{ closeOnOverlay?: boolean }>();
const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <div id="modal-root">
    <div class="overlay" @click.self="closeOnOverlay && emit('close')">
      <div class="modal">
        <slot />
      </div>
    </div>
  </div>
</template>
