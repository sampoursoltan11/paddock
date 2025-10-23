/**
 * Compliance Agent
 * Checks documents against Australian safety standards and regulations
 */
import { AzureOpenAI } from 'openai';
import { logger } from '../utils/logger';
import { uploadBlob } from '../storage';

const endpoint = process.env.AZURE_OPENAI_ENDPOINT || '';
const apiKey = process.env.AZURE_OPENAI_KEY || '';
const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_GPT4 || 'gpt-4o';

const client = new AzureOpenAI({
  endpoint,
  apiKey,
  apiVersion: '2024-08-01-preview',
});

export interface ComplianceIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  standard: string;
  recommendation: string;
}

export interface ComplianceResult {
  success: boolean;
  complianceScore?: number;
  issues?: ComplianceIssue[];
  passedChecks?: number;
  totalChecks?: number;
  summary?: string;
  error?: string;
}

/**
 * Check compliance against Australian safety standards
 */
export async function complianceAgent(
  uploadId: string,
  extractedText: string,
  imageAnalysis: any
): Promise<ComplianceResult> {
  try {
    logger.info('Compliance agent starting', { uploadId, textLength: extractedText.length });

    // Build compliance checking prompt
    const prompt = `You are an expert in Australian product safety standards and regulations.

Analyze the following product documentation and check for compliance with relevant Australian standards.

DOCUMENT TEXT:
${extractedText}

IMAGE ANALYSIS:
${JSON.stringify(imageAnalysis, null, 2)}

COMPLIANCE CHECKS TO PERFORM:
1. AS/NZS Standards compliance (check for mentions of relevant standards)
2. Safety warnings and labels (must include appropriate warnings)
3. Product specifications (must include dimensions, weight, capacity, materials)
4. Certification marks (should mention safety certifications)
5. Usage instructions (must provide clear usage guidelines)
6. Risk assessments (should identify potential hazards)
7. Manufacturer information (must include manufacturer details)

Return a JSON object with this exact structure:
{
  "complianceScore": 0-100,
  "passedChecks": number,
  "totalChecks": 7,
  "summary": "brief summary of overall compliance",
  "issues": [
    {
      "id": "unique_id",
      "severity": "critical|high|medium|low",
      "category": "standards|safety|documentation|labeling|quality",
      "title": "Short issue title",
      "description": "Detailed description of the issue",
      "standard": "Relevant AS/NZS standard",
      "recommendation": "How to fix the issue"
    }
  ]
}

Be thorough and identify ALL compliance issues. If a required element is missing or inadequate, create an issue for it.`;

    // Call GPT-4o for compliance analysis
    const response = await client.chat.completions.create({
      model: deploymentName,
      messages: [
        {
          role: 'system',
          content: 'You are an Australian product safety compliance expert. Always return valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 4000,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const resultText = response.choices[0]?.message?.content || '{}';
    const result = JSON.parse(resultText);

    // Ensure we have the required structure
    const complianceResult: ComplianceResult = {
      success: true,
      complianceScore: result.complianceScore || 0,
      passedChecks: result.passedChecks || 0,
      totalChecks: result.totalChecks || 7,
      summary: result.summary || 'Compliance check completed',
      issues: result.issues || [],
    };

    // Save compliance report to blob storage
    const reportJson = JSON.stringify(complianceResult, null, 2);
    await uploadBlob('uploads', `${uploadId}/compliance-report.json`, Buffer.from(reportJson));

    logger.info('Compliance agent completed', {
      uploadId,
      complianceScore: complianceResult.complianceScore,
      issuesFound: complianceResult.issues?.length || 0,
    });

    return complianceResult;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error('Compliance agent failed', {
      uploadId,
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}
