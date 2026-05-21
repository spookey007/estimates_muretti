import { loadEnvFile } from "./load-env";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

async function main() {
  loadEnvFile();
  const url = process.env.POSTGRES_URL;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!url || !email || !password) {
    console.error("POSTGRES_URL, ADMIN_EMAIL, and ADMIN_PASSWORD are required");
    process.exit(1);
  }

  if (password.length < 12) {
    console.error("ADMIN_PASSWORD must be at least 12 characters");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: url,
    ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: true },
  });

  const hash = await bcrypt.hash(password, 12);
  const normalized = email.trim().toLowerCase();

  try {
    const existing = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = $1",
      [normalized],
    );
    if (existing.rows.length > 0) {
      console.log(`Admin user already exists for ${normalized}`);
      return;
    }

    await pool.query(
      `INSERT INTO users (email, password_hash, name, role, email_verified_at)
       VALUES ($1, $2, $3, 'admin', NOW())`,
      [normalized, hash, "Administrator"],
    );
    console.log(`Admin user created for ${normalized}`);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
