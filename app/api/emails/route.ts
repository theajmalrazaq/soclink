export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db, contactResponses } from "@/lib/db";
import { desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "0", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const status = searchParams.get("status") || "all";
  const search = (searchParams.get("search") || "").trim().toLowerCase();

  try {
    let list = await db.select().from(contactResponses).orderBy(desc(contactResponses.id));

    if (search) {
      list = list.filter(
        (e) =>
          e.name?.toLowerCase().includes(search) ||
          e.email?.toLowerCase().includes(search) ||
          e.subject?.toLowerCase().includes(search)
      );
    }

    if (status === "responded") {
      list = list.filter((e) => e.status === true);
    } else if (status === "on_hold") {
      list = list.filter((e) => e.status === false);
    } else if (status === "waiting") {
      list = list.filter((e) => e.status === null || e.status === undefined);
    }

    const total = list.length;
    const paged = list.slice(page * limit, (page + 1) * limit);

    return NextResponse.json({
      success: true,
      data: paged,
      total,
    });
  } catch (err: any) {
    console.error("GET /api/emails error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;
    const res = await db.update(contactResponses).set({ status }).where(eq(contactResponses.id, id)).returning();
    const updated = res[0];
    return NextResponse.json({ success: true, email: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") || "0", 10);
  try {
    await db.delete(contactResponses).where(eq(contactResponses.id, id));
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
