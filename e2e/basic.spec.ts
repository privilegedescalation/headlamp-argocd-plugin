import { test, expect } from '@playwright/test';

test.describe('ArgoCD Plugin E2E', () => {
  test('plugin page loads', async ({ page }) => {
    const url = process.env.HEADLAMP_URL;
    if (!url) {
      throw new Error('HEADLAMP_URL must be set');
    }

    await page.goto(url);
    await page.waitForLoadState('networkidle');

    const title = await page.title();
    expect(title).toBeTruthy();
  });
});