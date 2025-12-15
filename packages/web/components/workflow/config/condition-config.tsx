"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ConditionConfigProps = {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
};

export function ConditionConfig({
  config,
  onUpdateConfig,
  disabled,
}: ConditionConfigProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="condition">Condition Expression</Label>
      <Input
        disabled={disabled}
        id="condition"
        onChange={(e) => onUpdateConfig("condition", e.target.value)}
        placeholder="e.g., 5 > 3, status === 200, {{PreviousNode.value}} > 100"
        value={(config?.condition as string) || ""}
      />
      <p className="text-muted-foreground text-xs">
        Enter a JavaScript expression that evaluates to true or false. You can
        use @ to reference previous node outputs.
      </p>
    </div>
  );
}
