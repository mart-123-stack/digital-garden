import { randomBytes, scryptSync } from "node:crypto";
import pg from "pg";
import { loadEnv } from "./load-env.mjs";

loadEnv();

const { Pool } = pg;
const KEY_LENGTH = 64;
const databaseUrl = process.env.DATABASE_URL;
const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || "";

function hashPassword(value) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(value, salt, KEY_LENGTH).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

if (!databaseUrl) {
  console.error("DATABASE_URL is required. Copy .env.example to .env and update it first.");
  process.exit(1);
}

if (!email || !password || password === "change_me") {
  console.error("ADMIN_EMAIL and a non-default ADMIN_PASSWORD are required.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
  connectionTimeoutMillis: 10_000
});

try {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, name, nickname, role, auth_provider)
     VALUES ($1, $2, $3, $4, 'admin', 'credentials')
     ON CONFLICT (email)
     DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       role = 'admin',
       name = COALESCE(NULLIF(users.name, ''), EXCLUDED.name),
       nickname = COALESCE(NULLIF(users.nickname, ''), EXCLUDED.nickname),
       updated_at = NOW()
     RETURNING id, email, role`,
    [email, hashPassword(password), "Sylvie Chu", "Garden Admin"]
  );

  console.log(`Admin ready: ${result.rows[0].email} (${result.rows[0].role})`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
