import { resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

import { createJiti } from 'jiti';
import { chain, noop } from 'lodash-es';
import { match, P } from 'ts-pattern';

const { nullish } = P;

process.env.NODE_ENV ||= 'production';

const exitWithUsage = () =>
  chain(console.error('Usage: node scripts/jiti.mjs <entry.ts> [args…]'))
    .thru(() => process.exit(1))
    .value();

match(process.argv[2]).with(nullish, exitWithUsage).otherwise(noop);

const entry = process.argv[2];
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
