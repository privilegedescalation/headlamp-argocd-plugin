import { test as setup, request } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  const token = process.env.HEADLAMP_TOKEN;
  const url = process.env.HEADLAMP_URL;

  if (!token || !url) {
    throw new Error('HEADLAMP_TOKEN and HEADLAMP_URL must be set');
  }

  await page.context().addInitScript(() => {
    window.localStorage.setItem('token', 'dummy-token');
  });

  await page.goto(url);

  const context = page.context();
  await context.storageState({ path: 'e2e/.auth/state.json' });
});