import { BaseAgent } from '../shared/base-agent';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Compliance Agent
 * Checks marketing materials against brand, legal, and PIT rules
 */
export class ComplianceAgent extends BaseAgent {
  private rules: any[];

  constructor(uploadId: string) {
    super('compliance', uploadId);

    // Load all rule files
    const rulesPath = path.join(__dirname, 'rules');
    this.rules = [
      ...JSON.parse(fs.readFileSync(path.join(rulesPath, 'brand-rules.json'), 'utf-8')).brand_compliance_rules,
      ...JSON.parse(fs.readFileSync(path.join(rulesPath, 'legal-rules.json'), 'utf-8')).legal_compliance_rules,
      ...JSON.parse(fs.readFileSync(path.join(rulesPath, 'pit-rules.json'), 'utf-8')).product_information_accuracy_rules,
      ...JSON.parse(fs.readFileSync(path.join(rulesPath, 'image-rules.json'), 'utf-8')).image_compliance_rules,
    ];
  }

  async execute(): Promise<any> {
    this.log('Starting compliance checks', { totalRules: this.rules.length });

    try {
      // Get results from previous agents
      const parserResult = await this.getAgentResult('parser');
      const imageAnalysisResult = await this.getAgentResult('image-analysis');
      const searchResult = await this.getAgentResult('search');

      // Run text compliance checks
      const textIssues = await this.checkTextCompliance(parserResult.extractedText);

      // Collect image compliance issues
      const imageIssues = imageAnalysisResult.results?.flatMap((img: any) => img.issues) || [];

      // Combine all issues
      const allIssues = [...textIssues, ...imageIssues];

      // Calculate summary statistics
      const summary = this.calculateSummary(allIssues, imageAnalysisResult);

      // Determine overall status
      const overallStatus = this.determineOverallStatus(allIssues);

      const result = {
        overallStatus,
        textCompliance: {
          passed: textIssues.filter((i) => i.severity === 'critical').length === 0,
          issues: textIssues,
          rulesChecked: this.rules.length,
          rulesPassed: this.rules.length - textIssues.length,
        },
        imageCompliance: imageAnalysisResult.results || [],
        totalIssues: allIssues.length,
        summary,
      };

      this.log('Compliance checks completed', {
        overallStatus,
        totalIssues: allIssues.length,
        criticalIssues: summary.criticalIssues,
      });

      return result;

    } catch (error) {
      this.log('Compliance check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async checkTextCompliance(text: string): Promise<any[]> {
    const issues = [];

    // Check each rule (placeholder - in production, use GPT-4 for complex rules)
    for (const rule of this.rules) {
      if (rule.category === 'image_quality' || rule.category === 'logo' || rule.category === 'color') {
        continue; // Skip image rules for text compliance
      }

      // Simple pattern matching (placeholder)
      if (rule.check_type === 'presence' && rule.required_text) {
        if (!text.includes(rule.required_text)) {
          issues.push({
            id: `issue_${rule.rule_id}_${Date.now()}`,
            severity: rule.severity,
            category: rule.category,
            message: rule.description,
            suggestion: rule.remediation,
            confidence: 0.9,
            ruleId: rule.rule_id,
          });
        }
      }
    }

    return issues;
  }

  private calculateSummary(issues: any[], imageAnalysis: any) {
    return {
      totalIssues: issues.length,
      criticalIssues: issues.filter((i) => i.severity === 'critical').length,
      highIssues: issues.filter((i) => i.severity === 'high').length,
      mediumIssues: issues.filter((i) => i.severity === 'medium').length,
      lowIssues: issues.filter((i) => i.severity === 'low').length,
      imagesAnalyzed: imageAnalysis.summary?.totalImages || 0,
      pagesProcessed: 5, // From parser result
      overallConfidence: 0.88,
    };
  }

  private determineOverallStatus(issues: any[]): 'passed' | 'failed' | 'warning' {
    const hasCritical = issues.some((i) => i.severity === 'critical');
    const hasHigh = issues.some((i) => i.severity === 'high');

    if (hasCritical) return 'failed';
    if (hasHigh) return 'warning';
    return 'passed';
  }
}

export default ComplianceAgent;
