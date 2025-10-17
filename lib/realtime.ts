import { Realtime, InferRealtimeEvents } from "@upstash/realtime"
import { redis } from "./redis"
import z from "zod"

const schema = {
  webhook: {
    received: z.object({
      id: z.string(),
      uuid: z.string(),
      method: z.string(),
      url: z.string(),
      headers: z.record(z.string(), z.unknown()),
      body: z.any(),
      query: z.record(z.string(), z.unknown()),
      timestamp: z.number(),
    }),
  },
}

export const realtime = new Realtime({ schema, redis })
export type RealtimeEvents = InferRealtimeEvents<typeof realtime>

