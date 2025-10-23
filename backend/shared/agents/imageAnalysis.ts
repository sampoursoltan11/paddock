/**
 * Image Analysis Agent
 * Analyzes visual content including logos, quality, and brand compliance
 */
import { logger } from '../utils/logger';
import { detectLogos, checkImageQuality } from '../vision';

export interface ImageAnalysisResult {
  success: boolean;
  analysis?: {
    logos?: any[];
    quality?: any;
    visualContent?: string;
  };
  error?: string;
}

/**
 * Analyze visual content in the document
 */
export async function imageAnalysisAgent(
  uploadId: string,
  blobUrl: string
): Promise<ImageAnalysisResult> {
  try {
    logger.info('Image analysis agent starting', { uploadId, blobUrl });

    // Detect logos
    const logos = await detectLogos(blobUrl);

    // Check image quality
    const quality = await checkImageQuality(blobUrl);

    logger.info('Image analysis agent completed', {
      uploadId,
      logosDetected: logos.length,
      isBlackAndWhite: quality.isBlackAndWhite || false,
    });

    return {
      success: true,
      analysis: {
        logos,
        quality,
        visualContent: `Found ${logos.length} logo(s). Image quality assessed.`,
      },
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error('Image analysis agent failed', {
      uploadId,
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}
