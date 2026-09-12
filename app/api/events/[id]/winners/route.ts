export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db, competitionWinners } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = parseInt(params.id, 10);
  try {
    const winners = await db.select().from(competitionWinners).where(eq(competitionWinners.event_id, eventId));
    return NextResponse.json({ success: true, winners });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = parseInt(params.id, 10);
  try {
    const body = await req.json();
    const res = await db.insert(competitionWinners).values({ ...body, event_id: eventId }).returning();
    const created = res[0];
    return NextResponse.json({ success: true, winner: created });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const winnerId = parseInt(searchParams.get("winnerId") || "0", 10);
  try {
    await db.delete(competitionWinners).where(eq(competitionWinners.id, winnerId));
    return NextResponse.json({ success: true, winnerId });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
