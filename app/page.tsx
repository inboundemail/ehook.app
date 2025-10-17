"use client"

import { useEffect, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { WebhookUrlDisplay } from "./components/webhook-url-display"
import { Inbox } from "./components/inbox"
import { MessageViewer } from "./components/message-viewer"
import { type WebhookEvent } from "./actions/webhook"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import Link from "next/link"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

const STORAGE_KEY = "ehook-webhook-uuid"

export default function Home() {
  const [uuid, setUuid] = useState<string>("")
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null)
  const [status, setStatus] = useState<"connecting" | "connected" | "reconnecting" | "disconnected">("connecting")
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Get or create UUID from localStorage
    let storedUuid = localStorage.getItem(STORAGE_KEY)
    if (!storedUuid) {
      storedUuid = uuidv4()
      localStorage.setItem(STORAGE_KEY, storedUuid)
    }
    setUuid(storedUuid)
  }, [])

  // Update document title with unread count
  useEffect(() => {
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) eHook.app`
    } else {
      document.title = "eHook.app"
    }
  }, [unreadCount])

  // Clear unread count when window is focused
  useEffect(() => {
    const handleFocus = () => {
      setUnreadCount(0)
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setUnreadCount(0)
      }
    }

    window.addEventListener("focus", handleFocus)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  if (!uuid) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
            <Inbox
              uuid={uuid}
              onSelectEvent={(event) => {
                setSelectedEvent(event)
                setUnreadCount(0) // Clear unread when user interacts
              }}
              selectedEventId={selectedEvent?.id || null}
              onStatusChange={setStatus}
              onNewEvent={() => {
                // Only increment unread if window is not focused or visible
                if (document.hidden || !document.hasFocus()) {
                  setUnreadCount((prev) => prev + 1)
                }
              }}
              onEventsChange={() => {
                setSelectedEvent(null)
              }}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={70}>
            <div className="p-4 border-b">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <WebhookUrlDisplay uuid={uuid} status={status} />
                </div>
                <Link href="/settings">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <MessageViewer
              event={selectedEvent}
              onDelete={() => setSelectedEvent(null)}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
