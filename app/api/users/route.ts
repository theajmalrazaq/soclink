export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const list = await db.select().from(users).orderBy(desc(users.id));
    return NextResponse.json({ success: true, users: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role, permissionMatrix } = body;

    let authUserId: string | null | undefined = null;
    try {
      const { data: authData } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role } },
      });
      authUserId = authData?.user?.id;
    } catch {
      // client signup fallback
    }

    const payload = {
      name,
      email,
      role,
      permissions: typeof permissionMatrix === "object" ? JSON.stringify(permissionMatrix) : permissionMatrix,
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
  try {
    const body = await req.json();
    const { id, permissions, role } = body;

    const formattedPermissions = typeof permissions === "object" ? JSON.stringify(permissions) : permissions;

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
  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") || "0", 10);
  try {
    await db.delete(users).where(eq(users.id, id));
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
