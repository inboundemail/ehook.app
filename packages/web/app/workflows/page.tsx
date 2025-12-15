import { db } from "@/db"
import { workflows } from "@/db/schema"
import { desc } from "drizzle-orm"
import { redirect } from "next/navigation"

export default async function WorkflowsPage() {
  const allWorkflows = await db
    .select()
    .from(workflows)
    .orderBy(desc(workflows.updatedAt))

  // If there are workflows, redirect to the most recently updated one
  if (allWorkflows.length > 0) {
    redirect(`/workflows/${allWorkflows[0].id}`)
  }

  // Only show empty state if there are no workflows
  return (
    <div className="flex-1 p-6">
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-muted-foreground">No workflows yet</p>
      </div>
    </div>
  )
}
