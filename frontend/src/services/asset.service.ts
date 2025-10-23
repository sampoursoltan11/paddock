import { api } from './api';
import { ApiResponse, UploadAsset, ComplianceReport, PaginatedResponse } from '@/types';

/**
 * Asset Service - Handles all asset upload and management operations
 */
export const assetService = {
  /**
   * Upload a marketing asset (PDF, image, etc.)
   */
  uploadAsset: async (
    file: File,
    metadata?: {
      model?: string;
      year?: string;
      category?: string;
    },
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<UploadAsset>> => {
    return api.upload<UploadAsset>('/assets/upload', file, onProgress);
  },

  /**
   * Get asset by ID
   */
  getAsset: async (assetId: string): Promise<ApiResponse<UploadAsset>> => {
    return api.get<UploadAsset>(`/assets/${assetId}`);
  },

  /**
   * Get all assets with pagination
   */
  getAssets: async (
    page: number = 1,
    pageSize: number = 20,
    filters?: {
      status?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<ApiResponse<PaginatedResponse<UploadAsset>>> => {
    return api.get<PaginatedResponse<UploadAsset>>('/assets', {
      page,
      pageSize,
      ...filters,
    });
  },

  /**
   * Delete an asset
   */
  deleteAsset: async (assetId: string): Promise<ApiResponse<void>> => {
    return api.delete<void>(`/assets/${assetId}`);
  },

  /**
   * Get processing status of an asset
   */
  getProcessingStatus: async (assetId: string): Promise<ApiResponse<{
    status: string;
    progress: number;
    message?: string;
  }>> => {
    return api.get(`/assets/${assetId}/status`);
  },
};

export default assetService;
