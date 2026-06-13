import { NextRequest, NextResponse } from "next/server";
import { attachSession, requireUser, signSession } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  email: string;
  name: string;
  nickname: string;
  avatar_url: string | null;
  bio: string;
  interests: string[];
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
};

async function profileResponse(profile: ProfileRow) {
  const response = NextResponse.json({ profile });
  attachSession(
    response,
    await signSession({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      nickname: profile.nickname,
      avatarUrl: profile.avatar_url,
      role: profile.role
    })
  );

  return response;
}

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;

  try {
    const result = await query<ProfileRow>(
      `SELECT id, email, name, nickname, avatar_url, bio, interests, role, created_at, updated_at
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [auth.user?.id]
    );

    return profileResponse(result.rows[0]);
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
    const result = await query<ProfileRow>(
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

    return profileResponse(result.rows[0]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
