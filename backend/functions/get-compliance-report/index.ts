import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { v4 as uuidv4 } from 'uuid';
import { downloadBlob, blobExists, CONTAINERS } from '../../shared/storage';
import { successResponse, notFoundResponse, errorResponse } from '../../shared/utils/response';
import { logger } from '../../shared/utils/logger';
import { ComplianceReport } from '../../shared/types';

/**
 * Azure Function: Get Compliance Report
 * GET /api/compliance/reports/{assetId}
 *
 * Retrieves the compliance report for a processed asset
 */
export async function getComplianceReport(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const correlationId = request.headers.get('X-Correlation-ID') || uuidv4();

  try {
    const assetId = request.params.assetId;

    if (!assetId) {
      return errorResponse('INVALID_REQUEST', 'Asset ID is required', 400);
    }

    logger.info('Get compliance report request', { correlationId, assetId });

    // Check if report exists
    const reportBlobName = `${assetId}/report.json`;
    const exists = await blobExists(CONTAINERS.reports, reportBlobName);

    if (!exists) {
      logger.warn('Compliance report not found', { correlationId, assetId });
      return notFoundResponse('Compliance report');
    }

    // Download report from blob storage
    const reportBuffer = await downloadBlob(CONTAINERS.reports, reportBlobName);
    const report: ComplianceReport = JSON.parse(reportBuffer.toString('utf-8'));

    logger.info('Compliance report retrieved', {
      correlationId,
      assetId,
      overallStatus: report.overallStatus,
      totalIssues: report.summary.totalIssues,
    });

    return successResponse(report);

  } catch (error) {
    logger.error('Error retrieving compliance report', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return errorResponse('REPORT_ERROR', 'Failed to retrieve compliance report', 500);
  }
}

// Register the function
app.http('get-compliance-report', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'compliance/reports/{assetId}',
  handler: getComplianceReport,
});
