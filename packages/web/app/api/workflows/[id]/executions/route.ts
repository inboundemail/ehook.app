import { db } from "@/db"
import { workflowExecutions } from "@/db/schema"
import { desc, eq } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: workflowId } = await context.params

    const executions = await db
      .select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.workflowId, workflowId))
      .orderBy(desc(workflowExecutions.startedAt))
      .limit(50)

    // Transform to match expected format
    const formattedExecutions = executions.map((execution) => ({
      id: execution.id,
      workflowId: execution.workflowId,
      status: execution.status,
      input: execution.input,
      output: execution.output,
      error: execution.error,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      duration: execution.durationMs,
    }))

    return NextResponse.json(formattedExecutions)
  } catch (error) {
    console.error("Failed to fetch executions:", error)
    return NextResponse.json(
      { error: "Failed to fetch executions" },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: workflowId } = await context.params

    // Delete all executions for this workflow (logs cascade-delete via FK)
    const result = await db
      .delete(workflowExecutions)
      .where(eq(workflowExecutions.workflowId, workflowId))
      .returning()

    return NextResponse.json({
      success: true,
      deletedCount: result.length,
    })
  } catch (error) {
    console.error("Failed to delete executions:", error)
    return NextResponse.json(
      { error: "Failed to delete executions" },
      { status: 500 },
    )
  }
}
