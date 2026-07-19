import { match } from 'ts-pattern';

export const getLevelSuffix = (level: number): string =>
  match(level)
    .when(
      () => level > 1,
      () => ` L${level}`,
    )
    .otherwise(() => '');
