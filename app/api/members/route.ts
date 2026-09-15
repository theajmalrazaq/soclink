export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db, members } from "@/lib/db";
import { desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "0", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const status = searchParams.get("status") || "all";
  const team = searchParams.get("team") || "all";
  const search = (searchParams.get("search") || "").trim().toLowerCase();
  const isStats = searchParams.get("stats") === "true";

  try {
    let list = await db.select().from(members).orderBy(desc(members.id));

    if (isStats) {
      const activeCount = list.filter((m) => m.status === true).length;
      return NextResponse.json({
        success: true,
        stats: {
          total: list.length,
          active: activeCount,
          inactive: list.length - activeCount,
        },
      });
    }

    if (search) {
      list = list.filter(
        (m) =>
          m.name?.toLowerCase().includes(search) ||
          m.roll_no?.toLowerCase().includes(search) ||
          m.email?.toLowerCase().includes(search),
      );
    }

    if (status === "active") {
      list = list.filter((m) => m.status === true);
    } else if (status === "inactive") {
      list = list.filter((m) => m.status === false);
    }

    if (team !== "all") {
      list = list.filter((m) => m.team === team);
    }

    const total = list.length;
    const paged = list.slice(page * limit, (page + 1) * limit);

    return NextResponse.json({
      success: true,
      data: paged,
      total,
    });
  } catch (err: any) {
    console.error("GET /api/members error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await db.insert(members).values(body).returning();
    const created = res[0];
    return NextResponse.json({ success: true, member: created });
  } catch (err: any) {
    console.error("POST /api/members error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    const res = await db.update(members).set(updates).where(eq(members.id, id)).returning();
    const updated = res[0];
    return NextResponse.json({ success: true, member: updated });
  } catch (err: any) {
    console.error("PATCH /api/members error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") || "0", 10);
  try {
    await db.delete(members).where(eq(members.id, id));
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error("DELETE /api/members error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
