import { createOrUpdateWorkflowSchedule } from "@/app/actions/workflow-schedules"
import { db } from "@/db"
import { workflows } from "@/db/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [workflow] = await db
      .select()
      .from(workflows)
      .where(eq(workflows.id, id))
      .limit(1);

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("Failed to fetch workflow:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflow" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, nodes, edges, status } = body

    // Fetch existing workflow to get scheduleId
    const [existingWorkflow] = await db
      .select()
      .from(workflows)
      .where(eq(workflows.id, id))
      .limit(1)

    if (!existingWorkflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (nodes !== undefined) updateData.nodes = nodes
    if (edges !== undefined) updateData.edges = edges
    if (status !== undefined) updateData.status = status

    const [workflow] = await db
      .update(workflows)
      .set(updateData)
      .where(eq(workflows.id, id))
      .returning()

    // Manage schedule if nodes were updated
    if (nodes !== undefined) {
      const scheduleResult = await createOrUpdateWorkflowSchedule(
        id,
        nodes,
        existingWorkflow.scheduleId,
      )

      if (!scheduleResult.success) {
        console.error("Failed to manage schedule:", scheduleResult.error)
        // Don't fail the whole request, just log the error
      }
    }

    return NextResponse.json(workflow)
  } catch (error) {
    console.error("Failed to update workflow:", error)
    return NextResponse.json(
      { error: "Failed to update workflow" },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    // Fetch workflow to get scheduleId before deletion
    const [existingWorkflow] = await db
      .select()
      .from(workflows)
      .where(eq(workflows.id, id))
      .limit(1)

    if (!existingWorkflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
    }

    // Delete the workflow
    await db.delete(workflows).where(eq(workflows.id, id))

    // Clean up QStash schedule if one exists
    if (existingWorkflow.scheduleId) {
      try {
        const { deleteWorkflowSchedule } = await import(
          "@/app/actions/workflow-schedules"
        )
        await deleteWorkflowSchedule(existingWorkflow.scheduleId)
      } catch (error) {
        console.error("Failed to delete schedule:", error)
        // Don't fail the whole request
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete workflow:", error)
    return NextResponse.json(
      { error: "Failed to delete workflow" },
      { status: 500 },
    )
  }
}

