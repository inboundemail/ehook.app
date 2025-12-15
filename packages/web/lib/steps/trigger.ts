/**
 * Trigger Step
 * Handles workflow triggers with "use step" directive for Workflow DevKit
 * Also handles workflow completion logging
 */
import {
  logWorkflowComplete,
  type StepInput,
  withStepLogging,
} from "./step-handler"

type TriggerResult = {
  success: true
  data: Record<string, unknown>
}

export type TriggerInput = StepInput & {
  triggerData: Record<string, unknown>
  _workflowComplete?: {
    executionId: string
    status: "success" | "error"
    output?: unknown
    error?: string
    startTime: number
  }
}

/**
 * Trigger logic (pure business logic, no step concerns)
 */
async function trigger(input: TriggerInput): Promise<TriggerResult> {
  // If this is a workflow completion signal, handle it
  if (input._workflowComplete) {
    await logWorkflowComplete({
      executionId: input._workflowComplete.executionId,
      status: input._workflowComplete.status,
      output: input._workflowComplete.output,
      error: input._workflowComplete.error,
      startTime: input._workflowComplete.startTime,
    })
  }

  return {
    success: true,
    data: {
      triggered: true,
      timestamp: Date.now(),
      ...input.triggerData,
    },
  }
}

/**
 * Trigger Step with Workflow DevKit support
 * Uses "use step" directive for durability and observability
 */
export async function triggerStep(input: TriggerInput): Promise<TriggerResult> {
  "use step"
  return withStepLogging(input, () => trigger(input))
}
