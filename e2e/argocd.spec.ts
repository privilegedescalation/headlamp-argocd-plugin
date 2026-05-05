import { test, expect } from '@playwright/test';

test.describe('argocd plugin smoke tests', () => {
  test('sidebar contains argocd entry', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.getByRole('navigation', { name: 'Navigation' });
    await expect(sidebar).toBeVisible({ timeout: 15_000 });
    await expect(sidebar.getByRole('button', { name: /argocd/i })).toBeVisible();
  });

  test('argocd sidebar entry navigates to argocd view', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.getByRole('navigation', { name: 'Navigation' });
    await expect(sidebar).toBeVisible({ timeout: 15_000 });

    const entry = sidebar.getByRole('button', { name: /argocd/i });
    await expect(entry).toBeVisible();
    await entry.click();

    await expect(page).toHaveURL(/argocd/);
    await expect(page.getByRole('heading', { name: /argocd/i })).toBeVisible();
  });

  test('argocd page renders content', async ({ page }) => {
    await page.goto('/c/main/argocd');

    await expect(page.getByRole('heading', { name: /argocd/i })).toBeVisible({
      timeout: 15_000,
    });

    const hasTable = await page.locator('table').first().isVisible().catch(() => false);
    const hasContent = await page.locator('[class*="Mui"]').first().isVisible().catch(() => false);
    expect(hasTable || hasContent).toBe(true);
  });

  test('plugin settings page shows argocd plugin entry', async ({ page }) => {
    await page.goto('/settings/plugins');

    const pluginEntry = page.locator('text=/argocd/i').first();
    await expect(pluginEntry).toBeVisible({ timeout: 30_000 });
  });
});