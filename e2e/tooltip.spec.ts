import { expect, test } from '@playwright/test';

test('floating-ui tooltips appear on hover and vanish on leave', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('.difficulty-card:not(.locked)').first().click();

  const card = page.locator('#hand .card').first();
  await card.hover();
  const tip = page.locator('.fui-tooltip');
  await expect(tip).toBeVisible();
  await expect(tip).toContainText('Ore');

  await page.locator('h1').hover();
  await expect(tip).toHaveCount(0);

  const recruitBtn = page.locator('#action-zone button').first();
  await expect(recruitBtn).toBeDisabled();
  await recruitBtn.hover();
  await expect(page.locator('.fui-tooltip')).toContainText('Barracks');
});
