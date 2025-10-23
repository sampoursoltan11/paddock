import { ComputerVisionClient } from '@azure/cognitiveservices-computervision';
import { ApiKeyCredentials } from '@azure/ms-rest-js';
import { logger } from './utils/logger';

const endpoint = process.env.AZURE_COMPUTER_VISION_ENDPOINT || '';
const key = process.env.AZURE_COMPUTER_VISION_KEY || '';

// Initialize Computer Vision client
const credentials = new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': key } });
const visionClient = new ComputerVisionClient(credentials, endpoint);

/**
 * Analyze image using Azure Computer Vision
 */
export async function analyzeImage(imageUrl: string) {
  try {
    logger.info('Analyzing image with Computer Vision', { imageUrl });

    const analysis = await visionClient.analyzeImage(imageUrl, {
      visualFeatures: [
        'Categories',
        'Description',
        'Color',
        'ImageType',
        'Objects',
        'Brands',
        'Adult',
      ],
      details: ['Landmarks'],
    });

    logger.info('Image analysis completed', {
      imageUrl,
      objectsDetected: analysis.objects?.length || 0,
      brandsDetected: analysis.brands?.length || 0,
    });

    return {
      description: analysis.description?.captions?.[0]?.text || '',
      confidence: analysis.description?.captions?.[0]?.confidence || 0,
      dominantColors: analysis.color?.dominantColors || [],
      accentColor: analysis.color?.accentColor,
      objects: analysis.objects?.map((obj) => ({
        name: obj.object || '',
        confidence: obj.confidence || 0,
        rectangle: obj.rectangle,
      })) || [],
      brands: analysis.brands?.map((brand) => ({
        name: brand.name || '',
        confidence: brand.confidence || 0,
        rectangle: brand.rectangle,
      })) || [],
      imageType: {
        clipArtType: analysis.imageType?.clipArtType || 0,
        lineDrawingType: analysis.imageType?.lineDrawingType || 0,
      },
      categories: analysis.categories?.map((cat) => ({
        name: cat.name || '',
        score: cat.score || 0,
      })) || [],
    };
  } catch (error) {
    logger.error('Error analyzing image', {
      error: error instanceof Error ? error.message : 'Unknown error',
      imageUrl,
    });
    throw error;
  }
}

/**
 * Extract text from image using OCR
 */
export async function extractTextFromImage(imageUrl: string): Promise<string> {
  try {
    logger.info('Extracting text from image with OCR', { imageUrl });

    const result = await visionClient.read(imageUrl);
    const operationId = result.operationLocation.split('/').pop();

    if (!operationId) {
      throw new Error('Failed to get operation ID from OCR result');
    }

    // Wait for OCR operation to complete
    let readResult = await visionClient.getReadResult(operationId);
    while (readResult.status === 'running' || readResult.status === 'notStarted') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      readResult = await visionClient.getReadResult(operationId);
    }

    if (readResult.status !== 'succeeded') {
      throw new Error(`OCR operation failed with status: ${readResult.status}`);
    }

    // Extract text from all pages
    const extractedText: string[] = [];
    for (const page of readResult.analyzeResult?.readResults || []) {
      for (const line of page.lines || []) {
        extractedText.push(line.text || '');
      }
    }

    const fullText = extractedText.join('\n');

    logger.info('Text extraction completed', {
      imageUrl,
      textLength: fullText.length,
      linesExtracted: extractedText.length,
    });

    return fullText;

  } catch (error) {
    logger.error('Error extracting text from image', {
      error: error instanceof Error ? error.message : 'Unknown error',
      imageUrl,
    });
    throw error;
  }
}

/**
 * Detect logos in image (for Toyota logo detection)
 */
export async function detectLogos(imageUrl: string) {
  try {
    logger.info('Detecting logos in image', { imageUrl });

    const analysis = await visionClient.analyzeImage(imageUrl, {
      visualFeatures: ['Brands'],
    });

    const logos = analysis.brands?.map((brand) => ({
      name: brand.name || '',
      confidence: brand.confidence || 0,
      rectangle: brand.rectangle,
    })) || [];

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
 * Check image quality metrics
 */
export async function checkImageQuality(imageUrl: string) {
  try {
    logger.info('Checking image quality', { imageUrl });

    const analysis = await visionClient.analyzeImage(imageUrl, {
      visualFeatures: ['ImageType', 'Color'],
    });

    return {
      isBlackAndWhite: analysis.color?.isBWImg || false,
      dominantColors: analysis.color?.dominantColors || [],
      accentColor: analysis.color?.accentColor,
      isClipart: (analysis.imageType?.clipArtType || 0) > 0,
      isLineDrawing: (analysis.imageType?.lineDrawingType || 0) > 0,
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
