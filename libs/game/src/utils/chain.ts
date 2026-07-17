import * as lodashModule from 'lodash-es';

/**
 * `chain` must come from the monolithic lodash build: the wrapper methods
 * (`.sortBy`, `.map`, ...) are attached to the wrapper prototype by side
 * effects in `lodash-es/lodash.default.js`, and cherry-picking
 * `import { chain } from 'lodash-es'` lets production tree-shaking drop that
 * wiring (`lodash-es` declares `sideEffects: false`), breaking every chain at
 * runtime. Importing the default build keeps the wiring in the bundle.
 *
 * `@types/lodash-es` does not declare the runtime default export, hence the
 * cast.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- @types/lodash-es omits the runtime default export this file exists to reach
const lodash = (lodashModule as unknown as { default: typeof lodashModule })
  .default;

export const { chain } = lodash;
