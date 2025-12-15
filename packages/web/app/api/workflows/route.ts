import { db } from "@/db";
import { workflows } from "@/db/schema";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const allWorkflows = await db
      .select()
      .from(workflows)
      .orderBy(desc(workflows.updatedAt));

    return NextResponse.json(allWorkflows);
  } catch (error) {
    console.error("Failed to fetch workflows:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflows" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, nodes, edges } = body;

    const [workflow] = await db
      .insert(workflows)
      .values({
        name: name || "Untitled Workflow",
        description,
        nodes: nodes || [],
        edges: edges || [],
        status: "draft",
      })
      .returning();

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    console.error("Failed to create workflow:", error);
    return NextResponse.json(
      { error: "Failed to create workflow" },
      { status: 500 }
    );
  }
}

