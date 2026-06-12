import { SignJWT, jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hashPassword, verifyPasswordHash } from "@/lib/password";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  nickname: string;
  avatarUrl: string | null;
  role: "user" | "admin";
};

type UserRow = {
  id: string;
  email: string;
  name: string;
  nickname: string;
  avatar_url: string | null;
  role: "user" | "admin";
};

const COOKIE_NAME = "garden_session";

function jwtSecret() {
  const secret = process.env.JWT_SECRET || "dev_only_change_me";
  return new TextEncoder().encode(secret);
}

function normalizeUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    nickname: row.nickname,
    avatarUrl: row.avatar_url,
    role: row.role
  };
}

export async function signSession(user: AuthUser) {
  return new SignJWT({
    email: user.email,
    name: user.name,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    role: user.role
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(jwtSecret());
}

export async function verifySession(token: string | undefined) {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, jwtSecret());
    if (!payload.sub || !payload.email || !payload.role) return null;

    return {
      id: payload.sub,
      email: String(payload.email),
      name: String(payload.name || ""),
      nickname: String(payload.nickname || ""),
      avatarUrl: payload.avatarUrl ? String(payload.avatarUrl) : null,
      role: payload.role === "admin" ? "admin" : "user"
    } satisfies AuthUser;
  } catch {
    return null;
  }
}

export async function getUserFromRequest(request: NextRequest) {
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const cookieToken = request.cookies.get(COOKIE_NAME)?.value;
  return verifySession(bearer || cookieToken);
}

export async function requireUser(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return { user: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { user, response: null };
}

export async function requireAdmin(request: NextRequest) {
  const user = await getUserFromRequest(request);
  const legacyAdminToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (user?.role === "admin" || legacyAdminToken === process.env.ADMIN_PASSWORD) {
    return { user, response: null };
  }

  return { user: null, response: NextResponse.json({ error: "Admin only" }, { status: 403 }) };
}

export function attachSession(response: NextResponse, token: string) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });

  return response;
}

export function clearSession(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });

  return response;
}

export async function registerUser(input: {
  email: string;
  password: string;
  name?: string;
  nickname?: string;
}) {
  const email = input.email.trim().toLowerCase();
  const nickname = (input.nickname || input.name || email.split("@")[0] || "Pilot").trim();
  const name = (input.name || nickname).trim();

  if (!email || !input.password) {
    return { error: "email and password are required" };
  }

  if (input.password.length < 8) {
    return { error: "password must be at least 8 characters" };
  }

  const result = await query<UserRow>(
    `INSERT INTO users (email, password_hash, name, nickname)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, name, nickname, avatar_url, role`,
    [email, hashPassword(input.password), name, nickname]
  );

  return { user: normalizeUser(result.rows[0]) };
}

export async function upsertGitHubUser(input: {
  githubId: string;
  email: string;
  name: string;
  nickname: string;
  avatarUrl: string | null;
}) {
  const email = input.email.trim().toLowerCase();
  const nickname = (input.nickname || input.name || email.split("@")[0] || "Pilot").trim();
  const name = (input.name || nickname).trim();

  if (!input.githubId || !email) {
    return { error: "GitHub identity is incomplete" };
  }

  const result = await query<UserRow>(
    `INSERT INTO users (email, name, nickname, avatar_url, auth_provider, provider_id, last_login_at)
     VALUES ($1, $2, $3, $4, 'github', $5, NOW())
     ON CONFLICT (email)
     DO UPDATE SET
       name = COALESCE(NULLIF(users.name, ''), EXCLUDED.name),
       nickname = COALESCE(NULLIF(users.nickname, ''), EXCLUDED.nickname),
       avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
       auth_provider = 'github',
       provider_id = EXCLUDED.provider_id,
       last_login_at = NOW(),
       updated_at = NOW()
     RETURNING id, email, name, nickname, avatar_url, role`,
    [email, name, nickname, input.avatarUrl, input.githubId]
  );

  return { user: normalizeUser(result.rows[0]) };
}

export async function loginUser(emailInput: string, password: string) {
  const email = emailInput.trim().toLowerCase();
  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();

  if (email && email === adminEmail && password === process.env.ADMIN_PASSWORD) {
    return {
      user: {
        id: "admin",
        email,
        name: "Admin",
        nickname: "Admin",
        avatarUrl: null,
        role: "admin"
      } satisfies AuthUser
    };
  }

  if (email && password) {
    const result = await query<UserRow & { password_hash: string | null }>(
      `SELECT id, email, name, nickname, avatar_url, role, password_hash
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email]
    );
    const row = result.rows[0];

    if (row && verifyPasswordHash(password, row.password_hash)) {
      await query("UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1", [row.id]);
      return { user: normalizeUser(row) };
    }
  }

  return { error: "invalid email or password" };
}
