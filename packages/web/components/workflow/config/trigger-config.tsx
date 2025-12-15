"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Editor from "@monaco-editor/react"
import { Clock, Copy, Play, Webhook } from "lucide-react"
import { toast } from "sonner"
import { SchemaBuilder, type SchemaField } from "./schema-builder"

function parseWebhookSchema(schemaString: unknown): SchemaField[] {
  if (!schemaString || typeof schemaString !== "string") {
    return []
  }
  try {
    return JSON.parse(schemaString) as SchemaField[]
  } catch (error) {
    console.warn("Failed to parse webhookSchema:", error)
    return []
  }
}

type TriggerConfigProps = {
  config: Record<string, unknown>
  onUpdateConfig: (key: string, value: string) => void
  disabled: boolean
  workflowId?: string
  webhookId?: string
  nodeLabel?: string
}

export function TriggerConfig({
  config,
  onUpdateConfig,
  disabled,
  webhookId,
  nodeLabel,
}: TriggerConfigProps) {
  // Use the node label for the example, defaulting to trigger type or "Trigger"
  const labelForExample =
    nodeLabel || (config?.triggerType as string) || "Trigger"
  const webhookUrl = webhookId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/api/webhook/${webhookId}`
    : ""

  const handleCopyWebhookUrl = () => {
    if (webhookUrl) {
      navigator.clipboard.writeText(webhookUrl)
      toast.success("Webhook URL copied to clipboard")
    }
  }

  return (
    <>
      <div className="space-y-2">
        <Label className="ml-1" htmlFor="triggerType">
          Trigger Type
        </Label>
        <Select
          disabled={disabled}
          onValueChange={(value) => onUpdateConfig("triggerType", value)}
          value={(config?.triggerType as string) || "Manual"}
        >
          <SelectTrigger className="w-full" id="triggerType">
            <SelectValue placeholder="Select trigger type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Manual">
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Manual
              </div>
            </SelectItem>
            <SelectItem value="Schedule">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Schedule
              </div>
            </SelectItem>
            <SelectItem value="Webhook">
              <div className="flex items-center gap-2">
                <Webhook className="h-4 w-4" />
                Webhook
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Webhook fields */}
      {config?.triggerType === "Webhook" && (
        <>
          <div className="space-y-2">
            <Label className="ml-1">Webhook URL</Label>
            <div className="flex gap-2">
              <Input
                className="font-mono text-xs"
                disabled
                value={webhookUrl || "Save workflow to generate webhook URL"}
              />
              <Button
                disabled={!webhookUrl}
                onClick={handleCopyWebhookUrl}
                size="icon"
                variant="outline"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Request Schema (Optional)</Label>
            <SchemaBuilder
              disabled={disabled}
              onChange={(schema) =>
                onUpdateConfig("webhookSchema", JSON.stringify(schema))
              }
              schema={parseWebhookSchema(config?.webhookSchema)}
            />
            <p className="text-muted-foreground text-xs">
              Define the expected structure of the incoming webhook payload.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="webhookMockRequest">Mock Request (Optional)</Label>
            <div className="overflow-hidden rounded-md border">
              <Editor
                height="200px"
                defaultLanguage="json"
                value={(config?.webhookMockRequest as string) || "{}"}
                onChange={(value) =>
                  onUpdateConfig("webhookMockRequest", value || "{}")
                }
                options={{
                  readOnly: disabled,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 12,
                  lineNumbers: "on",
                  folding: true,
                  wordWrap: "on",
                  automaticLayout: true,
                  contextmenu: true,
                  formatOnPaste: true,
                  formatOnType: true,
                  tabSize: 2,
                  insertSpaces: true,
                }}
                theme="vs"
              />
            </div>
            <p className="text-muted-foreground text-xs">
              Enter sample JSON to test the workflow. Reference values in other
              nodes using{" "}
              <code className="bg-muted rounded px-1">
                {`{{${labelForExample}.body.fieldName}}`}
              </code>
            </p>
          </div>
        </>
      )}

      {/* Schedule fields */}
      {config?.triggerType === "Schedule" && (
        <>
          <div className="space-y-2">
            <Label className="ml-1" htmlFor="scheduleCron">
              Cron Expression
            </Label>
            <Input
              disabled={disabled}
              id="scheduleCron"
              onChange={(e) => onUpdateConfig("scheduleCron", e.target.value)}
              placeholder="0 9 * * * (every day at 9am)"
              value={(config?.scheduleCron as string) || ""}
            />
          </div>
          <div className="space-y-2">
            <Label className="ml-1" htmlFor="scheduleTimezone">
              Timezone
            </Label>
            <Select
              disabled={disabled}
              onValueChange={(value) =>
                onUpdateConfig("scheduleTimezone", value)
              }
              value={(config?.scheduleTimezone as string) || "America/New_York"}
            >
              <SelectTrigger className="w-full" id="scheduleTimezone">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">
                  America/New_York (EST/EDT)
                </SelectItem>
                <SelectItem value="America/Chicago">
                  America/Chicago (CST/CDT)
                </SelectItem>
                <SelectItem value="America/Denver">
                  America/Denver (MST/MDT)
                </SelectItem>
                <SelectItem value="America/Los_Angeles">
                  America/Los_Angeles (PST/PDT)
                </SelectItem>
                <SelectItem value="Europe/London">
                  Europe/London (GMT/BST)
                </SelectItem>
                <SelectItem value="Europe/Paris">
                  Europe/Paris (CET/CEST)
                </SelectItem>
                <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </>
  )
}
