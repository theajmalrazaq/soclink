export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db, events, eventsResponses, competitionsResponses } from "@/lib/db";
import { desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "0", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const search = (searchParams.get("search") || "").trim().toLowerCase();
  const all = searchParams.get("all") === "true";

  try {
    let allEventsList = await db.select().from(events).orderBy(desc(events.id));
    let total = allEventsList.length;

    if (search) {
      allEventsList = allEventsList.filter(
        (ev) =>
          ev.title?.toLowerCase().includes(search) ||
          ev.speaker?.toLowerCase().includes(search) ||
          ev.location?.toLowerCase().includes(search),
      );
      total = allEventsList.length;
    }

    const pagedEvents = all ? allEventsList : allEventsList.slice(page * limit, (page + 1) * limit);

    // Enrich with registrations count
    const [evResp, compResp] = await Promise.all([
      db.select({ event_id: eventsResponses.event_id }).from(eventsResponses),
      db.select({ event_id: competitionsResponses.event_id }).from(competitionsResponses),
    ]);

    const enriched = pagedEvents.map((event) => {
      const count = event.is_competition
        ? compResp.filter((r) => r.event_id === event.id).length
        : evResp.filter((r) => r.event_id === event.id).length;
      return { ...event, responseCount: count };
    });

    return NextResponse.json({
      success: true,
      events: enriched,
      total,
    });
  } catch (err: any) {
    console.error("GET /api/events error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await db.insert(events).values(body).returning();
    const created = res[0];

    return NextResponse.json({ success: true, event: created });
  } catch (err: any) {
    console.error("POST /api/events error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
