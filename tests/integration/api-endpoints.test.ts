import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Integration Tests for Azure Functions API Endpoints
 *
 * These tests verify API endpoints work correctly with Azure services.
 *
 * Prerequisites:
 * - Backend Azure Functions running (local or deployed)
 * - Environment variables configured
 * - Test fixtures available
 *
 * Run with: npm run test:integration -- tests/integration/api-endpoints.test.ts
 */

describe('API Endpoints - Integration Tests', () => {

  let apiClient: AxiosInstance;
  let testUploadId: string;
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:7071/api';

  beforeAll(() => {
    apiClient = axios.create({
      baseURL: API_BASE_URL,
      timeout: 60000,
      validateStatus: () => true // Don't throw on non-2xx status codes
    });
  });

  afterAll(async () => {
    // Cleanup: Delete test uploads if needed
  });

  describe('POST /assets/upload', () => {

    it('should upload a PDF file successfully', async () => {
      const testPdfPath = join(__dirname, '../fixtures/sample-brochure.pdf');
      const testPdfBuffer = readFileSync(testPdfPath);

      const formData = new FormData();
      formData.append('file', testPdfBuffer, {
        filename: 'sample-brochure.pdf',
        contentType: 'application/pdf'
      });
      formData.append('model', 'Camry');
      formData.append('year', '2024');
      formData.append('uploadedBy', 'test@toyota.com');

      const response = await apiClient.post('/assets/upload', formData, {
        headers: formData.getHeaders()
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('uploadId');
      expect(response.data).toHaveProperty('blobUrl');
      expect(response.data).toHaveProperty('status', 'uploaded');
      expect(response.data).toHaveProperty('fileName', 'sample-brochure.pdf');

      // Save uploadId for subsequent tests
      testUploadId = response.data.uploadId;
    });

    it('should reject non-PDF files', async () => {
      const formData = new FormData();
      formData.append('file', Buffer.from('test content'), {
        filename: 'test.txt',
        contentType: 'text/plain'
      });
      formData.append('model', 'Camry');

      const response = await apiClient.post('/assets/upload', formData, {
        headers: formData.getHeaders()
      });

      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('error');
      expect(response.data.error).toContain('PDF');
    });

    it('should validate required metadata fields', async () => {
      const testPdfBuffer = Buffer.from('%PDF-1.4 test');

      const formData = new FormData();
      formData.append('file', testPdfBuffer, {
        filename: 'test.pdf',
        contentType: 'application/pdf'
      });
      // Missing 'model' field

      const response = await apiClient.post('/assets/upload', formData, {
        headers: formData.getHeaders()
      });

      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('error');
      expect(response.data.error).toMatch(/model.*required/i);
    });

    it('should enforce file size limits', async () => {
      // Create a buffer larger than 10MB
      const largePdfBuffer = Buffer.alloc(11 * 1024 * 1024, 'a');

      const formData = new FormData();
      formData.append('file', largePdfBuffer, {
        filename: 'large.pdf',
        contentType: 'application/pdf'
      });
      formData.append('model', 'Camry');

      const response = await apiClient.post('/assets/upload', formData, {
        headers: formData.getHeaders()
      });

      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('error');
      expect(response.data.error).toContain('size');
    });

    it('should return proper CORS headers', async () => {
      const response = await apiClient.options('/assets/upload');

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });
  });

  describe('POST /products/search', () => {

    it('should search for product information', async () => {
      const response = await apiClient.post('/products/search', {
        query: 'Camry 2024 engine specifications',
        model: 'Camry',
        year: '2024'
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('results');
      expect(Array.isArray(response.data.results)).toBe(true);
      expect(response.data).toHaveProperty('count');

      if (response.data.results.length > 0) {
        const firstResult = response.data.results[0];
        expect(firstResult).toHaveProperty('content');
        expect(firstResult).toHaveProperty('score');
        expect(firstResult).toHaveProperty('source');
      }
    });

    it('should support filtering by model and year', async () => {
      const response = await apiClient.post('/products/search', {
        query: 'safety features',
        filter: {
          model: 'RAV4',
          year: '2024'
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.results).toBeDefined();

      // Verify filtering
      response.data.results.forEach((result: any) => {
        expect(result.model).toBe('RAV4');
        expect(result.year).toBe('2024');
      });
    });

    it('should validate search query', async () => {
      const response = await apiClient.post('/products/search', {
        query: '' // Empty query
      });

      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('error');
    });

    it('should limit number of results', async () => {
      const response = await apiClient.post('/products/search', {
        query: 'Toyota',
        limit: 5
      });

      expect(response.status).toBe(200);
      expect(response.data.results.length).toBeLessThanOrEqual(5);
    });

    it('should handle search queries with special characters', async () => {
      const response = await apiClient.post('/products/search', {
        query: 'Camry "hybrid" AND (2024 OR 2023)',
        model: 'Camry'
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('results');
    });
  });

  describe('GET /compliance-reports/:uploadId', () => {

    it('should retrieve a compliance report', async () => {
      // Wait for processing to complete (or use a pre-existing upload)
      if (!testUploadId) {
        // Upload a file first
        const testPdfPath = join(__dirname, '../fixtures/sample-brochure.pdf');
        const testPdfBuffer = readFileSync(testPdfPath);

        const formData = new FormData();
        formData.append('file', testPdfBuffer, {
          filename: 'sample.pdf',
          contentType: 'application/pdf'
        });
        formData.append('model', 'Camry');

        const uploadResponse = await apiClient.post('/assets/upload', formData, {
          headers: formData.getHeaders()
        });

        testUploadId = uploadResponse.data.uploadId;

        // Wait for processing (in real scenario, poll for status)
        await new Promise(resolve => setTimeout(resolve, 30000));
      }

      const response = await apiClient.get(`/compliance-reports/${testUploadId}`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('uploadId', testUploadId);
      expect(response.data).toHaveProperty('complianceResults');
      expect(response.data).toHaveProperty('overallScore');
      expect(response.data).toHaveProperty('summary');

      // Verify structure of compliance results
      expect(response.data.complianceResults).toHaveProperty('violations');
      expect(response.data.complianceResults).toHaveProperty('warnings');
      expect(response.data.complianceResults).toHaveProperty('passed');
    });

    it('should return 404 for non-existent reports', async () => {
      const response = await apiClient.get('/compliance-reports/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.data).toHaveProperty('error');
    });

    it('should include detailed violation information', async () => {
      const response = await apiClient.get(`/compliance-reports/${testUploadId}`);

      if (response.status === 200 && response.data.complianceResults.violations.length > 0) {
        const violation = response.data.complianceResults.violations[0];

        expect(violation).toHaveProperty('ruleId');
        expect(violation).toHaveProperty('category');
        expect(violation).toHaveProperty('severity');
        expect(violation).toHaveProperty('message');
        expect(violation).toHaveProperty('location');
      }
    });
  });

  describe('GET /compliance-reports/:uploadId/download', () => {

    it('should download HTML report', async () => {
      if (!testUploadId) {
        // Skip if no test upload available
        return;
      }

      const response = await apiClient.get(
        `/compliance-reports/${testUploadId}/download`,
        {
          params: { format: 'html' }
        }
      );

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
      expect(response.data).toContain('<!DOCTYPE html>');
      expect(response.data).toContain('Compliance Report');
    });

    it('should download PDF report', async () => {
      if (!testUploadId) {
        return;
      }

      const response = await apiClient.get(
        `/compliance-reports/${testUploadId}/download`,
        {
          params: { format: 'pdf' },
          responseType: 'arraybuffer'
        }
      );

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/pdf');

      // Verify PDF header
      const buffer = Buffer.from(response.data);
      expect(buffer.toString('utf-8', 0, 4)).toBe('%PDF');
    });

    it('should validate format parameter', async () => {
      if (!testUploadId) {
        return;
      }

      const response = await apiClient.get(
        `/compliance-reports/${testUploadId}/download`,
        {
          params: { format: 'invalid-format' }
        }
      );

      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('error');
    });
  });

  describe('GET /assets/:uploadId/status', () => {

    it('should return processing status', async () => {
      if (!testUploadId) {
        return;
      }

      const response = await apiClient.get(`/assets/${testUploadId}/status`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('uploadId', testUploadId);
      expect(response.data).toHaveProperty('status');
      expect(['uploaded', 'processing', 'completed', 'failed']).toContain(response.data.status);

      if (response.data.status === 'processing') {
        expect(response.data).toHaveProperty('currentAgent');
        expect(response.data).toHaveProperty('progress');
      }

      if (response.data.status === 'completed') {
        expect(response.data).toHaveProperty('completedAt');
      }

      if (response.data.status === 'failed') {
        expect(response.data).toHaveProperty('error');
      }
    });

    it('should include agent progress details', async () => {
      if (!testUploadId) {
        return;
      }

      const response = await apiClient.get(`/assets/${testUploadId}/status`);

      if (response.data.status === 'processing' || response.data.status === 'completed') {
        expect(response.data).toHaveProperty('agentResults');
        expect(response.data.agentResults).toHaveProperty('parser-agent');
        expect(response.data.agentResults).toHaveProperty('compliance-agent');
      }
    });
  });

  describe('Error Handling', () => {

    it('should return 500 on internal server errors', async () => {
      // This would require mocking Azure service failures
      // Example: Storage account down, AI service unavailable, etc.
    });

    it('should return proper error messages', async () => {
      const response = await apiClient.post('/assets/upload', {
        // Invalid request body (not FormData)
        test: 'invalid'
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.data).toHaveProperty('error');
      expect(typeof response.data.error).toBe('string');
    });

    it('should handle authentication failures', async () => {
      // If Azure AD auth is enabled
      const unauthenticatedClient = axios.create({
        baseURL: API_BASE_URL,
        timeout: 10000
      });

      const response = await unauthenticatedClient.get('/compliance-reports/test-id', {
        validateStatus: () => true
      });

      // Should return 401 if auth is required
      if (process.env.REQUIRE_AUTH === 'true') {
        expect(response.status).toBe(401);
      }
    });
  });

  describe('Performance', () => {

    it('should respond to health check within 1 second', async () => {
      const startTime = Date.now();

      const response = await apiClient.get('/health');

      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(1000);
    });

    it('should handle concurrent upload requests', async () => {
      const testPdfPath = join(__dirname, '../fixtures/sample-brochure.pdf');
      const testPdfBuffer = readFileSync(testPdfPath);

      const uploadPromises = Array.from({ length: 5 }, (_, i) => {
        const formData = new FormData();
        formData.append('file', testPdfBuffer, {
          filename: `concurrent-${i}.pdf`,
          contentType: 'application/pdf'
        });
        formData.append('model', 'Camry');

        return apiClient.post('/assets/upload', formData, {
          headers: formData.getHeaders()
        });
      });

      const responses = await Promise.all(uploadPromises);

      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('uploadId');
      });

      // Verify all uploads have unique IDs
      const uploadIds = responses.map(r => r.data.uploadId);
      const uniqueIds = new Set(uploadIds);
      expect(uniqueIds.size).toBe(5);
    }, 120000);
  });
});
