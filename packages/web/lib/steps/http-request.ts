/**
 * HTTP Request Step
 * Makes an HTTP request to an endpoint with "use step" directive for Vercel Workflows
 */
import "server-only"

import { type StepInput, withStepLogging } from "./step-handler"

type HttpRequestResult =
  | { success: true; data: unknown; status: number }
  | { success: false; error: string; status?: number }

export type HttpRequestInput = StepInput & {
  endpoint: string
  httpMethod: string
  httpHeaders?: string
  httpBody?: string
}

function parseHeaders(httpHeaders?: string): Record<string, string> {
  if (!httpHeaders) {
    return {}
  }
  try {
    return JSON.parse(httpHeaders)
  } catch {
    return {}
  }
}

function parseBody(httpMethod: string, httpBody?: string): string | undefined {
  if (httpMethod === "GET" || !httpBody) {
    return undefined
  }
  try {
    const parsedBody = JSON.parse(httpBody)
    return Object.keys(parsedBody).length > 0
      ? JSON.stringify(parsedBody)
      : undefined
  } catch {
    const trimmed = httpBody.trim()
    return trimmed && trimmed !== "{}" ? httpBody : undefined
  }
}

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type")
  if (contentType?.includes("application/json")) {
    return response.json()
  }
  return response.text()
}

/**
 * HTTP request logic (pure business logic, no step concerns)
 */
async function httpRequest(
  input: HttpRequestInput,
): Promise<HttpRequestResult> {
  if (!input.endpoint) {
    return {
      success: false,
      error: "HTTP request failed: URL is required",
    }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000) // 30 seconds timeout

  try {
    const response = await fetch(input.endpoint, {
      method: input.httpMethod,
      headers: parseHeaders(input.httpHeaders),
      body: parseBody(input.httpMethod, input.httpBody),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      return {
        success: false,
        error: `HTTP request failed with status ${response.status}: ${errorText}`,
        status: response.status,
      }
    }

    const data = await parseResponse(response)
    return { success: true, data, status: response.status }
  } catch (error) {
    return {
      success: false,
      error: `HTTP request failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

/**
 * HTTP Request Step with Vercel Workflow support
 * Uses "use step" directive for durability and observability
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function httpRequestStep(
  input: HttpRequestInput,
): Promise<HttpRequestResult> {
  "use step"
  return withStepLogging(input, () => httpRequest(input))
}
httpRequestStep.maxRetries = 0
