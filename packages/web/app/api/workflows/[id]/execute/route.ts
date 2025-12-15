import { db } from "@/db"
import { workflowExecutions, workflows } from "@/db/schema"
import { executeWorkflow } from "@/lib/workflow-executor.workflow"
import type { WorkflowEdge, WorkflowNode } from "@/lib/workflow-store"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: workflowId } = await context.params

    // Get workflow
    const [workflow] = await db
      .select()
      .from(workflows)
      .where(eq(workflows.id, workflowId))
      .limit(1)

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
    }

    // Parse request body
    const body = await request.json().catch(() => ({}))
    const input = body.input || {}

    // Create execution record
    const [execution] = await db
      .insert(workflowExecutions)
      .values({
        workflowId,
        status: "running",
        input,
      })
      .returning()

    console.log("[API] Created execution:", execution.id)

    // Execute the workflow in the background (don't await)
    // We use Promise.resolve().then() to defer execution without blocking the response
    Promise.resolve().then(async () => {
      try {
        console.log("[Workflow Execute] Starting execution:", execution.id)

        await executeWorkflow({
          nodes: workflow.nodes as WorkflowNode[],
          edges: workflow.edges as WorkflowEdge[],
          triggerInput: input,
          executionId: execution.id,
          workflowId,
        })

        console.log("[Workflow Execute] Workflow completed successfully")
      } catch (error) {
        console.error("[Workflow Execute] Error during execution:", error)

        // Update execution record with error
        await db
          .update(workflowExecutions)
          .set({
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error",
            completedAt: new Date(),
          })
          .where(eq(workflowExecutions.id, execution.id))
      }
    })

    // Return immediately with the execution ID
    return NextResponse.json({
      executionId: execution.id,
      status: "running",
    })
  } catch (error) {
    console.error("Failed to start workflow execution:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to execute workflow",
      },
      { status: 500 },
    )
  }
}
