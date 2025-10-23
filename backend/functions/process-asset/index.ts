import { app, InvocationContext } from '@azure/functions';
import { loadWorkflowState, updateAgentResult, CONTAINERS } from '../../shared/storage';
import { logger } from '../../shared/utils/logger';

/**
 * Azure Function: Process Asset
 * Blob Trigger: uploads/{uploadId}/{fileName}
 *
 * Triggered when a new file is uploaded to the uploads container.
 * Initiates the AI agent workflow for compliance checking.
 */
export async function processAsset(blob: Buffer, context: InvocationContext): Promise<void> {
  try {
    // Extract uploadId from blob path
    const blobName = context.triggerMetadata?.name as string;
    const pathParts = blobName.split('/');
    const uploadId = pathParts[0];
    const fileName = pathParts[1];

    logger.info('Process asset triggered', {
      uploadId,
      fileName,
      blobSize: blob.length,
    });

    // Load workflow state
    const workflowState = await loadWorkflowState(uploadId);
    if (!workflowState) {
      logger.error('Workflow state not found', { uploadId });
      return;
    }

    // Update orchestrator agent status to processing
    await updateAgentResult(uploadId, 'orchestrator', {
      message: 'Starting processing workflow',
      fileName,
      fileSize: blob.length,
    }, 'processing');

    // TODO: In a full implementation, this would:
    // 1. Call Orchestrator Agent to coordinate workflow
    // 2. Orchestrator triggers Parser Agent
    // 3. Parser extracts text, tables, images
    // 4. Image Analysis Agent processes images
    // 5. Search Agent retrieves product info
    // 6. Compliance Agent checks rules
    // 7. Critic Agent generates final report

    // For now, we'll create a placeholder message
    logger.info('Workflow initiated - agents will process asynchronously', {
      uploadId,
      agents: Object.keys(workflowState.agents),
    });

    // Update orchestrator to completed (temporary for PoC)
    await updateAgentResult(uploadId, 'orchestrator', {
      message: 'Orchestrator completed - workflow queued',
      nextAgent: 'parser',
    }, 'completed');

  } catch (error) {
    logger.error('Error processing asset', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// Register the function
app.storageBlob('process-asset', {
  path: 'uploads/{uploadId}/{fileName}',
  connection: 'AzureWebJobsStorage',
  handler: processAsset,
});
