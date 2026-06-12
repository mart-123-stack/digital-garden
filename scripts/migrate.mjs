import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";
import { loadEnv } from "./load-env.mjs";

loadEnv();

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required. Copy .env.example to .env and update it first.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
  connectionTimeoutMillis: 10_000
});

try {
  const migrationsDir = join(process.cwd(), "migrations");
  const files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();

  if (files.length === 0) {
    console.log("No SQL migrations found.");
    process.exit(0);
  }

  for (const file of files) {
    const sql = await readFile(join(migrationsDir, file), "utf8");
    console.log(`Applying ${file}...`);
    await pool.query(sql);
  }

  console.log("Database migrations complete.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
