import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool {
  const url = process.env.POSTGRES_URL;
  if (!url) {
    throw new Error("POSTGRES_URL is not set");
  }
  if (!pool) {
    pool = new Pool({
      connectionString: url,
      ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: true },
      max: 10,
    });
  }
  return pool;
}

export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<{ rows: T[]; rowCount: number | null }> {
  const client = await getPool().connect();
  try {
    const result = await client.query<T>(text, params);
    return { rows: result.rows, rowCount: result.rowCount };
  } finally {
    client.release();
  }
}
