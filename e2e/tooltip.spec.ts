import { expect, test } from '@playwright/test';

test('floating-ui tooltips appear on hover and vanish on leave', ({ page }) =>
  page
    .goto('/')
    .then(() => page.locator('.difficulty-card:not(.locked)').first().click())
    .then(() => page.locator('#hand .card').first().hover())
    .then(() => expect(page.locator('.fui-tooltip')).toBeVisible())
    .then(() => expect(page.locator('.fui-tooltip')).toContainText('Ore'))
    .then(() => page.locator('h1').hover())
    .then(() => expect(page.locator('.fui-tooltip')).toHaveCount(0))
    .then(() =>
      expect(page.locator('#action-zone button').first()).toBeDisabled(),
    )
    .then(() => page.locator('#action-zone button').first().hover())
    .then(() =>
      expect(page.locator('.fui-tooltip')).toContainText('Barracks'),
    ));
