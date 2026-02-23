import { auth } from "@/lib/auth/server";
import { getActiveOrgId } from "@/lib/auth/session";
import { db } from "@/db";
import { todo } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session } = await auth.getSession({ query: { disableCookieCache: "true" } } as any);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeOrgId = getActiveOrgId(session);
  if (!activeOrgId) {
    return NextResponse.json({ todos: [] });
  }

  const todos = await db
    .select()
    .from(todo)
    .where(eq(todo.orgId, activeOrgId))
    .orderBy(desc(todo.createdAt));

  return NextResponse.json({ todos });
}

export async function POST(request: Request) {
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

  const body = await request.json();
  const { title } = body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const [newTodo] = await db
    .insert(todo)
    .values({
      title: title.trim(),
      orgId: activeOrgId,
      createdBy: session.user.id,
      createdByName: session.user.name || "",
      createdByImage: session.user.image || "",
    })
    .returning();

  return NextResponse.json({ todo: newTodo }, { status: 201 });
}
