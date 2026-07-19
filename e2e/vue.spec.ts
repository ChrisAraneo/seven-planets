import { expect, test } from '@playwright/test';

test('visits the app root url', ({ page }) =>
  page.goto('/').then(() => expect(page.locator('h1')).toContainText('SEVEN')));
