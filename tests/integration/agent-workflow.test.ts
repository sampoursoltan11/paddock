import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { BlobServiceClient } from '@azure/storage-blob';
import { readFileSync } from 'fs';
import { join } from 'path';

import { OrchestratorAgent } from '../../ai-agents/orchestrator/agent';
import { ParserAgent } from '../../ai-agents/parser-agent/agent';
import { ImageAnalysisAgent } from '../../ai-agents/image-analysis-agent/agent';
import { SearchAgent } from '../../ai-agents/search-agent/agent';
import { ComplianceAgent } from '../../ai-agents/compliance-agent/agent';
import { CriticAgent } from '../../ai-agents/critic-agent/agent';

/**
 * Integration Tests for AI Agent Workflow
 *
 * These tests verify the complete agent orchestration pipeline
 * using real Azure services (requires configuration).
 *
 * Prerequisites:
 * - Azure resources provisioned
 * - Environment variables configured
 * - Test PDF files in tests/fixtures/
 *
 * Run with: npm run test:integration -- tests/integration/agent-workflow.test.ts
 */

describe('AI Agent Workflow - Integration Tests', () => {

  let blobServiceClient: BlobServiceClient;
  let testUploadId: string;

  beforeAll(async () => {
    // Initialize Azure clients
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING not set');
    }

    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    testUploadId = `test-${Date.now()}`;
  });

  afterAll(async () => {
    // Cleanup: Delete test blobs
    try {
      const containerClient = blobServiceClient.getContainerClient('uploads');
      for await (const blob of containerClient.listBlobsFlat({ prefix: testUploadId })) {
        await containerClient.deleteBlob(blob.name);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  describe('Complete Agent Pipeline', () => {

    it('should orchestrate all 6 agents in sequence', async () => {
      // Upload a test PDF to blob storage
      const testPdfPath = join(__dirname, '../fixtures/sample-brochure.pdf');
      const testPdfBuffer = readFileSync(testPdfPath);

      const uploadsContainer = blobServiceClient.getContainerClient('uploads');
      const blobName = `${testUploadId}/sample-brochure.pdf`;
      const blockBlobClient = uploadsContainer.getBlockBlobClient(blobName);

      await blockBlobClient.upload(testPdfBuffer, testPdfBuffer.length, {
        blobHTTPHeaders: { blobContentType: 'application/pdf' }
      });

      // Initialize orchestrator agent
      const orchestrator = new OrchestratorAgent({
        uploadId: testUploadId,
        fileName: 'sample-brochure.pdf',
        model: 'Camry',
        year: '2024'
      });

      // Execute orchestration
      const result = await orchestrator.run();

      // Verify orchestration completed
      expect(result.status).toBe('completed');
      expect(result.agentsExecuted).toHaveLength(5); // Parser, Image, Search, Compliance, Critic

      // Verify each agent completed successfully
      expect(result.agentsExecuted).toContain('parser-agent');
      expect(result.agentsExecuted).toContain('image-analysis-agent');
      expect(result.agentsExecuted).toContain('search-agent');
      expect(result.agentsExecuted).toContain('compliance-agent');
      expect(result.agentsExecuted).toContain('critic-agent');

      // Verify workflow state was saved
      const stateContainer = blobServiceClient.getContainerClient('state');
      const stateBlobClient = stateContainer.getBlockBlobClient(`${testUploadId}/workflow-state.json`);
      const stateExists = await stateBlobClient.exists();

      expect(stateExists).toBe(true);

      // Verify final report was generated
      const reportsContainer = blobServiceClient.getContainerClient('reports');
      const reportBlobClient = reportsContainer.getBlockBlobClient(`${testUploadId}/report.html`);
      const reportExists = await reportBlobClient.exists();

      expect(reportExists).toBe(true);
    }, 120000); // 2 minute timeout for complete pipeline

    it('should handle parser agent failures gracefully', async () => {
      // Upload a corrupted PDF
      const corruptedPdfBuffer = Buffer.from('This is not a valid PDF');

      const uploadsContainer = blobServiceClient.getContainerClient('uploads');
      const blobName = `${testUploadId}-corrupted/corrupted.pdf`;
      const blockBlobClient = uploadsContainer.getBlockBlobClient(blobName);

      await blockBlobClient.upload(corruptedPdfBuffer, corruptedPdfBuffer.length, {
        blobHTTPHeaders: { blobContentType: 'application/pdf' }
      });

      const orchestrator = new OrchestratorAgent({
        uploadId: `${testUploadId}-corrupted`,
        fileName: 'corrupted.pdf',
        model: 'Camry',
        year: '2024'
      });

      const result = await orchestrator.run();

      // Orchestrator should fail gracefully
      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
      expect(result.error).toContain('parser');
    }, 60000);
  });

  describe('Parser Agent Integration', () => {

    it('should extract text, tables, and images from PDF', async () => {
      const testPdfPath = join(__dirname, '../fixtures/sample-brochure.pdf');
      const testPdfBuffer = readFileSync(testPdfPath);

      const uploadsContainer = blobServiceClient.getContainerClient('uploads');
      const blobName = `${testUploadId}-parser/sample.pdf`;
      const blockBlobClient = uploadsContainer.getBlockBlobClient(blobName);

      await blockBlobClient.upload(testPdfBuffer, testPdfBuffer.length, {
        blobHTTPHeaders: { blobContentType: 'application/pdf' }
      });

      const parser = new ParserAgent({
        uploadId: `${testUploadId}-parser`,
        fileName: 'sample.pdf',
        blobUrl: blockBlobClient.url
      });

      const result = await parser.run();

      expect(result.status).toBe('completed');
      expect(result.extractedText).toBeDefined();
      expect(result.extractedText.length).toBeGreaterThan(0);
      expect(result.tables).toBeDefined();
      expect(Array.isArray(result.tables)).toBe(true);
      expect(result.images).toBeDefined();
      expect(Array.isArray(result.images)).toBe(true);
    }, 60000);

    it('should save extracted content to processed container', async () => {
      const parser = new ParserAgent({
        uploadId: `${testUploadId}-parser`,
        fileName: 'sample.pdf',
        blobUrl: 'test-url'
      });

      await parser.run();

      // Verify extracted content was saved
      const processedContainer = blobServiceClient.getContainerClient('processed');
      const textBlobClient = processedContainer.getBlockBlobClient(
        `${testUploadId}-parser/extracted-text.txt`
      );

      const textExists = await textBlobClient.exists();
      expect(textExists).toBe(true);
    }, 60000);
  });

  describe('Image Analysis Agent Integration', () => {

    it('should detect Toyota logos in images', async () => {
      const testImagePath = join(__dirname, '../fixtures/toyota-logo.jpg');
      const testImageBuffer = readFileSync(testImagePath);

      const uploadsContainer = blobServiceClient.getContainerClient('uploads');
      const imageBlobName = `${testUploadId}-image/toyota-logo.jpg`;
      const imageBlockBlobClient = uploadsContainer.getBlockBlobClient(imageBlobName);

      await imageBlockBlobClient.upload(testImageBuffer, testImageBuffer.length, {
        blobHTTPHeaders: { blobContentType: 'image/jpeg' }
      });

      const imageAnalysis = new ImageAnalysisAgent({
        uploadId: `${testUploadId}-image`,
        images: [
          {
            url: imageBlockBlobClient.url,
            pageNumber: 1,
            fileName: 'toyota-logo.jpg'
          }
        ]
      });

      const result = await imageAnalysis.run();

      expect(result.status).toBe('completed');
      expect(result.logoDetections).toBeDefined();
      expect(result.logoDetections.length).toBeGreaterThan(0);
      expect(result.logoDetections[0]).toHaveProperty('confidence');
      expect(result.logoDetections[0].confidence).toBeGreaterThan(0.7);
    }, 60000);

    it('should verify brand colors', async () => {
      const imageAnalysis = new ImageAnalysisAgent({
        uploadId: `${testUploadId}-colors`,
        images: [
          {
            url: 'test-url',
            pageNumber: 1,
            fileName: 'brand-colors.jpg'
          }
        ]
      });

      const result = await imageAnalysis.run();

      expect(result.status).toBe('completed');
      expect(result.colorAnalysis).toBeDefined();
      expect(result.colorAnalysis).toHaveProperty('dominantColors');
      expect(result.colorAnalysis).toHaveProperty('brandColorCompliance');
    }, 60000);

    it('should assess image quality', async () => {
      const imageAnalysis = new ImageAnalysisAgent({
        uploadId: `${testUploadId}-quality`,
        images: [
          {
            url: 'test-url',
            pageNumber: 1,
            fileName: 'test-image.jpg'
          }
        ]
      });

      const result = await imageAnalysis.run();

      expect(result.status).toBe('completed');
      expect(result.qualityAssessment).toBeDefined();
      expect(result.qualityAssessment).toHaveProperty('resolution');
      expect(result.qualityAssessment).toHaveProperty('sharpness');
      expect(result.qualityAssessment).toHaveProperty('isBlurry');
    }, 60000);
  });

  describe('Search Agent Integration', () => {

    it('should retrieve product information from AI Search', async () => {
      const search = new SearchAgent({
        uploadId: `${testUploadId}-search`,
        query: 'Camry 2024 engine specifications',
        model: 'Camry',
        year: '2024'
      });

      const result = await search.run();

      expect(result.status).toBe('completed');
      expect(result.searchResults).toBeDefined();
      expect(Array.isArray(result.searchResults)).toBe(true);
      expect(result.searchResults.length).toBeGreaterThan(0);

      // Verify each result has required fields
      const firstResult = result.searchResults[0];
      expect(firstResult).toHaveProperty('content');
      expect(firstResult).toHaveProperty('score');
      expect(firstResult).toHaveProperty('source');
    }, 30000);

    it('should filter results by model and year', async () => {
      const search = new SearchAgent({
        uploadId: `${testUploadId}-search-filter`,
        query: 'safety features',
        model: 'RAV4',
        year: '2024'
      });

      const result = await search.run();

      expect(result.status).toBe('completed');
      expect(result.searchResults.length).toBeGreaterThan(0);

      // Verify filtering was applied
      result.searchResults.forEach((res: any) => {
        expect(res.model).toBe('RAV4');
        expect(res.year).toBe('2024');
      });
    }, 30000);
  });

  describe('Compliance Agent Integration', () => {

    it('should check all compliance rules', async () => {
      const compliance = new ComplianceAgent({
        uploadId: `${testUploadId}-compliance`,
        extractedText: 'Sample marketing text with proper disclaimers',
        images: [],
        productInfo: []
      });

      const result = await compliance.run();

      expect(result.status).toBe('completed');
      expect(result.complianceResults).toBeDefined();
      expect(result.complianceResults).toHaveProperty('violations');
      expect(result.complianceResults).toHaveProperty('warnings');
      expect(result.complianceResults).toHaveProperty('passed');
      expect(result.overallScore).toBeDefined();
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    }, 60000);

    it('should detect brand guideline violations', async () => {
      const compliance = new ComplianceAgent({
        uploadId: `${testUploadId}-brand-violations`,
        extractedText: 'Check out our amazing deals!', // Uses non-approved language
        images: [],
        productInfo: []
      });

      const result = await compliance.run();

      expect(result.status).toBe('completed');
      expect(result.complianceResults.violations.length).toBeGreaterThan(0);

      // Should have brand-related violation
      const brandViolation = result.complianceResults.violations.find(
        (v: any) => v.category === 'brand'
      );
      expect(brandViolation).toBeDefined();
    }, 60000);

    it('should detect missing legal disclaimers', async () => {
      const compliance = new ComplianceAgent({
        uploadId: `${testUploadId}-legal-violations`,
        extractedText: 'Get the new Camry for $299/month', // Missing lease disclaimer
        images: [],
        productInfo: []
      });

      const result = await compliance.run();

      const legalViolation = result.complianceResults.violations.find(
        (v: any) => v.category === 'legal'
      );
      expect(legalViolation).toBeDefined();
      expect(legalViolation.message).toContain('disclaimer');
    }, 60000);
  });

  describe('Critic Agent Integration', () => {

    it('should generate comprehensive HTML report', async () => {
      const critic = new CriticAgent({
        uploadId: `${testUploadId}-critic`,
        fileName: 'test.pdf',
        parserResults: { extractedText: 'Sample text', tables: [], images: [] },
        imageAnalysisResults: { logoDetections: [], colorAnalysis: {}, qualityAssessment: {} },
        searchResults: [],
        complianceResults: {
          violations: [],
          warnings: [],
          passed: [],
          overallScore: 95
        }
      });

      const result = await critic.run();

      expect(result.status).toBe('completed');
      expect(result.reportHtml).toBeDefined();
      expect(result.reportHtml).toContain('<!DOCTYPE html>');
      expect(result.reportHtml).toContain('Compliance Report');
      expect(result.summary).toBeDefined();
    }, 60000);

    it('should save report to reports container', async () => {
      const critic = new CriticAgent({
        uploadId: `${testUploadId}-critic-save`,
        fileName: 'test.pdf',
        parserResults: { extractedText: 'Test', tables: [], images: [] },
        imageAnalysisResults: {},
        searchResults: [],
        complianceResults: { violations: [], warnings: [], passed: [], overallScore: 90 }
      });

      await critic.run();

      // Verify report was saved
      const reportsContainer = blobServiceClient.getContainerClient('reports');
      const reportBlobClient = reportsContainer.getBlockBlobClient(
        `${testUploadId}-critic-save/report.html`
      );

      const reportExists = await reportBlobClient.exists();
      expect(reportExists).toBe(true);
    }, 60000);

    it('should categorize issues by severity', async () => {
      const critic = new CriticAgent({
        uploadId: `${testUploadId}-severity`,
        fileName: 'test.pdf',
        parserResults: { extractedText: 'Test', tables: [], images: [] },
        imageAnalysisResults: {},
        searchResults: [],
        complianceResults: {
          violations: [
            { ruleId: 'R1', category: 'brand', severity: 'critical', message: 'Critical' },
            { ruleId: 'R2', category: 'legal', severity: 'high', message: 'High' }
          ],
          warnings: [
            { ruleId: 'R3', category: 'pit', severity: 'medium', message: 'Medium' }
          ],
          passed: [],
          overallScore: 70
        }
      });

      const result = await critic.run();

      expect(result.summary).toContain('critical');
      expect(result.summary).toContain('high');
      expect(result.reportHtml).toContain('Critical');
      expect(result.reportHtml).toContain('High');
    }, 60000);
  });

  describe('State Management', () => {

    it('should save and retrieve workflow state', async () => {
      const orchestrator = new OrchestratorAgent({
        uploadId: `${testUploadId}-state`,
        fileName: 'test.pdf',
        model: 'Camry',
        year: '2024'
      });

      // Save initial state
      await orchestrator.saveState({
        currentAgent: 'parser-agent',
        status: 'processing',
        completedAgents: []
      });

      // Retrieve state
      const stateContainer = blobServiceClient.getContainerClient('state');
      const stateBlobClient = stateContainer.getBlockBlobClient(
        `${testUploadId}-state/workflow-state.json`
      );

      const downloadResponse = await stateBlobClient.download();
      const stateJson = await streamToString(downloadResponse.readableStreamBody!);
      const state = JSON.parse(stateJson);

      expect(state.currentAgent).toBe('parser-agent');
      expect(state.status).toBe('processing');
      expect(Array.isArray(state.completedAgents)).toBe(true);
    });

    it('should update state as agents complete', async () => {
      const orchestrator = new OrchestratorAgent({
        uploadId: `${testUploadId}-state-update`,
        fileName: 'test.pdf',
        model: 'Camry',
        year: '2024'
      });

      // Update state multiple times
      await orchestrator.saveState({
        currentAgent: 'parser-agent',
        status: 'processing',
        completedAgents: []
      });

      await orchestrator.saveState({
        currentAgent: 'image-analysis-agent',
        status: 'processing',
        completedAgents: ['parser-agent']
      });

      await orchestrator.saveState({
        currentAgent: null,
        status: 'completed',
        completedAgents: ['parser-agent', 'image-analysis-agent', 'search-agent', 'compliance-agent', 'critic-agent']
      });

      // Retrieve final state
      const stateContainer = blobServiceClient.getContainerClient('state');
      const stateBlobClient = stateContainer.getBlockBlobClient(
        `${testUploadId}-state-update/workflow-state.json`
      );

      const downloadResponse = await stateBlobClient.download();
      const stateJson = await streamToString(downloadResponse.readableStreamBody!);
      const state = JSON.parse(stateJson);

      expect(state.status).toBe('completed');
      expect(state.completedAgents).toHaveLength(5);
    });
  });
});

// Helper function to convert stream to string
async function streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    readableStream.on('data', (data) => {
      chunks.push(data.toString());
    });
    readableStream.on('end', () => {
      resolve(chunks.join(''));
    });
    readableStream.on('error', reject);
  });
}
