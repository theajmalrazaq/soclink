export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db, appSettings } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const res = await db.select().from(appSettings).limit(1);
    const settings = res[0] || null;

    return NextResponse.json({
      success: true,
      settings: settings || {
        id: null,
        induction: true,
        upcomingevent: false,
        upcomingeventstatus: true,
      },
    });
  } catch (err: any) {
    console.error("GET /api/settings error:", err);
    return NextResponse.json(
      {
        success: false,
        settings: {
          id: null,
          induction: true,
          upcomingevent: false,
          upcomingeventstatus: true,
        },
      },
      { status: 200 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const patch = await req.json();
    let saved: any = null;

    const existing = await db.select().from(appSettings).limit(1);
    if (existing && existing.length > 0) {
      const res = await db
        .update(appSettings)
        .set(patch)
        .where(eq(appSettings.id, existing[0].id))
        .returning();
      saved = res[0];
    } else {
      const res = await db.insert(appSettings).values(patch).returning();
      saved = res[0];
    }

    return NextResponse.json({ success: true, settings: saved });
  } catch (err: any) {
    console.error("POST /api/settings error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
