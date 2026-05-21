import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import { getSmtpConfig } from "@/lib/email/config";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
};

export type SendEmailResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  const cfg = getSmtpConfig();
  if (!cfg) return null;

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass },
    });
  }
  return transporter;
}

export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const cfg = getSmtpConfig();
  const transport = getTransporter();

  if (!cfg || !transport) {
    return {
      ok: false,
      error:
        "Email is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and EMAIL_FROM.",
    };
  }

  const mail: Mail.Options = {
    from: cfg.from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    replyTo: input.replyTo,
  };

  try {
    const info = await transport.sendMail(mail);
    return { ok: true, messageId: info.messageId };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Send failed";
    return { ok: false, error: message };
  }
}
