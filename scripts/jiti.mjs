import { resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

import { createJiti } from 'jiti';

process.env.NODE_ENV ||= 'production';

const entry = process.argv[2];
if (!entry) {
  console.error('Usage: node scripts/jiti.mjs <entry.ts> [args…]');
  process.exit(1);
}
process.argv.splice(2, 1);

const p = (rel) =>
  fileURLToPath(new URL(rel, import.meta.url)).replace(/\\/g, '/');
const jiti = createJiti(import.meta.url, {
  alias: {
    '@': p('../apps/browser/src'),
    '@seven-planets/game': p('../libs/game/src/index.ts'),
    '@seven-planets/ai': p('../libs/ai/src/index.ts'),
    '@seven-planets/effects': p('../libs/effects/src/index.ts'),
  },
});
await jiti.import(pathToFileURL(resolve(process.cwd(), entry)).href);
