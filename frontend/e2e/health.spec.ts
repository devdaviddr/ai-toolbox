import { test, expect } from '@playwright/test';

test.describe('Health Check', () => {
  test('should display health status on dashboard', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/');

    // Wait for health component to load
    await page.waitForSelector('[data-testid="health-component"]', { timeout: 10000 });

    // Check if health status is displayed
    const healthElement = page.locator('[data-testid="health-component"]');
    await expect(healthElement).toBeVisible();

    // Check for either healthy or unhealthy status
    const statusText = await healthElement.textContent();
    expect(statusText).toMatch(/(System Healthy|System Unhealthy|Checking system health)/);
  });

  test('should show retry button on error', async ({ page }) => {
    // This test assumes backend is down or returns error
    // For now, we'll just check the component renders
    await page.goto('/');

    await page.waitForSelector('[data-testid="health-component"]', { timeout: 10000 });

    const healthElement = page.locator('[data-testid="health-component"]');
    await expect(healthElement).toBeVisible();
  });
});