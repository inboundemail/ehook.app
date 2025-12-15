"use client"

import { Button } from "@/components/ui/button"
import { api } from "@/lib/api-client"
import { Loader2, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

type CreateWorkflowButtonProps = {
  variant?: "default" | "outline" | "ghost"
  className?: string
}

export function CreateWorkflowButton({
  variant = "default",
  className,
}: CreateWorkflowButtonProps) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateWorkflow = async () => {
    setIsCreating(true)
    try {
      // Create workflow with a default trigger node
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

      // Navigate to the new workflow
      router.push(`/workflows/${newWorkflow.id}`)
    } catch (error) {
      console.error("Failed to create workflow:", error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleCreateWorkflow}
      disabled={isCreating}
    >
      {isCreating ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <Plus className="mr-2 size-4" />
      )}
      {isCreating ? "Creating..." : "New Workflow"}
    </Button>
  )
}
