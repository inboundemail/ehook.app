"use server"

import { redis } from "@/lib/redis"

export type WebhookSettings = {
  responseStatus: number
  responseBody: string
  responseHeaders: Record<string, string>
}

export async function saveWebhookSettings(uuid: string, settings: WebhookSettings) {
  try {
    const redisKey = `webhook:${uuid}:settings`
    await redis.set(redisKey, JSON.stringify(settings))
    return true
  } catch (error) {
    console.error("Error saving settings:", error)
    return false
  }
}

export async function getWebhookSettings(uuid: string): Promise<WebhookSettings | null> {
  try {
    const redisKey = `webhook:${uuid}:settings`
    const settings = await redis.get(redisKey)
    
    if (settings) {
      return typeof settings === "string" ? JSON.parse(settings) : settings as WebhookSettings
    }
    
    return null
  } catch (error) {
    console.error("Error getting settings:", error)
    return null
  }
}

