import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for SmartProof AI E2E Tests
 *
 * See https://playwright.dev/docs/test-configuration
 */

export default defineConfig({
  // Look for test files in the "tests/e2e" directory
  testDir: './tests/e2e',

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.FRONTEND_URL || 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Take screenshot on failure
    screenshot: 'only-on-failure',

    // Record video on retry
    video: 'retain-on-failure',

    // Maximum time each action such as `click()` can take
    actionTimeout: 10000,

    // Maximum time for navigation actions
    navigationTimeout: 30000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 }
      },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 }
      },
    },

    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5']
      },
    },

    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12']
      },
    },

    // Tablet viewports
    {
      name: 'iPad',
      use: {
        ...devices['iPad Pro']
      },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'cd frontend && npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  // Global timeout for each test
  timeout: 60000,

  // Global setup/teardown
  // globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
  // globalTeardown: require.resolve('./tests/e2e/global-teardown.ts'),

  // Expect timeout
  expect: {
    timeout: 10000,
  },
});
