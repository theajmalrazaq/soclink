export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db, leadsData } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const leadId = parseInt(params.id, 10);
  try {
    const list = await db.select().from(leadsData).where(eq(leadsData.lead_id, leadId));
    return NextResponse.json({ success: true, members: list });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const leadId = parseInt(params.id, 10);
  try {
    const body = await req.json();
    const res = await db
      .insert(leadsData)
      .values({ ...body, lead_id: leadId })
      .returning();
    const created = res[0];
    return NextResponse.json({ success: true, member: created });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    const res = await db.update(leadsData).set(updates).where(eq(leadsData.id, id)).returning();
    const updated = res[0];
    return NextResponse.json({ success: true, member: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const memberId = parseInt(searchParams.get("memberId") || "0", 10);
  try {
    await db.delete(leadsData).where(eq(leadsData.id, memberId));
    return NextResponse.json({ success: true, memberId });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
