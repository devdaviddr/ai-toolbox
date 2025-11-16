import { test, expect } from '@playwright/test';

test.describe('Settings Tabs', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to settings page
    await page.goto('/settings');
  });

  test('should display settings page with tabs', async ({ page }) => {
    // Check page title and description
    await expect(page.getByText('Settings')).toBeVisible();
    await expect(page.getByText('System configuration and status')).toBeVisible();

    // Check tabs are present
    await expect(page.getByText('System Status')).toBeVisible();
    await expect(page.getByText('User Account')).toBeVisible();
  });

  test('should show system status tab by default', async ({ page }) => {
    // System status tab should be active by default
    await expect(page.locator('[aria-selected="true"]').filter({ hasText: 'System Status' })).toBeVisible();

    // System status content should be visible
    await expect(page.getByTestId('system-status-component')).toBeVisible();
  });

  test('should switch to user account tab when clicked', async ({ page }) => {
    // Click on User Account tab
    await page.getByText('User Account').click();

    // User account tab should be active
    await expect(page.locator('[aria-selected="true"]').filter({ hasText: 'User Account' })).toBeVisible();

    // User account content should be visible
    await expect(page.getByText('Account Details')).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Focus on the tabs
    await page.getByLabel('Settings tabs').focus();

    // Initially on system status
    await expect(page.locator('[aria-selected="true"]').filter({ hasText: 'System Status' })).toBeVisible();

    // Press right arrow to navigate to user account
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[aria-selected="true"]').filter({ hasText: 'User Account' })).toBeVisible();

    // Press left arrow to navigate back to system status
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('[aria-selected="true"]').filter({ hasText: 'System Status' })).toBeVisible();
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    // Check tabs have proper ARIA labels
    const tabsContainer = page.getByLabel('Settings tabs');
    await expect(tabsContainer).toBeVisible();

    // Check tab panels have proper roles
    const systemStatusPanel = page.locator('#system-status-panel');
    await expect(systemStatusPanel).toHaveAttribute('role', 'tabpanel');

    const userAccountPanel = page.locator('#user-account-panel');
    await expect(userAccountPanel).toHaveAttribute('role', 'tabpanel');
  });

  test('should be responsive on mobile', async ({ page, isMobile }) => {
    if (!isMobile) {
      // Skip this test on desktop
      return;
    }

    // Check that tabs are still functional on mobile
    await expect(page.getByText('System Status')).toBeVisible();
    await expect(page.getByText('User Account')).toBeVisible();

    // Test touch interaction by clicking (simulating tap)
    await page.getByText('User Account').tap();
    await expect(page.locator('[aria-selected="true"]').filter({ hasText: 'User Account' })).toBeVisible();
  });

  test('should lazy load tab components', async ({ page }) => {
    // Initially should show loading for system status
    await expect(page.getByText('Loading...')).toBeVisible();

    // After loading, content should appear
    await expect(page.getByTestId('system-status-component')).toBeVisible();
  });

  test('should maintain tab state when navigating away and back', async ({ page }) => {
    // Switch to user account tab
    await page.getByText('User Account').click();
    await expect(page.locator('[aria-selected="true"]').filter({ hasText: 'User Account' })).toBeVisible();

    // Navigate away to dashboard
    await page.goto('/');

    // Navigate back to settings
    await page.goto('/settings');

    // Should still be on system status (default state)
    await expect(page.locator('[aria-selected="true"]').filter({ hasText: 'System Status' })).toBeVisible();
  });
});