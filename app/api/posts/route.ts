import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserFromRequest, requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { awardPoints } from "@/lib/points";

export const dynamic = "force-dynamic";

type PostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  cover_url: string | null;
  tags: string[];
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 10)));
    const search = searchParams.get("search")?.trim();
    const tag = searchParams.get("tag")?.trim();
    const includeDrafts = searchParams.get("drafts") === "true";
    const offset = (page - 1) * limit;
    const user = await getUserFromRequest(request);

    if (user && searchParams.get("award") === "read") {
      await awardPoints(user.id, "read_content", "posts").catch(() => null);
    }

    const params: unknown[] = [];
    const conditions = includeDrafts ? ["TRUE"] : ["published = TRUE"];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(title ILIKE $${params.length} OR excerpt ILIKE $${params.length} OR content ILIKE $${params.length})`);
    }

    if (tag) {
      params.push(tag);
      conditions.push(`tags ? $${params.length}`);
    }

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM posts
       WHERE ${conditions.join(" AND ")}`,
      params
    );

    params.push(limit, offset);
    const result = await query<PostRow>(
      `SELECT id, title, slug, excerpt, cover_url, tags, published, published_at, created_at, updated_at
       FROM posts
       WHERE ${conditions.join(" AND ")}
       ORDER BY COALESCE(published_at, created_at) DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const total = Number(countResult.rows[0]?.count || 0);
    return NextResponse.json({ posts: result.rows, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load posts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireAdmin(request);
  if (response) return response;

  try {
    const body = await request.json();
    const slug = body.slug ? slugify(body.slug) : slugify(body.title || crypto.randomUUID());
    const published = Boolean(body.published);

    const result = await query<PostRow>(
      `INSERT INTO posts (title, slug, excerpt, content, cover_url, tags, author_id, published, published_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, CASE WHEN $8 THEN NOW() ELSE NULL END)
       RETURNING id, title, slug, excerpt, content, cover_url, tags, published, published_at, created_at, updated_at`,
      [
        body.title,
        slug,
        body.excerpt || "",
        body.content || "",
        body.coverUrl || null,
        JSON.stringify(body.tags || []),
        user?.id === "admin" ? null : user?.id || null,
        published
      ]
    );

    return NextResponse.json({ post: result.rows[0] }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create post";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
