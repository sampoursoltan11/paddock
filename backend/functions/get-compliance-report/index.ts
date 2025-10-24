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
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const correlationId = request.headers.get('X-Correlation-ID') || uuidv4();

  try {
    const assetId = request.params.assetId;

    if (!assetId) {
      return errorResponse('INVALID_REQUEST', 'Asset ID is required', 400);
    }

    logger.info('Get compliance report request', { correlationId, assetId });

    // Check if compliance report exists (stored in uploads container)
    const reportBlobName = `${assetId}/compliance-report.json`;
    const exists = await blobExists(CONTAINERS.uploads, reportBlobName);

    if (!exists) {
      logger.warn('Compliance report not found', { correlationId, assetId });
      return notFoundResponse('Compliance report');
    }

    // Download report from blob storage
    const reportBuffer = await downloadBlob(CONTAINERS.uploads, reportBlobName);
    const complianceData = JSON.parse(reportBuffer.toString('utf-8'));

    // Transform to ComplianceReport format expected by frontend
    const report: ComplianceReport = {
      id: assetId,
      assetId: assetId,
      fileName: 'document',
      processedAt: new Date().toISOString(),
      overallStatus: complianceData.complianceScore >= 80 ? 'passed' : 'failed',
      textCompliance: {
        passed: complianceData.complianceScore >= 80,
        issues: complianceData.issues || [],
        rulesChecked: complianceData.totalChecks || 0,
        rulesPassed: complianceData.passedChecks || 0,
      },
      imageCompliance: [],
      summary: {
        totalIssues: complianceData.issues?.length || 0,
        criticalIssues: complianceData.issues?.filter((i: any) => i.severity === 'critical').length || 0,
        highIssues: complianceData.issues?.filter((i: any) => i.severity === 'high').length || 0,
        mediumIssues: complianceData.issues?.filter((i: any) => i.severity === 'medium').length || 0,
        lowIssues: complianceData.issues?.filter((i: any) => i.severity === 'low').length || 0,
        imagesAnalyzed: 0,
        pagesProcessed: 1,
        overallConfidence: complianceData.complianceScore || 0,
      },
      issues: complianceData.issues || [],
      timestamp: new Date().toISOString(),
      reportUrl: '',
      pdfReportUrl: '',
    };

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
