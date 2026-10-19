import { NextRequest, NextResponse } from "next/server";
import { authorizeApiRequest } from "@/lib/server/apiAuth";
import { getAssistantCredential } from "@/lib/server/assistantCredentials";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const access = await authorizeApiRequest(req);
  if (access instanceof NextResponse) return access;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (body.apiKey !== undefined &&
      (typeof body.apiKey !== "string" || !body.apiKey.trim() || body.apiKey.length > 500)) {
    return NextResponse.json({ error: "Enter a valid API key." }, { status: 400 });
  }

  try {
    const key = body.apiKey?.trim() || (await getAssistantCredential()).key;
    if (!key) {
      return NextResponse.json({ error: "Add a GroqCloud API key first." }, { status: 400 });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: "Return a JSON object with status set to ok." },
          { role: "user", content: "Check connection." },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "groq_connection_check",
            strict: true,
            schema: {
              type: "object",
              properties: { status: { type: "string", enum: ["ok"] } },
              required: ["status"],
              additionalProperties: false,
            },
          },
        },
      }),
      signal: AbortSignal.timeout(20000),
      cache: "no-store",
    });

    if (!response.ok) {
      const message = response.status === 401 || response.status === 403
        ? "GroqCloud rejected the API key or access is denied."
        : response.status === 429
          ? "GroqCloud rate limit reached. Try again later."
          : response.status === 400
            ? "GroqCloud rejected the configured model. Check GROQ_MODEL."
            : "GroqCloud could not complete the test. Try again later.";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const result = await response.json();
    const content = result?.choices?.[0]?.message?.content;
    let parsed: { status?: string } | null = null;
    if (typeof content === "string") {
      try { parsed = JSON.parse(content); } catch { /* Invalid provider response. */ }
    }
    if (parsed?.status !== "ok") {
      return NextResponse.json({ error: "GroqCloud returned an unexpected response." }, { status: 502 });
    }
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not reach GroqCloud. Try again later." }, { status: 502 });
  }
}
