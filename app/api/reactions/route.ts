import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetType = searchParams.get("targetType") || "post";
  const targetSlug = searchParams.get("targetSlug");

  if (!targetSlug) {
    return NextResponse.json({ error: "targetSlug is required" }, { status: 400 });
  }

  try {
    const result = await query(
      `SELECT reaction_type, COUNT(*)::int AS count
       FROM reactions
       WHERE target_type = $1 AND target_slug = $2
       GROUP BY reaction_type`,
      [targetType, targetSlug]
    );

    return NextResponse.json({ reactions: result.rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load reactions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const targetType = body.targetType || "post";
    const reactionType = body.reactionType || "like";

    const existing = await query<{ id: string }>(
      `SELECT id FROM reactions
       WHERE target_type = $1 AND target_slug = $2 AND user_id = $3 AND reaction_type = $4
       LIMIT 1`,
      [targetType, body.targetSlug, auth.user?.id, reactionType]
    );

    if (existing.rows[0]) {
      await query("DELETE FROM reactions WHERE id = $1", [existing.rows[0].id]);
      return NextResponse.json({ active: false });
    }

    await query(
      `INSERT INTO reactions (target_type, target_slug, user_id, reaction_type)
       VALUES ($1, $2, $3, $4)`,
      [targetType, body.targetSlug, auth.user?.id, reactionType]
    );

    return NextResponse.json({ active: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update reaction";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
