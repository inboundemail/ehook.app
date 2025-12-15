/**
 * Send Email Step
 * Sends an email using Inbound SDK with "use step" directive for Workflow DevKit
 */
import { Inbound } from "@inboundemail/sdk"
import { FatalError } from "workflow"
import { type StepInput, withStepLogging } from "./step-handler"

type SendEmailResult =
  | {
      success: true
      data: { id?: string; messageId?: string; status: string }
    }
  | { success: false; error: string }

export type SendEmailInput = StepInput & {
  emailTo: string
  emailSubject: string
  emailBody?: string
}

/**
 * Send email logic (pure business logic, no step concerns)
 */
async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const { emailTo, emailSubject, emailBody } = input

  // Configuration errors should not be retried
  if (!emailTo) {
    throw new FatalError("Send email failed: recipient email (to) is required")
  }

  if (!emailSubject) {
    throw new FatalError("Send email failed: subject is required")
  }

  const apiKey = process.env.INBOUND_API_KEY
  if (!apiKey) {
    throw new FatalError(
      "Send email failed: INBOUND_API_KEY environment variable is not configured",
    )
  }

  const fromEmail = process.env.INBOUND_FROM_EMAIL
  if (!fromEmail) {
    throw new FatalError(
      "Send email failed: INBOUND_FROM_EMAIL environment variable is not configured",
    )
  }

  try {
    const inbound = new Inbound(apiKey)

    const response = await inbound.email.send({
      from: fromEmail,
      to: emailTo,
      subject: emailSubject,
      text: emailBody || "",
    })

    if (response.error) {
      throw new FatalError(`Send email failed: ${response.error}`)
    }

    return {
      success: true,
      data: {
        id: response.data?.id,
        messageId: response.data?.messageId,
        status: response.data?.status || "sent",
      },
    }
  } catch (error) {
    // Re-throw FatalErrors as-is
    if (error instanceof FatalError) {
      throw error
    }
    // Other errors might be transient (network issues, etc.)
    return {
      success: false,
      error: `Send email failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

/**
 * Send Email Step with Workflow DevKit support
 * Uses "use step" directive for durability and observability
 */
export async function sendEmailStep(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  "use step"
  return withStepLogging(input, () => sendEmail(input))
}
