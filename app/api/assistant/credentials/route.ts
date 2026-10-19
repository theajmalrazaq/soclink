import { NextRequest, NextResponse } from "next/server";
import { db, app_settings } from "@/lib/db";
import { eq } from "drizzle-orm";
import { authorizeApiRequest } from "@/lib/server/apiAuth";
import {
  GROQ_SETTINGS_KEY,
  canEncryptSettings,
  encryptSecret,
  getAssistantCredentialStatus,
} from "@/lib/server/assistantCredentials";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const access = await authorizeApiRequest(req);
  if (access instanceof NextResponse) return access;
  try {
    return NextResponse.json(await getAssistantCredentialStatus(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Could not load GroqCloud settings." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const access = await authorizeApiRequest(req);
  if (access instanceof NextResponse) return access;
  if (!canEncryptSettings()) {
    return NextResponse.json({ error: "Server encryption key is not configured." }, { status: 503 });
  }
  const body = await req.json().catch(() => null);
  const apiKey = typeof body?.apiKey === "string" ? body.apiKey.trim() : "";
  if (!apiKey || apiKey.length > 500) {
    return NextResponse.json({ error: "Enter a valid API key." }, { status: 400 });
  }
  try {
    const encrypted = encryptSecret(apiKey);
    await db.insert(app_settings)
      .values({ key: GROQ_SETTINGS_KEY, value: encrypted, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: app_settings.key,
        set: { value: encrypted, updatedAt: new Date() },
      });
    return NextResponse.json({ configured: true, source: "settings", canSave: true }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Could not save GroqCloud key." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const access = await authorizeApiRequest(req);
  if (access instanceof NextResponse) return access;
  try {
    await db.delete(app_settings).where(eq(app_settings.key, GROQ_SETTINGS_KEY));
    return NextResponse.json(await getAssistantCredentialStatus(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Could not remove GroqCloud key." }, { status: 500 });
  }
}
