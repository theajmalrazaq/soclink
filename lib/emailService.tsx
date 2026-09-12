import React from "react";
import { render } from "@react-email/render";
import CertificateEmail from "@/emails/CertificateEmail";
import InterviewEmail from "@/emails/InterviewEmail";
import SelectionEmail from "@/emails/SelectionEmail";
import RejectionEmail from "@/emails/RejectionEmail";
import AnnouncementEmail from "@/emails/AnnouncementEmail";
import EventEmail from "@/emails/EventEmail";
import ContactEmail from "@/emails/ContactEmail";
import InductionEmail from "@/emails/InductionEmail";
import { getEmailConfig, getSmtpConfig } from "./emailConfig";

export const EMAIL_TEMPLATES: Record<string, any> = {
  announcement: AnnouncementEmail,
  event: EventEmail,
  certificate: CertificateEmail,
  interview: InterviewEmail,
  induction: InductionEmail,
  selection: SelectionEmail,
  rejection: RejectionEmail,
  contact: ContactEmail,
};

export async function renderEmailTemplate(templateName: string, props: any = {}) {
  const Template = EMAIL_TEMPLATES[templateName];
  if (!Template) {
    throw new Error(`Email template "${templateName}" not found`);
  }
  const config = props?.config ? { ...getEmailConfig(), ...props.config } : getEmailConfig();
  const mergedProps = { ...props, config };
  const html = await render(<Template {...mergedProps} />, { pretty: false });
  return html;
}

export function isValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

interface SendEmailOptions {
  to: string;
  subject: string;
  templateName: string;
  templateProps?: any;
  attachments?: any[];
  fromName?: string;
}

export async function sendEmail({
  to,
  subject,
  templateName,
  templateProps = {},
  attachments = [],
  fromName,
}: SendEmailOptions) {
  if (!isValidEmail(to)) {
    throw new Error(`Invalid email address: ${to}`);
  }

  const currentConfig = templateProps?.config
    ? { ...getEmailConfig(), ...templateProps.config }
    : getEmailConfig();

  const html = await renderEmailTemplate(templateName, { ...templateProps, config: currentConfig });

  const senderDisplayName =
    fromName || currentConfig.senderName || currentConfig.brandName || "Society Team";

  const response = await fetch("/api/SendEmail", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to,
      subject,
      html,
      attachments,
      fromName: senderDisplayName,
      smtpConfig: getSmtpConfig(),
    }),
  });

  const responseText = await response.text();
  let data: any = {};
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    throw new Error(
      `Delivery service responded with status ${response.status}: ${responseText.slice(0, 120) || "Empty response"}`,
    );
  }

  if (!response.ok) {
    const detailedMessage = data?.error
      ? `${data.message}: ${data.error}`
      : data?.message || `Failed to send email (${response.status})`;
    throw new Error(detailedMessage);
  }

  if (data?.sent === 0 && data?.failed > 0) {
    const firstError = data?.results?.[0]?.error || data?.message || "Delivery failed";
    throw new Error(firstError);
  }

  return data;
}

interface BulkEmailOptions {
  recipients: (string | { email: string })[];
  subject: string;
  templateName: string;
  templateProps: any;
  onProgress?: (current: number, total: number, recipient: any) => void;
  batchSize?: number;
  delayMs?: number;
}

export async function sendBulkEmails({
  recipients,
  subject,
  templateName,
  templateProps,
  onProgress,
  batchSize = 5,
  delayMs = 1000,
}: BulkEmailOptions) {
  const results: { success: any[]; failed: any[] } = {
    success: [],
    failed: [],
  };

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);

    const batchPromises = batch.map(async (recipient) => {
      try {
        const email = typeof recipient === "string" ? recipient : recipient.email;
        const props =
          typeof templateProps === "function" ? templateProps(recipient) : templateProps;

        await sendEmail({
          to: email,
          subject,
          templateName,
          templateProps: props,
        });

        results.success.push(recipient);

        if (onProgress) {
          onProgress(results.success.length + results.failed.length, recipients.length, recipient);
        }
      } catch (error: any) {
        results.failed.push({ recipient, error: error.message });

        if (onProgress) {
          onProgress(results.success.length + results.failed.length, recipients.length, recipient);
        }
      }
    });

    await Promise.all(batchPromises);

    if (i + batchSize < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

export async function sendCertificateEmail({
  to,
  recipientName,
  eventName,
  eventDate,
  certificateUrl,
  position,
  hasAttachment = false,
  attachments = [],
}: any) {
  return sendEmail({
    to,
    subject: `Your Certificate - ${eventName}`,
    templateName: "certificate",
    templateProps: {
      recipientName,
      eventName,
      eventDate,
      certificateUrl,
      position,
      hasAttachment,
    },
    attachments,
  });
}

export async function sendInterviewEmail({
  to,
  candidateName,
  interviewDate,
  interviewTime,
  interviewSlot,
  meetingLink,
  location,
  instructions,
}: any) {
  const cfg = getEmailConfig();
  return sendEmail({
    to,
    subject: `Interview Scheduled - ${cfg.brandName} Inductions`,
    templateName: "interview",
    templateProps: {
      candidateName,
      interviewDate,
      interviewTime,
      interviewSlot,
      meetingLink,
      location,
      instructions,
    },
  });
}

export async function sendEventEmail({
  to,
  recipientName,
  eventTitle,
  eventDescription,
  eventDate,
  eventTime,
  eventLocation,
  eventImage,
  registrationLink,
  isCompetition,
}: any) {
  return sendEmail({
    to,
    subject: `${isCompetition ? "New Competition" : "New Event"} - ${eventTitle}`,
    templateName: "event",
    templateProps: {
      recipientName,
      eventTitle,
      eventDescription,
      eventDate,
      eventTime,
      eventLocation,
      eventImage,
      registrationLink,
      isCompetition,
    },
  });
}

export async function sendSelectionEmail({ to, recipientName, role }: any) {
  return sendEmail({
    to,
    subject: "Congratulations — You are selected!",
    templateName: "selection",
    templateProps: { recipientName, role },
  });
}

export async function sendRejectionEmail({ to, recipientName }: any) {
  return sendEmail({
    to,
    subject: "Application Update",
    templateName: "rejection",
    templateProps: { recipientName },
  });
}

export async function sendContactResponseEmail({
  to,
  recipientName,
  originalSubject,
  originalMessage,
  responseMessage,
  responderName,
}: any) {
  return sendEmail({
    to,
    subject: `Re: ${originalSubject}`,
    templateName: "contact",
    templateProps: {
      recipientName,
      originalSubject,
      originalMessage,
      responseMessage,
      responderName,
    },
  });
}

export async function sendInductionEmail({ to, recipientEmails, name, deadline }: any) {
  const cfg = getEmailConfig();
  const rawList =
    recipientEmails ||
    (Array.isArray(to)
      ? to
      : typeof to === "string"
        ? to.split(/[;,]+/).flatMap((s) => {
            const trimmed = s.trim();
            return trimmed ? [trimmed] : [];
          })
        : []);

  if (Array.isArray(rawList) && rawList.length > 1) {
    const bulkRes = await sendBulkEmails({
      recipients: rawList,
      subject: `Inductions are Open! Join ${cfg.brandName}`,
      templateName: "induction",
      templateProps: {
        name,
        deadline,
      },
    });
    return {
      ...bulkRes,
      success: bulkRes.success.length > 0,
      sent: bulkRes.success.length,
      failed: bulkRes.failed.length,
    };
  }

  const singleTo = Array.isArray(rawList) && rawList.length > 0 ? rawList[0] : to;
  const res = await sendEmail({
    to: singleTo,
    subject: `Inductions are Open! Join ${cfg.brandName}`,
    templateName: "induction",
    templateProps: {
      name,
      deadline,
    },
  });
  return { success: true, sent: 1, ...res };
}

export async function sendAnnouncementEmail({ to, recipientEmails, title, message }: any) {
  const cfg = getEmailConfig();
  const rawList =
    recipientEmails ||
    (Array.isArray(to)
      ? to
      : typeof to === "string" && to.includes(",")
        ? to.split(/[;,]+/).flatMap((s) => {
            const trimmed = s.trim();
            return trimmed ? [trimmed] : [];
          })
        : null);

  if (Array.isArray(rawList) && rawList.length > 1) {
    const bulkRes = await sendBulkEmails({
      recipients: rawList,
      subject: title || `Announcement from ${cfg.brandName}`,
      templateName: "announcement",
      templateProps: { title, message },
    });
    return {
      ...bulkRes,
      success: bulkRes.success.length > 0,
      sent: bulkRes.success.length,
      failed: bulkRes.failed.length,
    };
  }

  const singleTo = Array.isArray(rawList) && rawList.length > 0 ? rawList[0] : to;
  const res = await sendEmail({
    to: singleTo,
    subject: title || `Announcement from ${cfg.brandName}`,
    templateName: "announcement",
    templateProps: { title, message },
  });
  return { success: true, sent: 1, ...res };
}
