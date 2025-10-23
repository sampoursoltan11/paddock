/**
 * Orchestrator Agent
 * Coordinates the multi-agent workflow for document compliance checking
 */
import { logger } from '../utils/logger';
import { updateAgentResult } from '../storage';
import { parserAgent } from './parser';
import { imageAnalysisAgent } from './imageAnalysis';
import { complianceAgent } from './compliance';
import { knowledgeBaseBuilderAgent } from './knowledgeBaseBuilder';

export interface OrchestrationResult {
  success: boolean;
  message: string;
  nextAgent?: string;
  error?: string;
}

/**
 * Main orchestrator that coordinates all agents
 */
export async function orchestratorAgent(
  uploadId: string,
  fileName: string,
  blobUrl: string
): Promise<OrchestrationResult> {
  try {
    logger.info('Orchestrator starting workflow', { uploadId, fileName });

    await updateAgentResult(uploadId, 'orchestrator', {
      message: 'Starting multi-agent workflow',
      fileName,
    }, 'processing');

    // Step 1: Parser Agent - Extract text and structure from document
    logger.info('Triggering Parser Agent', { uploadId });
    await updateAgentResult(uploadId, 'parser', {
      message: 'Parsing document and extracting content',
    }, 'processing');

    const parserResult = await parserAgent(uploadId, blobUrl);

    await updateAgentResult(uploadId, 'parser', parserResult,
      parserResult.success ? 'completed' : 'failed');

    if (!parserResult.success) {
      throw new Error(`Parser agent failed: ${parserResult.error}`);
    }

    // Step 2: Image Analysis Agent - Analyze visual content
    logger.info('Triggering Image Analysis Agent', { uploadId });
    await updateAgentResult(uploadId, 'image-analysis', {
      message: 'Analyzing visual content and logos',
    }, 'processing');

    const imageResult = await imageAnalysisAgent(uploadId, blobUrl);

    await updateAgentResult(uploadId, 'image-analysis', imageResult,
      imageResult.success ? 'completed' : 'failed');

    if (!imageResult.success) {
      logger.warn('Image analysis failed, continuing workflow', {
        uploadId,
        error: imageResult.error,
      });
    }

    // Step 3: Compliance Agent - Check compliance rules
    logger.info('Triggering Compliance Agent', { uploadId });
    await updateAgentResult(uploadId, 'compliance', {
      message: 'Checking compliance against Australian standards',
    }, 'processing');

    const complianceResult = await complianceAgent(
      uploadId,
      parserResult.extractedText || '',
      imageResult.analysis || {}
    );

    await updateAgentResult(uploadId, 'compliance', complianceResult,
      complianceResult.success ? 'completed' : 'failed');

    if (!complianceResult.success) {
      throw new Error(`Compliance agent failed: ${complianceResult.error}`);
    }

    // Step 4: Knowledge Base Builder - Index document for search
    logger.info('Triggering Knowledge Base Builder Agent', { uploadId });
    await updateAgentResult(uploadId, 'knowledge-base', {
      message: 'Indexing document in knowledge base',
    }, 'processing');

    const kbResult = await knowledgeBaseBuilderAgent(uploadId, fileName, blobUrl);

    await updateAgentResult(uploadId, 'knowledge-base', kbResult,
      kbResult.success ? 'completed' : 'failed');

    if (!kbResult.success) {
      logger.warn('Knowledge base indexing failed, continuing workflow', {
        uploadId,
        error: kbResult.error,
      });
    }

    // Step 5: Finalize - Mark orchestrator as complete
    await updateAgentResult(uploadId, 'orchestrator', {
      message: 'Workflow completed successfully',
      totalIssues: complianceResult.issues?.length || 0,
      complianceScore: complianceResult.complianceScore || 0,
      documentsIndexed: kbResult.documentsIndexed || 0,
    }, 'completed');

    logger.info('Orchestrator workflow completed', {
      uploadId,
      totalIssues: complianceResult.issues?.length || 0,
      documentsIndexed: kbResult.documentsIndexed || 0,
    });

    return {
      success: true,
      message: 'Workflow completed successfully',
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error('Orchestrator workflow failed', {
      uploadId,
      error: errorMessage,
    });

    await updateAgentResult(uploadId, 'orchestrator', {
      message: 'Workflow failed',
      error: errorMessage,
    }, 'failed');

    return {
      success: false,
      message: 'Workflow failed',
      error: errorMessage,
    };
  }
}
