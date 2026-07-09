import { expect, test } from '@playwright/test';

// Full-stack smoke test: "?auto" seats the AI agent at every chair (including
// the human's), so a real game runs through the Vuex store actions, the
// engine loop and the canvas effects. The game must visibly progress.
test('an ?auto demo game plays turns by itself', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/?auto');

  // The turn indicator must advance past the first draft within a minute.
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
