import { expect, test } from '@playwright/test';

test('an ?auto demo game plays turns by itself', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/?auto');

  await expect(page.locator('#turn-ind')).toContainText(/Turn \d+/, {
    timeout: 30_000,
  });
  await expect
    .poll(
      async () => {
        const text = (await page.locator('#turn-ind').textContent()) ?? '';
        const m = /Turn (\d+)/.exec(text);
        return m ? Number(m[1]) : 0;
      },
      { timeout: 60_000 },
    )
    .toBeGreaterThan(2);

  expect(errors).toEqual([]);
});
