import { match } from 'ts-pattern';

export const getPluralSuffix = (count: number): string =>
  match(count)
    .when(
      (candidate) => candidate > 1,
      () => 's',
    )
    .otherwise(() => '');
