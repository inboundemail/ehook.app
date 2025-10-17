"use server"

import { redis } from "@/lib/redis"

export type WebhookEvent = {
  id: string
  uuid: string
  method: string
  url: string
  headers: Record<string, unknown>
  body: any
  query: Record<string, unknown>
  timestamp: number
}

export async function getWebhookEvents(uuid: string): Promise<WebhookEvent[]> {
  try {
    const redisKey = `webhook:${uuid}:events`
    
    // Get all events from sorted set (most recent first)
    const events = await redis.zrange(redisKey, 0, -1, {
      rev: true,
    })

    // Upstash Redis client automatically deserializes JSON, so events are already objects
    // If an event is a string, parse it; otherwise, use it as-is
    return events.map((event) => {
      if (typeof event === "string") {
        return JSON.parse(event) as WebhookEvent
      }
      return event as WebhookEvent
    })
  } catch (error) {
    console.error("Error fetching webhook events:", error)
    return []
  }
}

export async function deleteWebhookEvent(uuid: string, eventId: string): Promise<boolean> {
  try {
    const redisKey = `webhook:${uuid}:events`
    
    // Get all events to find the one to delete
    const events = await redis.zrange(redisKey, 0, -1)
    
    for (const event of events) {
      const parsedEvent = typeof event === "string" ? JSON.parse(event) : event
      if (parsedEvent.id === eventId) {
        const member = typeof event === "string" ? event : JSON.stringify(event)
        await redis.zrem(redisKey, member)
        return true
      }
    }
    
    return false
  } catch (error) {
    console.error("Error deleting webhook event:", error)
    return false
  }
}

export async function deleteAllWebhookEvents(uuid: string): Promise<boolean> {
  try {
    const redisKey = `webhook:${uuid}:events`
    await redis.del(redisKey)
    return true
  } catch (error) {
    console.error("Error deleting all webhook events:", error)
    return false
  }
}

