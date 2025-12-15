"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  currentWorkflowIdAtom,
  currentWorkflowNameAtom,
} from "@/lib/workflow-store"
import Editor from "@monaco-editor/react"
import { useAtom } from "jotai"
import { Mail, Zap } from "lucide-react"
import { useEffect, useState } from "react"

type ActionConfigProps = {
  config: Record<string, unknown>
  onUpdateConfig: (key: string, value: string) => void
  disabled: boolean
}

// Send Email fields component
function SendEmailFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>
  onUpdateConfig: (key: string, value: string) => void
  disabled: boolean
}) {
  return (
    <>
      <div className="space-y-2">
        <Label className="ml-1" htmlFor="emailTo">
          To (Email Address)
        </Label>
        <Input
          disabled={disabled}
          id="emailTo"
          onChange={(e) => onUpdateConfig("emailTo", e.target.value)}
          placeholder="user@example.com or {{Trigger.body.email}}"
          value={(config?.emailTo as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label className="ml-1" htmlFor="emailSubject">
          Subject
        </Label>
        <Input
          disabled={disabled}
          id="emailSubject"
          onChange={(e) => onUpdateConfig("emailSubject", e.target.value)}
          placeholder="Subject or {{Trigger.body.subject}}"
          value={(config?.emailSubject as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label className="ml-1" htmlFor="emailBody">
          Body
        </Label>
        <Textarea
          disabled={disabled}
          id="emailBody"
          onChange={(e) => onUpdateConfig("emailBody", e.target.value)}
          placeholder="Use {{NodeLabel.field}} to insert data, e.g. {{Trigger.body.message}}"
          rows={4}
          value={(config?.emailBody as string) || ""}
        />
      </div>
    </>
  )
}

// HTTP Request fields component
function HttpRequestFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>
  onUpdateConfig: (key: string, value: string) => void
  disabled: boolean
}) {
  // Initialize httpMethod to POST if not set
  useEffect(() => {
    if (!config?.httpMethod) {
      onUpdateConfig("httpMethod", "POST")
    }
  }, [config?.httpMethod, onUpdateConfig])

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="httpMethod">HTTP Method</Label>
        <Select
          disabled={disabled}
          onValueChange={(value) => onUpdateConfig("httpMethod", value)}
          value={(config?.httpMethod as string) || "POST"}
        >
          <SelectTrigger className="w-full" id="httpMethod">
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="endpoint">URL</Label>
        <Input
          disabled={disabled}
          id="endpoint"
          onChange={(e) => onUpdateConfig("endpoint", e.target.value)}
          placeholder="https://api.example.com/endpoint or {{Trigger.body.url}}"
          value={(config?.endpoint as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="httpHeaders">Headers (JSON)</Label>
        <div className="overflow-hidden rounded-md border">
          <Editor
            height="120px"
            defaultLanguage="json"
            value={(config?.httpHeaders as string) || "{}"}
            onChange={(value) => onUpdateConfig("httpHeaders", value || "{}")}
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
      </div>
      <div className="space-y-2">
        <Label htmlFor="httpBody">Body (JSON)</Label>
        <div
          className={`overflow-hidden rounded-md border ${
            config?.httpMethod === "GET" ? "opacity-50" : ""
          }`}
        >
          <Editor
            height="180px"
            defaultLanguage="json"
            value={(config?.httpBody as string) || "{}"}
            onChange={(value) => onUpdateConfig("httpBody", value || "{}")}
            options={{
              readOnly: config?.httpMethod === "GET" || disabled,
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
        {config?.httpMethod === "GET" && (
          <p className="text-muted-foreground text-xs">
            Body is disabled for GET requests
          </p>
        )}
      </div>
    </>
  )
}

// Action categories and their actions
const ACTION_CATEGORIES = {
  System: ["HTTP Request"],
  Inbound: ["Send Email"],
} as const

type ActionCategory = keyof typeof ACTION_CATEGORIES

// Get category for an action type
const getCategoryForAction = (actionType: string): ActionCategory | null => {
  for (const [category, actions] of Object.entries(ACTION_CATEGORIES)) {
    if (actions.includes(actionType as never)) {
      return category as ActionCategory
    }
  }
  return null
}

export function ActionConfig({
  config,
  onUpdateConfig,
  disabled,
}: ActionConfigProps) {
  const [_workflowId] = useAtom(currentWorkflowIdAtom)
  const [_workflowName] = useAtom(currentWorkflowNameAtom)

  const actionType = (config?.actionType as string) || ""
  const selectedCategory = actionType ? getCategoryForAction(actionType) : null
  const [category, setCategory] = useState<ActionCategory | "">(
    selectedCategory || "",
  )

  // Sync category state when actionType changes (e.g., when switching nodes)
  useEffect(() => {
    const newCategory = actionType ? getCategoryForAction(actionType) : null
    setCategory(newCategory || "")
  }, [actionType])

  const handleCategoryChange = (newCategory: ActionCategory) => {
    setCategory(newCategory)
    // Auto-select the first action in the new category
    const firstAction = ACTION_CATEGORIES[newCategory][0]
    onUpdateConfig("actionType", firstAction)
  }

  const handleActionTypeChange = (value: string) => {
    onUpdateConfig("actionType", value)
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label className="ml-1" htmlFor="actionCategory">
            Category
          </Label>
          <Select
            disabled={disabled}
            onValueChange={(value) =>
              handleCategoryChange(value as ActionCategory)
            }
            value={category || undefined}
          >
            <SelectTrigger className="w-full" id="actionCategory">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="System">
                <div className="flex items-center gap-2">
                  <Zap className="size-4" />
                  <span>System</span>
                </div>
              </SelectItem>
              <SelectItem value="Inbound">
                <div className="flex items-center gap-2">
                  <Mail className="size-4" />
                  <span>Inbound</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="ml-1" htmlFor="actionType">
            Action
          </Label>
          <Select
            disabled={disabled || !category}
            onValueChange={handleActionTypeChange}
            value={actionType || undefined}
          >
            <SelectTrigger className="w-full" id="actionType">
              <SelectValue placeholder="Select action" />
            </SelectTrigger>
            <SelectContent>
              {category &&
                ACTION_CATEGORIES[category].map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* HTTP Request fields */}
      {config?.actionType === "HTTP Request" && (
        <HttpRequestFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      )}

      {/* Send Email fields */}
      {config?.actionType === "Send Email" && (
        <SendEmailFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      )}
    </>
  )
}
