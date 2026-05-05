import { test, expect } from '@playwright/test';

test.describe('ArgoCD plugin smoke tests', () => {
  test('sidebar contains ArgoCD entry', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.getByRole('navigation', { name: 'Navigation' });
    await expect(sidebar).toBeVisible({ timeout: 15_000 });
    await expect(sidebar.getByRole('button', { name: 'ArgoCD' })).toBeVisible();
  });

  test('applications list page loads', async ({ page }) => {
    await page.goto('/c/main/argocd');

    await expect(
      page.getByRole('heading', { name: /argo.*cd/i })
    ).toBeVisible({ timeout: 15_000 });
  });
});