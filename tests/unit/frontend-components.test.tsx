import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

import Dashboard from '../../frontend/src/pages/Dashboard';
import Upload from '../../frontend/src/pages/Upload';
import Search from '../../frontend/src/pages/Search';
import ComplianceReview from '../../frontend/src/pages/ComplianceReview';

/**
 * Unit Tests for Frontend React Components
 *
 * These tests verify UI component rendering and user interactions.
 * Run with: npm test -- tests/unit/frontend-components.test.tsx
 */

// Mock API service
jest.mock('../../frontend/src/services/api', () => ({
  uploadAsset: jest.fn(),
  searchProducts: jest.fn(),
  getComplianceReport: jest.fn(),
  getStats: jest.fn(),
}));

// Helper to render components with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Frontend Components - Unit Tests', () => {

  describe('Dashboard Component', () => {

    it('should render statistics cards', async () => {
      const mockStats = {
        totalUploads: 42,
        pendingReviews: 8,
        approved: 30,
        rejected: 4,
        avgProcessingTime: '3.5 minutes'
      };

      // Mock API response
      const api = require('../../frontend/src/services/api');
      api.getStats.mockResolvedValue({ data: mockStats });

      renderWithRouter(<Dashboard />);

      // Wait for stats to load
      await waitFor(() => {
        expect(screen.getByText('Total Uploads')).toBeInTheDocument();
      });

      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('Pending Reviews')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('should display loading state', () => {
      renderWithRouter(<Dashboard />);

      // Should show loading indicator
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      const api = require('../../frontend/src/services/api');
      api.getStats.mockRejectedValue(new Error('Network error'));

      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/error loading statistics/i)).toBeInTheDocument();
      });
    });

    it('should render recent uploads table', async () => {
      const mockRecentUploads = [
        {
          id: 'upload-1',
          fileName: 'camry-brochure.pdf',
          model: 'Camry',
          uploadedAt: '2024-01-15T10:30:00Z',
          status: 'completed'
        },
        {
          id: 'upload-2',
          fileName: 'rav4-flyer.pdf',
          model: 'RAV4',
          uploadedAt: '2024-01-15T11:00:00Z',
          status: 'processing'
        }
      ];

      const api = require('../../frontend/src/services/api');
      api.getStats.mockResolvedValue({
        data: {
          totalUploads: 2,
          recentUploads: mockRecentUploads
        }
      });

      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('camry-brochure.pdf')).toBeInTheDocument();
        expect(screen.getByText('rav4-flyer.pdf')).toBeInTheDocument();
      });
    });
  });

  describe('Upload Component', () => {

    it('should render drag-and-drop zone', () => {
      renderWithRouter(<Upload />);

      expect(screen.getByText(/drag.*drop/i)).toBeInTheDocument();
      expect(screen.getByText(/click to browse/i)).toBeInTheDocument();
    });

    it('should accept PDF file drops', async () => {
      renderWithRouter(<Upload />);

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const dropzone = screen.getByText(/drag.*drop/i).parentElement;

      const dataTransfer = {
        files: [file],
        types: ['Files']
      };

      fireEvent.drop(dropzone!, { dataTransfer });

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });
    });

    it('should reject non-PDF files', async () => {
      renderWithRouter(<Upload />);

      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const dropzone = screen.getByText(/drag.*drop/i).parentElement;

      const dataTransfer = {
        files: [file],
        types: ['Files']
      };

      fireEvent.drop(dropzone!, { dataTransfer });

      await waitFor(() => {
        expect(screen.getByText(/only pdf files/i)).toBeInTheDocument();
      });
    });

    it('should validate required metadata fields', async () => {
      renderWithRouter(<Upload />);

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const dropzone = screen.getByText(/drag.*drop/i).parentElement;

      fireEvent.drop(dropzone!, { dataTransfer: { files: [file], types: ['Files'] } });

      // Try to submit without filling model
      const submitButton = screen.getByRole('button', { name: /upload/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/model is required/i)).toBeInTheDocument();
      });
    });

    it('should show upload progress', async () => {
      const api = require('../../frontend/src/services/api');
      api.uploadAsset.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve({ data: { uploadId: 'test-123' } }), 1000);
        });
      });

      renderWithRouter(<Upload />);

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const dropzone = screen.getByText(/drag.*drop/i).parentElement;

      fireEvent.drop(dropzone!, { dataTransfer: { files: [file], types: ['Files'] } });

      // Fill required fields
      const modelInput = screen.getByLabelText(/model/i);
      fireEvent.change(modelInput, { target: { value: 'Camry' } });

      const submitButton = screen.getByRole('button', { name: /upload/i });
      fireEvent.click(submitButton);

      // Should show progress
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });

    it('should display success message after upload', async () => {
      const api = require('../../frontend/src/services/api');
      api.uploadAsset.mockResolvedValue({
        data: { uploadId: 'test-123', status: 'uploaded' }
      });

      renderWithRouter(<Upload />);

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const dropzone = screen.getByText(/drag.*drop/i).parentElement;

      fireEvent.drop(dropzone!, { dataTransfer: { files: [file], types: ['Files'] } });

      const modelInput = screen.getByLabelText(/model/i);
      fireEvent.change(modelInput, { target: { value: 'Camry' } });

      const submitButton = screen.getByRole('button', { name: /upload/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/upload successful/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search Component', () => {

    it('should render search input and button', () => {
      renderWithRouter(<Search />);

      expect(screen.getByPlaceholderText(/search product information/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    });

    it('should display search results', async () => {
      const mockResults = [
        {
          id: '1',
          model: 'Camry',
          year: '2024',
          content: 'The 2024 Camry features a 2.5L engine with 203 horsepower...',
          score: 0.95
        },
        {
          id: '2',
          model: 'Camry',
          year: '2024',
          content: 'Standard safety features include Toyota Safety Sense 3.0...',
          score: 0.88
        }
      ];

      const api = require('../../frontend/src/services/api');
      api.searchProducts.mockResolvedValue({ data: { results: mockResults, count: 2 } });

      renderWithRouter(<Search />);

      const searchInput = screen.getByPlaceholderText(/search product information/i);
      fireEvent.change(searchInput, { target: { value: 'Camry horsepower' } });

      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText(/2024 camry features/i)).toBeInTheDocument();
        expect(screen.getByText(/203 horsepower/i)).toBeInTheDocument();
      });
    });

    it('should handle empty search results', async () => {
      const api = require('../../frontend/src/services/api');
      api.searchProducts.mockResolvedValue({ data: { results: [], count: 0 } });

      renderWithRouter(<Search />);

      const searchInput = screen.getByPlaceholderText(/search product information/i);
      fireEvent.change(searchInput, { target: { value: 'nonexistent model' } });

      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText(/no results found/i)).toBeInTheDocument();
      });
    });

    it('should support filtering by model and year', async () => {
      renderWithRouter(<Search />);

      const modelFilter = screen.getByLabelText(/filter by model/i);
      const yearFilter = screen.getByLabelText(/filter by year/i);

      fireEvent.change(modelFilter, { target: { value: 'Camry' } });
      fireEvent.change(yearFilter, { target: { value: '2024' } });

      expect(modelFilter).toHaveValue('Camry');
      expect(yearFilter).toHaveValue('2024');
    });
  });

  describe('ComplianceReview Component', () => {

    it('should display compliance report details', async () => {
      const mockReport = {
        uploadId: 'test-123',
        fileName: 'camry-brochure.pdf',
        overallScore: 85,
        complianceResults: {
          violations: [
            {
              ruleId: 'BRAND-001',
              category: 'brand',
              severity: 'high',
              message: 'Logo size does not meet minimum requirements'
            }
          ],
          warnings: [
            {
              ruleId: 'LEGAL-002',
              category: 'legal',
              severity: 'medium',
              message: 'Consider adding disclaimer about lease terms'
            }
          ]
        },
        summary: 'Document has 1 critical issue and 1 warning'
      };

      const api = require('../../frontend/src/services/api');
      api.getComplianceReport.mockResolvedValue({ data: mockReport });

      renderWithRouter(<ComplianceReview />);

      await waitFor(() => {
        expect(screen.getByText('camry-brochure.pdf')).toBeInTheDocument();
        expect(screen.getByText('85')).toBeInTheDocument();
      });

      expect(screen.getByText(/logo size does not meet/i)).toBeInTheDocument();
      expect(screen.getByText(/consider adding disclaimer/i)).toBeInTheDocument();
    });

    it('should categorize violations by severity', async () => {
      const mockReport = {
        uploadId: 'test-456',
        fileName: 'test.pdf',
        overallScore: 70,
        complianceResults: {
          violations: [
            { ruleId: 'R1', category: 'brand', severity: 'critical', message: 'Critical issue' },
            { ruleId: 'R2', category: 'legal', severity: 'high', message: 'High priority issue' },
            { ruleId: 'R3', category: 'pit', severity: 'medium', message: 'Medium issue' }
          ],
          warnings: []
        }
      };

      const api = require('../../frontend/src/services/api');
      api.getComplianceReport.mockResolvedValue({ data: mockReport });

      renderWithRouter(<ComplianceReview />);

      await waitFor(() => {
        expect(screen.getByText(/critical/i)).toBeInTheDocument();
        expect(screen.getByText(/high/i)).toBeInTheDocument();
        expect(screen.getByText(/medium/i)).toBeInTheDocument();
      });
    });

    it('should allow downloading HTML report', async () => {
      const mockReport = {
        uploadId: 'test-789',
        fileName: 'test.pdf',
        overallScore: 90,
        complianceResults: { violations: [], warnings: [] }
      };

      const api = require('../../frontend/src/services/api');
      api.getComplianceReport.mockResolvedValue({ data: mockReport });

      renderWithRouter(<ComplianceReview />);

      await waitFor(() => {
        const downloadButton = screen.getByRole('button', { name: /download.*html/i });
        expect(downloadButton).toBeInTheDocument();
      });
    });

    it('should show approval/rejection actions', async () => {
      const mockReport = {
        uploadId: 'test-approval',
        fileName: 'test.pdf',
        overallScore: 95,
        status: 'pending_review',
        complianceResults: { violations: [], warnings: [] }
      };

      const api = require('../../frontend/src/services/api');
      api.getComplianceReport.mockResolvedValue({ data: mockReport });

      renderWithRouter(<ComplianceReview />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
      });
    });
  });
});
