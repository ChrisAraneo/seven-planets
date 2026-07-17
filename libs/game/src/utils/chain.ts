import * as lodashModule from 'lodash-es';

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- @types/lodash-es omits the runtime default export this file exists to reach
const lodash = (lodashModule as unknown as { default: typeof lodashModule })
  .default;

export const { chain } = lodash;
