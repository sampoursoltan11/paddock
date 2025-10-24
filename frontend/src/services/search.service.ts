import { api } from './api';
import { ApiResponse, ProductSearchQuery, ProductSearchResult } from '@/types';

/**
 * Search Service - Handles product information search operations
 */
export const searchService = {
  /**
   * Search product information using AI Search
   */
  searchProduct: async (query: ProductSearchQuery): Promise<ApiResponse<ProductSearchResult[]>> => {
    return api.post<ProductSearchResult[]>('/search/product', query);
  },

  /**
   * Get product details by ID
   */
  getProductDetails: async (productId: string): Promise<ApiResponse<ProductSearchResult>> => {
    return api.get<ProductSearchResult>(`/search/product/${productId}`);
  },

  /**
   * Get search suggestions/autocomplete
   */
  getSearchSuggestions: async (partialQuery: string): Promise<ApiResponse<string[]>> => {
    return api.get<string[]>('/search/suggestions', { q: partialQuery });
  },

  /**
   * Get available models for filtering
   */
  getModels: async (): Promise<ApiResponse<string[]>> => {
    return api.get<string[]>('/search/models');
  },

  /**
   * Get available years for filtering
   */
  getYears: async (): Promise<ApiResponse<string[]>> => {
    return api.get<string[]>('/search/years');
  },

  /**
   * Get available categories for filtering
   */
  getCategories: async (): Promise<ApiResponse<string[]>> => {
    return api.get<string[]>('/search/categories');
  },

  /**
   * Delete all indexed documents from the knowledge base
   */
  deleteAllDocuments: async (): Promise<ApiResponse<{ deletedCount: number }>> => {
    return api.delete<{ deletedCount: number }>('/search/documents');
  },
};

export default searchService;
