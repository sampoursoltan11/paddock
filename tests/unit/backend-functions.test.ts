import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { uploadAsset } from '../../backend/functions/upload-asset';
import { processAsset } from '../../backend/functions/process-asset';
import { searchProduct } from '../../backend/functions/search-product';
import { getComplianceReport } from '../../backend/functions/get-compliance-report';

/**
 * Unit Tests for Backend Azure Functions
 *
 * These tests verify individual function logic using mocks for Azure services.
 * Run with: npm test -- tests/unit/backend-functions.test.ts
 */

describe('Backend Functions - Unit Tests', () => {

  describe('upload-asset function', () => {

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully upload a PDF file', async () => {
      // Mock request with file upload
      const mockRequest = {
        method: 'POST',
        headers: new Headers({
          'content-type': 'multipart/form-data'
        }),
        formData: async () => ({
          file: new File(['test content'], 'test.pdf', { type: 'application/pdf' }),
          model: 'Camry',
          year: '2024',
          uploadedBy: 'test@toyota.com'
        })
      };

      const mockContext = {
        log: jest.fn(),
        invocationId: 'test-123'
      };

      // Expected: Function should return success response with upload details
      const response = await uploadAsset(mockRequest as any, mockContext as any);

      expect(response.status).toBe(201);
      expect(response.jsonBody).toHaveProperty('uploadId');
      expect(response.jsonBody).toHaveProperty('blobUrl');
      expect(response.jsonBody.status).toBe('uploaded');
    });

    it('should reject non-PDF files', async () => {
      const mockRequest = {
        method: 'POST',
        headers: new Headers({
          'content-type': 'multipart/form-data'
        }),
        formData: async () => ({
          file: new File(['test'], 'test.txt', { type: 'text/plain' }),
          model: 'Camry'
        })
      };

      const mockContext = {
        log: jest.fn(),
        invocationId: 'test-456'
      };

      const response = await uploadAsset(mockRequest as any, mockContext as any);

      expect(response.status).toBe(400);
      expect(response.jsonBody).toHaveProperty('error');
      expect(response.jsonBody.error).toContain('Only PDF files are allowed');
    });

    it('should validate required fields', async () => {
      const mockRequest = {
        method: 'POST',
        headers: new Headers({
          'content-type': 'multipart/form-data'
        }),
        formData: async () => ({
          file: new File(['test'], 'test.pdf', { type: 'application/pdf' })
          // Missing model field
        })
      };

      const mockContext = {
        log: jest.fn(),
        invocationId: 'test-789'
      };

      const response = await uploadAsset(mockRequest as any, mockContext as any);

      expect(response.status).toBe(400);
      expect(response.jsonBody).toHaveProperty('error');
      expect(response.jsonBody.error).toContain('model');
    });

    it('should handle file size limits', async () => {
      // Create a mock file larger than 10MB
      const largeContent = new Array(11 * 1024 * 1024).fill('a').join('');
      const mockRequest = {
        method: 'POST',
        headers: new Headers({
          'content-type': 'multipart/form-data'
        }),
        formData: async () => ({
          file: new File([largeContent], 'large.pdf', { type: 'application/pdf' }),
          model: 'Camry'
        })
      };

      const mockContext = {
        log: jest.fn(),
        invocationId: 'test-large'
      };

      const response = await uploadAsset(mockRequest as any, mockContext as any);

      expect(response.status).toBe(400);
      expect(response.jsonBody).toHaveProperty('error');
      expect(response.jsonBody.error).toContain('File size exceeds limit');
    });
  });

  describe('search-product function', () => {

    it('should return product information from AI Search', async () => {
      const mockRequest = {
        method: 'POST',
        json: async () => ({
          query: 'Camry 2024 horsepower'
        })
      };

      const mockContext = {
        log: jest.fn(),
        invocationId: 'search-123'
      };

      const response = await searchProduct(mockRequest as any, mockContext as any);

      expect(response.status).toBe(200);
      expect(response.jsonBody).toHaveProperty('results');
      expect(Array.isArray(response.jsonBody.results)).toBe(true);
      expect(response.jsonBody).toHaveProperty('count');
    });

    it('should handle empty search queries', async () => {
      const mockRequest = {
        method: 'POST',
        json: async () => ({
          query: ''
        })
      };

      const mockContext = {
        log: jest.fn(),
        invocationId: 'search-empty'
      };

      const response = await searchProduct(mockRequest as any, mockContext as any);

      expect(response.status).toBe(400);
      expect(response.jsonBody).toHaveProperty('error');
    });

    it('should support filtering by model and year', async () => {
      const mockRequest = {
        method: 'POST',
        json: async () => ({
          query: 'engine specifications',
          filter: {
            model: 'Camry',
            year: '2024'
          }
        })
      };

      const mockContext = {
        log: jest.fn(),
        invocationId: 'search-filter'
      };

      const response = await searchProduct(mockRequest as any, mockContext as any);

      expect(response.status).toBe(200);
      expect(response.jsonBody.results.length).toBeGreaterThan(0);
      // Verify filtering was applied
      expect(response.jsonBody.results[0]).toHaveProperty('model', 'Camry');
    });
  });

  describe('get-compliance-report function', () => {

    it('should retrieve a compliance report by ID', async () => {
      const uploadId = 'test-upload-123';
      const mockRequest = {
        method: 'GET',
        params: { uploadId }
      };

      const mockContext = {
        log: jest.fn(),
        invocationId: 'report-123'
      };

      const response = await getComplianceReport(mockRequest as any, mockContext as any);

      expect(response.status).toBe(200);
      expect(response.jsonBody).toHaveProperty('uploadId', uploadId);
      expect(response.jsonBody).toHaveProperty('complianceResults');
      expect(response.jsonBody).toHaveProperty('overallScore');
      expect(response.jsonBody).toHaveProperty('summary');
    });

    it('should return 404 for non-existent reports', async () => {
      const mockRequest = {
        method: 'GET',
        params: { uploadId: 'non-existent-id' }
      };

      const mockContext = {
        log: jest.fn(),
        invocationId: 'report-404'
      };

      const response = await getComplianceReport(mockRequest as any, mockContext as any);

      expect(response.status).toBe(404);
      expect(response.jsonBody).toHaveProperty('error');
    });

    it('should include detailed rule violations', async () => {
      const uploadId = 'test-upload-violations';
      const mockRequest = {
        method: 'GET',
        params: { uploadId }
      };

      const mockContext = {
        log: jest.fn(),
        invocationId: 'report-violations'
      };

      const response = await getComplianceReport(mockRequest as any, mockContext as any);

      expect(response.status).toBe(200);
      expect(response.jsonBody.complianceResults).toHaveProperty('violations');
      expect(Array.isArray(response.jsonBody.complianceResults.violations)).toBe(true);

      // Each violation should have required fields
      if (response.jsonBody.complianceResults.violations.length > 0) {
        const violation = response.jsonBody.complianceResults.violations[0];
        expect(violation).toHaveProperty('ruleId');
        expect(violation).toHaveProperty('category');
        expect(violation).toHaveProperty('severity');
        expect(violation).toHaveProperty('message');
      }
    });
  });

  describe('process-asset function (blob trigger)', () => {

    it('should trigger orchestrator agent for new uploads', async () => {
      const mockBlob = {
        name: 'uploads/test-123/document.pdf',
        properties: {
          contentLength: 1024000
        }
      };

      const mockContext = {
        log: jest.fn(),
        invocationId: 'process-123',
        triggerMetadata: {
          blobTrigger: mockBlob.name
        }
      };

      await processAsset(mockBlob as any, mockContext as any);

      // Verify orchestrator agent was triggered
      expect(mockContext.log).toHaveBeenCalledWith(
        expect.stringContaining('Starting asset processing for: test-123')
      );
    });

    it('should handle corrupted PDF files gracefully', async () => {
      const mockBlob = {
        name: 'uploads/test-corrupted/corrupted.pdf',
        properties: {
          contentLength: 500
        }
      };

      const mockContext = {
        log: jest.fn(),
        invocationId: 'process-corrupted',
        triggerMetadata: {
          blobTrigger: mockBlob.name
        }
      };

      await processAsset(mockBlob as any, mockContext as any);

      // Should log error but not throw
      expect(mockContext.log).toHaveBeenCalledWith(
        expect.stringContaining('Error processing asset')
      );
    });
  });
});
