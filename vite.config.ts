import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./apps/browser/src', import.meta.url)),
      '@seven-planets/game': fileURLToPath(
        new URL('./libs/game/src/index.ts', import.meta.url),
      ),
      '@seven-planets/ai': fileURLToPath(
        new URL('./libs/ai/src/index.ts', import.meta.url),
      ),
      '@seven-planets/effects': fileURLToPath(
        new URL('./libs/effects/src/index.ts', import.meta.url),
      ),
    },
  },
})
