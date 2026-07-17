import { match } from 'ts-pattern';

export function getPluralSuffix(count: number): string {
  return match(count)
    .when(
      (candidate) => candidate > 1,
      () => 's',
    )
    .otherwise(() => '');
}
