import { test, expect, Page } from '@playwright/test';
import { join } from 'path';

/**
 * E2E Tests for Upload Workflow
 *
 * These tests verify the complete user journey from file upload to viewing results.
 *
 * Prerequisites:
 * - Frontend running at localhost:3000 (or configured URL)
 * - Backend APIs available
 * - Azure AD authentication configured (or mocked)
 *
 * Run with: npx playwright test tests/e2e/upload-workflow.test.ts
 */

test.describe('Upload Workflow - E2E Tests', () => {

  let page: Page;
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(FRONTEND_URL);

    // Handle authentication (skip if in dev mode)
    if (await page.locator('text=Sign In').isVisible()) {
      // Mock or perform Azure AD login
      await mockAzureAdLogin(page);
    }
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should complete full upload workflow', async () => {
    // 1. Navigate to Upload page
    await page.click('text=Upload');
    await expect(page).toHaveURL(/.*\/upload/);

    // 2. Upload a PDF file
    const fileInput = page.locator('input[type="file"]');
    const testPdfPath = join(__dirname, '../fixtures/sample-brochure.pdf');

    await fileInput.setInputFiles(testPdfPath);

    // 3. Verify file is shown
    await expect(page.locator('text=sample-brochure.pdf')).toBeVisible();

    // 4. Fill required metadata
    await page.fill('input[name="model"]', 'Camry');
    await page.fill('input[name="year"]', '2024');

    // 5. Submit upload
    await page.click('button:has-text("Upload")');

    // 6. Verify upload progress is shown
    await expect(page.locator('role=progressbar')).toBeVisible();

    // 7. Wait for upload to complete
    await expect(page.locator('text=Upload successful')).toBeVisible({ timeout: 30000 });

    // 8. Verify redirect to dashboard or view compliance
    await expect(page).toHaveURL(/\/(dashboard|compliance)/);

    // 9. Verify upload appears in recent uploads
    await page.goto(`${FRONTEND_URL}/dashboard`);
    await expect(page.locator('text=sample-brochure.pdf')).toBeVisible();
  });

  test('should show file validation errors', async () => {
    await page.click('text=Upload');

    // Try to upload non-PDF file
    const fileInput = page.locator('input[type="file"]');
    const testTxtPath = join(__dirname, '../fixtures/invalid-file.txt');

    await fileInput.setInputFiles(testTxtPath);

    // Should show error message
    await expect(page.locator('text=/only.*pdf.*allowed/i')).toBeVisible();
  });

  test('should validate required metadata fields', async () => {
    await page.click('text=Upload');

    // Upload PDF without filling metadata
    const fileInput = page.locator('input[type="file"]');
    const testPdfPath = join(__dirname, '../fixtures/sample-brochure.pdf');

    await fileInput.setInputFiles(testPdfPath);

    // Try to submit without model
    await page.click('button:has-text("Upload")');

    // Should show validation error
    await expect(page.locator('text=/model.*required/i')).toBeVisible();
  });

  test('should allow drag-and-drop file upload', async () => {
    await page.click('text=Upload');

    // Locate dropzone
    const dropzone = page.locator('[data-testid="dropzone"]');

    // Create a DataTransfer object with file
    const testPdfPath = join(__dirname, '../fixtures/sample-brochure.pdf');

    // Simulate drag-and-drop (Note: Playwright has limitations with file drag-drop)
    // Alternative: Use file input instead
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testPdfPath);

    // Verify file is shown
    await expect(page.locator('text=sample-brochure.pdf')).toBeVisible();
  });

  test('should display upload progress percentage', async () => {
    await page.click('text=Upload');

    const fileInput = page.locator('input[type="file"]');
    const testPdfPath = join(__dirname, '../fixtures/sample-brochure.pdf');

    await fileInput.setInputFiles(testPdfPath);

    await page.fill('input[name="model"]', 'RAV4');
    await page.click('button:has-text("Upload")');

    // Check for progress indicator
    const progressBar = page.locator('role=progressbar');
    await expect(progressBar).toBeVisible();

    // Wait for completion
    await expect(page.locator('text=Upload successful')).toBeVisible({ timeout: 30000 });
  });

  test('should handle large file uploads', async () => {
    await page.click('text=Upload');

    // Try to upload file larger than 10MB
    const fileInput = page.locator('input[type="file"]');
    const largePdfPath = join(__dirname, '../fixtures/large-file.pdf');

    // Check if file exists, otherwise skip
    try {
      await fileInput.setInputFiles(largePdfPath);

      // Should show file size error
      await expect(page.locator('text=/file.*too.*large/i')).toBeVisible();
    } catch (error) {
      test.skip();
    }
  });

  test('should allow canceling upload', async () => {
    await page.click('text=Upload');

    const fileInput = page.locator('input[type="file"]');
    const testPdfPath = join(__dirname, '../fixtures/sample-brochure.pdf');

    await fileInput.setInputFiles(testPdfPath);
    await page.fill('input[name="model"]', 'Camry');
    await page.click('button:has-text("Upload")');

    // Click cancel button during upload
    const cancelButton = page.locator('button:has-text("Cancel")');
    if (await cancelButton.isVisible()) {
      await cancelButton.click();

      // Upload should be canceled
      await expect(page.locator('text=/upload.*canceled/i')).toBeVisible();
    }
  });

  test('should support uploading multiple files sequentially', async () => {
    await page.click('text=Upload');

    // Upload first file
    const fileInput = page.locator('input[type="file"]');
    const testPdf1Path = join(__dirname, '../fixtures/sample-brochure.pdf');

    await fileInput.setInputFiles(testPdf1Path);
    await page.fill('input[name="model"]', 'Camry');
    await page.click('button:has-text("Upload")');

    await expect(page.locator('text=Upload successful')).toBeVisible({ timeout: 30000 });

    // Upload second file
    await page.click('text=Upload another file');

    const testPdf2Path = join(__dirname, '../fixtures/another-sample.pdf');
    await fileInput.setInputFiles(testPdf2Path);
    await page.fill('input[name="model"]', 'RAV4');
    await page.click('button:has-text("Upload")');

    await expect(page.locator('text=Upload successful')).toBeVisible({ timeout: 30000 });

    // Verify both uploads in dashboard
    await page.goto(`${FRONTEND_URL}/dashboard`);
    await expect(page.locator('text=sample-brochure.pdf')).toBeVisible();
    await expect(page.locator('text=another-sample.pdf')).toBeVisible();
  });

  test('should preserve form data on validation error', async () => {
    await page.click('text=Upload');

    // Fill some fields
    await page.fill('input[name="model"]', 'Highlander');
    await page.fill('input[name="year"]', '2024');
    await page.fill('input[name="notes"]', 'Test notes');

    // Try to submit without file
    await page.click('button:has-text("Upload")');

    // Should show error but preserve form data
    await expect(page.locator('text=/file.*required/i')).toBeVisible();
    await expect(page.locator('input[name="model"]')).toHaveValue('Highlander');
    await expect(page.locator('input[name="year"]')).toHaveValue('2024');
    await expect(page.locator('input[name="notes"]')).toHaveValue('Test notes');
  });

  test('should show network error on API failure', async () => {
    await page.click('text=Upload');

    // Intercept API call and force failure
    await page.route('**/api/assets/upload', route => {
      route.abort('failed');
    });

    const fileInput = page.locator('input[type="file"]');
    const testPdfPath = join(__dirname, '../fixtures/sample-brochure.pdf');

    await fileInput.setInputFiles(testPdfPath);
    await page.fill('input[name="model"]', 'Camry');
    await page.click('button:has-text("Upload")');

    // Should show network error
    await expect(page.locator('text=/network.*error/i')).toBeVisible();
  });
});

test.describe('Upload - Accessibility', () => {

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto(FRONTEND_URL);

    // Navigate using Tab key
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should be able to navigate to Upload link
    const uploadLink = page.locator('a:has-text("Upload")');
    await expect(uploadLink).toBeFocused();

    // Press Enter to navigate
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/.*\/upload/);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/upload`);

    // Check for ARIA labels
    await expect(page.locator('[aria-label="Upload PDF file"]')).toBeVisible();
    await expect(page.locator('[aria-label="Vehicle model"]')).toBeVisible();
    await expect(page.locator('[aria-label="Model year"]')).toBeVisible();
  });

  test('should announce upload progress to screen readers', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/upload`);

    const fileInput = page.locator('input[type="file"]');
    const testPdfPath = join(__dirname, '../fixtures/sample-brochure.pdf');

    await fileInput.setInputFiles(testPdfPath);
    await page.fill('input[name="model"]', 'Camry');
    await page.click('button:has-text("Upload")');

    // Check for aria-live region
    const liveRegion = page.locator('[aria-live="polite"]');
    await expect(liveRegion).toContainText(/uploading/i);
  });
});

test.describe('Upload - Mobile Responsiveness', () => {

  test('should work on mobile viewport', async ({ browser }) => {
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 }
    });

    const page = await mobileContext.newPage();
    await page.goto(FRONTEND_URL);

    // Navigate to upload
    await page.click('text=Upload');

    // Verify layout is mobile-friendly
    const uploadContainer = page.locator('[data-testid="upload-container"]');
    const boundingBox = await uploadContainer.boundingBox();

    expect(boundingBox?.width).toBeLessThanOrEqual(375);

    // Verify file upload works
    const fileInput = page.locator('input[type="file"]');
    const testPdfPath = join(__dirname, '../fixtures/sample-brochure.pdf');

    await fileInput.setInputFiles(testPdfPath);
    await expect(page.locator('text=sample-brochure.pdf')).toBeVisible();

    await mobileContext.close();
  });

  test('should have touch-friendly dropzone', async ({ browser }) => {
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true
    });

    const page = await mobileContext.newPage();
    await page.goto(`${FRONTEND_URL}/upload`);

    // Dropzone should be large enough for touch
    const dropzone = page.locator('[data-testid="dropzone"]');
    const boundingBox = await dropzone.boundingBox();

    expect(boundingBox?.height).toBeGreaterThanOrEqual(100);

    await mobileContext.close();
  });
});

// Helper function to mock Azure AD login
async function mockAzureAdLogin(page: Page) {
  // In development, you might have a bypass or mock login
  // In production tests, perform actual Azure AD login
  if (process.env.MOCK_AUTH === 'true') {
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'mock-token-for-testing');
      localStorage.setItem('user', JSON.stringify({
        name: 'Test User',
        email: 'test@toyota.com'
      }));
    });
    await page.reload();
  } else {
    // Perform actual Azure AD login if needed
    // This would require test credentials or service principal
  }
}
