import { auth } from "@/lib/auth/server";
import { getActiveOrgId } from "@/lib/auth/session";
import { db } from "@/db";
import { todo } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session } = await auth.getSession({ query: { disableCookieCache: "true" } } as any);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeOrgId = getActiveOrgId(session);
  if (!activeOrgId) {
    return NextResponse.json(
      { error: "No active organization" },
      { status: 400 }
    );
  }

  const { id } = await params;
  const body = await request.json();

  const [updated] = await db
    .update(todo)
    .set({
      completed: body.completed,
      updatedAt: new Date(),
    })
    .where(and(eq(todo.id, id), eq(todo.orgId, activeOrgId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ todo: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session } = await auth.getSession({ query: { disableCookieCache: "true" } } as any);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeOrgId = getActiveOrgId(session);
  if (!activeOrgId) {
    return NextResponse.json(
      { error: "No active organization" },
      { status: 400 }
    );
  }

  const { id } = await params;

  const [deleted] = await db
    .delete(todo)
    .where(and(eq(todo.id, id), eq(todo.orgId, activeOrgId)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
