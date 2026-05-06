import { test as setup, expect, Page } from '@playwright/test';

const AUTH_STATE_PATH = 'e2e/.auth/state.json';

async function authenticateWithToken(page: Page, token: string): Promise<void> {
  await page.goto('/');
  await page.waitForURL(/\/(login|token)$/);

  if (page.url().includes('/login')) {
    const useTokenBtn = page.getByRole('button', { name: /use a token/i });
    await useTokenBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await useTokenBtn.click();
    await page.waitForURL('**/token');
  }

  await page.getByRole('textbox', { name: /id token/i }).fill(token);
  await page.getByRole('button', { name: /authenticate/i }).click();

  await expect(page.getByRole('navigation', { name: 'Navigation' })).toBeVisible({
    timeout: 15_000,
  });
}

setup('authenticate with Headlamp', async ({ page }) => {
  const token = process.env.HEADLAMP_TOKEN;

  if (!token) {
    throw new Error('Set HEADLAMP_TOKEN for token auth');
  }

  await authenticateWithToken(page, token);

  await page.context().storageState({ path: AUTH_STATE_PATH });
});