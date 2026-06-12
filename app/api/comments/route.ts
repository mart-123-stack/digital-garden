import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { awardPoints } from "@/lib/points";

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
      `SELECT c.id, c.target_type, c.target_slug, c.parent_id, c.author_name, c.content, c.created_at,
              u.id AS user_id, u.nickname, u.name, u.avatar_url
       FROM comments c
       LEFT JOIN users u ON u.id = c.user_id
       WHERE c.target_type = $1 AND c.target_slug = $2
       ORDER BY c.created_at ASC`,
      [targetType, targetSlug]
    );

    return NextResponse.json({ comments: result.rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load comments";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const user = auth.user;

    const result = await query(
      `INSERT INTO comments (target_type, target_slug, user_id, parent_id, author_name, content)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, target_type, target_slug, parent_id, author_name, content, created_at`,
      [
        body.targetType || "post",
        body.targetSlug,
        user?.id,
        body.parentId || null,
        user?.nickname || user?.name || "Pilot",
        body.content
      ]
    );

    if (user) {
      await awardPoints(user.id, "comment", `${body.targetType || "post"}:${body.targetSlug}`).catch(() => null);
    }

    return NextResponse.json({ comment: result.rows[0] }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create comment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
