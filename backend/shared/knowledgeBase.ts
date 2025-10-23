import { SearchClient, SearchIndexClient, AzureKeyCredential, SearchIndex } from '@azure/search-documents';
import { AzureOpenAI } from 'openai';
import { logger } from './utils/logger';
import { ProductSearchResult } from './types';

const searchEndpoint = process.env.AZURE_AI_SEARCH_ENDPOINT || '';
const searchKey = process.env.AZURE_AI_SEARCH_KEY || '';
const indexName = process.env.AZURE_AI_SEARCH_INDEX_NAME || 'smartproof-product-info';

const openAIEndpoint = process.env.AZURE_OPENAI_ENDPOINT || '';
const openAIKey = process.env.AZURE_OPENAI_KEY || '';
const embeddingDeployment = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-ada-002';

/**
 * Product document structure for Azure AI Search
 */
export interface ProductDocument {
  id: string;
  title: string;
  content: string;
  model: string;
  year: string;
  category: string;
  source: string;
  uploadId: string;
  fileName: string;
  extractedAt: string;
  contentVector?: number[];
  metadata?: {
    manufacturer?: string;
    standards?: string[];
    certifications?: string[];
    specifications?: Record<string, string>;
  };
}

/**
 * Initialize or update the Azure AI Search index
 */
export async function ensureSearchIndex(): Promise<void> {
  try {
    logger.info('Ensuring Azure AI Search index exists', { indexName });

    const indexClient = new SearchIndexClient(
      searchEndpoint,
      new AzureKeyCredential(searchKey)
    );

    // Define the index schema with vector search capabilities
    // Using 'as any' for features that have type mismatches in Azure SDK
    const indexDefinition: SearchIndex = {
      name: indexName,
      fields: [
        { name: 'id', type: 'Edm.String', key: true, filterable: true },
        { name: 'title', type: 'Edm.String', searchable: true, filterable: false },
        { name: 'content', type: 'Edm.String', searchable: true, filterable: false },
        { name: 'model', type: 'Edm.String', searchable: true, filterable: true, facetable: true },
        { name: 'year', type: 'Edm.String', filterable: true, facetable: true },
        { name: 'category', type: 'Edm.String', searchable: true, filterable: true, facetable: true },
        { name: 'source', type: 'Edm.String', filterable: true },
        { name: 'uploadId', type: 'Edm.String', filterable: true },
        { name: 'fileName', type: 'Edm.String', filterable: true },
        { name: 'extractedAt', type: 'Edm.DateTimeOffset', filterable: true, sortable: true },
        {
          name: 'contentVector',
          type: 'Collection(Edm.Single)',
          searchable: true,
          vectorSearchDimensions: 1536,
          vectorSearchProfileName: 'vector-profile',
        } as any,
        { name: 'manufacturer', type: 'Edm.String', searchable: true, filterable: true },
        { name: 'standards', type: 'Collection(Edm.String)', searchable: true, filterable: true },
        { name: 'certifications', type: 'Collection(Edm.String)', searchable: true, filterable: true },
      ],
      vectorSearch: {
        algorithms: [
          {
            name: 'vector-algorithm',
            kind: 'hnsw',
            parameters: {
              metric: 'cosine',
              m: 4,
              efConstruction: 400,
              efSearch: 500,
            },
          } as any,
        ],
        profiles: [
          {
            name: 'vector-profile',
            algorithmConfigurationName: 'vector-algorithm',
          },
        ],
      } as any,
      semanticSearch: {
        defaultConfigurationName: 'semantic-config',
        configurations: [
          {
            name: 'semantic-config',
            prioritizedFields: {
              titleField: { name: 'title' },
              prioritizedContentFields: [{ name: 'content' }],
              prioritizedKeywordsFields: [{ name: 'model' }, { name: 'category' }, { name: 'manufacturer' }],
            },
          } as any,
        ],
      } as any,
    };

    // Check if index exists
    try {
      await indexClient.getIndex(indexName);
      logger.info('Search index already exists', { indexName });
    } catch (error) {
      // Index doesn't exist, create it
      logger.info('Creating new search index', { indexName });
      await indexClient.createIndex(indexDefinition);
      logger.info('Search index created successfully', { indexName });
    }
  } catch (error) {
    logger.error('Error ensuring search index', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Generate embeddings for text using Azure OpenAI
 */
export async function generateEmbeddings(text: string): Promise<number[]> {
  try {
    const client = new AzureOpenAI({
      endpoint: openAIEndpoint,
      apiKey: openAIKey,
      apiVersion: '2024-08-01-preview',
    });

    const embeddings = await client.embeddings.create({
      model: embeddingDeployment,
      input: text,
    });

    if (embeddings.data.length === 0) {
      throw new Error('No embeddings generated');
    }

    return embeddings.data[0].embedding;
  } catch (error) {
    logger.error('Error generating embeddings', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Index a product document in Azure AI Search
 */
export async function indexProductDocument(document: ProductDocument): Promise<void> {
  try {
    logger.info('Indexing product document', {
      id: document.id,
      title: document.title,
      uploadId: document.uploadId,
    });

    // Generate embeddings for the content
    const embeddingText = `${document.title}\n\n${document.content}`;
    const contentVector = await generateEmbeddings(embeddingText);

    // Prepare document for indexing
    const searchDocument = {
      id: document.id,
      title: document.title,
      content: document.content,
      model: document.model,
      year: document.year,
      category: document.category,
      source: document.source,
      uploadId: document.uploadId,
      fileName: document.fileName,
      extractedAt: document.extractedAt,
      contentVector,
      manufacturer: document.metadata?.manufacturer || null,
      standards: document.metadata?.standards || [],
      certifications: document.metadata?.certifications || [],
    };

    // Index the document
    const searchClient = new SearchClient(
      searchEndpoint,
      indexName,
      new AzureKeyCredential(searchKey)
    );

    const result = await searchClient.uploadDocuments([searchDocument]);

    if (result.results[0].succeeded) {
      logger.info('Product document indexed successfully', { id: document.id });
    } else {
      logger.error('Failed to index product document', {
        id: document.id,
        error: result.results[0].errorMessage,
      });
      throw new Error(result.results[0].errorMessage || 'Failed to index document');
    }
  } catch (error) {
    logger.error('Error indexing product document', {
      error: error instanceof Error ? error.message : 'Unknown error',
      documentId: document.id,
    });
    throw error;
  }
}

/**
 * Index multiple product documents in batch
 */
export async function indexProductDocuments(documents: ProductDocument[]): Promise<void> {
  try {
    logger.info('Batch indexing product documents', { count: documents.length });

    for (const document of documents) {
      await indexProductDocument(document);
    }

    logger.info('Batch indexing completed', { count: documents.length });
  } catch (error) {
    logger.error('Error batch indexing product documents', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Delete a product document from the index
 */
export async function deleteProductDocument(documentId: string): Promise<void> {
  try {
    logger.info('Deleting product document from index', { documentId });

    const searchClient = new SearchClient(
      searchEndpoint,
      indexName,
      new AzureKeyCredential(searchKey)
    );

    await searchClient.deleteDocuments([{ id: documentId }]);

    logger.info('Product document deleted from index', { documentId });
  } catch (error) {
    logger.error('Error deleting product document', {
      error: error instanceof Error ? error.message : 'Unknown error',
      documentId,
    });
    throw error;
  }
}

/**
 * Search the knowledge base with vector and semantic search
 */
export async function searchKnowledgeBase(
  query: string,
  options?: {
    model?: string;
    year?: string;
    category?: string;
    top?: number;
    useVectorSearch?: boolean;
  }
): Promise<ProductSearchResult[]> {
  try {
    logger.info('Searching knowledge base', { query, options });

    const searchClient = new SearchClient(
      searchEndpoint,
      indexName,
      new AzureKeyCredential(searchKey)
    );

    // Build filter expression
    const filters: string[] = [];
    if (options?.model) {
      filters.push(`model eq '${options.model}'`);
    }
    if (options?.year) {
      filters.push(`year eq '${options.year}'`);
    }
    if (options?.category) {
      filters.push(`category eq '${options.category}'`);
    }

    const searchOptions: any = {
      filter: filters.length > 0 ? filters.join(' and ') : undefined,
      top: options?.top || 10,
      includeTotalCount: true,
      queryType: 'semantic',
      semanticConfiguration: 'semantic-config',
      select: ['id', 'title', 'content', 'model', 'year', 'category', 'source'],
    };

    // Add vector search if enabled
    if (options?.useVectorSearch) {
      const queryVector = await generateEmbeddings(query);
      searchOptions.vectorQueries = [
        {
          kind: 'vector',
          vector: queryVector,
          kNearestNeighborsCount: options?.top || 10,
          fields: ['contentVector'],
        },
      ];
    }

    // Execute search
    const searchResults = await searchClient.search(query, searchOptions);

    // Transform results
    const results: ProductSearchResult[] = [];
    for await (const result of searchResults.results) {
      const doc = result.document as any;
      results.push({
        id: doc.id as string,
        title: doc.title as string,
        content: doc.content as string,
        model: doc.model as string,
        year: doc.year as string,
        category: doc.category as string,
        relevanceScore: result.score || 0,
        source: doc.source as string,
      });
    }

    logger.info('Knowledge base search completed', {
      query,
      resultsCount: results.length,
    });

    return results;
  } catch (error) {
    logger.error('Error searching knowledge base', {
      error: error instanceof Error ? error.message : 'Unknown error',
      query,
    });
    throw error;
  }
}
