import { BaseAgent } from '../shared/base-agent';
import { ParserAgent } from '../parser-agent/agent';
import { ImageAnalysisAgent } from '../image-analysis-agent/agent';
import { SearchAgent } from '../search-agent/agent';
import { ComplianceAgent } from '../compliance-agent/agent';
import { CriticAgent } from '../critic-agent/agent';

/**
 * Orchestrator Agent
 * Coordinates the entire compliance checking workflow
 */
export class OrchestratorAgent extends BaseAgent {
  constructor(uploadId: string) {
    super('orchestrator', uploadId);
  }

  async execute(): Promise<any> {
    this.log('Starting workflow orchestration');

    try {
      // Step 1: Parse document (extract text, tables, images)
      this.log('Step 1/5: Parsing document');
      const parserAgent = new ParserAgent(this.uploadId);
      const parserResult = await parserAgent.run();
      this.log('Parser completed', {
        textLength: parserResult.extractedText?.length,
        tablesCount: parserResult.extractedTables?.length,
        imagesCount: parserResult.extractedImages?.length,
      });

      // Step 2: Analyze images (if any)
      this.log('Step 2/5: Analyzing images');
      let imageAnalysisResult = null;
      if (parserResult.extractedImages && parserResult.extractedImages.length > 0) {
        const imageAgent = new ImageAnalysisAgent(this.uploadId);
        imageAnalysisResult = await imageAgent.run();
        this.log('Image analysis completed', {
          imagesAnalyzed: imageAnalysisResult.results?.length,
        });
      } else {
        this.log('No images to analyze, skipping image analysis');
      }

      // Step 3: Search for product information (parallel with compliance)
      this.log('Step 3/5: Searching product information');
      const searchAgent = new SearchAgent(this.uploadId);
      const searchResult = await searchAgent.run();
      this.log('Search completed', {
        resultsFound: searchResult.results?.length,
      });

      // Step 4: Run compliance checks
      this.log('Step 4/5: Running compliance checks');
      const complianceAgent = new ComplianceAgent(this.uploadId);
      const complianceResult = await complianceAgent.run();
      this.log('Compliance checks completed', {
        totalIssues: complianceResult.totalIssues,
        overallStatus: complianceResult.overallStatus,
      });

      // Step 5: Critic validates and generates final report
      this.log('Step 5/5: Generating final report');
      const criticAgent = new CriticAgent(this.uploadId);
      const criticResult = await criticAgent.run();
      this.log('Report generation completed', {
        reportUrl: criticResult.reportUrl,
      });

      // Return orchestration summary
      return {
        workflowCompleted: true,
        steps: {
          parser: 'completed',
          imageAnalysis: imageAnalysisResult ? 'completed' : 'skipped',
          search: 'completed',
          compliance: 'completed',
          critic: 'completed',
        },
        summary: {
          textExtracted: parserResult.extractedText?.length > 0,
          imagesAnalyzed: imageAnalysisResult?.results?.length || 0,
          productInfoRetrieved: searchResult.results?.length > 0,
          complianceStatus: complianceResult.overallStatus,
          reportGenerated: criticResult.reportUrl != null,
        },
        reportUrl: criticResult.reportUrl,
        pdfReportUrl: criticResult.pdfReportUrl,
      };

    } catch (error) {
      this.log('Workflow failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

export default OrchestratorAgent;
