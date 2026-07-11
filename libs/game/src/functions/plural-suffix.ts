import { match } from 'ts-pattern';

// 's' when a count reads as plural in log lines (2 troops / 1 troop).
export function pluralSuffix(n: number): string {
  return match(n)
    .when(
      (x) => x > 1,
      () => 's',
    )
    .otherwise(() => '');
}
