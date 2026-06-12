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
      `SELECT id, title, slug, summary, content, cluster, status, tags, links, published, created_at, updated_at
       FROM notes
       WHERE slug = $1
       LIMIT 1`,
      [slug]
    );

    if (!result.rows[0]) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ note: result.rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load note";
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
      `UPDATE notes
       SET title = COALESCE($2, title),
           slug = $3,
           summary = COALESCE($4, summary),
           content = COALESCE($5, content),
           cluster = COALESCE($6, cluster),
           status = COALESCE($7, status),
           tags = COALESCE($8::jsonb, tags),
           links = COALESCE($9::jsonb, links),
           published = COALESCE($10, published),
           updated_at = NOW()
       WHERE slug = $1
       RETURNING id, title, slug, summary, content, cluster, status, tags, links, published, created_at, updated_at`,
      [
        slug,
        body.title ?? null,
        nextSlug,
        body.summary ?? null,
        body.content ?? null,
        body.cluster ?? null,
        body.status ?? null,
        body.tags ? JSON.stringify(body.tags) : null,
        body.links ? JSON.stringify(body.links) : null,
        body.published ?? null
      ]
    );

    if (!result.rows[0]) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ note: result.rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update note";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
