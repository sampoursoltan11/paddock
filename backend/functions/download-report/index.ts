import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { v4 as uuidv4 } from 'uuid';
import { downloadBlob, blobExists, CONTAINERS } from '../../shared/storage';
import { notFoundResponse, errorResponse } from '../../shared/utils/response';
import { logger } from '../../shared/utils/logger';

/**
 * Azure Function: Download Report
 * GET /api/compliance/reports/{assetId}/download/{format}
 *
 * Downloads the compliance report in HTML or PDF format
 */
export async function downloadReport(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const correlationId = request.headers.get('X-Correlation-ID') || uuidv4();

  try {
    const assetId = request.params.assetId;
    const format = request.params.format?.toLowerCase();

    if (!assetId || !format) {
      return errorResponse('INVALID_REQUEST', 'Asset ID and format are required', 400);
    }

    if (format !== 'html' && format !== 'pdf') {
      return errorResponse('INVALID_FORMAT', 'Format must be either html or pdf', 400);
    }

    logger.info('Download report request', { correlationId, assetId, format });

    // Determine blob name based on format
    const blobName = format === 'html'
      ? `${assetId}/report.html`
      : `${assetId}/report.pdf`;

    // Check if report exists
    const exists = await blobExists(CONTAINERS.reports, blobName);

    if (!exists) {
      logger.warn('Report file not found', { correlationId, assetId, format });
      return notFoundResponse(`${format.toUpperCase()} report`);
    }

    // Download report from blob storage
    const reportBuffer = await downloadBlob(CONTAINERS.reports, blobName);

    logger.info('Report downloaded successfully', {
      correlationId,
      assetId,
      format,
      fileSize: reportBuffer.length,
    });

    // Determine content type
    const contentType = format === 'html' ? 'text/html' : 'application/pdf';

    // Set filename for download
    const fileName = `compliance-report-${assetId}.${format}`;

    return {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': reportBuffer.length.toString(),
      },
      body: reportBuffer,
    };

  } catch (error) {
    logger.error('Error downloading report', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return errorResponse('DOWNLOAD_ERROR', 'Failed to download report', 500);
  }
}

// Register the function
app.http('download-report', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'compliance/reports/{assetId}/download/{format}',
  handler: downloadReport,
});
