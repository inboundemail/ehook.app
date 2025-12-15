"use client";

import { Button } from "@/components/ui/button";
import type { NodeProps } from "@xyflow/react";
import { Plus } from "lucide-react";

type AddNodeData = {
  onClick?: () => void;
};

export function AddNode({ data }: NodeProps & { data?: AddNodeData }) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 rounded-lg border border-border border-dashed bg-background/50 p-8 backdrop-blur-sm">
      <div className="text-center">
        <h1 className="mb-2 font-bold text-3xl">
          Workflow Builder
        </h1>
        <p className="text-muted-foreground text-sm">
          Create automated workflows with triggers and actions
        </p>
      </div>
      <Button className="gap-2 shadow-lg" onClick={data?.onClick} size="default">
        <Plus className="size-4" />
        Add a Step
      </Button>
    </div>
  );
}

