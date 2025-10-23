import { AzureOpenAI } from 'openai';
import { logger } from './utils/logger';

const endpoint = process.env.AZURE_OPENAI_ENDPOINT || '';
const apiKey = process.env.AZURE_OPENAI_KEY || '';
const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_GPT4 || 'gpt-4o';

// Initialize Azure OpenAI client
const client = new AzureOpenAI({
  endpoint,
  apiKey,
  apiVersion: '2024-08-01-preview',
});

/**
 * Get the Azure OpenAI client instance
 */
export function getOpenAIClient(): AzureOpenAI {
  return client;
}

/**
 * Analyze document (PDF or image) using GPT-4o Vision
 */
export async function analyzeDocument(documentUrl: string, prompt: string) {
  try {
    logger.info('Analyzing document with GPT-4o', { documentUrl });

    const response = await client.chat.completions.create({
      model: deploymentName,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: documentUrl },
            },
          ],
        },
      ],
      max_tokens: 4000,
      temperature: 0.1,
    });

    const result = response.choices[0]?.message?.content || '';

    logger.info('Document analysis completed', {
      documentUrl,
      contentLength: result.length,
    });

    return result;

  } catch (error) {
    logger.error('Error analyzing document', {
      error: error instanceof Error ? error.message : 'Unknown error',
      documentUrl,
    });
    throw error;
  }
}

/**
 * Extract structured data from document using GPT-4o
 */
export async function extractStructuredData(documentUrl: string) {
  const prompt = `Analyze this document and extract the following information in JSON format:

1. All text content (as a single string)
2. Any tables found (as an array with headers and rows)
3. Images and their locations (as an array with page numbers and positions)
4. Page count

Return the data in this exact JSON structure:
{
  "extractedText": "full text content here",
  "extractedTables": [
    {
      "id": "table_001",
      "pageNumber": 1,
      "headers": ["Column1", "Column2"],
      "rows": [["value1", "value2"]]
    }
  ],
  "extractedImages": [
    {
      "imageId": "img_001",
      "pageNumber": 1,
      "position": { "x": 0, "y": 0, "width": 100, "height": 100 }
    }
  ],
  "pageCount": 1
}`;

  try {
    const result = await analyzeDocument(documentUrl, prompt);

    // Try to parse as JSON
    try {
      return JSON.parse(result);
    } catch {
      // If not valid JSON, return structured placeholder
      logger.warn('GPT-4o did not return valid JSON, using fallback structure');
      return {
        extractedText: result,
        extractedTables: [],
        extractedImages: [],
        pageCount: 1,
      };
    }
  } catch (error) {
    logger.error('Error extracting structured data', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Analyze image for visual compliance using GPT-4o Vision
 */
export async function analyzeImageCompliance(
  imageUrl: string,
  brandGuidelines: {
    logoSpecs: any;
    brandColors: any;
    qualityStandards: any;
  }
) {
  const prompt = `Analyze this image for brand compliance based on these guidelines:

Logo Specifications:
${JSON.stringify(brandGuidelines.logoSpecs, null, 2)}

Brand Colors:
${JSON.stringify(brandGuidelines.brandColors, null, 2)}

Quality Standards:
${JSON.stringify(brandGuidelines.qualityStandards, null, 2)}

Analyze the image and return a JSON object with:
1. logoDetected: boolean
2. logoPosition: {x, y, width, height, confidence}
3. imageQuality: {resolution, dpi, isBlurry, qualityScore}
4. dominantColors: array of hex color codes
5. objectsDetected: array of object names
6. textInImage: string
7. brandCompliance: {logoUsage, colorConsistency, visualStyle, issues: array}
8. issues: array of compliance issues with severity, category, message

Return only valid JSON.`;

  try {
    const result = await analyzeDocument(imageUrl, prompt);

    // Try to parse as JSON
    try {
      return JSON.parse(result);
    } catch {
      // If not valid JSON, return fallback structure
      logger.warn('GPT-4o did not return valid JSON for image compliance, using fallback');
      return {
        logoDetected: false,
        logoPosition: null,
        imageQuality: {
          resolution: 'unknown',
          dpi: 0,
          isBlurry: false,
          qualityScore: 0,
        },
        dominantColors: [],
        objectsDetected: [],
        textInImage: result,
        brandCompliance: {
          logoUsage: 'unknown',
          colorConsistency: 'unknown',
          visualStyle: 'unknown',
          issues: [],
        },
        issues: [],
      };
    }
  } catch (error) {
    logger.error('Error analyzing image compliance', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Extract text from image using GPT-4o Vision OCR
 */
export async function extractTextFromImage(imageUrl: string): Promise<string> {
  const prompt = 'Extract all text from this image. Return only the text content, nothing else.';

  try {
    return await analyzeDocument(imageUrl, prompt);
  } catch (error) {
    logger.error('Error extracting text from image', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Detect logos in image using GPT-4o Vision
 */
export async function detectLogos(imageUrl: string) {
  const prompt = `Detect all logos in this image. Return a JSON array with:
[
  {
    "name": "Logo Name",
    "confidence": 0.95,
    "rectangle": {"x": 0, "y": 0, "width": 100, "height": 50}
  }
]

Return only valid JSON array.`;

  try {
    const result = await analyzeDocument(imageUrl, prompt);

    try {
      return JSON.parse(result);
    } catch {
      logger.warn('GPT-4o did not return valid JSON for logo detection, returning empty array');
      return [];
    }
  } catch (error) {
    logger.error('Error detecting logos', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Check image quality using GPT-4o Vision
 */
export async function checkImageQuality(imageUrl: string) {
  const prompt = `Analyze this image's quality and return a JSON object:
{
  "isBlackAndWhite": boolean,
  "dominantColors": ["#RRGGBB", ...],
  "accentColor": "#RRGGBB",
  "isClipart": boolean,
  "isLineDrawing": boolean,
  "estimatedDPI": number,
  "isBlurry": boolean,
  "qualityScore": 0.0-1.0
}

Return only valid JSON.`;

  try {
    const result = await analyzeDocument(imageUrl, prompt);

    try {
      return JSON.parse(result);
    } catch {
      logger.warn('GPT-4o did not return valid JSON for quality check, using fallback');
      return {
        isBlackAndWhite: false,
        dominantColors: [],
        accentColor: '#000000',
        isClipart: false,
        isLineDrawing: false,
        estimatedDPI: 0,
        isBlurry: false,
        qualityScore: 0,
      };
    }
  } catch (error) {
    logger.error('Error checking image quality', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export default {
  analyzeDocument,
  extractStructuredData,
  analyzeImageCompliance,
  extractTextFromImage,
  detectLogos,
  checkImageQuality,
};
