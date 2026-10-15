import { authorizeApiRequest } from "@/lib/server/apiAuth";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { desc, eq, sql } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_PERMISSIONS, NO_PERMISSIONS, hasPermission } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const access = await authorizeApiRequest(req);
  if (access instanceof NextResponse) return access;
  try {
    const list = await db.select().from(users).orderBy(desc(users.id));
    return NextResponse.json({ success: true, users: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const access = await authorizeApiRequest(req);
  if (access instanceof NextResponse) return access;
  try {
    const body = await req.json();
    const { name, email, password, role, permissionMatrix } = body;
    if (typeof email !== "string" || !email.trim() || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    if (access.bootstrap) {
      if (email.toLowerCase() !== access.user.email?.toLowerCase()) {
        return NextResponse.json({ error: "Email does not match authenticated user" }, { status: 403 });
      }
      const created = await db.transaction(async (tx) => {
        await tx.execute(sql`select pg_advisory_xact_lock(702371204)`);
        const existing = await tx.select({ id: users.id }).from(users).limit(1);
        if (existing.length) return null;
        const rows = await tx.insert(users).values({
          name: name.trim(),
          email: access.user.email!,
          user_id: access.user.id,
          role: "admin",
          permissions: JSON.stringify(DEFAULT_PERMISSIONS),
          status: true,
        }).returning();
        return rows[0];
      });
      if (!created) return NextResponse.json({ error: "Setup has already been completed" }, { status: 409 });
      return NextResponse.json({ success: true, user: created });
    }

    let authUserId: string | null | undefined = null;
    if (typeof password === "string" && password) {
      const auth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: authData, error } = await auth.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) throw error;
      authUserId = authData?.user?.id;
    }

    const canAssignRoles = hasPermission(access.account!.permissions || access.account!.role, "users", "editRole");
    const payload = {
      name,
      email,
      role: canAssignRoles ? role : "member",
      permissions:
        canAssignRoles
          ? (typeof permissionMatrix === "object" ? JSON.stringify(permissionMatrix) : permissionMatrix)
          : JSON.stringify(NO_PERMISSIONS),
      user_id: authUserId,
    };

    const res = await db.insert(users).values(payload).returning();
    const created = res[0];

    return NextResponse.json({ success: true, user: created });
  } catch (err: any) {
    console.error("POST /api/users error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const access = await authorizeApiRequest(req);
  if (access instanceof NextResponse) return access;
  try {
    const body = await req.json();
    const { id, permissions, role } = body;

    const formattedPermissions =
      typeof permissions === "object" ? JSON.stringify(permissions) : permissions;

    const res = await db
      .update(users)
      .set({ permissions: formattedPermissions, role })
      .where(eq(users.id, id))
      .returning();
    const updated = res[0];

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const access = await authorizeApiRequest(req);
  if (access instanceof NextResponse) return access;
  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") || "0", 10);
  try {
    await db.delete(users).where(eq(users.id, id));
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
