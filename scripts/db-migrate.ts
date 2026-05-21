import { loadEnvFile } from "./load-env";
import { readFileSync } from "fs";
import { join } from "path";
import { Pool } from "pg";

async function main() {
  loadEnvFile();
  const url = process.env.POSTGRES_URL;
  if (!url) {
    console.error("POSTGRES_URL is required");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: url,
    ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: true },
  });

  const schemaPath = join(process.cwd(), "src/lib/db/schema.sql");
  const sql = readFileSync(schemaPath, "utf-8");

  try {
    await pool.query(sql);
    console.log("Database schema applied successfully.");
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
