import { relations } from "drizzle-orm"
import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { v4 as uuidv4 } from "uuid"

// Workflows table
export const workflows = pgTable("workflows", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  name: text("name").notNull(),
  description: text("description"),
  // Webhook ID for triggering this workflow via /api/webhook/[uuid]
  webhookId: text("webhook_id")
    .notNull()
    .$defaultFn(() => uuidv4()),
  // QStash schedule ID for scheduled workflows
  scheduleId: text("schedule_id"),
  // Store React Flow nodes as JSON
  nodes: jsonb("nodes").notNull().$type<unknown[]>().default([]),
  // Store React Flow edges as JSON
  edges: jsonb("edges").notNull().$type<unknown[]>().default([]),
  // Workflow status
  status: text("status")
    .notNull()
    .$type<"draft" | "active" | "paused">()
    .default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// Workflow executions table to track workflow runs
export const workflowExecutions = pgTable("workflow_executions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  workflowId: text("workflow_id")
    .notNull()
    .references(() => workflows.id, { onDelete: "cascade" }),
  status: text("status")
    .notNull()
    .$type<"pending" | "running" | "success" | "error" | "cancelled">()
    .default("pending"),
  // Input data that triggered the workflow
  input: jsonb("input").$type<Record<string, unknown>>(),
  // Output data from the workflow execution
  output: jsonb("output").$type<unknown>(),
  // Error message if execution failed
  error: text("error"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  // Duration in milliseconds
  durationMs: text("duration_ms"),
})

// Workflow execution logs to track individual node executions
export const workflowExecutionLogs = pgTable("workflow_execution_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  executionId: text("execution_id")
    .notNull()
    .references(() => workflowExecutions.id, { onDelete: "cascade" }),
  nodeId: text("node_id").notNull(),
  nodeName: text("node_name").notNull(),
  nodeType: text("node_type").notNull(),
  status: text("status")
    .notNull()
    .$type<"pending" | "running" | "success" | "error">()
    .default("pending"),
  // Input data passed to the node
  input: jsonb("input").$type<unknown>(),
  // Output data from the node
  output: jsonb("output").$type<unknown>(),
  // Error message if node execution failed
  error: text("error"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  // Duration in milliseconds
  durationMs: text("duration_ms"),
})

// Relations
export const workflowsRelations = relations(workflows, ({ many }) => ({
  executions: many(workflowExecutions),
}))

export const workflowExecutionsRelations = relations(
  workflowExecutions,
  ({ one, many }) => ({
    workflow: one(workflows, {
      fields: [workflowExecutions.workflowId],
      references: [workflows.id],
    }),
    logs: many(workflowExecutionLogs),
  }),
)

export const workflowExecutionLogsRelations = relations(
  workflowExecutionLogs,
  ({ one }) => ({
    execution: one(workflowExecutions, {
      fields: [workflowExecutionLogs.executionId],
      references: [workflowExecutions.id],
    }),
  }),
)

// Type exports
export type Workflow = typeof workflows.$inferSelect
export type NewWorkflow = typeof workflows.$inferInsert
export type WorkflowExecution = typeof workflowExecutions.$inferSelect
export type NewWorkflowExecution = typeof workflowExecutions.$inferInsert
export type WorkflowExecutionLog = typeof workflowExecutionLogs.$inferSelect
export type NewWorkflowExecutionLog = typeof workflowExecutionLogs.$inferInsert
