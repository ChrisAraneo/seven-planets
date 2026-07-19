export const choice = <T>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)];
