import { getWebhookSettings } from "@/app/actions/settings"
import { db } from "@/db"
import { workflowExecutions, workflows } from "@/db/schema"
import { realtime } from "@/lib/realtime"
import { redis } from "@/lib/redis"
import { executeWorkflow } from "@/lib/workflow-executor.workflow"
import type { WorkflowEdge, WorkflowNode } from "@/lib/workflow-store"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

type RouteContext = {
  params: Promise<{ uuid: string }>
}

async function handleWebhook(request: NextRequest, context: RouteContext) {
  try {
    const { uuid } = await context.params

    // Extract request data
    const method = request.method
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      // Filter out x-vercel-* headers
      if (!key.toLowerCase().startsWith("x-vercel-")) {
        headers[key] = value
      }
    })

    // Parse query params
    const url = new URL(request.url)
    const query: Record<string, string> = {}
    url.searchParams.forEach((value, key) => {
      query[key] = value
    })

    // Parse body
    let body: any = null
    const contentType = request.headers.get("content-type") || ""

    try {
      if (contentType.includes("application/json")) {
        body = await request.json()
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const formData = await request.formData()
        body = Object.fromEntries(formData)
      } else if (contentType.includes("text/")) {
        body = await request.text()
      } else {
        // For other content types, try to read as text
        const text = await request.text()
        body = text || null
      }
    } catch (e) {
      // If body parsing fails, set to null
      body = null
    }

    const timestamp = Date.now()
    const eventId = uuidv4()

    const webhookEvent = {
      id: eventId,
      uuid,
      method,
      url: request.url,
      headers,
      body,
      query,
      timestamp,
    }

    // Store in Redis (keep last 50 events)
    const redisKey = `webhook:${uuid}:events`

    // Add to sorted set with timestamp as score
    await redis.zadd(redisKey, {
      score: timestamp,
      member: JSON.stringify(webhookEvent),
    })

    // Keep only last 50 events
    const count = await redis.zcard(redisKey)
    if (count > 50) {
      await redis.zremrangebyrank(redisKey, 0, count - 51)
    }

    // Emit real-time event to specific channel
    await realtime
      .channel(`webhook:${uuid}`)
      .emit("webhook.received", webhookEvent)

    // Check if this webhook is associated with a workflow
    const workflow = await db.query.workflows.findFirst({
      where: eq(workflows.webhookId, uuid),
    })

    // If there's a workflow with this webhookId and it has a webhook trigger, execute it
    if (workflow) {
      const nodes = workflow.nodes as WorkflowNode[]
      const edges = workflow.edges as WorkflowEdge[]

      // Find the trigger node and check if it's a webhook trigger
      const triggerNode = nodes.find((node) => node.data.type === "trigger")

      if (triggerNode?.data.config?.triggerType === "Webhook") {
        // Create execution record
        const [execution] = await db
          .insert(workflowExecutions)
          .values({
            workflowId: workflow.id,
            status: "running",
            input: webhookEvent,
          })
          .returning()

        // Execute the workflow in the background (don't await)
        executeWorkflow({
          nodes,
          edges,
          triggerInput: webhookEvent,
          executionId: execution.id,
          workflowId: workflow.id,
        }).catch((error) => {
          console.error("[Webhook] Workflow execution error:", error)
        })
      }
    }

    // Get custom settings for this webhook
    const settings = await getWebhookSettings(uuid)

    if (settings) {
      // Use custom settings
      const responseHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...settings.responseHeaders,
      }

      let responseBody
      try {
        responseBody = JSON.parse(settings.responseBody)
      } catch {
        responseBody = settings.responseBody
      }

      return NextResponse.json(responseBody, {
        status: settings.responseStatus,
        headers: responseHeaders,
      })
    }

    // Default response
    return NextResponse.json(
      { success: true, message: "Webhook received" },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    )
  }
}

// Export all HTTP methods
export const GET = handleWebhook
export const POST = handleWebhook
export const PUT = handleWebhook
export const DELETE = handleWebhook
export const PATCH = handleWebhook
export const OPTIONS = handleWebhook
export const HEAD = handleWebhook
