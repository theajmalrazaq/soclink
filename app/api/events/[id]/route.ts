export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db, events } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  try {
    const res = await db.select().from(events).where(eq(events.id, id));
    const event = res[0] || null;
    return NextResponse.json({ success: true, event });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  try {
    const body = await req.json();
    const res = await db.update(events).set(body).where(eq(events.id, id)).returning();
    const updated = res[0];
    return NextResponse.json({ success: true, event: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  try {
    await db.delete(events).where(eq(events.id, id));
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
