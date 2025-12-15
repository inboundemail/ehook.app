import { Background, ReactFlow, type ReactFlowProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { ReactNode } from "react";

type CanvasProps = ReactFlowProps & {
  children?: ReactNode;
};

export const Canvas = ({ children, ...props }: CanvasProps) => {
  return (
    <ReactFlow
      deleteKeyCode={["Backspace", "Delete"]}
      fitView
      panActivationKeyCode={null}
      selectionOnDrag={false}
      zoomOnDoubleClick={false}
      zoomOnPinch
      {...props}
    >
      <Background 
        bgColor="var(--sidebar)" 
        color="var(--border)" 
        gap={24} 
        size={2}
      />
      {children}
    </ReactFlow>
  );
};

