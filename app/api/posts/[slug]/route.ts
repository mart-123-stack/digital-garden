import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const result = await query(
      `SELECT id, title, slug, excerpt, content, cover_url, published, published_at, created_at, updated_at
       FROM posts
       WHERE slug = $1
       LIMIT 1`,
      [slug]
    );

    if (!result.rows[0]) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post: result.rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load post";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  const { slug } = await params;

  try {
    const body = await request.json();
    const nextSlug = body.slug ? slugify(body.slug) : slug;

    const result = await query(
      `UPDATE posts
       SET title = COALESCE($2, title),
           slug = $3,
           excerpt = COALESCE($4, excerpt),
           content = COALESCE($5, content),
           cover_url = COALESCE($6, cover_url),
           published = COALESCE($7, published),
           published_at = CASE WHEN $7 = TRUE AND published_at IS NULL THEN NOW() ELSE published_at END,
           updated_at = NOW()
       WHERE slug = $1
       RETURNING id, title, slug, excerpt, content, cover_url, published, published_at, created_at, updated_at`,
      [slug, body.title ?? null, nextSlug, body.excerpt ?? null, body.content ?? null, body.coverUrl ?? null, body.published ?? null]
    );

    if (!result.rows[0]) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post: result.rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update post";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
