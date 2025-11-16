import { test, expect } from '@playwright/test';

test.describe('Health Component (Local)', () => {
  test('should render health component on dashboard', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/');

    // Wait for health component to load
    await page.waitForSelector('[data-testid="health-component"]', { timeout: 10000 });

    // Check if health status component is displayed
    const healthElement = page.locator('[data-testid="health-component"]');
    await expect(healthElement).toBeVisible();
  });

  test('should show loading state initially', async ({ page }) => {
    await page.goto('/');

    // Check for loading spinner or message
    const healthElement = page.locator('[data-testid="health-component"]');
    const text = await healthElement.textContent();
    
    // Should contain either loading message or status
    expect(text).toBeTruthy();
  });

  test('should have retry button available', async ({ page }) => {
    await page.goto('/');

    // Wait for health component
    await page.waitForSelector('[data-testid="health-component"]', { timeout: 10000 });

    // Check for retry or refresh button
    const button = page.locator('button:has-text("Retry"), button:has-text("Refresh")').first();
    await expect(button).toBeVisible();
  });

  test('should navigate to dashboard from home', async ({ page }) => {
    await page.goto('/');

    // Page should be loaded at /
    expect(page.url()).toContain('localhost:5173');

    // Health component should be present
    await page.waitForSelector('[data-testid="health-component"]', { timeout: 10000 });
  });
});
