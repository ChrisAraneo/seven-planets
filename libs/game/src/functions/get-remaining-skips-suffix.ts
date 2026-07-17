import { match } from 'ts-pattern';

export const getRemainingSkipsSuffix = (skipTurns: number): string =>
  match(skipTurns)
    .when(
      (count) => count > 0,
      (count) => ` (${count} more)`,
    )
    .otherwise(() => '');
