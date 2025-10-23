import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import { BlobUploadResult, WorkflowState } from './types';
import { logger } from './utils/logger';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';

// Initialize Blob Service Client
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

// Container names
const CONTAINERS = {
  uploads: process.env.BLOB_CONTAINER_UPLOADS || 'uploads',
  processed: process.env.BLOB_CONTAINER_PROCESSED || 'processed',
  reports: process.env.BLOB_CONTAINER_REPORTS || 'reports',
  state: process.env.BLOB_CONTAINER_STATE || 'state',
};

/**
 * Get container client
 */
export function getContainerClient(containerName: string): ContainerClient {
  return blobServiceClient.getContainerClient(containerName);
}

/**
 * Upload file to blob storage
 */
export async function uploadBlob(
  containerName: string,
  blobName: string,
  content: Buffer | string,
  contentType?: string
): Promise<BlobUploadResult> {
  try {
    const containerClient = getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const uploadOptions: any = {};
    if (contentType) {
      uploadOptions.blobHTTPHeaders = { blobContentType: contentType };
    }

    await blockBlobClient.upload(content, Buffer.byteLength(content), uploadOptions);

    logger.info(`Blob uploaded successfully: ${blobName}`);

    return {
      blobName,
      blobUrl: blockBlobClient.url,
      containerName,
    };
  } catch (error) {
    logger.error(`Error uploading blob: ${error}`);
    throw error;
  }
}

/**
 * Download blob from storage
 */
export async function downloadBlob(
  containerName: string,
  blobName: string
): Promise<Buffer> {
  try {
    const containerClient = getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const downloadResponse = await blockBlobClient.download(0);
    const downloaded = await streamToBuffer(downloadResponse.readableStreamBody!);

    logger.info(`Blob downloaded successfully: ${blobName}`);
    return downloaded;
  } catch (error) {
    logger.error(`Error downloading blob: ${error}`);
    throw error;
  }
}

/**
 * Delete blob from storage
 */
export async function deleteBlob(
  containerName: string,
  blobName: string
): Promise<void> {
  try {
    const containerClient = getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.delete();
    logger.info(`Blob deleted successfully: ${blobName}`);
  } catch (error) {
    logger.error(`Error deleting blob: ${error}`);
    throw error;
  }
}

/**
 * Check if blob exists
 */
export async function blobExists(
  containerName: string,
  blobName: string
): Promise<boolean> {
  try {
    const containerClient = getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    return await blockBlobClient.exists();
  } catch (error) {
    logger.error(`Error checking blob existence: ${error}`);
    return false;
  }
}

/**
 * List blobs in container
 */
export async function listBlobs(
  containerName: string,
  prefix?: string
): Promise<string[]> {
  try {
    const containerClient = getContainerClient(containerName);
    const blobNames: string[] = [];

    for await (const blob of containerClient.listBlobsFlat({ prefix })) {
      blobNames.push(blob.name);
    }

    return blobNames;
  } catch (error) {
    logger.error(`Error listing blobs: ${error}`);
    throw error;
  }
}

/**
 * Save workflow state to blob storage
 */
export async function saveWorkflowState(
  uploadId: string,
  state: WorkflowState
): Promise<void> {
  const blobName = `${uploadId}/workflow-state.json`;
  const content = JSON.stringify(state, null, 2);

  await uploadBlob(CONTAINERS.state, blobName, content, 'application/json');
}

/**
 * Load workflow state from blob storage
 */
export async function loadWorkflowState(uploadId: string): Promise<WorkflowState | null> {
  try {
    const blobName = `${uploadId}/workflow-state.json`;
    const buffer = await downloadBlob(CONTAINERS.state, blobName);
    const state = JSON.parse(buffer.toString('utf-8'));
    return state;
  } catch (error) {
    logger.error(`Error loading workflow state: ${error}`);
    return null;
  }
}

/**
 * Update agent result in workflow state
 */
export async function updateAgentResult(
  uploadId: string,
  agentName: string,
  result: any,
  status: 'pending' | 'processing' | 'completed' | 'failed'
): Promise<void> {
  const state = await loadWorkflowState(uploadId);
  if (!state) {
    throw new Error(`Workflow state not found for uploadId: ${uploadId}`);
  }

  state.agents[agentName] = {
    status,
    startedAt: state.agents[agentName]?.startedAt || new Date().toISOString(),
    completedAt: status === 'completed' || status === 'failed' ? new Date().toISOString() : undefined,
    output: result,
  };

  state.updatedAt = new Date().toISOString();
  state.currentAgent = agentName;

  await saveWorkflowState(uploadId, state);
}

/**
 * Helper function to convert stream to buffer
 */
async function streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on('data', (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on('error', reject);
  });
}

export { CONTAINERS };
