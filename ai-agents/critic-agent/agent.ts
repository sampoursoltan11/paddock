import { BaseAgent } from '../shared/base-agent';
import { uploadBlob, CONTAINERS } from '../../backend/shared/storage';
import { ComplianceReport } from '../../backend/shared/types';

/**
 * Critic Agent
 * Validates all results and generates final compliance report
 */
export class CriticAgent extends BaseAgent {
  constructor(uploadId: string) {
    super('critic', uploadId);
  }

  async execute(): Promise<any> {
    this.log('Starting report generation');

    try {
      // Get all agent results
      const parserResult = await this.getAgentResult('parser');
      const imageAnalysisResult = await this.getAgentResult('image-analysis');
      const searchResult = await this.getAgentResult('search');
      const complianceResult = await this.getAgentResult('compliance');

      // Build compliance report
      const report: ComplianceReport = {
        id: this.uploadId,
        assetId: this.uploadId,
        fileName: 'marketing-material.pdf', // From parser
        processedAt: new Date().toISOString(),
        overallStatus: complianceResult.overallStatus,
        textCompliance: complianceResult.textCompliance,
        imageCompliance: complianceResult.imageCompliance,
        summary: complianceResult.summary,
        reportUrl: `${CONTAINERS.reports}/${this.uploadId}/report.html`,
        pdfReportUrl: `${CONTAINERS.reports}/${this.uploadId}/report.pdf`,
      };

      // Generate HTML report
      const htmlReport = this.generateHtmlReport(report);
      await uploadBlob(
        CONTAINERS.reports,
        `${this.uploadId}/report.html`,
        htmlReport,
        'text/html'
      );

      // Generate PDF (placeholder - in production, use PDF library)
      await uploadBlob(
        CONTAINERS.reports,
        `${this.uploadId}/report.pdf`,
        'PDF placeholder',
        'application/pdf'
      );

      // Save JSON report
      await uploadBlob(
        CONTAINERS.reports,
        `${this.uploadId}/report.json`,
        JSON.stringify(report, null, 2),
        'application/json'
      );

      this.log('Report generation completed', {
        overallStatus: report.overallStatus,
        totalIssues: report.summary.totalIssues,
      });

      return {
        reportGenerated: true,
        reportUrl: report.reportUrl,
        pdfReportUrl: report.pdfReportUrl,
        summary: report.summary,
      };

    } catch (error) {
      this.log('Report generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private generateHtmlReport(report: ComplianceReport): string {
    // HTML template for compliance report
    return `
<!DOCTYPE html>
<html>
<head>
  <title>SmartProof AI Compliance Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #2C3E50; }
    .header { background: #2C3E50; color: white; padding: 20px; border-radius: 8px; }
    .status { padding: 20px; margin: 20px 0; border-radius: 8px; }
    .status.passed { background: #d4edda; color: #155724; }
    .status.failed { background: #f8d7da; color: #721c24; }
    .status.warning { background: #fff3cd; color: #856404; }
    .issue { padding: 15px; margin: 10px 0; border-left: 4px solid; border-radius: 4px; }
    .issue.critical { border-color: #E74C3C; background: #FADBD8; }
    .issue.high { border-color: #F39C12; background: #FCF3CF; }
    .issue.medium { border-color: #3498DB; background: #D6EAF8; }
    .issue.low { border-color: #95A5A6; background: #EAECEE; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
    .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .stat-value { font-size: 32px; font-weight: bold; color: #2C3E50; }
    .stat-label { color: #7F8C8D; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>SmartProof AI Compliance Report</h1>
    <p>Asset ID: ${report.assetId}</p>
    <p>Generated: ${new Date(report.processedAt).toLocaleString()}</p>
  </div>

  <div class="status ${report.overallStatus}">
    <h2>Overall Status: ${report.overallStatus.toUpperCase()}</h2>
  </div>

  <h2>Summary Statistics</h2>
  <div class="summary">
    <div class="stat-card">
      <div class="stat-value">${report.summary.totalIssues}</div>
      <div class="stat-label">Total Issues</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${report.summary.criticalIssues}</div>
      <div class="stat-label">Critical</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${report.summary.imagesAnalyzed}</div>
      <div class="stat-label">Images Analyzed</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${Math.round(report.summary.overallConfidence * 100)}%</div>
      <div class="stat-label">Confidence</div>
    </div>
  </div>

  <h2>Text Compliance Issues</h2>
  ${report.textCompliance.issues.map((issue) => `
    <div class="issue ${issue.severity}">
      <h3>${issue.message}</h3>
      <p><strong>Category:</strong> ${issue.category}</p>
      <p><strong>Severity:</strong> ${issue.severity}</p>
      <p><strong>Suggestion:</strong> ${issue.suggestion || 'N/A'}</p>
      <p><strong>Confidence:</strong> ${Math.round(issue.confidence * 100)}%</p>
    </div>
  `).join('')}

  <h2>Image Compliance Issues</h2>
  ${report.imageCompliance.map((img) => `
    <h3>Image ${img.imageId} (Page ${img.pageNumber})</h3>
    ${img.issues.map((issue) => `
      <div class="issue ${issue.severity}">
        <p><strong>${issue.message}</strong></p>
        <p>Suggestion: ${issue.suggestion || 'N/A'}</p>
      </div>
    `).join('')}
  `).join('')}

  <div style="margin-top: 40px; padding: 20px; background: #F5F7FA; border-radius: 8px;">
    <p><small>Generated by SmartProof AI | Toyota Motor Corporation</small></p>
  </div>
</body>
</html>
    `.trim();
  }
}

export default CriticAgent;
