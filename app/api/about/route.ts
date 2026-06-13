import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type AboutProfileRow = {
  id: number;
  name: string;
  title: string;
  location: string;
  bio: string;
  avatar_url: string | null;
  photos: unknown[];
  interests: unknown[];
  experiences: unknown[];
  updated_at: string;
};

export async function GET() {
  try {
    const result = await query<AboutProfileRow>(
      `SELECT id, name, title, location, bio, avatar_url, photos, interests, experiences, updated_at
       FROM about_profile
       WHERE id = 1
       LIMIT 1`
    );

    return NextResponse.json({ about: result.rows[0] || null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load about profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const result = await query<AboutProfileRow>(
      `INSERT INTO about_profile (id, name, title, location, bio, avatar_url, photos, interests, experiences, updated_at)
       VALUES (1, $1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, NOW())
       ON CONFLICT (id)
       DO UPDATE SET
         name = EXCLUDED.name,
         title = EXCLUDED.title,
         location = EXCLUDED.location,
         bio = EXCLUDED.bio,
         avatar_url = EXCLUDED.avatar_url,
         photos = EXCLUDED.photos,
         interests = EXCLUDED.interests,
         experiences = EXCLUDED.experiences,
         updated_at = NOW()
       RETURNING id, name, title, location, bio, avatar_url, photos, interests, experiences, updated_at`,
      [
        body.name || "",
        body.title || "",
        body.location || "",
        body.bio || "",
        body.avatarUrl || null,
        JSON.stringify(Array.isArray(body.photos) ? body.photos : []),
        JSON.stringify(Array.isArray(body.interests) ? body.interests : []),
        JSON.stringify(Array.isArray(body.experiences) ? body.experiences : [])
      ]
    );

    return NextResponse.json({ about: result.rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update about profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
