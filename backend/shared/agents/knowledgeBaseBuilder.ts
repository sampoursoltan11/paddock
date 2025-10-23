import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { extractStructuredData } from '../vision';
import {
  ProductDocument,
  indexProductDocument,
  ensureSearchIndex,
} from '../knowledgeBase';
import { getOpenAIClient } from '../openai';

const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o';

/**
 * Knowledge Base Builder Agent
 * Extracts product information from documents and indexes them in Azure AI Search
 */

export interface KnowledgeBaseResult {
  success: boolean;
  documentsIndexed: number;
  error?: string;
}

/**
 * Extract product metadata from text using GPT-4o
 */
async function extractProductMetadata(text: string): Promise<{
  model: string;
  year: string;
  category: string;
  manufacturer?: string;
  standards?: string[];
  certifications?: string[];
  specifications?: Record<string, string>;
}> {
  const client = getOpenAIClient();

  const prompt = `You are a product information extraction specialist.

Analyze the following product documentation and extract key metadata.

DOCUMENT TEXT:
${text}

Extract the following information:
1. Product Model/Name
2. Year (manufacture year or documentation year)
3. Category (e.g., "Safety Equipment", "Industrial Tools", "Construction Equipment", etc.)
4. Manufacturer name
5. Australian/New Zealand Standards mentioned (e.g., AS/NZS 1892.1:1996)
6. Certifications (e.g., ISO9001, CE marking)
7. Key specifications (as key-value pairs)

Return ONLY valid JSON in this exact format:
{
  "model": "product model or name",
  "year": "YYYY",
  "category": "product category",
  "manufacturer": "manufacturer name",
  "standards": ["AS/NZS 1892.1:1996", ...],
  "certifications": ["ISO9001", ...],
  "specifications": {
    "height": "2.4m",
    "weight": "5kg",
    ...
  }
}

If any field is not found, use reasonable defaults:
- model: "Unknown Model"
- year: current year
- category: "General Product"
- manufacturer: null
- standards: []
- certifications: []
- specifications: {}`;

  try {
    const response = await client.chat.completions.create({
      model: deploymentName,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const metadata = JSON.parse(content);

    logger.info('Product metadata extracted', { metadata });

    return {
      model: metadata.model || 'Unknown Model',
      year: metadata.year || new Date().getFullYear().toString(),
      category: metadata.category || 'General Product',
      manufacturer: metadata.manufacturer || undefined,
      standards: metadata.standards || [],
      certifications: metadata.certifications || [],
      specifications: metadata.specifications || {},
    };
  } catch (error) {
    logger.error('Error extracting product metadata', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Return defaults on error
    return {
      model: 'Unknown Model',
      year: new Date().getFullYear().toString(),
      category: 'General Product',
      standards: [],
      certifications: [],
      specifications: {},
    };
  }
}

/**
 * Generate a concise product title from metadata and text
 */
async function generateProductTitle(
  model: string,
  category: string,
  textSnippet: string
): Promise<string> {
  const client = getOpenAIClient();

  const prompt = `Generate a concise, descriptive product title (max 100 characters) based on:

Model: ${model}
Category: ${category}
Context: ${textSnippet.substring(0, 500)}

Return only the title, nothing else.`;

  try {
    const response = await client.chat.completions.create({
      model: deploymentName,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 50,
    });

    const title = response.choices[0]?.message?.content?.trim() || `${model} - ${category}`;

    logger.info('Product title generated', { title });

    return title;
  } catch (error) {
    logger.error('Error generating product title', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return `${model} - ${category}`;
  }
}

/**
 * Knowledge Base Builder Agent
 * Processes a document and adds it to the knowledge base
 */
export async function knowledgeBaseBuilderAgent(
  uploadId: string,
  fileName: string,
  blobUrl: string
): Promise<KnowledgeBaseResult> {
  try {
    logger.info('Knowledge base builder agent starting', { uploadId, fileName });

    // Ensure the search index exists
    await ensureSearchIndex();

    // Extract text and structured data from the document
    const extractedData = await extractStructuredData(blobUrl);

    if (!extractedData.extractedText || extractedData.extractedText.trim().length === 0) {
      logger.warn('No text extracted from document', { uploadId, fileName });
      return {
        success: false,
        documentsIndexed: 0,
        error: 'No text could be extracted from the document',
      };
    }

    logger.info('Text extracted from document', {
      uploadId,
      textLength: extractedData.extractedText.length,
    });

    // Extract product metadata using GPT-4o
    const metadata = await extractProductMetadata(extractedData.extractedText);

    // Generate a product title
    const title = await generateProductTitle(
      metadata.model,
      metadata.category,
      extractedData.extractedText
    );

    // Create product document for indexing
    const productDocument: ProductDocument = {
      id: uuidv4(),
      title,
      content: extractedData.extractedText,
      model: metadata.model,
      year: metadata.year,
      category: metadata.category,
      source: fileName,
      uploadId,
      fileName,
      extractedAt: new Date().toISOString(),
      metadata: {
        manufacturer: metadata.manufacturer,
        standards: metadata.standards,
        certifications: metadata.certifications,
        specifications: metadata.specifications,
      },
    };

    // Index the document in Azure AI Search
    await indexProductDocument(productDocument);

    logger.info('Knowledge base builder agent completed', {
      uploadId,
      documentId: productDocument.id,
      model: metadata.model,
      category: metadata.category,
    });

    return {
      success: true,
      documentsIndexed: 1,
    };
  } catch (error) {
    logger.error('Knowledge base builder agent failed', {
      uploadId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      documentsIndexed: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process multiple documents and add them to the knowledge base
 */
export async function batchBuildKnowledgeBase(
  documents: Array<{ uploadId: string; fileName: string; blobUrl: string }>
): Promise<KnowledgeBaseResult> {
  try {
    logger.info('Batch knowledge base building started', { count: documents.length });

    let totalIndexed = 0;
    const errors: string[] = [];

    for (const doc of documents) {
      const result = await knowledgeBaseBuilderAgent(doc.uploadId, doc.fileName, doc.blobUrl);
      if (result.success) {
        totalIndexed += result.documentsIndexed;
      } else if (result.error) {
        errors.push(`${doc.fileName}: ${result.error}`);
      }
    }

    logger.info('Batch knowledge base building completed', {
      totalDocuments: documents.length,
      totalIndexed,
      errors: errors.length,
    });

    return {
      success: errors.length === 0,
      documentsIndexed: totalIndexed,
      error: errors.length > 0 ? errors.join('; ') : undefined,
    };
  } catch (error) {
    logger.error('Batch knowledge base building failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      documentsIndexed: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
