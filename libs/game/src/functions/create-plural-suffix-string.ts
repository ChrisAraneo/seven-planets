import { match } from 'ts-pattern';

// TODO: OK, ale wrzucić do folderu związanego z logowaniem
export const createPluralSuffixString = (count: number): string =>
  match(count)
    .when(
      (candidate) => candidate > 1,
      () => 's',
    )
    .otherwise(() => '');
