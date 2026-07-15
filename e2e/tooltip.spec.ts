import { expect, test } from '@playwright/test';

/* The v-tooltip directive (floating-ui) replaces native title attributes:
   hovering a bound element must float a styled .fui-tooltip, and leaving
   it must remove the tooltip again. */
test('floating-ui tooltips appear on hover and vanish on leave', async ({
  page,
}) => {
  await page.goto('/');
  // The difficulty picker blocks everything until a mode is chosen.
  await page.locator('.difficulty-card:not(.locked)').first().click();

  // A hand card (Ore is always the first slot) carries a v-tooltip.
  const card = page.locator('#hand .card').first();
  await card.hover();
  const tip = page.locator('.fui-tooltip');
  await expect(tip).toBeVisible();
  await expect(tip).toContainText('Ore');

  // Leaving the card removes the floating element entirely.
  await page.locator('h1').hover();
  await expect(tip).toHaveCount(0);

  // Action buttons keep their tooltips even while disabled (draft phase).
  const recruitBtn = page.locator('#action-zone button').first();
  await expect(recruitBtn).toBeDisabled();
  await recruitBtn.hover();
  await expect(page.locator('.fui-tooltip')).toContainText('Barracks');
});
