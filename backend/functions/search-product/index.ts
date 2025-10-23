import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { v4 as uuidv4 } from 'uuid';
import { successResponse, errorResponse, validationErrorResponse } from '../../shared/utils/response';
import { logger } from '../../shared/utils/logger';
import { ProductSearchQuery } from '../../shared/types';
import { searchKnowledgeBase } from '../../shared/knowledgeBase';

/**
 * Azure Function: Search Product
 * POST /api/search/product
 *
 * Searches product information using Azure AI Search with semantic ranking
 */
export async function searchProduct(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const correlationId = request.headers.get('X-Correlation-ID') || uuidv4();

  try {
    logger.info('Product search request received', { correlationId });

    // Parse request body
    let searchQuery: ProductSearchQuery;

    if (request.method === 'POST') {
      searchQuery = await request.json() as ProductSearchQuery;
    } else {
      // GET request - parse query params
      const query = request.query.get('q') || request.query.get('query');
      if (!query) {
        return validationErrorResponse('Query parameter is required');
      }
      searchQuery = {
        query,
        model: request.query.get('model') || undefined,
        year: request.query.get('year') || undefined,
        category: request.query.get('category') || undefined,
      };
    }

    // Validate query
    if (!searchQuery.query || searchQuery.query.trim().length === 0) {
      return validationErrorResponse('Search query cannot be empty');
    }

    logger.info('Executing search', {
      correlationId,
      query: searchQuery.query,
      filters: {
        model: searchQuery.model,
        year: searchQuery.year,
        category: searchQuery.category,
      },
    });

    // Check if vector search should be used (for natural language queries)
    const useVectorSearch = request.query.get('useVector') === 'true' || request.method === 'POST';

    // Execute search using knowledge base
    const results = await searchKnowledgeBase(searchQuery.query, {
      model: searchQuery.model,
      year: searchQuery.year,
      category: searchQuery.category,
      top: 10,
      useVectorSearch,
    });

    logger.info('Search completed', {
      correlationId,
      resultsCount: results.length,
      useVectorSearch,
    });

    return successResponse(results);

  } catch (error) {
    logger.error('Error searching products', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return errorResponse('SEARCH_ERROR', 'Failed to search products', 500);
  }
}

// Register the function
app.http('search-product', {
  methods: ['POST', 'GET'],
  authLevel: 'function',
  route: 'search/product',
  handler: searchProduct,
});
