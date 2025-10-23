import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { SearchClient, AzureKeyCredential } from '@azure/search-documents';
import { v4 as uuidv4 } from 'uuid';
import { successResponse, errorResponse, validationErrorResponse } from '../../shared/utils/response';
import { logger } from '../../shared/utils/logger';
import { ProductSearchQuery, ProductSearchResult } from '../../shared/types';

const searchEndpoint = process.env.AZURE_AI_SEARCH_ENDPOINT || '';
const searchKey = process.env.AZURE_AI_SEARCH_KEY || '';
const indexName = process.env.AZURE_AI_SEARCH_INDEX_NAME || 'smartproof-product-info';

/**
 * Azure Function: Search Product
 * POST /api/search/product
 *
 * Searches product information using Azure AI Search with semantic ranking
 */
export async function searchProduct(
  request: HttpRequest,
  context: InvocationContext
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

    // Initialize Azure AI Search client
    const searchClient = new SearchClient(
      searchEndpoint,
      indexName,
      new AzureKeyCredential(searchKey)
    );

    // Build filter expression
    const filters: string[] = [];
    if (searchQuery.model) {
      filters.push(`model eq '${searchQuery.model}'`);
    }
    if (searchQuery.year) {
      filters.push(`year eq '${searchQuery.year}'`);
    }
    if (searchQuery.category) {
      filters.push(`category eq '${searchQuery.category}'`);
    }

    // Execute search
    const searchResults = await searchClient.search(searchQuery.query, {
      filter: filters.length > 0 ? filters.join(' and ') : undefined,
      top: 10,
      includeTotalCount: true,
      queryType: 'semantic',
      semanticConfiguration: 'default',
      select: ['id', 'title', 'content', 'model', 'year', 'category', 'source'],
    });

    // Transform results
    const results: ProductSearchResult[] = [];
    for await (const result of searchResults.results) {
      results.push({
        id: result.document.id as string,
        title: result.document.title as string,
        content: result.document.content as string,
        model: result.document.model as string,
        year: result.document.year as string,
        category: result.document.category as string,
        relevanceScore: result.score || 0,
        source: result.document.source as string,
      });
    }

    logger.info('Search completed', {
      correlationId,
      resultsCount: results.length,
      totalCount: searchResults.count,
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
