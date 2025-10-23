import { loadWorkflowState, updateAgentResult, WorkflowState } from '../../backend/shared/storage';
import { logger } from '../../backend/shared/utils/logger';

/**
 * Base Agent Class
 * All AI agents inherit from this class
 */
export abstract class BaseAgent {
  protected name: string;
  protected uploadId: string;

  constructor(name: string, uploadId: string) {
    this.name = name;
    this.uploadId = uploadId;
  }

  /**
   * Execute the agent's main logic
   * Must be implemented by child classes
   */
  abstract execute(): Promise<any>;

  /**
   * Run the agent (template method pattern)
   */
  async run(): Promise<any> {
    try {
      logger.info(`Starting agent: ${this.name}`, { uploadId: this.uploadId });

      // Update status to processing
      await updateAgentResult(this.uploadId, this.name, {
        message: `${this.name} started processing`,
      }, 'processing');

      // Execute agent logic
      const result = await this.execute();

      // Update status to completed
      await updateAgentResult(this.uploadId, this.name, result, 'completed');

      logger.info(`Agent completed: ${this.name}`, {
        uploadId: this.uploadId,
        resultKeys: Object.keys(result),
      });

      return result;

    } catch (error) {
      logger.error(`Agent failed: ${this.name}`, {
        uploadId: this.uploadId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Update status to failed
      await updateAgentResult(this.uploadId, this.name, {
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'failed');

      throw error;
    }
  }

  /**
   * Get workflow state
   */
  protected async getWorkflowState(): Promise<WorkflowState | null> {
    return await loadWorkflowState(this.uploadId);
  }

  /**
   * Get result from another agent
   */
  protected async getAgentResult(agentName: string): Promise<any> {
    const state = await this.getWorkflowState();
    if (!state || !state.agents[agentName]) {
      throw new Error(`Agent ${agentName} not found in workflow state`);
    }

    const agentState = state.agents[agentName];
    if (agentState.status !== 'completed') {
      throw new Error(`Agent ${agentName} has not completed yet (status: ${agentState.status})`);
    }

    return agentState.output;
  }

  /**
   * Log agent activity
   */
  protected log(message: string, meta?: any) {
    logger.info(`[${this.name}] ${message}`, {
      uploadId: this.uploadId,
      agent: this.name,
      ...meta,
    });
  }
}

export default BaseAgent;
