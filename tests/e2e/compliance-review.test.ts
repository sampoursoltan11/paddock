import { test, expect, Page } from '@playwright/test';
import { join } from 'path';

/**
 * E2E Tests for Compliance Review Workflow
 *
 * These tests verify the complete compliance review user journey.
 *
 * Prerequisites:
 * - Frontend running
 * - Backend APIs available
 * - Test data available (uploaded PDFs with compliance results)
 *
 * Run with: npx playwright test tests/e2e/compliance-review.test.ts
 */

test.describe('Compliance Review - E2E Tests', () => {

  let page: Page;
  let uploadId: string;
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

  test.beforeAll(async ({ browser }) => {
    // Setup: Upload a test file to get compliance results
    const setupPage = await browser.newPage();
    await setupPage.goto(FRONTEND_URL);

    // Mock auth if needed
    if (await setupPage.locator('text=Sign In').isVisible()) {
      await mockAzureAdLogin(setupPage);
    }

    // Upload test file
    await setupPage.click('text=Upload');
    const fileInput = setupPage.locator('input[type="file"]');
    const testPdfPath = join(__dirname, '../fixtures/sample-brochure.pdf');
    await fileInput.setInputFiles(testPdfPath);
    await setupPage.fill('input[name="model"]', 'Camry');
    await setupPage.fill('input[name="year"]', '2024');
    await setupPage.click('button:has-text("Upload")');

    // Wait for upload and get upload ID
    await expect(setupPage.locator('text=Upload successful')).toBeVisible({ timeout: 30000 });

    // Extract upload ID from URL or response
    uploadId = await setupPage.evaluate(() => {
      const stateStr = localStorage.getItem('lastUploadId');
      return stateStr || 'test-upload-id';
    });

    // Wait for processing to complete
    await setupPage.waitForTimeout(45000); // Wait for agent pipeline

    await setupPage.close();
  });

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(FRONTEND_URL);

    if (await page.locator('text=Sign In').isVisible()) {
      await mockAzureAdLogin(page);
    }
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should view compliance report', async () => {
    // Navigate to compliance review page
    await page.click('text=Compliance');
    await expect(page).toHaveURL(/.*\/compliance/);

    // Should see list of uploaded files
    await expect(page.locator('text=sample-brochure.pdf')).toBeVisible();

    // Click to view detailed report
    await page.click('text=sample-brochure.pdf');

    // Should see compliance report details
    await expect(page.locator('text=Compliance Report')).toBeVisible();
    await expect(page.locator('text=Overall Score')).toBeVisible();

    // Should see score percentage
    const scoreElement = page.locator('[data-testid="overall-score"]');
    await expect(scoreElement).toBeVisible();

    const scoreText = await scoreElement.textContent();
    expect(scoreText).toMatch(/\d+%/);
  });

  test('should display violations by category', async () => {
    await page.goto(`${FRONTEND_URL}/compliance/${uploadId}`);

    // Should see category tabs or sections
    await expect(page.locator('text=Brand Guidelines')).toBeVisible();
    await expect(page.locator('text=Legal Compliance')).toBeVisible();
    await expect(page.locator('text=Product Information')).toBeVisible();
    await expect(page.locator('text=Image Quality')).toBeVisible();

    // Click on a category
    await page.click('text=Brand Guidelines');

    // Should see violations in that category
    const violationsList = page.locator('[data-testid="violations-list"]');
    await expect(violationsList).toBeVisible();
  });

  test('should filter violations by severity', async () => {
    await page.goto(`${FRONTEND_URL}/compliance/${uploadId}`);

    // Should see severity filter
    await page.click('[data-testid="severity-filter"]');

    // Select "Critical" only
    await page.click('text=Critical');

    // Should only show critical violations
    const violations = page.locator('[data-severity="critical"]');
    const criticalCount = await violations.count();

    // Verify no high/medium/low violations are shown
    const nonCriticalViolations = page.locator('[data-severity="high"], [data-severity="medium"], [data-severity="low"]');
    await expect(nonCriticalViolations).toHaveCount(0);
  });

  test('should expand/collapse violation details', async () => {
    await page.goto(`${FRONTEND_URL}/compliance/${uploadId}`);

    // Find first violation
    const firstViolation = page.locator('[data-testid="violation-item"]').first();

    // Should have expand button
    const expandButton = firstViolation.locator('[aria-label="Expand details"]');
    await expandButton.click();

    // Should show detailed information
    await expect(firstViolation.locator('text=Location:')).toBeVisible();
    await expect(firstViolation.locator('text=Recommendation:')).toBeVisible();

    // Collapse
    await expandButton.click();
    await expect(firstViolation.locator('text=Location:')).not.toBeVisible();
  });

  test('should download HTML report', async () => {
    await page.goto(`${FRONTEND_URL}/compliance/${uploadId}`);

    // Click download HTML button
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download HTML")');

    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toMatch(/.*\.html$/);

    // Save and verify content
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('should download PDF report', async () => {
    await page.goto(`${FRONTEND_URL}/compliance/${uploadId}`);

    // Click download PDF button
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download PDF")');

    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toMatch(/.*\.pdf$/);
  });

  test('should show compliance score visualization', async () => {
    await page.goto(`${FRONTEND_URL}/compliance/${uploadId}`);

    // Should have score gauge or chart
    const scoreGauge = page.locator('[data-testid="score-gauge"]');
    await expect(scoreGauge).toBeVisible();

    // Should show color coding based on score
    // Green: 80-100, Yellow: 60-79, Red: 0-59
    const scoreText = await page.locator('[data-testid="overall-score"]').textContent();
    const score = parseInt(scoreText?.match(/\d+/)?.[0] || '0');

    if (score >= 80) {
      await expect(scoreGauge).toHaveClass(/green|success/);
    } else if (score >= 60) {
      await expect(scoreGauge).toHaveClass(/yellow|warning/);
    } else {
      await expect(scoreGauge).toHaveClass(/red|error/);
    }
  });

  test('should navigate between violations', async () => {
    await page.goto(`${FRONTEND_URL}/compliance/${uploadId}`);

    // Should have navigation controls if multiple violations
    const nextButton = page.locator('button:has-text("Next Violation")');
    const prevButton = page.locator('button:has-text("Previous Violation")');

    if (await nextButton.isVisible()) {
      // Track current violation
      const firstViolationText = await page.locator('[data-testid="current-violation"]').textContent();

      // Click next
      await nextButton.click();

      // Should show different violation
      const secondViolationText = await page.locator('[data-testid="current-violation"]').textContent();
      expect(secondViolationText).not.toBe(firstViolationText);

      // Click previous
      await prevButton.click();

      // Should go back to first violation
      const backToFirstText = await page.locator('[data-testid="current-violation"]').textContent();
      expect(backToFirstText).toBe(firstViolationText);
    }
  });

  test('should show original PDF alongside violations', async () => {
    await page.goto(`${FRONTEND_URL}/compliance/${uploadId}`);

    // Should have PDF viewer
    const pdfViewer = page.locator('[data-testid="pdf-viewer"]');
    await expect(pdfViewer).toBeVisible();

    // Click on a violation
    await page.click('[data-testid="violation-item"]');

    // PDF should scroll to relevant page
    const pageIndicator = page.locator('[data-testid="current-page"]');
    await expect(pageIndicator).toBeVisible();
  });

  test('should allow approving compliant documents', async () => {
    await page.goto(`${FRONTEND_URL}/compliance/${uploadId}`);

    // Check if approve button is visible (only for compliant docs)
    const approveButton = page.locator('button:has-text("Approve")');

    if (await approveButton.isVisible()) {
      await approveButton.click();

      // Should show confirmation dialog
      await expect(page.locator('text=Are you sure you want to approve')).toBeVisible();

      // Confirm
      await page.click('button:has-text("Confirm")');

      // Should show success message
      await expect(page.locator('text=Document approved')).toBeVisible();

      // Status should be updated
      await expect(page.locator('text=Status: Approved')).toBeVisible();
    }
  });

  test('should allow rejecting non-compliant documents', async () => {
    await page.goto(`${FRONTEND_URL}/compliance/${uploadId}`);

    // Click reject button
    const rejectButton = page.locator('button:has-text("Reject")');
    await rejectButton.click();

    // Should show rejection reason dialog
    await expect(page.locator('text=Rejection Reason')).toBeVisible();

    // Enter reason
    await page.fill('textarea[name="rejectionReason"]', 'Multiple critical brand violations');

    // Confirm rejection
    await page.click('button:has-text("Confirm Rejection")');

    // Should show success message
    await expect(page.locator('text=Document rejected')).toBeVisible();

    // Status should be updated
    await expect(page.locator('text=Status: Rejected')).toBeVisible();
  });

  test('should show processing history', async () => {
    await page.goto(`${FRONTEND_URL}/compliance/${uploadId}`);

    // Click on history tab
    await page.click('text=Processing History');

    // Should show agent execution timeline
    await expect(page.locator('text=Parser Agent')).toBeVisible();
    await expect(page.locator('text=Image Analysis Agent')).toBeVisible();
    await expect(page.locator('text=Search Agent')).toBeVisible();
    await expect(page.locator('text=Compliance Agent')).toBeVisible();
    await expect(page.locator('text=Critic Agent')).toBeVisible();

    // Each agent should have status and duration
    const parserAgent = page.locator('[data-agent="parser-agent"]');
    await expect(parserAgent.locator('text=Completed')).toBeVisible();
    await expect(parserAgent.locator('[data-testid="duration"]')).toBeVisible();
  });

  test('should search/filter violations', async () => {
    await page.goto(`${FRONTEND_URL}/compliance/${uploadId}`);

    // Enter search term
    await page.fill('input[placeholder*="Search violations"]', 'logo');

    // Should filter violations containing "logo"
    const visibleViolations = page.locator('[data-testid="violation-item"]:visible');
    const count = await visibleViolations.count();

    for (let i = 0; i < count; i++) {
      const text = await visibleViolations.nth(i).textContent();
      expect(text?.toLowerCase()).toContain('logo');
    }
  });

  test('should show image analysis results', async () => {
    await page.goto(`${FRONTEND_URL}/compliance/${uploadId}`);

    // Navigate to Image Analysis tab
    await page.click('text=Image Analysis');

    // Should show detected images
    await expect(page.locator('[data-testid="detected-images"]')).toBeVisible();

    // Should show logo detection results
    await expect(page.locator('text=Logo Detection')).toBeVisible();

    // Should show color analysis
    await expect(page.locator('text=Brand Colors')).toBeVisible();

    // Should show quality assessment
    await expect(page.locator('text=Image Quality')).toBeVisible();
  });

  test('should export compliance summary', async () => {
    await page.goto(`${FRONTEND_URL}/compliance/${uploadId}`);

    // Click export button
    await page.click('button:has-text("Export Summary")');

    // Should show export options
    await expect(page.locator('text=Export Format')).toBeVisible();

    // Select JSON
    await page.click('text=JSON');

    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download")');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/.*\.json$/);
  });

  test('should handle missing compliance report gracefully', async () => {
    await page.goto(`${FRONTEND_URL}/compliance/non-existent-id`);

    // Should show error message
    await expect(page.locator('text=Report not found')).toBeVisible();

    // Should have link back to dashboard
    const backButton = page.locator('a:has-text("Back to Dashboard")');
    await expect(backButton).toBeVisible();
  });
});

test.describe('Compliance Review - Accessibility', () => {

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto(FRONTEND_URL);

    // Navigate to compliance page
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Should focus on Compliance link

    const complianceLink = page.locator('a:has-text("Compliance")');
    await expect(complianceLink).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/.*\/compliance/);
  });

  test('should announce violations to screen readers', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/compliance/test-upload-id`);

    // Check for ARIA labels
    const violationsList = page.locator('[role="list"][aria-label*="violations"]');
    await expect(violationsList).toBeVisible();

    // Each violation should have proper ARIA
    const firstViolation = page.locator('[role="listitem"]').first();
    await expect(firstViolation).toHaveAttribute('aria-label');
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/compliance/test-upload-id`);

    // Check heading levels
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);

    const h2s = page.locator('h2');
    const h2Count = await h2s.count();
    expect(h2Count).toBeGreaterThan(0);
  });
});

test.describe('Compliance Review - Performance', () => {

  test('should load report within 3 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(`${FRONTEND_URL}/compliance/test-upload-id`);

    await expect(page.locator('[data-testid="compliance-report"]')).toBeVisible();

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle reports with 100+ violations', async ({ page }) => {
    // This would require a test upload with many violations
    await page.goto(`${FRONTEND_URL}/compliance/large-report-id`);

    // Should use virtualization or pagination
    const violationsList = page.locator('[data-testid="violations-list"]');
    await expect(violationsList).toBeVisible();

    // Scroll should be smooth
    await violationsList.evaluate(el => el.scrollTop = 1000);
    await page.waitForTimeout(500);

    // Should still be responsive
    await expect(violationsList).toBeVisible();
  });
});

// Helper function to mock Azure AD login
async function mockAzureAdLogin(page: Page) {
  if (process.env.MOCK_AUTH === 'true') {
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'mock-token-for-testing');
      localStorage.setItem('user', JSON.stringify({
        name: 'Test User',
        email: 'test@toyota.com'
      }));
    });
    await page.reload();
  }
}
