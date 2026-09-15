export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db, allLeads, leadsData } from "@/lib/db";
import { desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "0", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const search = (searchParams.get("search") || "").trim().toLowerCase();

  try {
    let leadsList = await db.select().from(allLeads).orderBy(desc(allLeads.id));

    if (search) {
      leadsList = leadsList.filter((l) => l.title?.toLowerCase().includes(search));
    }

    const total = leadsList.length;
    const paged = leadsList.slice(page * limit, (page + 1) * limit);

    // Enrich with members count
    const allMembersData = await db.select({ lead_id: leadsData.lead_id }).from(leadsData);

    const enriched = paged.map((lead) => {
      const memberCount = allMembersData.filter(
        (m) => String(m.lead_id) === String(lead.id),
      ).length;
      return { ...lead, memberCount };
    });

    return NextResponse.json({
      success: true,
      leads: enriched,
      total,
    });
  } catch (err: any) {
    console.error("GET /api/leads error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title } = body;
    const res = await db.insert(allLeads).values({ title }).returning();
    const created = res[0];
    return NextResponse.json({ success: true, lead: created });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title } = body;
    const res = await db.update(allLeads).set({ title }).where(eq(allLeads.id, id)).returning();
    const updated = res[0];
    return NextResponse.json({ success: true, lead: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") || "0", 10);
  try {
    await db.delete(allLeads).where(eq(allLeads.id, id));
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
