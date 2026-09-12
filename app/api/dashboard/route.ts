export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db, events, eventsResponses, competitionsResponses, inductionResponses, members } from "@/lib/db";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const [fetchEvents, evResponses, compResponses, inductions, membersList] = await Promise.all([
      db.select().from(events).orderBy(desc(events.id)).limit(10),
      db.select().from(eventsResponses),
      db.select().from(competitionsResponses),
      db.select().from(inductionResponses).orderBy(desc(inductionResponses.id)),
      db.select().from(members).orderBy(desc(members.id)),
    ]);

    const responsesWithCount = (fetchEvents || []).map((ev: any) => {
      const count = ev.is_competition
        ? (compResponses || []).filter((r: any) => r.event_id === ev.id).length
        : (evResponses || []).filter((r: any) => r.event_id === ev.id).length;

      return {
        ...ev,
        responseCount: count,
      };
    });

    const inductionAccepted = (inductions || []).filter((r: any) => r.status === true).length;
    const membersActive = (membersList || []).filter((m: any) => m.active || m.status).length;

    return NextResponse.json({
      success: true,
      events: responsesWithCount,
      rawEventResponses: evResponses,
      rawCompResponses: compResponses,
      inductionResponses: inductions,
      inductionAccepted,
      membersResponses: membersList,
      membersActive,
      totalRegistrations: (evResponses?.length || 0) + (compResponses?.length || 0),
    });
  } catch (err: any) {
    console.error("Dashboard API error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
