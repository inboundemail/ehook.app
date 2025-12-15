"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  clearNodeStatusesAtom,
  currentWorkflowIdAtom,
  currentWorkflowNameAtom,
  currentWorkflowWebhookIdAtom,
  deleteEdgeAtom,
  deleteNodeAtom,
  deleteSelectedItemsAtom,
  edgesAtom,
  isGeneratingAtom,
  nodesAtom,
  propertiesPanelActiveTabAtom,
  selectedEdgeAtom,
  selectedNodeAtom,
  showClearDialogAtom,
  showDeleteDialogAtom,
  updateNodeDataAtom,
} from "@/lib/workflow-store"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { Eraser, MenuIcon, RefreshCw, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { Panel } from "../ai-elements/panel"
import { Drawer, DrawerContent, DrawerTrigger } from "../ui/drawer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { ActionConfig } from "./config/action-config"
import { ActionGrid } from "./config/action-grid"
import { ConditionConfig } from "./config/condition-config"
import { TriggerConfig } from "./config/trigger-config"
import { WorkflowRuns } from "./workflow-runs"

// Multi-selection panel component
const MultiSelectionPanel = ({
  selectedNodes,
  selectedEdges,
  onDelete,
}: {
  selectedNodes: { id: string; selected?: boolean }[]
  selectedEdges: { id: string; selected?: boolean }[]
  onDelete: () => void
}) => {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)

  const nodeText = selectedNodes.length === 1 ? "node" : "nodes"
  const edgeText = selectedEdges.length === 1 ? "line" : "lines"
  const selectionParts: string[] = []

  if (selectedNodes.length > 0) {
    selectionParts.push(`${selectedNodes.length} ${nodeText}`)
  }
  if (selectedEdges.length > 0) {
    selectionParts.push(`${selectedEdges.length} ${edgeText}`)
  }

  const selectionText = selectionParts.join(" and ")

  const handleDelete = () => {
    onDelete()
    setShowDeleteAlert(false)
  }

  return (
    <>
      <div className="flex size-full flex-col">
        <div className="flex h-14 w-full shrink-0 items-center border-b bg-transparent px-4">
          <h2 className="text-foreground font-semibold">Properties</h2>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <div className="space-y-2">
            <Label>Selection</Label>
            <p className="text-muted-foreground text-sm">
              {selectionText} selected
            </p>
          </div>
        </div>
        <div className="shrink-0 border-t p-4">
          <Button
            onClick={() => setShowDeleteAlert(true)}
            size="icon"
            variant="ghost"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <AlertDialog onOpenChange={setShowDeleteAlert} open={showDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Items</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectionText}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export const PanelInner = () => {
  const router = useRouter()
  const [selectedNodeId] = useAtom(selectedNodeAtom)
  const [selectedEdgeId] = useAtom(selectedEdgeAtom)
  const [nodes] = useAtom(nodesAtom)
  const edges = useAtomValue(edgesAtom)
  const [isGenerating] = useAtom(isGeneratingAtom)
  const [currentWorkflowId] = useAtom(currentWorkflowIdAtom)
  const [currentWorkflowName, setCurrentWorkflowName] = useAtom(
    currentWorkflowNameAtom,
  )
  const [currentWorkflowWebhookId] = useAtom(currentWorkflowWebhookIdAtom)
  const updateNodeData = useSetAtom(updateNodeDataAtom)
  const deleteNode = useSetAtom(deleteNodeAtom)
  const deleteEdge = useSetAtom(deleteEdgeAtom)
  const deleteSelectedItems = useSetAtom(deleteSelectedItemsAtom)
  const setShowClearDialog = useSetAtom(showClearDialogAtom)
  const [showDeleteDialog, setShowDeleteDialog] = useAtom(showDeleteDialogAtom)
  const clearNodeStatuses = useSetAtom(clearNodeStatusesAtom)
  const [showDeleteNodeAlert, setShowDeleteNodeAlert] = useState(false)
  const [showDeleteEdgeAlert, setShowDeleteEdgeAlert] = useState(false)
  const [showDeleteRunsAlert, setShowDeleteRunsAlert] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDeletingWorkflow, setIsDeletingWorkflow] = useState(false)
  const [activeTab, setActiveTab] = useAtom(propertiesPanelActiveTabAtom)
  const refreshRunsRef = useRef<(() => Promise<void>) | null>(null)
  const selectedNode = nodes.find((node) => node.id === selectedNodeId)
  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId)

  // Count multiple selections
  const selectedNodes = nodes.filter((node) => node.selected)
  const selectedEdges = edges.filter((edge) => edge.selected)
  const hasMultipleSelections = selectedNodes.length + selectedEdges.length > 1

  const handleDelete = () => {
    if (selectedNodeId) {
      deleteNode(selectedNodeId)
      setShowDeleteNodeAlert(false)
    }
  }

  const handleDeleteEdge = () => {
    if (selectedEdgeId) {
      deleteEdge(selectedEdgeId)
      setShowDeleteEdgeAlert(false)
    }
  }

  const handleDeleteAllRuns = async () => {
    if (!currentWorkflowId) {
      return
    }

    try {
      await fetch(`/api/workflows/${currentWorkflowId}/executions`, {
        method: "DELETE",
      })
      clearNodeStatuses()
      setShowDeleteRunsAlert(false)
      // Refresh the runs list
      if (refreshRunsRef.current) {
        await refreshRunsRef.current()
      }
      toast.success("All runs deleted")
    } catch (error) {
      console.error("Failed to delete runs:", error)
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete runs"
      toast.error(errorMessage)
    }
  }

  const handleUpdateLabel = (label: string) => {
    if (selectedNode) {
      updateNodeData({ id: selectedNode.id, data: { label } })
    }
  }

  const handleUpdateDescription = (description: string) => {
    if (selectedNode) {
      updateNodeData({ id: selectedNode.id, data: { description } })
    }
  }

  const handleUpdateConfig = (key: string, value: string) => {
    if (selectedNode) {
      const newConfig = { ...selectedNode.data.config, [key]: value }
      updateNodeData({ id: selectedNode.id, data: { config: newConfig } })
    }
  }

  const handleUpdateWorkspaceName = async (newName: string) => {
    setCurrentWorkflowName(newName)

    // Save to database if workflow exists
    if (currentWorkflowId) {
      try {
        await fetch(`/api/workflows/${currentWorkflowId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName, nodes, edges }),
        })
      } catch (error) {
        console.error("Failed to update workflow name:", error)
        toast.error("Failed to update workspace name")
      }
    }
  }

  const handleRefreshRuns = async () => {
    setIsRefreshing(true)
    try {
      if (refreshRunsRef.current) {
        await refreshRunsRef.current()
      }
    } catch (error) {
      console.error("Failed to refresh runs:", error)
      toast.error("Failed to refresh runs")
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleDeleteWorkflow = async () => {
    if (!currentWorkflowId) {
      return
    }

    setIsDeletingWorkflow(true)
    try {
      const response = await fetch(`/api/workflows/${currentWorkflowId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setShowDeleteDialog(false)
        toast.success("Workflow deleted")
        router.push("/workflows")
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to delete workflow")
      }
    } catch (error) {
      console.error("Failed to delete workflow:", error)
      toast.error("Failed to delete workflow")
    } finally {
      setIsDeletingWorkflow(false)
    }
  }

  // If multiple items are selected, show multi-selection properties
  if (hasMultipleSelections) {
    return (
      <MultiSelectionPanel
        onDelete={deleteSelectedItems}
        selectedEdges={selectedEdges}
        selectedNodes={selectedNodes}
      />
    )
  }

  // If an edge is selected, show edge properties
  if (selectedEdge) {
    return (
      <>
        <div className="flex size-full flex-col">
          <div className="flex h-14 w-full shrink-0 items-center border-b bg-transparent px-4">
            <h2 className="text-foreground font-semibold">Properties</h2>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            <div className="space-y-2">
              <Label className="ml-1" htmlFor="edge-id">
                Edge ID
              </Label>
              <Input disabled id="edge-id" value={selectedEdge.id} />
            </div>
            <div className="space-y-2">
              <Label className="ml-1" htmlFor="edge-source">
                Source
              </Label>
              <Input disabled id="edge-source" value={selectedEdge.source} />
            </div>
            <div className="space-y-2">
              <Label className="ml-1" htmlFor="edge-target">
                Target
              </Label>
              <Input disabled id="edge-target" value={selectedEdge.target} />
            </div>
          </div>
          <div className="shrink-0 border-t p-4">
            <Button
              onClick={() => setShowDeleteEdgeAlert(true)}
              size="icon"
              variant="ghost"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        <AlertDialog
          onOpenChange={setShowDeleteEdgeAlert}
          open={showDeleteEdgeAlert}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Edge</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this connection? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteEdge}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  // If no node is selected, show workspace properties and runs
  if (!selectedNode) {
    return (
      <>
        <Tabs
          className="flex size-full flex-col"
          defaultValue="properties"
          onValueChange={setActiveTab}
          value={activeTab}
        >
          <TabsList className="h-14 w-full shrink-0 rounded-none border-b bg-transparent px-4 py-2.5">
            <TabsTrigger
              className="text-muted-foreground data-[state=active]:text-foreground bg-transparent data-[state=active]:shadow-none"
              value="properties"
            >
              Properties
            </TabsTrigger>
            <TabsTrigger
              className="text-muted-foreground data-[state=active]:text-foreground bg-transparent data-[state=active]:shadow-none"
              value="runs"
            >
              Runs
            </TabsTrigger>
          </TabsList>
          <TabsContent
            className="relative flex-1 overflow-hidden"
            value="properties"
          >
            <div className="absolute inset-0 flex flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                <div className="space-y-2">
                  <Label className="ml-1" htmlFor="workflow-name">
                    Workflow Name
                  </Label>
                  <Input
                    id="workflow-name"
                    onChange={(e) => handleUpdateWorkspaceName(e.target.value)}
                    value={currentWorkflowName}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="ml-1" htmlFor="workflow-id">
                    Workflow ID
                  </Label>
                  <Input
                    disabled
                    id="workflow-id"
                    value={currentWorkflowId || "Not saved"}
                  />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 border-t p-4">
                <Button
                  onClick={() => setShowClearDialog(true)}
                  variant="ghost"
                >
                  <Eraser className="size-4" />
                  Clear
                </Button>
                <Button
                  onClick={() => setShowDeleteDialog(true)}
                  variant="ghost"
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent className="relative flex-1 overflow-hidden" value="runs">
            <div className="absolute inset-0 flex flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                <WorkflowRuns
                  isActive={activeTab === "runs"}
                  onRefreshRef={refreshRunsRef}
                />
              </div>
              <div className="flex shrink-0 items-center gap-2 border-t p-4">
                <Button
                  disabled={isRefreshing}
                  onClick={handleRefreshRuns}
                  size="icon"
                  variant="ghost"
                >
                  <RefreshCw
                    className={`size-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </Button>
                <Button
                  onClick={() => setShowDeleteRunsAlert(true)}
                  size="icon"
                  variant="ghost"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <AlertDialog
          onOpenChange={setShowDeleteRunsAlert}
          open={showDeleteRunsAlert}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete All Runs</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete all workflow runs? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAllRuns}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog onOpenChange={setShowDeleteDialog} open={showDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{currentWorkflowName}
                &quot;? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingWorkflow}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={isDeletingWorkflow}
                onClick={handleDeleteWorkflow}
              >
                {isDeletingWorkflow ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  return (
    <>
      <Tabs
        className="flex size-full flex-col"
        defaultValue="properties"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList className="h-14 w-full shrink-0 rounded-none border-b bg-transparent px-4 py-2.5">
          <TabsTrigger
            className="text-muted-foreground data-[state=active]:text-foreground bg-transparent data-[state=active]:shadow-none"
            value="properties"
          >
            Properties
          </TabsTrigger>
          <TabsTrigger
            className="text-muted-foreground data-[state=active]:text-foreground bg-transparent data-[state=active]:shadow-none"
            value="runs"
          >
            Runs
          </TabsTrigger>
        </TabsList>
        <TabsContent
          className="relative flex-1 overflow-hidden"
          value="properties"
        >
          <div className="absolute inset-0 flex flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {selectedNode.data.type === "trigger" && (
                <TriggerConfig
                  config={selectedNode.data.config || {}}
                  disabled={isGenerating}
                  onUpdateConfig={handleUpdateConfig}
                  workflowId={currentWorkflowId ?? undefined}
                  webhookId={currentWorkflowWebhookId ?? undefined}
                  nodeLabel={selectedNode.data.label}
                />
              )}

              {selectedNode.data.type === "action" &&
              !selectedNode.data.config?.actionType ? (
                <ActionGrid
                  disabled={isGenerating}
                  onSelectAction={(actionType) =>
                    handleUpdateConfig("actionType", actionType)
                  }
                />
              ) : null}

              {selectedNode.data.type === "action" &&
              selectedNode.data.config?.actionType === "Condition" ? (
                <ConditionConfig
                  config={selectedNode.data.config || {}}
                  disabled={isGenerating}
                  onUpdateConfig={handleUpdateConfig}
                />
              ) : null}

              {selectedNode.data.type === "action" &&
              selectedNode.data.config?.actionType &&
              selectedNode.data.config?.actionType !== "Condition" ? (
                <ActionConfig
                  config={selectedNode.data.config || {}}
                  disabled={isGenerating}
                  onUpdateConfig={handleUpdateConfig}
                />
              ) : null}

              {selectedNode.data.type !== "action" ||
              selectedNode.data.config?.actionType ? (
                <>
                  <div className="space-y-2">
                    <Label className="ml-1" htmlFor="label">
                      Label
                    </Label>
                    <Input
                      disabled={isGenerating}
                      id="label"
                      onChange={(e) => handleUpdateLabel(e.target.value)}
                      value={selectedNode.data.label}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="ml-1" htmlFor="description">
                      Description
                    </Label>
                    <Input
                      disabled={isGenerating}
                      id="description"
                      onChange={(e) => handleUpdateDescription(e.target.value)}
                      placeholder="Optional description"
                      value={selectedNode.data.description || ""}
                    />
                  </div>
                </>
              ) : null}
            </div>
            {selectedNode.data.type === "action" && (
              <div className="flex shrink-0 items-center justify-between border-t p-4">
                <Button
                  onClick={() => setShowDeleteNodeAlert(true)}
                  size="sm"
                  variant="ghost"
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete Step
                </Button>
              </div>
            )}
            {selectedNode.data.type === "trigger" && (
              <div className="shrink-0 border-t p-4">
                <Button
                  onClick={() => setShowDeleteNodeAlert(true)}
                  size="icon"
                  variant="ghost"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent className="relative flex-1 overflow-hidden" value="runs">
          <div className="absolute inset-0 flex flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <WorkflowRuns
                isActive={activeTab === "runs"}
                onRefreshRef={refreshRunsRef}
              />
            </div>
            <div className="flex shrink-0 items-center gap-2 border-t p-4">
              <Button
                disabled={isRefreshing}
                onClick={handleRefreshRuns}
                size="sm"
                variant="ghost"
              >
                <RefreshCw
                  className={`mr-2 size-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh Runs
              </Button>
              <Button
                onClick={() => setShowDeleteRunsAlert(true)}
                size="sm"
                variant="ghost"
              >
                <Eraser className="mr-2 size-4" />
                Clear All Runs
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog
        onOpenChange={setShowDeleteRunsAlert}
        open={showDeleteRunsAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Runs</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all workflow runs? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllRuns}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        onOpenChange={setShowDeleteNodeAlert}
        open={showDeleteNodeAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Node</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this node? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export const NodeConfigPanel = () => {
  return (
    <>
      {/* Mobile: Drawer */}
      <div className="md:hidden">
        <Drawer>
          <DrawerTrigger asChild>
            <Panel position="bottom-right">
              <Button className="h-8 w-8" size="icon" variant="ghost">
                <MenuIcon className="size-4" />
              </Button>
            </Panel>
          </DrawerTrigger>
          <DrawerContent>
            <PanelInner />
          </DrawerContent>
        </Drawer>
      </div>

      {/* Desktop: Docked sidebar - now resizable */}
      <div className="bg-background hidden size-full flex-col overflow-hidden md:flex">
        <PanelInner />
      </div>
    </>
  )
}
