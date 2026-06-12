import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getUserFromRequest } from "@/lib/auth";
import { query } from "@/lib/db";
import { awardPoints } from "@/lib/points";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDrafts = searchParams.get("drafts") === "true";
    const user = await getUserFromRequest(request);

    if (user && searchParams.get("award") === "read") {
      await awardPoints(user.id, "read_content", "notes").catch(() => null);
    }

    const result = await query(
      `SELECT id, title, slug, summary, cluster, status, tags, links, published, created_at, updated_at
       FROM notes
       WHERE ${includeDrafts ? "TRUE" : "published = TRUE"}
       ORDER BY updated_at DESC`
    );

    return NextResponse.json({ notes: result.rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load notes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const result = await query(
      `INSERT INTO notes (title, slug, summary, content, cluster, status, tags, links, published, author_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10)
       RETURNING id, title, slug, summary, content, cluster, status, tags, links, published, created_at, updated_at`,
      [
        body.title,
        body.slug ? slugify(body.slug) : slugify(body.title || crypto.randomUUID()),
        body.summary || "",
        body.content || "",
        body.cluster || "PKM",
        body.status || "seedling",
        JSON.stringify(body.tags || []),
        JSON.stringify(body.links || []),
        Boolean(body.published),
        auth.user?.id === "admin" ? null : auth.user?.id || null
      ]
    );

    return NextResponse.json({ note: result.rows[0] }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create note";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
