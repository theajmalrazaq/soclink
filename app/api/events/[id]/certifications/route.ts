export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db, certification } from "@/lib/db";
import { and, eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = parseInt(params.id, 10);
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") || "";

  try {
    const res = await db
      .select()
      .from(certification)
      .where(and(eq(certification.event_id, eventId), eq(certification.name, name)))
      .limit(1);
    const cert = res[0] || null;
    return NextResponse.json({ success: true, certificate: cert });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = parseInt(params.id, 10);
  try {
    const body = await req.json();
    const res = await db.insert(certification).values({ ...body, event_id: eventId }).returning();
    const cert = res[0];
    return NextResponse.json({ success: true, certificate: cert });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
