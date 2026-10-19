import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, events, allLeads, leadsData, members, inductionResponses, contactResponses } from "@/lib/db";
import { authorizeApiRequest } from "@/lib/server/apiAuth";
import { managePermissions, validManageChange } from "@/lib/server/assistantActions";
import { hasPermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const actionSchema = z.object({
  resource: z.enum(["event", "competition", "lead", "lead_member", "member", "induction", "email"]),
  action: z.enum(["update", "delete", "status"]),
  id: z.number().int().positive(),
  expectedLabel: z.string().min(1).max(300),
  field: z.string().max(50),
  value: z.string().max(5000),
});

function label(row: { id: number; name?: string | null; title?: string | null; subject?: string | null; email?: string | null }): string {
  return row.title || row.subject || row.name || row.email || `#${row.id}`;
}

export async function POST(req: NextRequest) {
  const access = await authorizeApiRequest(req);
  if (access instanceof NextResponse) return access;
  const parsed = actionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  const { resource, action, id, expectedLabel, field, value } = parsed.data;
  const rule = managePermissions[resource]?.[action];
  if (!rule || !hasPermission(access.account?.permissions || access.account?.role, rule[0], rule[1]))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!validManageChange(resource, action, field, value))
    return NextResponse.json({ error: "That change is not supported." }, { status: 400 });

  try {
    const result = await db.transaction(async (tx) => {
      if (resource === "event" || resource === "competition") {
        const [record] = await tx.select().from(events).where(eq(events.id, id)).for("update");
        if (!record || Boolean(record.is_competition) !== (resource === "competition") || label(record) !== expectedLabel) return false;
        if (action === "delete") await tx.delete(events).where(eq(events.id, id));
        else await tx.update(events).set({ [field]: value || null }).where(eq(events.id, id));
      } else if (resource === "lead") {
        const [record] = await tx.select().from(allLeads).where(eq(allLeads.id, id)).for("update");
        if (!record || label(record) !== expectedLabel) return false;
        if (action === "delete") await tx.delete(allLeads).where(eq(allLeads.id, id));
        else await tx.update(allLeads).set({ title: value.trim() }).where(eq(allLeads.id, id));
      } else if (resource === "lead_member") {
        const [record] = await tx.select().from(leadsData).where(eq(leadsData.id, id)).for("update");
        if (!record || label(record) !== expectedLabel) return false;
        if (action === "delete") await tx.delete(leadsData).where(eq(leadsData.id, id));
        else if (action === "status") await tx.update(leadsData).set({ status: value === "true" }).where(eq(leadsData.id, id));
        else await tx.update(leadsData).set({ [field]: value || null }).where(eq(leadsData.id, id));
      } else if (resource === "member") {
        const [record] = await tx.select().from(members).where(eq(members.id, id)).for("update");
        if (!record || label(record) !== expectedLabel) return false;
        if (action === "delete") await tx.delete(members).where(eq(members.id, id));
        else await tx.update(members).set({ status: value === "true" }).where(eq(members.id, id));
      } else if (resource === "induction") {
        const [record] = await tx.select().from(inductionResponses).where(eq(inductionResponses.id, id)).for("update");
        if (!record || label(record) !== expectedLabel) return false;
        if (action === "delete") await tx.delete(inductionResponses).where(eq(inductionResponses.id, id));
        else await tx.update(inductionResponses).set({ status: value === "null" ? null : value === "true" }).where(eq(inductionResponses.id, id));
      } else if (resource === "email") {
        const [record] = await tx.select().from(contactResponses).where(eq(contactResponses.id, id)).for("update");
        if (!record || label(record) !== expectedLabel) return false;
        if (action === "delete") await tx.delete(contactResponses).where(eq(contactResponses.id, id));
        else await tx.update(contactResponses).set({ status: value === "null" ? null : value === "true" }).where(eq(contactResponses.id, id));
      }
      return true;
    });
    if (!result) return NextResponse.json({ error: "The selected record changed or no longer exists. Prepare the request again." }, { status: 409 });
    return NextResponse.json({ success: true, resource, action, id });
  } catch (error) {
    console.error("Assistant action failed:", error);
    return NextResponse.json({ error: "Could not complete the action." }, { status: 500 });
  }
}
