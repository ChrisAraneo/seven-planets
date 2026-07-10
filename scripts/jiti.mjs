// Runs a TypeScript entry point with jiti, resolving the app's "@/…" path
// alias to ./src (jiti does not read tsconfig paths on its own).
// Usage: node scripts/jiti.mjs <entry.ts> [args…]
import { resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

import { createJiti } from 'jiti';

// Run with production builds of vue/vuex: their dev builds carry extra
// checks and warnings that slow headless simulations noticeably.
process.env.NODE_ENV ||= 'production';

const entry = process.argv[2];
if (!entry) {
  console.error('Usage: node scripts/jiti.mjs <entry.ts> [args…]');
  process.exit(1);
}
// Drop the entry from argv so the target script sees its own args at argv[2].
process.argv.splice(2, 1);

// Forward slashes, matching jiti's internal (pathe) resolution: with native
// Windows separators here, "@/x" and a relative import of the same file get
// DIFFERENT module-cache keys and singleton modules load twice.
const p = (rel) => fileURLToPath(new URL(rel, import.meta.url)).replace(/\\/g, '/');
const jiti = createJiti(import.meta.url, {
  alias: {
    '@': p('../apps/browser/src'),
    '@seven-planets/game': p('../libs/game/src/index.ts'),
    '@seven-planets/ai': p('../libs/ai/src/index.ts'),
    '@seven-planets/effects': p('../libs/effects/src/index.ts'),
  },
});
await jiti.import(pathToFileURL(resolve(process.cwd(), entry)).href);
