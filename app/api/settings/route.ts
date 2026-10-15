import { authorizeApiRequest } from "@/lib/server/apiAuth";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db, appSettings, app_settings } from "@/lib/db";
import { eq } from "drizzle-orm";

const CONFIG_KEYS = new Set(["email_template_config", "smtp_delivery_config"]);

export async function GET(req: NextRequest) {
  const access = await authorizeApiRequest(req);
  if (access instanceof NextResponse) return access;
  try {
    const key = req.nextUrl.searchParams.get("key");
    if (key) {
      if (!CONFIG_KEYS.has(key)) return NextResponse.json({ error: "Unknown settings key" }, { status: 400 });
      const rows = await db.select().from(app_settings).where(eq(app_settings.key, key)).limit(1);
      return NextResponse.json({ success: true, settings: rows[0] || null });
    }
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
  const access = await authorizeApiRequest(req);
  if (access instanceof NextResponse) return access;
  try {
    const patch = await req.json();
    const key = req.nextUrl.searchParams.get("key");
    if (key) {
      if (!CONFIG_KEYS.has(key) || patch?.key !== key || !patch?.value || typeof patch.value !== "object") {
        return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
      }
      if (key === "smtp_delivery_config") {
        const host = String(patch.value.host || "smtp.gmail.com").trim().toLowerCase();
        const allowedHosts = new Set(["smtp.gmail.com", process.env.SMTP_HOST?.toLowerCase(),
          ...(process.env.SMTP_ALLOWED_HOSTS || "").toLowerCase().split(",").map((item) => item.trim())]);
        if (!allowedHosts.has(host) || typeof patch.value.user !== "string" || typeof patch.value.pass !== "string") {
          return NextResponse.json({ error: "Invalid SMTP configuration" }, { status: 400 });
        }
      }
      const rows = await db.insert(app_settings).values({ key, value: patch.value, updatedAt: new Date() })
        .onConflictDoUpdate({ target: app_settings.key, set: { value: patch.value, updatedAt: new Date() } }).returning();
      return NextResponse.json({ success: true, settings: rows[0] });
    }
    const allowedPatch: Partial<typeof appSettings.$inferInsert> = {};
    for (const field of ["induction", "upcomingevent", "upcomingeventstatus"] as const) {
      if (typeof patch?.[field] === "boolean") allowedPatch[field] = patch[field];
    }
    if (!Object.keys(allowedPatch).length) return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
    let saved: any = null;

    const existing = await db.select().from(appSettings).limit(1);
    if (existing && existing.length > 0) {
      const res = await db
        .update(appSettings)
        .set(allowedPatch)
        .where(eq(appSettings.id, existing[0].id))
        .returning();
      saved = res[0];
    } else {
      const res = await db.insert(appSettings).values(allowedPatch).returning();
      saved = res[0];
    }

    return NextResponse.json({ success: true, settings: saved });
  } catch (err: any) {
    console.error("POST /api/settings error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
