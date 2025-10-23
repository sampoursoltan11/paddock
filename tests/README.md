# SmartProof AI - Test Suite

This directory contains comprehensive test examples for the SmartProof AI PoC project.

## Test Structure

```
tests/
├── unit/                      # Unit tests for individual components
│   ├── backend-functions.test.ts      # Azure Functions tests
│   └── frontend-components.test.tsx   # React component tests
├── integration/               # Integration tests for workflows
│   ├── agent-workflow.test.ts        # AI agent pipeline tests
│   └── api-endpoints.test.ts         # API integration tests
├── e2e/                       # End-to-end tests
│   ├── upload-workflow.test.ts       # Complete upload flow
│   └── compliance-review.test.ts     # Compliance review flow
├── fixtures/                  # Test data files
│   ├── sample-brochure.pdf
│   ├── toyota-logo.jpg
│   └── invalid-file.txt
└── README.md                  # This file
```

## Prerequisites

### Unit Tests
```bash
npm install --save-dev jest @jest/globals @types/jest ts-jest
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

### Integration Tests
```bash
# Requires Azure resources provisioned
# Configure environment variables in .env.test
```

### E2E Tests
```bash
npm install --save-dev @playwright/test
npx playwright install
```

## Running Tests

### All Tests
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage
```

### Unit Tests Only
```bash
# Backend functions
npm test -- tests/unit/backend-functions.test.ts

# Frontend components
npm test -- tests/unit/frontend-components.test.tsx

# All unit tests
npm test -- tests/unit/
```

### Integration Tests
```bash
# Agent workflow
npm run test:integration -- tests/integration/agent-workflow.test.ts

# API endpoints
npm run test:integration -- tests/integration/api-endpoints.test.ts

# All integration tests
npm run test:integration
```

### E2E Tests
```bash
# Upload workflow
npx playwright test tests/e2e/upload-workflow.test.ts

# Compliance review
npx playwright test tests/e2e/compliance-review.test.ts

# All E2E tests
npx playwright test tests/e2e/

# Run in headed mode (see browser)
npx playwright test tests/e2e/ --headed

# Run specific browser
npx playwright test tests/e2e/ --project=chromium
```

## Test Configuration

### Jest Configuration (package.json)
```json
{
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "roots": ["<rootDir>/tests"],
    "testMatch": ["**/*.test.ts", "**/*.test.tsx"],
    "collectCoverageFrom": [
      "backend/**/*.ts",
      "frontend/src/**/*.{ts,tsx}",
      "ai-agents/**/*.ts",
      "!**/*.d.ts",
      "!**/node_modules/**"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 70,
        "functions": 70,
        "lines": 70,
        "statements": 70
      }
    }
  }
}
```

### Playwright Configuration (playwright.config.ts)
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.FRONTEND_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Environment Variables

Create a `.env.test` file for integration and E2E tests:

```env
# Azure Resources
AZURE_STORAGE_CONNECTION_STRING=<your-connection-string>
AZURE_OPENAI_ENDPOINT=<your-endpoint>
AZURE_OPENAI_KEY=<your-key>
AZURE_AI_SEARCH_ENDPOINT=<your-endpoint>
AZURE_AI_SEARCH_KEY=<your-key>
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=<your-endpoint>
AZURE_DOCUMENT_INTELLIGENCE_KEY=<your-key>
AZURE_COMPUTER_VISION_ENDPOINT=<your-endpoint>
AZURE_COMPUTER_VISION_KEY=<your-key>

# API Configuration
API_BASE_URL=http://localhost:7071/api
FRONTEND_URL=http://localhost:3000

# Testing Options
MOCK_AUTH=true
REQUIRE_AUTH=false
```

## Test Fixtures

### Creating Test Fixtures

Place test files in `tests/fixtures/`:

```bash
tests/fixtures/
├── sample-brochure.pdf       # Valid Toyota marketing PDF
├── another-sample.pdf        # Another valid PDF
├── large-file.pdf            # >10MB file for size testing
├── corrupted.pdf             # Corrupted PDF for error handling
├── invalid-file.txt          # Non-PDF file
├── toyota-logo.jpg           # Toyota logo image
└── brand-colors.jpg          # Image with brand colors
```

## Mocking Azure Services

For unit tests, mock Azure SDK calls:

```typescript
import { jest } from '@jest/globals';

// Mock Azure Storage
jest.mock('@azure/storage-blob', () => ({
  BlobServiceClient: {
    fromConnectionString: jest.fn(() => ({
      getContainerClient: jest.fn(() => ({
        getBlockBlobClient: jest.fn(() => ({
          upload: jest.fn(),
          download: jest.fn(),
          exists: jest.fn(() => true)
        }))
      }))
    }))
  }
}));

// Mock Azure OpenAI
jest.mock('@azure/openai', () => ({
  OpenAIClient: jest.fn(() => ({
    getChatCompletions: jest.fn(() => ({
      choices: [{ message: { content: 'Mock response' } }]
    }))
  }))
}));
```

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18.x'
      - run: npm ci
      - run: npm test -- tests/unit/

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:integration
        env:
          AZURE_STORAGE_CONNECTION_STRING: ${{ secrets.AZURE_STORAGE_CONNECTION_STRING }}
          # ... other secrets

  e2e-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test tests/e2e/
```

## Test Coverage

Generate coverage reports:

```bash
# Run tests with coverage
npm test -- --coverage

# Open coverage report
open coverage/lcov-report/index.html
```

### Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Key workflows covered
- **E2E Tests**: Critical user journeys covered

## Writing New Tests

### Unit Test Template

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('Component/Function Name', () => {
  beforeEach(() => {
    // Setup
  });

  it('should [expected behavior]', () => {
    // Arrange
    const input = ...;

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toBe(expected);
  });
});
```

### Integration Test Template

```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('Workflow Name - Integration', () => {
  beforeAll(async () => {
    // Setup Azure resources, test data
  });

  afterAll(async () => {
    // Cleanup
  });

  it('should complete workflow', async () => {
    // Test with real Azure services
  }, 60000); // Timeout for long-running tests
});
```

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should [user action/outcome]', async ({ page }) => {
    await page.goto('/path');
    await page.click('text=Button');
    await expect(page.locator('text=Result')).toBeVisible();
  });
});
```

## Best Practices

### General
- ✅ Write descriptive test names
- ✅ Follow AAA pattern (Arrange, Act, Assert)
- ✅ Keep tests independent and isolated
- ✅ Use meaningful assertions
- ✅ Mock external dependencies in unit tests

### Unit Tests
- ✅ Test one thing per test
- ✅ Mock all external services
- ✅ Test edge cases and error conditions
- ✅ Aim for fast execution (<100ms per test)

### Integration Tests
- ✅ Use real Azure services when possible
- ✅ Clean up test data after execution
- ✅ Set appropriate timeouts
- ✅ Handle async operations properly

### E2E Tests
- ✅ Test complete user journeys
- ✅ Use data-testid attributes for reliable selectors
- ✅ Test accessibility and mobile responsiveness
- ✅ Take screenshots on failures
- ✅ Run in multiple browsers

## Troubleshooting

### Common Issues

**Issue**: Tests timeout
**Solution**: Increase timeout or check Azure service availability

**Issue**: Mock not working
**Solution**: Ensure mock is defined before import

**Issue**: E2E tests fail in CI
**Solution**: Check baseURL and ensure services are running

**Issue**: Coverage below threshold
**Solution**: Add tests for uncovered code paths

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Azure SDK Testing](https://docs.microsoft.com/en-us/azure/developer/javascript/how-to/test-azure-sdk)

## Support

For test-related issues:
1. Check test logs for detailed error messages
2. Review test configuration
3. Verify Azure resources are available
4. Check environment variables

---

**Last Updated**: 2025-10-23
**Version**: 1.0.0
