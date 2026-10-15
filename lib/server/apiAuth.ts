import { createClient, type User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { and, eq, isNull, or } from "drizzle-orm";
import { hasPermission } from "@/lib/permissions";

type AccessRule = [string, string?];

function ruleFor(path: string, method: string): AccessRule | null {
  if (path === "/api/me" && method === "GET") return ["me"];
  if (path === "/api/SendEmail" && method === "POST") return ["emails", "sendEmail"];
  if (path === "/api/dashboard" && method === "GET") return ["dashboard", "viewStats"];
  if (path === "/api/settings") {
    return method === "GET" || method === "POST" ? ["settings"] : null;
  }
  if (path === "/api/societies") return method === "GET" ? ["emails"] : ["emails", "manageSettings"];
  if (path === "/api/users") {
    return { GET: ["users"], POST: ["users", "createUser"], PATCH: ["users", "editRole"], DELETE: ["users", "deleteUser"] }[method] as AccessRule || null;
  }
  if (path === "/api/emails") {
    return { GET: ["emails", "viewResponses"], PATCH: ["emails", "changeStatus"], DELETE: ["emails", "deleteEmail"] }[method] as AccessRule || null;
  }
  if (path === "/api/members") {
    return { GET: ["members", "readOnly"], POST: ["members"], PATCH: ["members", "changeStatus"], DELETE: ["members", "deleteMember"] }[method] as AccessRule || null;
  }
  if (path === "/api/inductions") {
    return { GET: ["inductions", "readOnly"], POST: ["inductions"], PATCH: ["inductions", "changeStatus"], DELETE: ["inductions", "deleteResponse"] }[method] as AccessRule || null;
  }
  if (path === "/api/leads") {
    return { GET: ["leads", "readOnly"], POST: ["leads", "addMember"], PATCH: ["leads", "changeStatus"], DELETE: ["leads", "deleteLead"] }[method] as AccessRule || null;
  }
  if (/^\/api\/leads\/[^/]+\/members$/.test(path)) {
    return { GET: ["leads", "readOnly"], POST: ["leads", "addMember"], PATCH: ["leads", "changeStatus"], DELETE: ["leads", "deleteLead"] }[method] as AccessRule || null;
  }
  if (path === "/api/events") {
    return { GET: ["events"], POST: ["events", "createEvent"] }[method] as AccessRule || null;
  }
  if (/^\/api\/events\/[^/]+$/.test(path)) {
    return { GET: ["events"], PATCH: ["events", "editEvent"], DELETE: ["events", "deleteEvent"] }[method] as AccessRule || null;
  }
  if (/^\/api\/events\/[^/]+\/registrations$/.test(path)) {
    return { GET: ["events", "viewRegistrations"], PATCH: ["events", "editEvent"], DELETE: ["events", "deleteEvent"] }[method] as AccessRule || null;
  }
  if (/^\/api\/events\/[^/]+\/winners$/.test(path)) return ["events", method === "GET" ? "viewRegistrations" : "selectWinners"];
  if (/^\/api\/events\/[^/]+\/certifications$/.test(path)) return ["events", method === "GET" ? "viewRegistrations" : "generateCertificates"];
  return null;
}

export async function authorizeApiRequest(req: NextRequest) {
  const token = /^Bearer (.+)$/i.exec(req.headers.get("authorization") || "")?.[1];
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ error: "Authentication unavailable" }, { status: 503 });

  const auth = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await auth.auth.getUser(token);
  const user: User | undefined = data.user || undefined;
  if (error || !user?.id || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const path = req.nextUrl.pathname;
  const rule = ruleFor(path, req.method);
  if (!rule) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const records = await db.select().from(users).where(or(
    eq(users.user_id, user.id),
    and(isNull(users.user_id), eq(users.email, user.email)),
  )).limit(1);
  const account = records[0];

  // A verified first signup may initialize an empty installation once.
  if (!account && path === "/api/users" && req.method === "POST") {
    const existing = await db.select({ id: users.id }).from(users).limit(1);
    if (!existing.length) return { user, account: null, bootstrap: true };
  }

  if (!account || account.status === false) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (path === "/api/me") return { user, account, bootstrap: false };

  const permissions = account.permissions || account.role;
  const settingKey = req.nextUrl.searchParams.get("key");
  let allowed = false;
  if (path === "/api/settings") {
    allowed = settingKey
      ? hasPermission(permissions, "emails", "manageSettings")
      : hasPermission(permissions, "dashboard", req.method === "POST" ? "quickSettings" : "viewStats");
  } else if (path === "/api/SendEmail") {
    allowed = hasPermission(permissions, "emails", "sendEmail") ||
      hasPermission(permissions, "inductions", "sendEmails") ||
      hasPermission(permissions, "events", "createEvent") ||
      hasPermission(permissions, "events", "generateCertificates");
  } else {
    allowed = hasPermission(permissions, rule[0], rule[1]);
  }
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return { user, account, bootstrap: false };
}
