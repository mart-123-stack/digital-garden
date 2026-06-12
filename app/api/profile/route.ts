import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;

  try {
    const result = await query(
      `SELECT id, email, name, nickname, avatar_url, bio, interests, role, created_at, updated_at
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [auth.user?.id]
    );

    return NextResponse.json({ profile: result.rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const result = await query(
      `UPDATE users
       SET name = COALESCE($2, name),
           nickname = COALESCE($3, nickname),
           avatar_url = COALESCE($4, avatar_url),
           bio = COALESCE($5, bio),
           interests = COALESCE($6::jsonb, interests),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, name, nickname, avatar_url, bio, interests, role, created_at, updated_at`,
      [
        auth.user?.id,
        body.name ?? null,
        body.nickname ?? null,
        body.avatarUrl ?? null,
        body.bio ?? null,
        body.interests ? JSON.stringify(body.interests) : null
      ]
    );

    return NextResponse.json({ profile: result.rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
