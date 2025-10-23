import { app, InvocationContext } from '@azure/functions';
import { loadWorkflowState, generateBlobSasUrl } from '../../shared/storage';
import { logger } from '../../shared/utils/logger';
import { orchestratorAgent } from '../../shared/agents/orchestrator';

/**
 * Azure Function: Process Asset
 * Blob Trigger: uploads/{uploadId}/{fileName}
 *
 * Triggered when a new file is uploaded to the uploads container.
 * Initiates the AI agent workflow for compliance checking.
 */
export async function processAsset(blob: unknown, context: InvocationContext): Promise<void> {
  const blobBuffer = blob as Buffer;
  try {
    // Extract uploadId from blob path
    // In local development, triggerMetadata.name might be different or undefined
    const blobName = (context.triggerMetadata?.name || context.triggerMetadata?.blobTrigger || context.triggerMetadata?.uri) as string;

    if (!blobName) {
      logger.error('Could not determine blob name from trigger metadata', {
        metadata: context.triggerMetadata,
      });
      return;
    }

    // Extract the relevant path (remove container name if present)
    let pathParts: string[];
    if (blobName.includes('uploads/')) {
      // Extract path after 'uploads/'
      const uploadsIndex = blobName.indexOf('uploads/');
      const relevantPath = blobName.substring(uploadsIndex + 'uploads/'.length);
      pathParts = relevantPath.split('/');
    } else {
      pathParts = blobName.split('/');
    }

    const uploadId = pathParts[0];
    const fileName = pathParts[1];

    logger.info('Process asset triggered', {
      uploadId,
      fileName,
      blobSize: blobBuffer.length,
    });

    // Load workflow state
    const workflowState = await loadWorkflowState(uploadId);
    if (!workflowState) {
      logger.error('Workflow state not found', { uploadId });
      return;
    }

    // Generate SAS URL for the blob so GPT-4o Vision can access it
    const blobPath = `${uploadId}/${fileName}`;
    const blobUrl = generateBlobSasUrl('uploads', blobPath, 120); // 2 hour expiry

    logger.info('Starting orchestrator agent', {
      uploadId,
      fileName,
      blobUrl: blobUrl.substring(0, 100) + '...', // Log truncated URL for security
    });

    // Call the orchestrator agent to run the full AI workflow
    // This will coordinate: Parser → Image Analysis → Compliance → Report Generation
    await orchestratorAgent(uploadId, fileName, blobUrl);

    logger.info('Orchestrator agent completed', { uploadId });

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
