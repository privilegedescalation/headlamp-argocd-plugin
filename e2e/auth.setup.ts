import { test as setup } from '@playwright/test';
import { request } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  const token = process.env.HEADLAMP_TOKEN;
  const url = process.env.HEADLAMP_URL;

  if (!token || !url) {
    throw new Error('HEADLAMP_TOKEN and HEADLAMP_URL must be set');
  }

  await page.goto(url);
  await page.evaluate((t) => {
    localStorage.setItem('token', t);
  }, token);
});