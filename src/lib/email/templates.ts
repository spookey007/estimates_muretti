import { getAppBaseUrl } from "@/lib/email/config";

export function passwordResetEmail(resetUrl: string): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = "Reset your Muretti Estimate password";
  const text = `Use this link to reset your password (expires in 1 hour):\n\n${resetUrl}\n\nIf you did not request this, ignore this email.`;
  const html = `
    <p>Use the link below to reset your password. This link expires in 1 hour.</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>If you did not request this, you can ignore this email.</p>
  `.trim();
  return { subject, text, html };
}

export function welcomeEmail(email: string): {
  subject: string;
  text: string;
  html: string;
} {
  const base = getAppBaseUrl();
  const subject = "Welcome to Muretti Estimate";
  const text = `Your account (${email}) is ready. Sign in at ${base}/login`;
  const html = `
    <p>Your account <strong>${email}</strong> is ready.</p>
    <p><a href="${base}/login">Sign in to Muretti Estimate</a></p>
  `.trim();
  return { subject, text, html };
}
