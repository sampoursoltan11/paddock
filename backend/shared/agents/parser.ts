/**
 * Parser Agent
 * Extracts text, tables, and structured data from documents using GPT-4o Vision
 */
import { logger } from '../utils/logger';
import { extractStructuredData } from '../openai';

export interface ParserResult {
  success: boolean;
  extractedText?: string;
  extractedTables?: any[];
  extractedImages?: any[];
  pageCount?: number;
  error?: string;
}

/**
 * Parse document and extract all content
 */
export async function parserAgent(
  uploadId: string,
  blobUrl: string
): Promise<ParserResult> {
  try {
    logger.info('Parser agent starting', { uploadId, blobUrl });

    // With public blob access enabled, use blob URL directly
    // Use GPT-4o Vision to extract structured data from the document
    const result = await extractStructuredData(blobUrl);

    logger.info('Parser agent completed', {
      uploadId,
      textLength: result.extractedText?.length || 0,
      tablesCount: result.extractedTables?.length || 0,
      imagesCount: result.extractedImages?.length || 0,
    });

    return {
      success: true,
      extractedText: result.extractedText,
      extractedTables: result.extractedTables || [],
      extractedImages: result.extractedImages || [],
      pageCount: result.pageCount || 1,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error('Parser agent failed', {
      uploadId,
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}
