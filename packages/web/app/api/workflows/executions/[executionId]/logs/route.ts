import { db } from "@/db"
import {
  workflowExecutionLogs,
  workflowExecutions,
  workflows,
} from "@/db/schema"
import { asc, eq } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  context: { params: Promise<{ executionId: string }> },
) {
  try {
    const { executionId } = await context.params

    // Get execution with workflow
    const [execution] = await db
      .select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.id, executionId))
      .limit(1)

    if (!execution) {
      return NextResponse.json(
        { error: "Execution not found" },
        { status: 404 },
      )
    }

    // Get workflow
    const [workflow] = await db
      .select()
      .from(workflows)
      .where(eq(workflows.id, execution.workflowId))
      .limit(1)

    // Get logs for this execution
    const logs = await db
      .select()
      .from(workflowExecutionLogs)
      .where(eq(workflowExecutionLogs.executionId, executionId))
      .orderBy(asc(workflowExecutionLogs.startedAt))

    // Format the response
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      executionId: log.executionId,
      nodeId: log.nodeId,
      nodeName: log.nodeName,
      nodeType: log.nodeType,
      status: log.status,
      input: log.input,
      output: log.output,
      error: log.error,
      startedAt: log.startedAt,
      completedAt: log.completedAt,
      duration: log.durationMs,
    }))

    return NextResponse.json({
      execution: {
        id: execution.id,
        workflowId: execution.workflowId,
        status: execution.status,
        input: execution.input,
        output: execution.output,
        error: execution.error,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
        duration: execution.durationMs,
        workflow: workflow
          ? {
              id: workflow.id,
              name: workflow.name,
              nodes: workflow.nodes,
              edges: workflow.edges,
            }
          : null,
      },
      logs: formattedLogs,
    })
  } catch (error) {
    console.error("Failed to fetch execution logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch execution logs" },
      { status: 500 },
    )
  }
}
