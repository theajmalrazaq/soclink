import { authorizeApiRequest } from "@/lib/server/apiAuth";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { db, app_settings } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const access = await authorizeApiRequest(req);
  if (access instanceof NextResponse) return access;
  try {
    const body = await req.json();
    const { to: rawTo, subject, html, attachments, fromName } = body;

    if (!rawTo || !subject || !html) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    // Helper: normalize input into array of email strings
    const normalizeList = (input: any): string[] => {
      if (!input) return [];
      if (Array.isArray(input)) {
        return input.flatMap((it) => {
          if (!it) return [];
          let val = "";
          if (typeof it === "string") val = it.trim();
          else if (typeof it === "object") val = (it.email || it.to || it.value || "").trim();
          else val = String(it).trim();
          return val ? [val] : [];
        });
      }
      if (typeof input === "string") {
        return input.split(/[;,]+/).flatMap((s) => {
          const trimmed = s.trim();
          return trimmed ? [trimmed] : [];
        });
      }
      const trimmed = String(input).trim();
      return trimmed ? [trimmed] : [];
    };

    const toList = normalizeList(rawTo);

    // A request may supply message content, but never server resources or transport settings.
    if (attachments !== undefined && (!Array.isArray(attachments) || attachments.length > 10)) {
      return NextResponse.json({ message: "Invalid attachments" }, { status: 400 });
    }
    const safeAttachments: { filename: string; content: string; encoding: "base64" }[] = [];
    for (const attachment of attachments || []) {
      if (!attachment || typeof attachment !== "object" ||
          Object.keys(attachment).some((key) => !["filename", "content", "encoding"].includes(key)) ||
          typeof attachment.filename !== "string" || attachment.filename.length > 200 ||
          typeof attachment.content !== "string" || attachment.content.length > 14_000_000 ||
          attachment.encoding !== "base64" || !/^[A-Za-z0-9+/]*={0,2}$/.test(attachment.content)) {
        return NextResponse.json({ message: "Invalid attachment" }, { status: 400 });
      }
      safeAttachments.push({ filename: attachment.filename, content: attachment.content, encoding: "base64" });
    }

    const rows = await db.select({ value: app_settings.value }).from(app_settings)
      .where(eq(app_settings.key, "smtp_delivery_config")).limit(1);
    const saved = rows[0]?.value && typeof rows[0].value === "object" ? rows[0].value as Record<string, unknown> : {};
    const configured = saved.user && saved.pass ? saved : null;
    const smtpHost = String(process.env.SMTP_HOST || "smtp.gmail.com").trim().toLowerCase();
    const smtpPort = Number(process.env.SMTP_PORT || 465);
    const smtpSecure = smtpPort === 465 ? true : process.env.SMTP_SECURE === "true";
    const smtpUser = String(configured?.user || process.env.SMTP_USER || "").trim();
    const smtpPass = String(configured?.pass || process.env.SMTP_PASS || "").trim().replace(/\s+/g, "");
    const allowedHosts = new Set(["smtp.gmail.com", process.env.SMTP_HOST?.toLowerCase(),
      ...(process.env.SMTP_ALLOWED_HOSTS || "").toLowerCase().split(",").map((host) => host.trim())]);
    if (!allowedHosts.has(smtpHost) || !Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
      return NextResponse.json({ message: "SMTP host or port is not allowed" }, { status: 400 });
    }

    if (!smtpUser || !smtpPass) {
      return NextResponse.json(
        {
          message:
            "No SMTP credentials configured. Please configure your Gmail address and App Password in Settings > SMTP & Delivery or in environment variables.",
        },
        { status: 400 },
      );
    }

    const transportConfig: any = {
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          requireTLS: !smtpSecure,
          disableFileAccess: true,
          disableUrlAccess: true,
          connectionTimeout: 15000,
          greetingTimeout: 15000,
          socketTimeout: 15000,
        };

    const transporter = nodemailer.createTransport(transportConfig);

    const senderDisplayName =
      fromName || configured?.fromName || process.env.FROM_NAME || "Society Team";
    const fromAddress = `"${senderDisplayName}" <${smtpUser}>`;

    const allRecipients = Array.from(new Set(toList));

    if (allRecipients.length === 0) {
      return NextResponse.json({ message: "No valid recipients found" }, { status: 400 });
    }

    console.log("SendEmail handler: will send individual mails", {
      toCount: toList.length,
      total: allRecipients.length,
      from: fromAddress,
    });

    const BATCH_SIZE = 10;
    const sendResults: any[] = [];

    for (let i = 0; i < allRecipients.length; i += BATCH_SIZE) {
      const batch = allRecipients.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (recipient) => {
          const opts = {
            from: fromAddress,
            to: recipient,
            subject,
            html,
            attachments: safeAttachments,
          };

          try {
            const info: any = await transporter.sendMail(opts);
            return {
              to: recipient,
              success: true,
              id: info && info.messageId ? info.messageId : null,
            };
          } catch (err: any) {
            console.error("SendEmail error for recipient", recipient, err?.message || err);
            return {
              to: recipient,
              success: false,
              error: err?.message || String(err),
            };
          }
        }),
      );
      sendResults.push(...batchResults);
    }

    const sentCount = sendResults.filter((r) => r.success).length;
    const failedCount = sendResults.length - sentCount;

    return NextResponse.json({
      message: "Bulk send complete",
      sent: sentCount,
      failed: failedCount,
      success: sentCount > 0,
      results: sendResults,
    });
  } catch (error: any) {
    console.error("Email sending failed:", error);
    return NextResponse.json(
      { message: "Failed to send email", error: error.message },
      { status: 500 },
    );
  }
}
