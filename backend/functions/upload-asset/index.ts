import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { v4 as uuidv4 } from 'uuid';
import { uploadBlob, saveWorkflowState, CONTAINERS } from '../../shared/storage';
import { successResponse, errorResponse, serverErrorResponse } from '../../shared/utils/response';
import { logger } from '../../shared/utils/logger';
import { UploadAsset, WorkflowState, AssetStatus } from '../../shared/types';

/**
 * Azure Function: Upload Asset
 * POST /api/assets/upload
 *
 * Handles file upload to blob storage and initiates processing workflow
 */
export async function uploadAsset(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const correlationId = request.headers.get('X-Correlation-ID') || uuidv4();

  try {
    logger.info('Upload asset request received', { correlationId });

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return errorResponse('NO_FILE', 'No file provided in the request', 400);
    }

    // Validate file
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxFileSize) {
      return errorResponse('FILE_TOO_LARGE', 'File size exceeds 50MB limit', 400);
    }

    // Allowed file types
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return errorResponse(
        'INVALID_FILE_TYPE',
        'Only PDF, PNG, and JPEG files are allowed',
        400
      );
    }

    // Get metadata from form
    const metadata = {
      model: formData.get('model') as string || undefined,
      year: formData.get('year') as string || undefined,
      category: formData.get('category') as string || undefined,
    };

    // Generate upload ID
    const uploadId = uuidv4();
    const fileName = file.name;
    const blobName = `${uploadId}/${fileName}`;

    // Upload file to blob storage
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await uploadBlob(
      CONTAINERS.uploads,
      blobName,
      fileBuffer,
      file.type
    );

    logger.info('File uploaded to blob storage', {
      correlationId,
      uploadId,
      fileName,
      blobUrl: uploadResult.blobUrl,
    });

    // Create upload asset record
    const asset: UploadAsset = {
      id: uploadId,
      fileName,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'user@toyota.com', // TODO: Get from auth context
      status: AssetStatus.PROCESSING,
      blobPath: uploadResult.blobUrl,
      metadata,
    };

    // Initialize workflow state
    const workflowState: WorkflowState = {
      uploadId,
      status: 'pending',
      currentAgent: 'orchestrator',
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      agents: {
        orchestrator: { status: 'pending' },
        parser: { status: 'pending' },
        'image-analysis': { status: 'pending' },
        search: { status: 'pending' },
        compliance: { status: 'pending' },
        critic: { status: 'pending' },
      },
    };

    await saveWorkflowState(uploadId, workflowState);

    logger.info('Workflow state initialized', { correlationId, uploadId });

    // TODO: Trigger processing (via queue or direct invocation)
    // For PoC, this would be done via blob trigger or manual invocation

    return successResponse(asset, 201);

  } catch (error) {
    logger.error('Error uploading asset', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return serverErrorResponse('Failed to upload asset');
  }
}

// Register the function
app.http('upload-asset', {
  methods: ['POST'],
  authLevel: 'function',
  route: 'assets/upload',
  handler: uploadAsset,
});
