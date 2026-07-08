// Runs a TypeScript entry point with jiti, resolving the app's "@/…" path
// alias to ./src (jiti does not read tsconfig paths on its own).
// Usage: node scripts/jiti.mjs <entry.ts> [args…]
import { resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

import { createJiti } from 'jiti';

// Run with production builds of vue/pinia: their dev builds log a Node-only
// "Pinia instance not found in context" warning on EVERY store access, which
// slows headless simulations by an order of magnitude.
process.env.NODE_ENV ||= 'production';

const entry = process.argv[2];
if (!entry) {
  console.error('Usage: node scripts/jiti.mjs <entry.ts> [args…]');
  process.exit(1);
}
// Drop the entry from argv so the target script sees its own args at argv[2].
process.argv.splice(2, 1);

const jiti = createJiti(import.meta.url, {
  alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) },
});
await jiti.import(pathToFileURL(resolve(process.cwd(), entry)).href);
