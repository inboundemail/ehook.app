import { db } from "@/db"
import { workflowExecutionLogs, workflowExecutions } from "@/db/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  context: { params: Promise<{ executionId: string }> },
) {
  try {
    const { executionId } = await context.params

    // Get execution
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

    // Get logs for this execution to get node statuses
    const logs = await db
      .select({
        nodeId: workflowExecutionLogs.nodeId,
        status: workflowExecutionLogs.status,
      })
      .from(workflowExecutionLogs)
      .where(eq(workflowExecutionLogs.executionId, executionId))

    // Create node statuses map (latest status per node)
    const nodeStatusMap = new Map<string, string>()
    for (const log of logs) {
      nodeStatusMap.set(log.nodeId, log.status)
    }
    const nodeStatuses = Array.from(nodeStatusMap, ([nodeId, status]) => ({
      nodeId,
      status,
    }))

    return NextResponse.json({
      status: execution.status,
      nodeStatuses,
    })
  } catch (error) {
    console.error("Failed to fetch execution status:", error)
    return NextResponse.json(
      { error: "Failed to fetch execution status" },
      { status: 500 },
    )
  }
}
