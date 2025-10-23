/**
 * Vision utilities - Now using GPT-4o Vision instead of Azure Computer Vision
 * This file provides backward compatibility by wrapping GPT-4o Vision calls
 */
import { logger } from './utils/logger';
import * as openai from './openai';

/**
 * Extract structured data from document using GPT-4o
 * Re-exported for convenience
 */
export { extractStructuredData } from './openai';

/**
 * Analyze image using GPT-4o Vision (backward compatibility wrapper)
 */
export async function analyzeImage(imageUrl: string) {
  try {
    logger.info('Analyzing image with GPT-4o Vision', { imageUrl });

    const prompt = `Analyze this image and return a JSON object with:
{
  "description": "detailed description",
  "confidence": 0.95,
  "dominantColors": ["#RRGGBB", ...],
  "accentColor": "#RRGGBB",
  "objects": [{"name": "object", "confidence": 0.9, "rectangle": {"x": 0, "y": 0, "width": 100, "height": 100}}],
  "brands": [{"name": "brand", "confidence": 0.9, "rectangle": {...}}],
  "imageType": {"clipArtType": 0, "lineDrawingType": 0},
  "categories": [{"name": "category", "score": 0.8}]
}`;

    const result = await openai.analyzeDocument(imageUrl, prompt);

    try {
      const parsed = JSON.parse(result);
      logger.info('Image analysis completed', {
        imageUrl,
        objectsDetected: parsed.objects?.length || 0,
        brandsDetected: parsed.brands?.length || 0,
      });
      return parsed;
    } catch {
      // Fallback structure
      logger.warn('GPT-4o did not return valid JSON, using fallback structure');
      return {
        description: result,
        confidence: 0,
        dominantColors: [],
        accentColor: '#000000',
        objects: [],
        brands: [],
        imageType: { clipArtType: 0, lineDrawingType: 0 },
        categories: [],
      };
    }
  } catch (error) {
    logger.error('Error analyzing image', {
      error: error instanceof Error ? error.message : 'Unknown error',
      imageUrl,
    });
    throw error;
  }
}

/**
 * Extract text from image using GPT-4o Vision OCR
 */
export async function extractTextFromImage(imageUrl: string): Promise<string> {
  try {
    logger.info('Extracting text from image with GPT-4o Vision OCR', { imageUrl });

    const text = await openai.extractTextFromImage(imageUrl);

    logger.info('Text extraction completed', {
      imageUrl,
      textLength: text.length,
    });

    return text;

  } catch (error) {
    logger.error('Error extracting text from image', {
      error: error instanceof Error ? error.message : 'Unknown error',
      imageUrl,
    });
    throw error;
  }
}

/**
 * Detect logos in image using GPT-4o Vision
 */
export async function detectLogos(imageUrl: string) {
  try {
    logger.info('Detecting logos in image with GPT-4o Vision', { imageUrl });

    const logos = await openai.detectLogos(imageUrl);

    logger.info('Logo detection completed', {
      imageUrl,
      logosDetected: logos.length,
    });

    return logos;

  } catch (error) {
    logger.error('Error detecting logos', {
      error: error instanceof Error ? error.message : 'Unknown error',
      imageUrl,
    });
    throw error;
  }
}

/**
 * Check image quality using GPT-4o Vision
 */
export async function checkImageQuality(imageUrl: string) {
  try {
    logger.info('Checking image quality with GPT-4o Vision', { imageUrl });

    const quality = await openai.checkImageQuality(imageUrl);

    return {
      isBlackAndWhite: quality.isBlackAndWhite || false,
      dominantColors: quality.dominantColors || [],
      accentColor: quality.accentColor || '#000000',
      isClipart: quality.isClipart || false,
      isLineDrawing: quality.isLineDrawing || false,
    };

  } catch (error) {
    logger.error('Error checking image quality', {
      error: error instanceof Error ? error.message : 'Unknown error',
      imageUrl,
    });
    throw error;
  }
}

export default {
  analyzeImage,
  extractTextFromImage,
  detectLogos,
  checkImageQuality,
};
