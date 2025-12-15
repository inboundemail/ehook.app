"use client";

import {
  Node,
  NodeDescription,
  NodeTitle,
} from "@/components/ai-elements/node";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "@/lib/workflow-store";
import type { NodeProps } from "@xyflow/react";
import {
  Check,
  Code,
  Database,
  GitBranch,
  Globe,
  Mail,
  MessageSquare,
  XCircle,
  Zap,
} from "lucide-react";
import { memo } from "react";

// Status badge component
const StatusBadge = ({
  status,
}: {
  status?: "idle" | "running" | "success" | "error";
}) => {
  // Don't show badge for idle or running (running has BorderBeam animation)
  if (!status || status === "idle" || status === "running") {
    return null;
  }

  return (
    <div
      className={cn(
        "absolute top-2 right-2 rounded-full p-1",
        status === "success" && "bg-green-500/50",
        status === "error" && "bg-red-500/50"
      )}
    >
      {status === "success" && (
        <Check className="size-3.5 text-white" strokeWidth={2.5} />
      )}
      {status === "error" && (
        <XCircle className="size-3.5 text-white" strokeWidth={2.5} />
      )}
    </div>
  );
};

// Helper to get provider logo for action type
const getProviderLogo = (actionType: string) => {
  switch (actionType) {
    case "Send Email":
      return <Mail className="size-12 text-purple-400" strokeWidth={1.5} />;
    case "Send Slack Message":
      return <MessageSquare className="size-12 text-green-400" strokeWidth={1.5} />;
    case "HTTP Request":
      return <Globe className="size-12 text-amber-300" strokeWidth={1.5} />;
    case "Database Query":
      return <Database className="size-12 text-blue-300" strokeWidth={1.5} />;
    case "Execute Code":
      return <Code className="size-12 text-green-300" strokeWidth={1.5} />;
    case "Condition":
      return <GitBranch className="size-12 text-pink-300" strokeWidth={1.5} />;
    default:
      return <Zap className="size-12 text-amber-300" strokeWidth={1.5} />;
  }
};

// Helper to get integration name from action type
const getIntegrationFromActionType = (actionType: string): string => {
  const integrationMap: Record<string, string> = {
    "Send Email": "Inbound",
    "Send Slack Message": "Slack",
    "HTTP Request": "HTTP",
    "Database Query": "Database",
    "Execute Code": "Code",
    "Condition": "Logic",
  };
  return integrationMap[actionType] || "Action";
};

type ActionNodeProps = NodeProps & {
  data?: WorkflowNodeData;
  id: string;
};

export const ActionNode = memo(({ data, selected }: ActionNodeProps) => {
  if (!data) {
    return null;
  }

  const actionType = (data.config?.actionType as string) || "";
  const status = data.status;

  // Handle empty action type (new node without selected action)
  if (!actionType) {
    return (
      <Node
        className={cn(
          "flex h-48 w-48 flex-col items-center justify-center shadow-none transition-all duration-150 ease-out",
          selected && "border-primary"
        )}
        handles={{ target: true, source: true }}
        status={status}
      >
        <div className="flex flex-col items-center justify-center gap-3 p-6">
          <Zap className="size-12 text-muted-foreground" strokeWidth={1.5} />
          <div className="flex flex-col items-center gap-1 text-center">
            <NodeTitle className="text-base">
              {data.label || "Action"}
            </NodeTitle>
            <NodeDescription className="text-xs">
              Select an action
            </NodeDescription>
          </div>
        </div>
      </Node>
    );
  }

  const displayTitle = data.label || actionType;
  const displayDescription =
    data.description || getIntegrationFromActionType(actionType);

  return (
    <Node
      className={cn(
        "relative flex h-48 w-48 flex-col items-center justify-center shadow-none transition-all duration-150 ease-out",
        selected && "border-primary"
      )}
      handles={{ target: true, source: true }}
      status={status}
    >
      {/* Status indicator badge in top right */}
      <StatusBadge status={status} />

      <div className="flex flex-col items-center justify-center gap-3 p-6">
        {getProviderLogo(actionType)}
        <div className="flex flex-col items-center gap-1 text-center">
          <NodeTitle className="text-base">{displayTitle}</NodeTitle>
          {displayDescription && (
            <NodeDescription className="text-xs">
              {displayDescription}
            </NodeDescription>
          )}
        </div>
      </div>
    </Node>
  );
});

ActionNode.displayName = "ActionNode";

