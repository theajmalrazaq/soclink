import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db, events, allLeads, leadsData, members, inductionResponses, contactResponses } from "@/lib/db";
import { authorizeApiRequest } from "@/lib/server/apiAuth";
import { managePermissions } from "@/lib/server/assistantActions";
import { hasPermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

type Candidate = { id: number; label: string; detail: string; currentValue: string | null };

function normalized(value: string): string {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, "").trim();
}

function distance(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row++) {
    const current = [row];
    for (let column = 1; column <= right.length; column++)
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1),
      );
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
}

function score(candidate: Candidate, term: string): number {
  if (String(candidate.id) === term) return 100;
  const label = normalized(candidate.label);
  const detail = normalized(candidate.detail);
  const queries = [term, term.replace(/\b(?:event|competition|lead category|lead member|member|induction|email)\b/gi, "").trim()]
    .map(normalized).filter(Boolean);
  return Math.max(0, ...queries.map((query) => {
    if (label === query) return 95;
    if (detail === query) return 90;
    if (label.includes(query) || detail.includes(query)) return 70;
    if (query.length >= 5 && distance(label, query) <= Math.max(2, Math.floor(query.length / 4))) return 45;
    return 0;
  }));
}

export async function GET(req: NextRequest) {
  const access = await authorizeApiRequest(req);
  if (access instanceof NextResponse) return access;
  const resource = req.nextUrl.searchParams.get("resource") || "";
  const action = req.nextUrl.searchParams.get("action") || "";
  const target = (req.nextUrl.searchParams.get("target") || "").trim().slice(0, 200);
  const field = req.nextUrl.searchParams.get("field") || "";
  const rule = managePermissions[resource]?.[action];
  if (!rule || !hasPermission(access.account?.permissions || access.account?.role, rule[0], rule[1]))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!target) return NextResponse.json({ error: "Name or ID is required." }, { status: 400 });

  try {
    let candidates: Candidate[] = [];
    if (resource === "event" || resource === "competition") {
      const rows = await db.select().from(events).orderBy(desc(events.id)).limit(500);
      candidates = rows.filter((row) => Boolean(row.is_competition) === (resource === "competition"))
        .map((row) => ({ id: row.id, label: row.title, detail: row.date || "", currentValue: String((row as Record<string, unknown>)[field] ?? "") }));
    } else if (resource === "lead") {
      const rows = await db.select().from(allLeads).orderBy(desc(allLeads.id)).limit(500);
      candidates = rows.map((row) => ({ id: row.id, label: row.title || `#${row.id}`, detail: "Lead category", currentValue: row.title || "" }));
    } else if (resource === "lead_member") {
      const rows = await db.select().from(leadsData).orderBy(desc(leadsData.id)).limit(500);
      candidates = rows.map((row) => ({ id: row.id, label: row.name || row.email || `#${row.id}`, detail: row.email || `Category #${row.lead_id}`, currentValue: String((row as Record<string, unknown>)[field] ?? "") }));
    } else if (resource === "member") {
      const rows = await db.select().from(members).orderBy(desc(members.id)).limit(500);
      candidates = rows.map((row) => ({ id: row.id, label: row.name, detail: row.email || row.roll_no || "", currentValue: String(row.status) }));
    } else if (resource === "induction") {
      const rows = await db.select().from(inductionResponses).orderBy(desc(inductionResponses.id)).limit(500);
      candidates = rows.map((row) => ({ id: row.id, label: row.name || row.email || `#${row.id}`, detail: row.email || row.roll_no || "", currentValue: String(row.status) }));
    } else if (resource === "email") {
      const rows = await db.select().from(contactResponses).orderBy(desc(contactResponses.id)).limit(500);
      candidates = rows.map((row) => ({ id: row.id, label: row.subject || row.email || `#${row.id}`, detail: row.email || row.name || "", currentValue: String(row.status) }));
    }
    const matches = candidates.map((candidate) => ({ ...candidate, score: score(candidate, target) }))
      .filter((candidate) => candidate.score > 0)
      .sort((a, b) => b.score - a.score || b.id - a.id)
      .slice(0, 8);
    if (!matches.length)
      return NextResponse.json({ error: `No matching ${resource.replace("_", " ")} found. Try its exact name or ID.` }, { status: 404 });
    return NextResponse.json({ candidates: matches });
  } catch (error) {
    console.error("Assistant target lookup failed:", error);
    return NextResponse.json({ error: "Could not look up that record." }, { status: 500 });
  }
}
