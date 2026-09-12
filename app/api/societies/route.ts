export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db, societies } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const list = await db.select().from(societies).limit(1);
    const society = list[0] || null;
    return NextResponse.json({ success: true, society });
  } catch (err: any) {
    console.error("GET /api/societies error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    let saved: any = null;
    if (id) {
      const res = await db
        .update(societies)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(societies.id, String(id)))
        .returning();
      saved = res[0];
    } else {
      const existing = await db.select().from(societies).limit(1);
      if (existing.length > 0) {
        const res = await db
          .update(societies)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(societies.id, existing[0].id))
          .returning();
        saved = res[0];
      } else {
        const res = await db.insert(societies).values(data).returning();
        saved = res[0];
      }
    }

    return NextResponse.json({ success: true, society: saved });
  } catch (err: any) {
    console.error("POST /api/societies error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
