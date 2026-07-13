import { match } from 'ts-pattern';

// 's' when a count reads as plural in log lines (2 troops / 1 troop).
export function pluralSuffix(count: number): string {
  return match(count)
    .when(
      (candidate) => candidate > 1,
      () => 's',
    )
    .otherwise(() => '');
}
