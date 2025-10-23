import { BaseAgent } from '../shared/base-agent';
import { getContainerClient, uploadBlob, CONTAINERS } from '../../backend/shared/storage';
import { extractStructuredData } from '../../backend/shared/openai';
import { v4 as uuidv4 } from 'uuid';

/**
 * Parser Agent
 * Extracts text, tables, and images from PDF documents using GPT-4o
 */
export class ParserAgent extends BaseAgent {
  constructor(uploadId: string) {
    super('parser', uploadId);
  }

  async execute(): Promise<any> {
    this.log('Starting document parsing');

    try {
      // Get the uploaded file blob URL
      const containerClient = getContainerClient(CONTAINERS.uploads);
      const blobs = containerClient.listBlobsFlat({ prefix: this.uploadId });

      let blobUrl = '';
      for await (const blob of blobs) {
        if (blob.name.endsWith('.pdf') || blob.name.match(/\.(png|jpg|jpeg)$/i)) {
          const blobClient = containerClient.getBlobClient(blob.name);
          blobUrl = blobClient.url;
          break;
        }
      }

      if (!blobUrl) {
        throw new Error('No valid document found for parsing');
      }

      this.log('Document found', { blobUrl });

      // TODO: In production, use Azure Document Intelligence SDK
      // For PoC, we'll create a placeholder result
      const result = await this.parseDocument(blobUrl);

      // Save extracted data to processed container
      const processedBlobName = `${this.uploadId}/extracted-data.json`;
      await uploadBlob(
        CONTAINERS.processed,
        processedBlobName,
        JSON.stringify(result, null, 2),
        'application/json'
      );

      this.log('Document parsing completed', {
        textLength: result.extractedText.length,
        tablesCount: result.extractedTables.length,
        imagesCount: result.extractedImages.length,
        pageCount: result.pageCount,
      });

      return result;

    } catch (error) {
      this.log('Document parsing failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Parse document using GPT-4o Vision
   */
  private async parseDocument(blobUrl: string): Promise<any> {
    this.log('Parsing document with GPT-4o', { blobUrl });

    try {
      // Extract structured data using GPT-4o
      const extracted = await extractStructuredData(blobUrl);

      // Return structured result
      return {
        uploadId: this.uploadId,
        sourceUrl: blobUrl,
        pageCount: extracted.pageCount || 1,
        extractedText: extracted.extractedText || '',
        extractedTables: extracted.extractedTables || [],
        extractedImages: (extracted.extractedImages || []).map((img: any, index: number) => ({
          imageId: img.imageId || `img_${String(index + 1).padStart(3, '0')}`,
          blobPath: `${CONTAINERS.processed}/${this.uploadId}/images/${img.imageId || `page${img.pageNumber}_img${index + 1}`}.jpg`,
          pageNumber: img.pageNumber || 1,
          position: img.position || { x: 0, y: 0, width: 0, height: 0 },
        })),
        processedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.log('Error parsing document with GPT-4o', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

export default ParserAgent;
