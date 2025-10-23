import { BaseAgent } from '../shared/base-agent';
import { analyzeImageCompliance } from '../../backend/shared/openai';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Image Analysis Agent
 * Analyzes images for visual compliance using GPT-4o Vision
 */
export class ImageAnalysisAgent extends BaseAgent {
  private logoSpecs: any;
  private brandColors: any;
  private qualityStandards: any;

  constructor(uploadId: string) {
    super('image-analysis', uploadId);

    // Load brand guidelines
    const guidelinesPath = path.join(__dirname, 'brand-guidelines');
    this.logoSpecs = JSON.parse(
      fs.readFileSync(path.join(guidelinesPath, 'toyota-logo-specs.json'), 'utf-8')
    );
    this.brandColors = JSON.parse(
      fs.readFileSync(path.join(guidelinesPath, 'brand-colors.json'), 'utf-8')
    );
    this.qualityStandards = JSON.parse(
      fs.readFileSync(path.join(guidelinesPath, 'image-quality-standards.json'), 'utf-8')
    );
  }

  async execute(): Promise<any> {
    this.log('Starting image analysis');

    try {
      // Get parser results to find extracted images
      const parserResult = await this.getAgentResult('parser');

      if (!parserResult.extractedImages || parserResult.extractedImages.length === 0) {
        this.log('No images to analyze');
        return {
          results: [],
          summary: {
            totalImages: 0,
            imagesAnalyzed: 0,
            issuesFound: 0,
          },
        };
      }

      this.log(`Analyzing ${parserResult.extractedImages.length} images`);

      // Analyze each image
      const results = [];
      for (const image of parserResult.extractedImages) {
        const analysis = await this.analyzeImage(image);
        results.push(analysis);
      }

      // Compute summary
      const summary = {
        totalImages: results.length,
        imagesAnalyzed: results.length,
        issuesFound: results.reduce((sum, r) => sum + r.issues.length, 0),
        passedImages: results.filter((r) => r.passed).length,
        failedImages: results.filter((r) => !r.passed).length,
      };

      this.log('Image analysis completed', summary);

      return {
        results,
        summary,
      };

    } catch (error) {
      this.log('Image analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Analyze a single image using GPT-4o Vision
   */
  private async analyzeImage(image: any): Promise<any> {
    this.log(`Analyzing image: ${image.imageId}`);

    try {
      // Use GPT-4o Vision to analyze image compliance
      const complianceResult = await analyzeImageCompliance(
        image.blobPath,
        {
          logoSpecs: this.logoSpecs,
          brandColors: this.brandColors,
          qualityStandards: this.qualityStandards,
        }
      );

      // Structure the analysis result
      const analysis = {
        imageId: image.imageId,
        imagePath: image.blobPath,
        pageNumber: image.pageNumber,
        passed: true,
        analysis: {
          logoDetected: complianceResult.logoDetected || false,
          logoPosition: complianceResult.logoPosition || null,
          imageQuality: complianceResult.imageQuality || {
            resolution: 'unknown',
            dpi: 0,
            isBlurry: false,
            qualityScore: 0,
          },
          dominantColors: complianceResult.dominantColors || [],
          objectsDetected: complianceResult.objectsDetected || [],
          textInImage: complianceResult.textInImage || '',
          brandCompliance: complianceResult.brandCompliance || {
            logoUsage: 'unknown',
            colorConsistency: 'unknown',
            visualStyle: 'unknown',
            issues: [],
          },
        },
        issues: complianceResult.issues || [],
      };

      // Update passed status based on issues
      analysis.passed = !analysis.issues.some(
        (issue: any) => issue.severity === 'critical' || issue.severity === 'high'
      );

      return analysis;

    } catch (error) {
      this.log('Error analyzing image', {
        error: error instanceof Error ? error.message : 'Unknown error',
        imageId: image.imageId,
      });

      // Return a failed analysis on error
      return {
        imageId: image.imageId,
        imagePath: image.blobPath,
        pageNumber: image.pageNumber,
        passed: false,
        analysis: {
          logoDetected: false,
          logoPosition: null,
          imageQuality: { resolution: 'unknown', dpi: 0, isBlurry: false, qualityScore: 0 },
          dominantColors: [],
          objectsDetected: [],
          textInImage: '',
          brandCompliance: {
            logoUsage: 'error',
            colorConsistency: 'error',
            visualStyle: 'error',
            issues: [],
          },
        },
        issues: [
          {
            id: `${image.imageId}_error`,
            severity: 'critical' as const,
            category: 'analysis_error' as const,
            message: `Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`,
            location: `Page ${image.pageNumber}, Image ${image.imageId}`,
            suggestion: 'Check image format and try again',
            confidence: 1.0,
            ruleId: 'ANALYSIS_ERROR',
          },
        ],
      };
    }
  }
}

export default ImageAnalysisAgent;
