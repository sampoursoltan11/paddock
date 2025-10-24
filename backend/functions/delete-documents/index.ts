import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { v4 as uuidv4 } from 'uuid';
import { successResponse, errorResponse } from '../../shared/utils/response';
import { logger } from '../../shared/utils/logger';
import { deleteAllDocuments } from '../../shared/knowledgeBase';

/**
 * Azure Function: Delete All Documents
 * DELETE /api/search/documents
 *
 * Deletes all documents from the knowledge base search index
 */
export async function deleteDocuments(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const correlationId = request.headers.get('X-Correlation-ID') || uuidv4();

  try {
    logger.info('Delete all documents request received', {
      correlationId,
    });

    // Delete all documents from the index
    const deletedCount = await deleteAllDocuments();

    logger.info('Delete all documents completed', {
      correlationId,
      deletedCount,
    });

    return successResponse({ deletedCount });
  } catch (error) {
    logger.error('Error deleting all documents', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return errorResponse('DELETE_ERROR', 'Failed to delete documents', 500);
  }
}

// Register the function
app.http('delete-documents', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'search/documents',
  handler: deleteDocuments,
});
