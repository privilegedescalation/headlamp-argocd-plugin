import { test, expect } from '@playwright/test';

test.describe('ArgoCD plugin smoke tests', () => {
  test('sidebar contains ArgoCD entry', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.getByRole('navigation', { name: 'Navigation' });
    await expect(sidebar).toBeVisible({ timeout: 15_000 });
    await expect(sidebar.getByRole('button', { name: /argocd/i })).toBeVisible();
  });

  test('ArgoCD sidebar entry navigates to applications list', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.getByRole('navigation', { name: 'Navigation' });
    await expect(sidebar).toBeVisible({ timeout: 15_000 });

    const argocdEntry = sidebar.getByRole('button', { name: /argocd/i });
    await expect(argocdEntry).toBeVisible();
    await argocdEntry.click();

    await expect(page).toHaveURL(/\/argocd/);
    await expect(page.getByRole('heading', { name: /argo.*cd|applications/i })).toBeVisible();
  });

  test('applications list page renders', async ({ page }) => {
    await page.goto('/c/main/argocd');

    await expect(page.getByRole('heading', { name: /argo.*cd|applications/i })).toBeVisible({
      timeout: 15_000,
    });

    const hasTable = await page.locator('table').first().isVisible().catch(() => false);
    const hasContent = await page.locator('text=/application|sync|health/i').first().isVisible().catch(() => false);
    expect(hasTable || hasContent).toBe(true);
  });

  test('plugin settings page shows argocd plugin entry', async ({ page }) => {
    await page.goto('/settings/plugins');

    const pluginEntry = page.locator('text=/argocd|argo.*cd/i').first();
    await expect(pluginEntry).toBeVisible({ timeout: 30_000 });
  });
});
