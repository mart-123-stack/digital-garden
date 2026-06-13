import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, requireUser } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetType = searchParams.get("targetType") || "post";
  const targetSlug = searchParams.get("targetSlug");
  const reactionType = searchParams.get("reactionType");

  if (!targetSlug) {
    const auth = await requireUser(request);
    if (auth.response) return auth.response;

    try {
      const params: unknown[] = [auth.user?.id];
      const filters = ["r.user_id = $1"];

      if (reactionType === "like" || reactionType === "favorite") {
        params.push(reactionType);
        filters.push(`r.reaction_type = $${params.length}`);
      }

      const result = await query(
        `SELECT
           r.target_type,
           r.target_slug,
           r.reaction_type,
           r.created_at,
           COALESCE(p.title, n.title, r.target_slug) AS title,
           COALESCE(p.excerpt, n.summary, '') AS summary,
           p.cover_url
         FROM reactions r
         LEFT JOIN posts p ON r.target_type = 'post' AND p.slug = r.target_slug
         LEFT JOIN notes n ON r.target_type = 'note' AND n.slug = r.target_slug
         WHERE ${filters.join(" AND ")}
         ORDER BY r.created_at DESC`,
        params
      );

      return NextResponse.json({
        items: result.rows.map((item) => ({
          ...item,
          href:
            item.target_type === "post"
              ? `/blog/${item.target_slug}`
              : `/notes?note=${item.target_slug}`
        }))
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load reactions";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  try {
    const user = await getUserFromRequest(request);
    const result = await query(
      `SELECT reaction_type, COUNT(*)::int AS count
       FROM reactions
       WHERE target_type = $1 AND target_slug = $2
       GROUP BY reaction_type`,
      [targetType, targetSlug]
    );
    const activeResult = user
      ? await query<{ reaction_type: "like" | "favorite" }>(
          `SELECT reaction_type
           FROM reactions
           WHERE target_type = $1 AND target_slug = $2 AND user_id = $3`,
          [targetType, targetSlug, user.id]
        )
      : { rows: [] };

    return NextResponse.json({
      reactions: result.rows,
      active: activeResult.rows.map((item) => item.reaction_type)
    });
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
