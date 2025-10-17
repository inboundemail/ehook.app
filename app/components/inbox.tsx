"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useRealtime } from "@upstash/realtime/client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { getWebhookEvents, deleteAllWebhookEvents, deleteWebhookEvent, type WebhookEvent } from "@/app/actions/webhook"
import { RealtimeEvents } from "@/lib/realtime"
import { Trash2, Search, Webhook, CreditCard, Github, MessageSquare, ShoppingCart, Phone, Mail, Globe, Code, Settings } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

type InboxProps = {
  uuid: string
  onSelectEvent: (event: WebhookEvent) => void
  selectedEventId: string | null
  onStatusChange: (status: "connecting" | "connected" | "reconnecting" | "disconnected") => void
  onNewEvent?: () => void
  onEventsChange?: () => void
  onOpenSettings?: () => void
  showSettings?: boolean
}

export function Inbox({ uuid, onSelectEvent, selectedEventId, onStatusChange, onNewEvent, onEventsChange, onOpenSettings, showSettings }: InboxProps) {
  const [events, setEvents] = useState<WebhookEvent[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  // Subscribe to real-time events
  useRealtime<RealtimeEvents>({
    event: "webhook.received",
    channels: [`webhook:${uuid}`],
    onData: (data) => {
      // Only add if the event is for this UUID
      if (data.uuid === uuid) {
        setEvents((prev) => [data, ...prev])
        // Notify parent about new event
        onNewEvent?.()
        // Show toast notification if window is visible
        if (!document.hidden && document.hasFocus()) {
          toast.success(`${data.method} webhook received`, {
            description: new Date(data.timestamp).toLocaleTimeString(),
            duration: 3000,
          })
        }
      }
    },
  })

  // Set status to connected when component mounts
  useEffect(() => {
    onStatusChange("connected")
  }, [onStatusChange])

  // Load initial events
  const loadEvents = async () => {
    const initialEvents = await getWebhookEvents(uuid)
    setEvents(initialEvents)
  }

  useEffect(() => {
    loadEvents()
  }, [uuid])

  const handleDeleteAll = async () => {
    if (!confirm(`Are you sure you want to delete all ${events.length} webhooks? This cannot be undone.`)) {
      return
    }
    await deleteAllWebhookEvents(uuid)
    setEvents([])
    onEventsChange?.()
    toast.success(`Deleted all ${events.length} webhooks`)
  }

  const handleDeleteOne = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent selecting the event when clicking delete
    await deleteWebhookEvent(uuid, eventId)
    setEvents((prev) => prev.filter((event) => event.id !== eventId))
    toast.success("Webhook deleted")
    
    // If deleting the selected event, clear selection
    if (selectedEventId === eventId) {
      onEventsChange?.()
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // CMD/CTRL + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const searchInput = document.querySelector('input[placeholder="Search events..."]') as HTMLInputElement
        searchInput?.focus()
      }
      
      // CMD/CTRL + , to open settings
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault()
        onOpenSettings?.()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [onOpenSettings])

  // Filter events based on search query
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) {
      return events
    }

    const query = searchQuery.toLowerCase()

    return events.filter((event) => {
      // Search in method
      if (event.method.toLowerCase().includes(query)) return true

      // Search in URL
      if (event.url.toLowerCase().includes(query)) return true

      // Search in headers
      const headersString = JSON.stringify(event.headers).toLowerCase()
      if (headersString.includes(query)) return true

      // Search in query params
      const queryString = JSON.stringify(event.query).toLowerCase()
      if (queryString.includes(query)) return true

      // Search in body
      if (event.body) {
        const bodyString = typeof event.body === "string"
          ? event.body.toLowerCase()
          : JSON.stringify(event.body).toLowerCase()
        if (bodyString.includes(query)) return true
      }

      // Search in ID
      if (event.id.toLowerCase().includes(query)) return true

      return false
    })
  }, [events, searchQuery])

  const getMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case "get":
        return "bg-blue-500"
      case "post":
        return "bg-green-500"
      case "put":
        return "bg-yellow-500"
      case "delete":
        return "bg-red-500"
      case "patch":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatTime = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch {
      return new Date(timestamp).toLocaleTimeString()
    }
  }

  const getPreview = (event: WebhookEvent) => {
    if (event.body) {
      if (typeof event.body === "string") {
        return event.body.substring(0, 50)
      }
      return JSON.stringify(event.body).substring(0, 50)
    }
    return "No body"
  }

  const getWebhookIcon = (event: WebhookEvent) => {
    const headers = event.headers
    const headersLower = Object.keys(headers).reduce((acc, key) => {
      acc[key.toLowerCase()] = headers[key]
      return acc
    }, {} as Record<string, unknown>)

    // Stripe
    if (headersLower['stripe-signature'] || headersLower['x-stripe-signature']) {
      return <CreditCard className="h-4 w-4 text-purple-500" />
    }

    // GitHub
    if (headersLower['x-github-event'] || headersLower['x-github-delivery']) {
      return <Github className="h-4 w-4 text-gray-800" />
    }

    // Slack
    if (headersLower['x-slack-signature'] || headersLower['x-slack-request-timestamp']) {
      return <MessageSquare className="h-4 w-4 text-purple-600" />
    }

    // Shopify
    if (headersLower['x-shopify-topic'] || headersLower['x-shopify-hmac-sha256']) {
      return <ShoppingCart className="h-4 w-4 text-green-600" />
    }

    // Twilio
    if (headersLower['x-twilio-signature'] || headersLower['i-twilio-idempotency-token']) {
      return <Phone className="h-4 w-4 text-red-500" />
    }

    // SendGrid / Mailgun
    if (headersLower['x-twilio-email-signature'] || headersLower['x-mailgun-signature']) {
      return <Mail className="h-4 w-4 text-blue-500" />
    }

    // Discord
    if (headersLower['x-signature-ed25519'] || headersLower['x-signature-timestamp']) {
      return <MessageSquare className="h-4 w-4 text-indigo-500" />
    }

    // Check for JSON content type
    const contentType = headersLower['content-type']
    if (contentType && String(contentType).includes('application/json')) {
      return <Code className="h-4 w-4 text-orange-500" />
    }

    // Check user agent for webhook.site or other tools
    const userAgent = headersLower['user-agent']
    if (userAgent && String(userAgent).toLowerCase().includes('webhook')) {
      return <Globe className="h-4 w-4 text-blue-400" />
    }

    // Default
    return <Webhook className="h-4 w-4 text-gray-500" />
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">eHook by <Link href="https://inbound.new" target="_blank">inbound</Link></h2>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onOpenSettings}
              className={showSettings ? "bg-accent" : ""}
            >
              <Settings className="h-4 w-4" />
            </Button>
            {events.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleDeleteAll}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            {filteredEvents.length} {filteredEvents.length === events.length ? "events" : `of ${events.length} events`}
          </p>
          {events.length > 0 && (
            <div className="flex items-center gap-2">
              {Object.entries(
                events.reduce((acc, e) => {
                  acc[e.method] = (acc[e.method] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
              ).map(([method, count]) => (
                <Badge key={method} variant="outline" className="text-xs">
                  {method}: {count}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div>
          {events.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Waiting for webhooks...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No events match your search
            </div>
          ) : (
            filteredEvents.map((event, index) => (
              <div key={event.id}>
                <div
                  className={`group p-3 cursor-pointer hover:bg-accent transition-colors ${selectedEventId === event.id ? "bg-accent" : ""
                    }`}
                  onClick={() => onSelectEvent(event)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getWebhookIcon(event)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <Badge className={`${getMethodColor(event.method)} text-white text-xs`}>
                          {event.method}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatTime(event.timestamp)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                            onClick={(e) => handleDeleteOne(event.id, e)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {getPreview(event)}
                      </p>
                    </div>
                  </div>
                </div>
                {index < filteredEvents.length - 1 && <Separator />}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

