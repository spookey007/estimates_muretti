export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

export function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.EMAIL_FROM?.trim() || user;

  if (!host || !user || !pass || !from) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT || "587");
  const secure =
    process.env.SMTP_SECURE === "true" || port === 465;

  return { host, port, secure, user, pass, from };
}

export function getAppBaseUrl(): string {
  return (
    process.env.APP_URL?.trim() ||
    (process.env.NODE_ENV === "production"
      ? "https://localhost"
      : "http://localhost:3000")
  );
}
