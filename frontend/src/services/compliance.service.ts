import { api } from './api';
import { ApiResponse, ComplianceReport, PaginatedResponse } from '@/types';

/**
 * Compliance Service - Handles compliance report operations
 */
export const complianceService = {
  /**
   * Get compliance report for an asset
   */
  getReport: async (assetId: string): Promise<ApiResponse<ComplianceReport>> => {
    return api.get<ComplianceReport>(`/compliance/reports/${assetId}`);
  },

  /**
   * Get all compliance reports with pagination
   */
  getReports: async (
    page: number = 1,
    pageSize: number = 20,
    filters?: {
      status?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<ApiResponse<PaginatedResponse<ComplianceReport>>> => {
    return api.get<PaginatedResponse<ComplianceReport>>('/compliance/reports', {
      page,
      pageSize,
      ...filters,
    });
  },

  /**
   * Download HTML report
   */
  downloadHtmlReport: async (assetId: string): Promise<void> => {
    return api.download(`/compliance/reports/${assetId}/download/html`, `report-${assetId}.html`);
  },

  /**
   * Download PDF report
   */
  downloadPdfReport: async (assetId: string): Promise<void> => {
    return api.download(`/compliance/reports/${assetId}/download/pdf`, `report-${assetId}.pdf`);
  },

  /**
   * Trigger compliance check manually (if needed)
   */
  triggerComplianceCheck: async (assetId: string): Promise<ApiResponse<{ jobId: string }>> => {
    return api.post<{ jobId: string }>(`/compliance/check/${assetId}`);
  },

  /**
   * Get compliance statistics/dashboard data
   */
  getComplianceStats: async (dateFrom?: string, dateTo?: string): Promise<ApiResponse<{
    totalReports: number;
    passedReports: number;
    failedReports: number;
    warningReports: number;
    avgProcessingTime: number;
    commonIssues: Array<{ category: string; count: number }>;
  }>> => {
    return api.get('/compliance/stats', { dateFrom, dateTo });
  },
};

export default complianceService;
