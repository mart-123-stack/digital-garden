import { Pool, type QueryResult, type QueryResultRow } from "pg";

const connectionString = process.env.DATABASE_URL;

declare global {
  // eslint-disable-next-line no-var
  var gardenPool: Pool | undefined;
}

export const pool =
  globalThis.gardenPool ??
  new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.gardenPool = pool;
}

pool.on("error", (error) => {
  console.error("PostgreSQL pool error:", error.message);
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  return pool.query<T>(text, params);
}

export async function testConnection() {
  try {
    await query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
