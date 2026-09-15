export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to: rawTo, subject, html, attachments, fromName, smtpConfig } = body;

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

    const smtpHost = (smtpConfig?.host || process.env.SMTP_HOST || "smtp.gmail.com").trim();
    const smtpPort = Number(smtpConfig?.port || process.env.SMTP_PORT || 465);
    const isGmail =
      smtpHost.includes("gmail") ||
      (!smtpConfig?.host && process.env.SMTP_HOST?.includes("gmail")) ||
      (!smtpConfig?.host && !process.env.SMTP_HOST);
    const smtpSecure =
      smtpPort === 465 ? true : Boolean(smtpConfig?.secure ?? process.env.SMTP_SECURE === "true");
    const smtpUser = (smtpConfig?.user || smtpConfig?.email || process.env.SMTP_USER || "").trim();
    const smtpPass = (smtpConfig?.pass || smtpConfig?.password || process.env.SMTP_PASS || "")
      .trim()
      .replace(/\s+/g, "");

    if (!smtpUser || !smtpPass) {
      return NextResponse.json(
        {
          message:
            "No SMTP credentials configured. Please configure your Gmail address and App Password in Settings > SMTP & Delivery or in environment variables.",
        },
        { status: 400 },
      );
    }

    const transportConfig: any = isGmail
      ? {
          service: "gmail",
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          tls: {
            rejectUnauthorized: false,
          },
          connectionTimeout: 15000,
          greetingTimeout: 15000,
          socketTimeout: 15000,
        }
      : {
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          tls: {
            rejectUnauthorized: false,
          },
          connectionTimeout: 15000,
          greetingTimeout: 15000,
          socketTimeout: 15000,
        };

    const transporter = nodemailer.createTransport(transportConfig);

    const senderDisplayName =
      fromName || smtpConfig?.fromName || process.env.FROM_NAME || "Society Team";
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
            attachments,
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
