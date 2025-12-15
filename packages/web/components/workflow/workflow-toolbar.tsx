"use client"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { api } from "@/lib/api-client"
import {
  addNodeAtom,
  canRedoAtom,
  canUndoAtom,
  currentWorkflowIdAtom,
  edgesAtom,
  isExecutingAtom,
  isGeneratingAtom,
  nodesAtom,
  propertiesPanelActiveTabAtom,
  redoAtom,
  selectedEdgeAtom,
  selectedExecutionIdAtom,
  selectedNodeAtom,
  undoAtom,
  updateNodeDataAtom,
  type WorkflowNode,
} from "@/lib/workflow-store"
import { useReactFlow } from "@xyflow/react"
import { useAtom, useSetAtom } from "jotai"
import { Loader2, Play, Plus, Redo2, Undo2 } from "lucide-react"
import { nanoid } from "nanoid"
import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { Panel } from "../ai-elements/panel"
import { WorkflowSelector } from "./workflow-selector"

type WorkflowToolbarProps = {
  workflowId?: string
}

export const WorkflowToolbar = ({ workflowId }: WorkflowToolbarProps) => {
  const [nodes, setNodes] = useAtom(nodesAtom)
  const [edges, setEdges] = useAtom(edgesAtom)
  const [isGenerating] = useAtom(isGeneratingAtom)
  const [isExecuting, setIsExecuting] = useAtom(isExecutingAtom)
  const [canUndo] = useAtom(canUndoAtom)
  const [canRedo] = useAtom(canRedoAtom)
  const [currentWorkflowId] = useAtom(currentWorkflowIdAtom)
  const undo = useSetAtom(undoAtom)
  const redo = useSetAtom(redoAtom)
  const addNode = useSetAtom(addNodeAtom)
  const setSelectedNodeId = useSetAtom(selectedNodeAtom)
  const setSelectedEdgeId = useSetAtom(selectedEdgeAtom)
  const updateNodeData = useSetAtom(updateNodeDataAtom)
  const setActiveTab = useSetAtom(propertiesPanelActiveTabAtom)
  const setSelectedExecutionId = useSetAtom(selectedExecutionIdAtom)
  const { screenToFlowPosition } = useReactFlow()
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current !== null) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [])

  const handleAddStep = () => {
    // Get the ReactFlow wrapper (the visible canvas container)
    const flowWrapper = document.querySelector(".react-flow")
    if (!flowWrapper) {
      return
    }

    const rect = flowWrapper.getBoundingClientRect()
    // Calculate center in absolute screen coordinates
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    // Convert to flow coordinates
    const position = screenToFlowPosition({ x: centerX, y: centerY })

    // Adjust for node dimensions to center it properly
    // Action node is 192px wide and 192px tall (w-48 h-48 in Tailwind)
    const nodeWidth = 192
    const nodeHeight = 192
    position.x -= nodeWidth / 2
    position.y -= nodeHeight / 2

    // Check if there's already a node at this position
    const offset = 20 // Offset distance in pixels
    const threshold = 20 // How close nodes need to be to be considered overlapping

    const finalPosition = { ...position }
    let hasOverlap = true
    let attempts = 0
    const maxAttempts = 20 // Prevent infinite loop

    while (hasOverlap && attempts < maxAttempts) {
      hasOverlap = nodes.some((node) => {
        const dx = Math.abs(node.position.x - finalPosition.x)
        const dy = Math.abs(node.position.y - finalPosition.y)
        return dx < threshold && dy < threshold
      })

      if (hasOverlap) {
        // Offset diagonally down-right
        finalPosition.x += offset
        finalPosition.y += offset
        attempts += 1
      }
    }

    // Create new action node
    const newNode: WorkflowNode = {
      id: nanoid(),
      type: "action",
      position: finalPosition,
      data: {
        label: "",
        description: "",
        type: "action",
        config: {},
        status: "idle",
      },
    }

    addNode(newNode)
    setSelectedNodeId(newNode.id)
  }

  // Update all node statuses helper
  const updateNodesStatus = (
    status: "idle" | "running" | "success" | "error",
  ) => {
    for (const node of nodes) {
      updateNodeData({ id: node.id, data: { status } })
    }
  }

  // Execute workflow
  const handleExecute = async () => {
    if (!currentWorkflowId || isExecuting) {
      return
    }

    // Switch to Runs tab when starting a test run
    setActiveTab("runs")

    // Deselect all nodes and edges
    setNodes(nodes.map((node) => ({ ...node, selected: false })))
    setEdges(edges.map((edge) => ({ ...edge, selected: false })))
    setSelectedNodeId(null)
    setSelectedEdgeId(null)

    setIsExecuting(true)

    // Set all nodes to idle first
    updateNodesStatus("idle")

    // Immediately set trigger nodes to running for instant visual feedback
    for (const node of nodes) {
      if (node.data.type === "trigger") {
        updateNodeData({ id: node.id, data: { status: "running" } })
      }
    }

    try {
      // Find trigger node and get mock request data if it's a webhook trigger
      const triggerNode = nodes.find((node) => node.data.type === "trigger")
      let triggerInput: Record<string, unknown> = {}

      if (triggerNode?.data.config?.triggerType === "Webhook") {
        const mockRequest = triggerNode.data.config.webhookMockRequest as
          | string
          | undefined
        if (mockRequest) {
          try {
            const parsedMock = JSON.parse(mockRequest) as Record<
              string,
              unknown
            >
            // Wrap the mock data in a body field to match real webhook structure
            triggerInput = {
              body: parsedMock,
              method: "POST",
              headers: {},
              query: {},
              timestamp: Date.now(),
            }
          } catch {
            // If parsing fails, use as-is
            triggerInput = { body: mockRequest }
          }
        }
      }

      // Start the execution via API
      const result = await api.workflow.execute(currentWorkflowId, triggerInput)

      // Select the new execution
      setSelectedExecutionId(result.executionId)

      // Poll for execution status updates
      const pollInterval = setInterval(async () => {
        try {
          const statusData = await api.workflow.getExecutionStatus(
            result.executionId,
          )

          // Update node statuses based on the execution logs
          for (const nodeStatus of statusData.nodeStatuses) {
            updateNodeData({
              id: nodeStatus.nodeId,
              data: {
                status: nodeStatus.status as
                  | "idle"
                  | "running"
                  | "success"
                  | "error",
              },
            })
          }

          // Stop polling if execution is complete
          if (statusData.status !== "running") {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current)
              pollingIntervalRef.current = null
            }

            setIsExecuting(false)
          }
        } catch (error) {
          console.error("Failed to poll execution status:", error)
        }
      }, 500) // Poll every 500ms

      pollingIntervalRef.current = pollInterval
    } catch (error) {
      console.error("Failed to execute workflow:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to execute workflow",
      )
      updateNodesStatus("error")
      setIsExecuting(false)
    }
  }

  if (!workflowId) {
    return null
  }

  return (
    <>
      <Panel
        className="flex flex-col gap-2 rounded-none border-none bg-transparent p-0 lg:flex-row lg:items-center"
        position="top-left"
      >
        <WorkflowSelector />
      </Panel>

      <div className="pointer-events-auto absolute top-4 right-4 z-10">
        <div className="flex flex-col-reverse items-end gap-2 lg:flex-row lg:items-center">
          {/* Add Step */}
          <ButtonGroup className="hidden lg:flex" orientation="horizontal">
            <Button
              className="disabled:[&>svg]:text-muted-foreground border hover:bg-black/5 disabled:opacity-100 dark:hover:bg-white/5"
              disabled={isGenerating}
              onClick={handleAddStep}
              size="icon"
              title="Add Step"
              variant="secondary"
            >
              <Plus className="size-4" />
            </Button>
          </ButtonGroup>

          {/* Undo/Redo */}
          <ButtonGroup className="hidden lg:flex" orientation="horizontal">
            <Button
              className="disabled:[&>svg]:text-muted-foreground border hover:bg-black/5 disabled:opacity-100 dark:hover:bg-white/5"
              disabled={!canUndo || isGenerating}
              onClick={() => undo()}
              size="icon"
              title="Undo"
              variant="secondary"
            >
              <Undo2 className="size-4" />
            </Button>
            <Button
              className="disabled:[&>svg]:text-muted-foreground border hover:bg-black/5 disabled:opacity-100 dark:hover:bg-white/5"
              disabled={!canRedo || isGenerating}
              onClick={() => redo()}
              size="icon"
              title="Redo"
              variant="secondary"
            >
              <Redo2 className="size-4" />
            </Button>
          </ButtonGroup>

          {/* Run Workflow */}
          <Button
            className="disabled:[&>svg]:text-muted-foreground border hover:bg-black/5 disabled:opacity-100 dark:hover:bg-white/5"
            disabled={isExecuting || nodes.length === 0 || isGenerating}
            onClick={handleExecute}
            size="icon"
            title="Run Workflow"
            variant="secondary"
          >
            {isExecuting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
          </Button>

          {/* Mobile Add Step */}
          <ButtonGroup className="flex lg:hidden" orientation="vertical">
            <Button
              className="disabled:[&>svg]:text-muted-foreground border hover:bg-black/5 disabled:opacity-100 dark:hover:bg-white/5"
              disabled={isGenerating}
              onClick={handleAddStep}
              size="icon"
              title="Add Step"
              variant="secondary"
            >
              <Plus className="size-4" />
            </Button>
          </ButtonGroup>

          {/* Mobile Undo/Redo */}
          <ButtonGroup className="flex lg:hidden" orientation="vertical">
            <Button
              className="disabled:[&>svg]:text-muted-foreground border hover:bg-black/5 disabled:opacity-100 dark:hover:bg-white/5"
              disabled={!canUndo || isGenerating}
              onClick={() => undo()}
              size="icon"
              title="Undo"
              variant="secondary"
            >
              <Undo2 className="size-4" />
            </Button>
            <Button
              className="disabled:[&>svg]:text-muted-foreground border hover:bg-black/5 disabled:opacity-100 dark:hover:bg-white/5"
              disabled={!canRedo || isGenerating}
              onClick={() => redo()}
              size="icon"
              title="Redo"
              variant="secondary"
            >
              <Redo2 className="size-4" />
            </Button>
          </ButtonGroup>

          {/* Mobile Run Workflow */}
          <Button
            className="disabled:[&>svg]:text-muted-foreground border hover:bg-black/5 disabled:opacity-100 lg:hidden dark:hover:bg-white/5"
            disabled={isExecuting || nodes.length === 0 || isGenerating}
            onClick={handleExecute}
            size="icon"
            title="Run Workflow"
            variant="secondary"
          >
            {isExecuting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </>
  )
}
