export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db, eventsResponses, competitionsResponses } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = parseInt(params.id, 10);
  const { searchParams } = new URL(req.url);
  const isCompetition = searchParams.get("isCompetition") === "true";

  try {
    const table = isCompetition ? competitionsResponses : eventsResponses;
    const list = await db.select().from(table).where(eq(table.event_id, eventId));
    return NextResponse.json({ success: true, registrations: list });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { registrationId, attended, isCompetition } = body;
    const drizzleTable = isCompetition ? competitionsResponses : eventsResponses;

    await db.update(drizzleTable).set({ attended }).where(eq(drizzleTable.id, registrationId));
    return NextResponse.json({ success: true, registrationId, attended });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const registrationId = parseInt(searchParams.get("registrationId") || "0", 10);
  const isCompetition = searchParams.get("isCompetition") === "true";

  try {
    const drizzleTable = isCompetition ? competitionsResponses : eventsResponses;
    await db.delete(drizzleTable).where(eq(drizzleTable.id, registrationId));
    return NextResponse.json({ success: true, registrationId });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
