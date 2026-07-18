import { match } from 'ts-pattern';

// TODO: Logging
export const getExtraTurnSuffix = (slot: number): string =>
  match(slot)
    .when(
      (count) => count > 0,
      () => ' (extra planet turn)',
    )
    .otherwise(() => '');
