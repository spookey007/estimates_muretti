# Security setup

## First-time setup

1. Copy `web/.env.example` values into `web/.env` (keep secrets out of git).
2. Generate JWT secrets (48+ characters each):

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```

3. Apply the database schema:

   ```bash
   cd web && npm run db:migrate
   ```

4. Create the first admin user:

   ```bash
   ADMIN_EMAIL=you@company.com ADMIN_PASSWORD='your-long-password' npm run db:seed-admin
   ```

5. Start the app and sign in at `/login`.

## What is protected

- All pages except `/login` require a valid JWT in an **httpOnly** cookie.
- All `/api/*` routes except `/api/auth/login` and `/api/auth/refresh` require authentication.
- API routes also verify the session in Postgres (revoked/expired sessions fail even with a forged JWT body).
- State-changing API calls require a **CSRF** double-submit token (`muretti_csrf` cookie + `X-CSRF-Token` header).
- **CORS** blocks browser calls from origins other than `APP_URL` (and localhost in development).
- Optional **ALLOWED_IPS** restricts `/api` to specific client IPs (e.g. behind a VPN or reverse proxy).
- **Rate limits** are stored in Postgres (`rate_limit_buckets`). Override windows/limits via `.env` (see `.env.example`); restart the server after changes.
- Login lockout after 5 failed attempts (15 minutes).

## Email

Configure `SMTP_*` and `EMAIL_FROM` to send mail via `sendEmail()` in `src/lib/email/send.ts`.

## Production checklist (protects AI API spend)

Before going live:

1. Set `APP_URL` to your **https** production URL (required — APIs return 503 without it).
2. Never set `RATE_LIMIT_DISABLED=true` in production (ignored automatically).
3. Use strong `JWT_*` secrets and a strong admin password.
4. Optionally set `ALLOWED_IPS` if the app is only reachable via VPN/office network.
5. Tune `RATE_LIMIT_IMPORT_POST_*` to cap Anthropic/Gemini usage per hour.
6. Rotate `ANTHROPIC_API_KEY` if it was ever committed or shared.

Logged-in users hitting `/login` are redirected to the app automatically (middleware + session check).

## Important notes

- No web app is “100% secure”; this stack follows common production practices. Rotate `ANTHROPIC_API_KEY` if it was ever exposed.
- Burp Suite can replay **your own** session cookies after login; it cannot bypass login without valid credentials and server-issued tokens.
- Deploy behind HTTPS in production so `Secure` cookies and HSTS apply.
