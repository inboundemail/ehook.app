"use server"

import { db } from "@/db"
import { workflows } from "@/db/schema"
import { qstash } from "@/lib/qstash"
import { eq } from "drizzle-orm"

type TriggerConfig = {
  triggerType?: string
  scheduleCron?: string
  scheduleTimezone?: string
}

type WorkflowNode = {
  id: string
  data: {
    type: string
    config?: TriggerConfig
  }
}

/**
 * Extract trigger configuration from workflow nodes
 */
function getTriggerConfig(nodes: unknown[]): TriggerConfig | null {
  const triggerNode = (nodes as WorkflowNode[]).find(
    (node) => node.data?.type === "trigger",
  )
  return (triggerNode?.data?.config as TriggerConfig) || null
}

/**
 * Get the base URL for the application
 */
function getBaseUrl(): string {
  let url: string

  // In production, use NEXT_PUBLIC_APP_URL or VERCEL_URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    url = process.env.NEXT_PUBLIC_APP_URL
  } else if (process.env.VERCEL_URL) {
    url = `https://${process.env.VERCEL_URL}`
  } else {
    // Fallback for development
    url = "http://localhost:3000"
  }

  // Remove trailing slash to avoid double slashes when concatenating paths
  return url.replace(/\/$/, "")
}

export type ManageScheduleResult =
  | { success: true; scheduleId: string | null }
  | { success: false; error: string }

/**
 * Create or update a QStash schedule for a workflow
 */
export async function createOrUpdateWorkflowSchedule(
  workflowId: string,
  nodes: unknown[],
  existingScheduleId: string | null,
): Promise<ManageScheduleResult> {
  const triggerConfig = getTriggerConfig(nodes)

  // If trigger type is not Schedule, delete any existing schedule
  if (triggerConfig?.triggerType !== "Schedule") {
    if (existingScheduleId) {
      try {
        await qstash.schedules.delete(existingScheduleId)
      } catch (error) {
        console.error("Error deleting existing schedule:", error)
        // Continue even if delete fails - schedule might not exist
      }

      // Update workflow to remove scheduleId
      await db
        .update(workflows)
        .set({ scheduleId: null, updatedAt: new Date() })
        .where(eq(workflows.id, workflowId))
    }
    return { success: true, scheduleId: null }
  }

  // Validate cron expression
  const cron = triggerConfig.scheduleCron
  if (!cron || cron.trim().length < 5) {
    return {
      success: false,
      error: "Cron expression is required for scheduled workflows",
    }
  }

  const baseUrl = getBaseUrl()
  const destination = `${baseUrl}/api/workflows/${workflowId}/execute`

  try {
    // Delete existing schedule if updating
    if (existingScheduleId) {
      try {
        await qstash.schedules.delete(existingScheduleId)
      } catch (error) {
        console.error("Error deleting existing schedule:", error)
        // Continue even if delete fails
      }
    }

    // Create new schedule
    const response = await qstash.schedules.create({
      destination,
      cron,
      method: "POST",
      body: JSON.stringify({ input: { scheduled: true } }),
      headers: {
        "Content-Type": "application/json",
      },
    })

    // Update workflow with new scheduleId
    await db
      .update(workflows)
      .set({ scheduleId: response.scheduleId, updatedAt: new Date() })
      .where(eq(workflows.id, workflowId))

    return { success: true, scheduleId: response.scheduleId }
  } catch (error) {
    console.error("Error creating schedule:", error)
    return {
      success: false,
      error: "Failed to create schedule. Please check your cron expression.",
    }
  }
}

/**
 * Delete a QStash schedule for a workflow
 */
export async function deleteWorkflowSchedule(
  scheduleId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await qstash.schedules.delete(scheduleId)
    return { success: true }
  } catch (error) {
    console.error("Error deleting schedule:", error)
    return {
      success: false,
      error: "Failed to delete schedule",
    }
  }
}
