export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db, inductionResponses } from "@/lib/db";
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
    let list = await db.select().from(inductionResponses).orderBy(desc(inductionResponses.id));

    if (isStats) {
      const selected = list.filter((r) => r.status === true).length;
      const rejected = list.filter((r) => r.status === false).length;
      const waiting = list.filter((r) => r.status === null || r.status === undefined).length;
      return NextResponse.json({
        success: true,
        stats: {
          total: list.length,
          selected,
          rejected,
          waiting,
        },
      });
    }

    if (search) {
      list = list.filter(
        (r) =>
          r.name?.toLowerCase().includes(search) ||
          r.roll_no?.toLowerCase().includes(search) ||
          r.email?.toLowerCase().includes(search)
      );
    }

    if (status === "selected") {
      list = list.filter((r) => r.status === true);
    } else if (status === "rejected") {
      list = list.filter((r) => r.status === false);
    } else if (status === "waiting") {
      list = list.filter((r) => r.status === null || r.status === undefined);
    }

    if (team !== "all") {
      list = list.filter((r) => r.team === team);
    }

    const total = list.length;
    const paged = list.slice(page * limit, (page + 1) * limit);

    return NextResponse.json({
      success: true,
      data: paged,
      total,
    });
  } catch (err: any) {
    console.error("GET /api/inductions error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await db.insert(inductionResponses).values(body).returning();
    const created = res[0];
    return NextResponse.json({ success: true, induction: created });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;
    const res = await db.update(inductionResponses).set({ status }).where(eq(inductionResponses.id, id)).returning();
    const updated = res[0];
    return NextResponse.json({ success: true, induction: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") || "0", 10);
  try {
    await db.delete(inductionResponses).where(eq(inductionResponses.id, id));
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
