import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { applicationNotes } from "../../../../../../drizzle/schema";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/applications/[id]/notes">
) {
  const { id } = await ctx.params;
  const applicationId = Number(id);
  if (!Number.isInteger(applicationId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const notes = await db
    .select()
    .from(applicationNotes)
    .where(eq(applicationNotes.applicationId, applicationId))
    .orderBy(desc(applicationNotes.createdAt));

  return NextResponse.json({ notes });
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/applications/[id]/notes">
) {
  const { id } = await ctx.params;
  const applicationId = Number(id);
  if (!Number.isInteger(applicationId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const body = await request.json();
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const [note] = await db
    .insert(applicationNotes)
    .values({ applicationId, content })
    .returning();

  return NextResponse.json({ note }, { status: 201 });
}
