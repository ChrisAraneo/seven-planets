import { chain } from '../utils/chain';

export const shuffleArray = <T>(items: T[]): T[] =>
  chain(items.map((item) => ({ item, key: Math.random() })))
    .sortBy(({ key }) => key)
    .map(({ item }) => item)
    .value();
