"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { saveWebhookSettings, getWebhookSettings, type WebhookSettings } from "@/app/actions/settings"

const SETTINGS_KEY = "ehook-settings"

const DEFAULT_SETTINGS: WebhookSettings = {
  responseStatus: 200,
  responseBody: '{"success": true, "message": "Webhook received"}',
  responseHeaders: {},
}

type SettingsPanelProps = {
  uuid: string
  onClose: () => void
}

export function SettingsPanel({ uuid, onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState<WebhookSettings>(DEFAULT_SETTINGS)
  const [headerKey, setHeaderKey] = useState("")
  const [headerValue, setHeaderValue] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Load settings from server
    if (uuid) {
      getWebhookSettings(uuid).then((serverSettings) => {
        if (serverSettings) {
          setSettings(serverSettings)
        } else {
          // Try localStorage fallback
          const stored = localStorage.getItem(SETTINGS_KEY)
          if (stored) {
            try {
              setSettings(JSON.parse(stored))
            } catch (e) {
              console.error("Failed to parse settings:", e)
            }
          }
        }
      })
    }
  }, [uuid])

  const saveSettings = async () => {
    // Save to localStorage
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    
    // Save to server if we have a UUID
    if (uuid) {
      await saveWebhookSettings(uuid, settings)
    }
    
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const resetSettings = async () => {
    setSettings(DEFAULT_SETTINGS)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS))
    
    // Save to server if we have a UUID
    if (uuid) {
      await saveWebhookSettings(uuid, DEFAULT_SETTINGS)
    }
    
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const addHeader = () => {
    if (headerKey && headerValue) {
      setSettings({
        ...settings,
        responseHeaders: {
          ...settings.responseHeaders,
          [headerKey]: headerValue,
        },
      })
      setHeaderKey("")
      setHeaderValue("")
    }
  }

  const removeHeader = (key: string) => {
    const newHeaders = { ...settings.responseHeaders }
    delete newHeaders[key]
    setSettings({
      ...settings,
      responseHeaders: newHeaders,
    })
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Webhook Settings</h2>
            <p className="text-sm text-muted-foreground">
              Configure the default response for your webhooks
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Separator />

        {/* Response Status */}
        <div className="space-y-2">
          <Label htmlFor="status">Response Status Code</Label>
          <Input
            id="status"
            type="number"
            value={settings.responseStatus}
            onChange={(e) =>
              setSettings({ ...settings, responseStatus: parseInt(e.target.value) || 200 })
            }
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            HTTP status code to return (e.g., 200, 201, 204)
          </p>
        </div>

        <Separator />

        {/* Response Body */}
        <div className="space-y-2">
          <Label htmlFor="body">Response Body (JSON)</Label>
          <textarea
            id="body"
            value={settings.responseBody}
            onChange={(e) => setSettings({ ...settings, responseBody: e.target.value })}
            className="w-full min-h-[200px] p-3 border bg-background font-mono text-sm"
            placeholder='{"success": true}'
          />
          <p className="text-xs text-muted-foreground">
            The JSON body to return in the response
          </p>
        </div>

        <Separator />

        {/* Response Headers */}
        <div className="space-y-3">
          <Label>Custom Response Headers</Label>
          
          {Object.entries(settings.responseHeaders).length > 0 && (
            <div className="space-y-2 mb-4">
              {Object.entries(settings.responseHeaders).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <Badge variant="outline" className="flex-1 justify-between">
                    <span className="font-mono text-xs">
                      {key}: {value}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-2"
                      onClick={() => removeHeader(key)}
                    >
                      ×
                    </Button>
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Header name (e.g., X-Custom-Header)"
              value={headerKey}
              onChange={(e) => setHeaderKey(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Header value"
              value={headerValue}
              onChange={(e) => setHeaderValue(e.target.value)}
              className="flex-1"
            />
            <Button onClick={addHeader} variant="outline">
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Add custom headers to include in webhook responses
          </p>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={saveSettings} className="flex-1">
            {saved ? "Saved!" : "Save Settings"}
          </Button>
          <Button onClick={resetSettings} variant="outline">
            Reset to Default
          </Button>
        </div>
      </div>
    </ScrollArea>
  )
}

