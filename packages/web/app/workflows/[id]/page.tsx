"use client"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { NodeConfigPanel } from "@/components/workflow/node-config-panel"
import { WorkflowCanvas } from "@/components/workflow/workflow-canvas"
import {
  currentWorkflowIdAtom,
  currentWorkflowNameAtom,
  currentWorkflowWebhookIdAtom,
  edgesAtom,
  hasUnsavedChangesAtom,
  nodesAtom,
  type WorkflowEdge,
  type WorkflowNode,
} from "@/lib/workflow-store"
import { ReactFlowProvider } from "@xyflow/react"
import { useSetAtom } from "jotai"
import { useRouter } from "next/navigation"
import { use, useEffect } from "react"

type WorkflowPageProps = {
  params: Promise<{ id: string }>
}

function WorkflowEditor({ workflowId }: { workflowId: string }) {
  const router = useRouter()
  const setNodes = useSetAtom(nodesAtom)
  const setEdges = useSetAtom(edgesAtom)
  const setCurrentWorkflowId = useSetAtom(currentWorkflowIdAtom)
  const setCurrentWorkflowName = useSetAtom(currentWorkflowNameAtom)
  const setCurrentWorkflowWebhookId = useSetAtom(currentWorkflowWebhookIdAtom)
  const setHasUnsavedChanges = useSetAtom(hasUnsavedChangesAtom)

  useEffect(() => {
    // Redirect to workflows page if someone navigates to /workflows/new directly
    if (workflowId === "new") {
      router.replace("/workflows")
      return
    }

    const loadWorkflow = async () => {
      try {
        const response = await fetch(`/api/workflows/${workflowId}`)
        if (response.ok) {
          const workflow = await response.json()

          // Parse nodes and edges from JSON if needed
          const parsedNodes: WorkflowNode[] =
            typeof workflow.nodes === "string"
              ? JSON.parse(workflow.nodes)
              : workflow.nodes || []
          const parsedEdges: WorkflowEdge[] =
            typeof workflow.edges === "string"
              ? JSON.parse(workflow.edges)
              : workflow.edges || []

          // Reset all node statuses to idle when loading
          const nodesWithIdleStatus = parsedNodes.map((node: WorkflowNode) => ({
            ...node,
            data: {
              ...node.data,
              status: "idle" as const,
            },
          }))

          setNodes(nodesWithIdleStatus)
          setEdges(parsedEdges)
          setCurrentWorkflowId(workflow.id)
          setCurrentWorkflowName(workflow.name || "Untitled Workflow")
          setCurrentWorkflowWebhookId(workflow.webhookId || null)
          setHasUnsavedChanges(false)
        } else if (response.status === 404) {
          // Workflow not found - redirect to workflows list
          router.replace("/workflows")
        }
      } catch (error) {
        console.error("Failed to load workflow:", error)
      }
    }

    loadWorkflow()
  }, [
    workflowId,
    router,
    setNodes,
    setEdges,
    setCurrentWorkflowId,
    setCurrentWorkflowName,
    setCurrentWorkflowWebhookId,
    setHasUnsavedChanges,
  ])

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={70} minSize={40}>
          <WorkflowCanvas />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel
          className="overflow-hidden"
          defaultSize={30}
          minSize={20}
          maxSize={50}
        >
          <NodeConfigPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default function WorkflowPage({ params }: WorkflowPageProps) {
  const { id } = use(params)

  return (
    <ReactFlowProvider>
      <WorkflowEditor workflowId={id} />
    </ReactFlowProvider>
  )
}
