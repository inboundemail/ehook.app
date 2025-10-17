"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Copy, Check } from "lucide-react"

type WebhookUrlDisplayProps = {
  uuid: string
  status: "connecting" | "connected" | "reconnecting" | "disconnected"
}

export function WebhookUrlDisplay({ uuid, status }: WebhookUrlDisplayProps) {
  const [copied, setCopied] = useState(false)
  const webhookUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/api/webhook/${uuid}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return "bg-green-500"
      case "connecting":
      case "reconnecting":
        return "bg-yellow-500"
      case "disconnected":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold">Your Webhook URL</h2>
        <Badge variant="outline" className="text-xs">
          <span className={`w-2 h-2 mr-1.5 ${getStatusColor()}`} />
          {status}
        </Badge>
      </div>
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 z-10"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
        <Input
          type="text"
          value={webhookUrl}
          readOnly
          onClick={copyToClipboard}
          className="pl-10 cursor-pointer font-mono text-sm"
        />
      </div>
    </div>
  )
}

