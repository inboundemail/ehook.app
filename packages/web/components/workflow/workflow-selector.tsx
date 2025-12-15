"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Workflow } from "@/db/schema"
import { api } from "@/lib/api-client"
import {
  currentWorkflowIdAtom,
  currentWorkflowNameAtom,
} from "@/lib/workflow-store"
import { useAtomValue } from "jotai"
import { Loader2, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function WorkflowSelector() {
  const router = useRouter()
  const currentWorkflowId = useAtomValue(currentWorkflowIdAtom)
  const currentWorkflowName = useAtomValue(currentWorkflowNameAtom)
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const response = await fetch("/api/workflows")
        if (response.ok) {
          const data = await response.json()
          setWorkflows(data)
        }
      } catch (error) {
        console.error("Failed to fetch workflows:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkflows()
  }, [currentWorkflowId])

  const handleWorkflowChange = (workflowId: string) => {
    if (workflowId === "new") {
      handleCreateWorkflow()
      return
    }
    if (workflowId !== currentWorkflowId) {
      router.push(`/workflows/${workflowId}`)
    }
  }

  const handleCreateWorkflow = async () => {
    setIsCreating(true)
    try {
      const newWorkflow = await api.workflow.create({
        name: "Untitled Workflow",
        description: "",
        nodes: [
          {
            id: `trigger-${Date.now()}`,
            type: "trigger",
            position: { x: 250, y: 200 },
            data: {
              label: "Manual",
              description: "Trigger",
              type: "trigger",
              config: { triggerType: "Manual" },
              status: "idle",
            },
          },
        ],
        edges: [],
      })
      router.push(`/workflows/${newWorkflow.id}`)
    } catch (error) {
      console.error("Failed to create workflow:", error)
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-secondary flex h-9 items-center rounded-md border px-3">
        <Loader2 className="text-muted-foreground size-4 animate-spin" />
      </div>
    )
  }

  return (
    <Select
      value={currentWorkflowId || undefined}
      onValueChange={handleWorkflowChange}
    >
      <SelectTrigger className="bg-secondary text-secondary-foreground h-9 max-w-[280px] min-w-[180px] border">
        <SelectValue placeholder="Select workflow">
          <span className="truncate font-medium">
            {currentWorkflowName || "Select workflow"}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start">
        {workflows.map((workflow) => (
          <SelectItem key={workflow.id} value={workflow.id}>
            <span className="truncate">
              {workflow.name || "Untitled Workflow"}
            </span>
          </SelectItem>
        ))}
        {workflows.length > 0 && <SelectSeparator />}
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 px-2 py-1.5 text-sm font-normal"
          onClick={handleCreateWorkflow}
          disabled={isCreating}
        >
          {isCreating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          New Workflow
        </Button>
      </SelectContent>
    </Select>
  )
}
