import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import {
  ProductDocument,
  indexProductDocument,
  ensureSearchIndex,
} from '../knowledgeBase';
import { getOpenAIClient, analyzeDocument } from '../openai';

const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_GPT4 || 'gpt-4o';

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
 * Extract comprehensive document content using GPT-4o Vision
 * This analyzes both text and visual content directly from the document
 */
async function extractDocumentContent(documentSasUrl: string, fileName: string): Promise<{
  extractedText: string;
  summary: string;
  model: string;
  year: string;
  category: string;
  manufacturer?: string;
  standards?: string[];
  certifications?: string[];
  specifications?: Record<string, string>;
}> {
  const analysisPrompt = `You are analyzing a document for a product information knowledge base.

Extract and provide the following information in a structured, human-readable format:

1. **All Text Content**: Extract ALL text from the document, including:
   - Headings, paragraphs, bullet points
   - Tables and data (preserve structure)
   - Captions, labels, and annotations
   - Any fine print or disclaimers
   - Brand names and logos visible in the document

2. **Visual Content**: Describe all images, diagrams, logos, and visual elements found in the document
   - Pay special attention to brand logos (e.g., Toyota, Ford, etc.)
   - Note any brand colors or styling

3. **Product Information**: Identify and extract:
   - Manufacturer name (from logos, text, or visual branding)
   - Product model/name (from text or visual elements)
   - Year (from document or visual year indicators)
   - Product category (e.g., "Vehicles", "Safety Equipment", "Industrial Tools")
   - Australian/New Zealand Standards (e.g., AS/NZS 1892.1:1996)
   - Certifications (e.g., ISO9001, CE marking)
   - Key specifications (dimensions, weight, capacity, etc.)

4. **Human-Readable Summary**: Create a 2-3 sentence natural summary that would help someone quickly understand what this document is about. Write as if explaining to a colleague. Include the brand/manufacturer name if known.

Return ONLY valid JSON in this exact format:
{
  "extractedText": "Full text content extracted from the document...",
  "visualContent": "Description of all visual elements found...",
  "summary": "Natural, human-readable summary of the document...",
  "model": "Product model or name",
  "year": "YYYY",
  "category": "Product category",
  "manufacturer": "Manufacturer name or null",
  "standards": ["AS/NZS 1892.1:1996", ...],
  "certifications": ["ISO9001", ...],
  "specifications": {
    "key": "value"
  }
}

If any field is not found, use:
- model: "Unknown Model"
- year: "${new Date().getFullYear()}"
- category: "General Product"
- manufacturer: null
- standards: []
- certifications: []
- specifications: {}`;

  try {
    logger.info('Analyzing document with GPT-4o Vision (PDF→PNG if needed)', { fileName });

    // Use analyzeDocument which handles PDF→PNG conversion automatically
    const analysisResult = await analyzeDocument(documentSasUrl, analysisPrompt);

    // Try to parse as JSON (response_format not available with analyzeDocument)
    let parsed;
    try {
      // Strip markdown code fences if present
      let jsonText = analysisResult.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
      }
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      logger.warn('GPT-4o did not return valid JSON, using fallback', { error: parseError });
      // If parsing fails, create a basic structure
      parsed = {
        extractedText: analysisResult,
        visualContent: '',
        summary: 'Document analyzed',
        model: 'Unknown Model',
        year: new Date().getFullYear().toString(),
        category: 'General Product',
      };
    }

    logger.info('Document analysis completed', {
      fileName,
      textLength: parsed.extractedText?.length || 0,
      model: parsed.model,
      category: parsed.category,
    });

    // Combine extracted text with visual content description
    const fullText = `${parsed.extractedText || ''}\n\nVISUAL CONTENT:\n${parsed.visualContent || ''}`.trim();

    return {
      extractedText: fullText,
      summary: parsed.summary || 'Document content extracted',
      model: parsed.model || 'Unknown Model',
      year: parsed.year || new Date().getFullYear().toString(),
      category: parsed.category || 'General Product',
      manufacturer: parsed.manufacturer || undefined,
      standards: parsed.standards || [],
      certifications: parsed.certifications || [],
      specifications: parsed.specifications || {},
    };
  } catch (error) {
    logger.error('Error analyzing document', {
      fileName,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

/**
 * Generate a concise product title from metadata and summary
 */
async function generateProductTitle(
  model: string,
  category: string,
  summary: string
): Promise<string> {
  const client = getOpenAIClient();

  const prompt = `Generate a concise, descriptive product title (max 100 characters) based on:

Model: ${model}
Category: ${category}
Summary: ${summary}

Create a title that would be helpful for someone searching this knowledge base.
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
 * Processes a document and adds it to the knowledge base using GPT-4o Vision
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

    // With public blob access enabled, use blob URL directly
    // Use GPT-4o Vision to analyze the document (works for both PDFs and images)
    const documentData = await extractDocumentContent(blobUrl, fileName);

    if (!documentData.extractedText || documentData.extractedText.trim().length === 0) {
      logger.warn('No content extracted from document', { uploadId, fileName });
      return {
        success: false,
        documentsIndexed: 0,
        error: 'No content could be extracted from the document',
      };
    }

    logger.info('Document content extracted', {
      uploadId,
      textLength: documentData.extractedText.length,
      model: documentData.model,
      category: documentData.category,
    });

    // Generate a product title
    const title = await generateProductTitle(
      documentData.model,
      documentData.category,
      documentData.summary
    );

    // Create product document for indexing
    const productDocument: ProductDocument = {
      id: uuidv4(),
      title,
      content: documentData.extractedText,
      model: documentData.model,
      year: documentData.year,
      category: documentData.category,
      source: fileName,
      uploadId,
      fileName,
      extractedAt: new Date().toISOString(),
      metadata: {
        manufacturer: documentData.manufacturer,
        standards: documentData.standards,
        certifications: documentData.certifications,
        specifications: documentData.specifications,
        summary: documentData.summary, // Add human-readable summary for search results
      },
    };

    // Index the document in Azure AI Search
    await indexProductDocument(productDocument);

    logger.info('Knowledge base builder agent completed', {
      uploadId,
      documentId: productDocument.id,
      model: documentData.model,
      category: documentData.category,
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
