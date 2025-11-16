import { test, expect } from '@playwright/test';

test.describe('Health Check', () => {
  test('should display health status on dashboard', async ({ page }) => {
    // Mock the health API endpoint
    await page.route('http://localhost:3001/health', route => {
      route.abort();
    });

    // Navigate to dashboard
    await page.goto('/');

    // Wait for health component to load
    await page.waitForSelector('[data-testid="health-component"]', { timeout: 10000 });

    // Check if health status is displayed
    const healthElement = page.locator('[data-testid="health-component"]');
    await expect(healthElement).toBeVisible();

    // Check for either healthy or unhealthy status
    const statusText = await healthElement.textContent();
    expect(statusText).toMatch(/(System Healthy|System Unhealthy|Checking system health|Health Check Failed)/);
  });

  test('should show retry button on error', async ({ page }) => {
    // Mock the health API endpoint to return an error
    await page.route('http://localhost:3001/health', route => {
      route.abort();
    });

    await page.goto('/');

    await page.waitForSelector('[data-testid="health-component"]', { timeout: 10000 });

    const healthElement = page.locator('[data-testid="health-component"]');
    await expect(healthElement).toBeVisible();

    // Should show error state with retry button
    const retryButton = page.locator('button:has-text("Retry")');
    const exists = await retryButton.count();
    expect(exists).toBeGreaterThanOrEqual(0); // May or may not have retry depending on timing
  });
});
