import pg from "pg";

type ToolArgs = Record<string, unknown>;

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 10_000
});

export const TOOLS = [
  {
    name: "garden_list_posts",
    description: "List published or draft blog posts with optional search, tag, and pagination filters.",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string" },
        tag: { type: "string" },
        includeDrafts: { type: "boolean", default: false },
        page: { type: "number", default: 1 },
        limit: { type: "number", default: 20 }
      }
    }
  },
  {
    name: "garden_get_post",
    description: "Get a blog post by slug.",
    inputSchema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] }
  },
  {
    name: "garden_create_post",
    description: "Create a blog post. Content is Markdown.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        slug: { type: "string" },
        excerpt: { type: "string" },
        content: { type: "string" },
        coverUrl: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        published: { type: "boolean", default: false }
      },
      required: ["title", "content"]
    }
  },
  {
    name: "garden_update_post",
    description: "Update a blog post by slug.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string" },
        title: { type: "string" },
        nextSlug: { type: "string" },
        excerpt: { type: "string" },
        content: { type: "string" },
        coverUrl: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        published: { type: "boolean" }
      },
      required: ["slug"]
    }
  },
  {
    name: "garden_delete_post",
    description: "Delete a blog post by id.",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] }
  },
  {
    name: "garden_list_notes",
    description: "List notes with optional search, cluster, status, and draft filters.",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string" },
        cluster: { type: "string" },
        status: { type: "string" },
        includeDrafts: { type: "boolean", default: false },
        limit: { type: "number", default: 50 }
      }
    }
  },
  {
    name: "garden_get_note",
    description: "Get a note by slug.",
    inputSchema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] }
  },
  {
    name: "garden_list_comments",
    description: "List comments with optional target filters.",
    inputSchema: {
      type: "object",
      properties: {
        targetType: { type: "string", enum: ["post", "note"] },
        targetSlug: { type: "string" },
        limit: { type: "number", default: 50 }
      }
    }
  },
  {
    name: "garden_delete_comment",
    description: "Delete a comment by id.",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] }
  },
  {
    name: "garden_list_tags",
    description: "List unique tags used by blog posts and notes.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "garden_get_about",
    description: "Get the editable About profile.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "garden_update_about",
    description: "Update the editable About profile.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        title: { type: "string" },
        location: { type: "string" },
        bio: { type: "string" },
        avatarUrl: { type: "string" },
        photos: { type: "array" },
        interests: { type: "array", items: { type: "string" } },
        experiences: { type: "array" }
      }
    }
  }
];

function stringArg(args: ToolArgs, key: string) {
  const value = args[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function boolArg(args: ToolArgs, key: string, fallback = false) {
  return typeof args[key] === "boolean" ? Boolean(args[key]) : fallback;
}

function numberArg(args: ToolArgs, key: string, fallback: number, max = 100) {
  const value = Number(args[key] ?? fallback);
  return Math.min(max, Math.max(1, Number.isFinite(value) ? value : fallback));
}

function stringArrayArg(args: ToolArgs, key: string) {
  const value = args[key];
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : undefined;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function handleTool(name: string, args: ToolArgs) {
  switch (name) {
    case "garden_list_posts": {
      const page = numberArg(args, "page", 1);
      const limit = numberArg(args, "limit", 20, 100);
      const offset = (page - 1) * limit;
      const conditions = boolArg(args, "includeDrafts") ? ["TRUE"] : ["published = TRUE"];
      const params: unknown[] = [];
      const search = stringArg(args, "search");
      const tag = stringArg(args, "tag");

      if (search) {
        params.push(`%${search}%`);
        conditions.push(`(title ILIKE $${params.length} OR excerpt ILIKE $${params.length} OR content ILIKE $${params.length})`);
      }
      if (tag) {
        params.push(tag);
        conditions.push(`tags ? $${params.length}`);
      }

      const count = await pool.query(`SELECT COUNT(*)::int AS count FROM posts WHERE ${conditions.join(" AND ")}`, params);
      params.push(limit, offset);
      const result = await pool.query(
        `SELECT id, title, slug, excerpt, cover_url, tags, published, published_at, created_at, updated_at
         FROM posts
         WHERE ${conditions.join(" AND ")}
         ORDER BY COALESCE(published_at, created_at) DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );

      return { posts: result.rows, page, limit, total: count.rows[0]?.count ?? 0 };
    }

    case "garden_get_post": {
      const result = await pool.query("SELECT * FROM posts WHERE slug = $1 LIMIT 1", [stringArg(args, "slug")]);
      if (!result.rows[0]) throw new Error(`Post not found: ${String(args.slug)}`);
      return result.rows[0];
    }

    case "garden_create_post": {
      const title = stringArg(args, "title");
      const content = stringArg(args, "content");
      if (!title || !content) throw new Error("title and content are required");
      const published = boolArg(args, "published");
      const result = await pool.query(
        `INSERT INTO posts (title, slug, excerpt, content, cover_url, tags, published, published_at)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, CASE WHEN $7 THEN NOW() ELSE NULL END)
         RETURNING *`,
        [
          title,
          stringArg(args, "slug") || slugify(title),
          stringArg(args, "excerpt") || "",
          content,
          stringArg(args, "coverUrl") || null,
          JSON.stringify(stringArrayArg(args, "tags") || []),
          published
        ]
      );
      return result.rows[0];
    }

    case "garden_update_post": {
      const slug = stringArg(args, "slug");
      if (!slug) throw new Error("slug is required");
      const fields: string[] = [];
      const values: unknown[] = [];
      const setters: Record<string, string> = {
        title: "title",
        nextSlug: "slug",
        excerpt: "excerpt",
        content: "content",
        coverUrl: "cover_url"
      };
      for (const [argKey, column] of Object.entries(setters)) {
        const value = stringArg(args, argKey);
        if (value !== undefined) {
          values.push(value);
          fields.push(`${column} = $${values.length}`);
        }
      }
      const tags = stringArrayArg(args, "tags");
      if (tags) {
        values.push(JSON.stringify(tags));
        fields.push(`tags = $${values.length}::jsonb`);
      }
      if (typeof args.published === "boolean") {
        values.push(args.published);
        fields.push(`published = $${values.length}`);
        fields.push(`published_at = CASE WHEN $${values.length} = TRUE AND published_at IS NULL THEN NOW() ELSE published_at END`);
      }
      if (fields.length === 0) throw new Error("No fields to update");
      values.push(slug);
      const result = await pool.query(
        `UPDATE posts SET ${fields.join(", ")}, updated_at = NOW() WHERE slug = $${values.length} RETURNING *`,
        values
      );
      if (!result.rows[0]) throw new Error(`Post not found: ${slug}`);
      return result.rows[0];
    }

    case "garden_delete_post": {
      const result = await pool.query("DELETE FROM posts WHERE id = $1 RETURNING id", [stringArg(args, "id")]);
      if (!result.rows[0]) throw new Error(`Post not found: ${String(args.id)}`);
      return { deleted: true, id: result.rows[0].id };
    }

    case "garden_list_notes": {
      const limit = numberArg(args, "limit", 50, 200);
      const conditions = boolArg(args, "includeDrafts") ? ["TRUE"] : ["published = TRUE"];
      const params: unknown[] = [];
      const search = stringArg(args, "search");
      const cluster = stringArg(args, "cluster");
      const status = stringArg(args, "status");
      if (search) {
        params.push(`%${search}%`);
        conditions.push(`(title ILIKE $${params.length} OR summary ILIKE $${params.length} OR content ILIKE $${params.length})`);
      }
      if (cluster) {
        params.push(cluster);
        conditions.push(`cluster = $${params.length}`);
      }
      if (status) {
        params.push(status);
        conditions.push(`status = $${params.length}`);
      }
      params.push(limit);
      const result = await pool.query(
        `SELECT id, title, slug, summary, cluster, status, tags, links, published, created_at, updated_at
         FROM notes
         WHERE ${conditions.join(" AND ")}
         ORDER BY updated_at DESC
         LIMIT $${params.length}`,
        params
      );
      return { notes: result.rows };
    }

    case "garden_get_note": {
      const result = await pool.query("SELECT * FROM notes WHERE slug = $1 LIMIT 1", [stringArg(args, "slug")]);
      if (!result.rows[0]) throw new Error(`Note not found: ${String(args.slug)}`);
      return result.rows[0];
    }

    case "garden_list_comments": {
      const conditions = ["TRUE"];
      const params: unknown[] = [];
      const targetType = stringArg(args, "targetType");
      const targetSlug = stringArg(args, "targetSlug");
      if (targetType) {
        params.push(targetType);
        conditions.push(`target_type = $${params.length}`);
      }
      if (targetSlug) {
        params.push(targetSlug);
        conditions.push(`target_slug = $${params.length}`);
      }
      params.push(numberArg(args, "limit", 50, 200));
      const result = await pool.query(
        `SELECT * FROM comments WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC LIMIT $${params.length}`,
        params
      );
      return { comments: result.rows };
    }

    case "garden_delete_comment": {
      const result = await pool.query("DELETE FROM comments WHERE id = $1 RETURNING id", [stringArg(args, "id")]);
      if (!result.rows[0]) throw new Error(`Comment not found: ${String(args.id)}`);
      return { deleted: true, id: result.rows[0].id };
    }

    case "garden_list_tags": {
      const result = await pool.query(
        `SELECT DISTINCT tag
         FROM (
           SELECT jsonb_array_elements_text(tags) AS tag FROM posts
           UNION ALL
           SELECT jsonb_array_elements_text(tags) AS tag FROM notes
         ) tags
         WHERE tag <> ''
         ORDER BY tag`
      );
      return { tags: result.rows.map((row) => row.tag) };
    }

    case "garden_get_about": {
      const result = await pool.query("SELECT * FROM about_profile WHERE id = 1 LIMIT 1");
      return result.rows[0] || null;
    }

    case "garden_update_about": {
      const fields: string[] = [];
      const values: unknown[] = [];
      const scalarFields: Record<string, string> = {
        name: "name",
        title: "title",
        location: "location",
        bio: "bio",
        avatarUrl: "avatar_url"
      };
      for (const [argKey, column] of Object.entries(scalarFields)) {
        const value = stringArg(args, argKey);
        if (value !== undefined) {
          values.push(value);
          fields.push(`${column} = $${values.length}`);
        }
      }
      for (const key of ["photos", "interests", "experiences"]) {
        if (args[key] !== undefined) {
          values.push(JSON.stringify(args[key]));
          fields.push(`${key} = $${values.length}::jsonb`);
        }
      }
      if (!fields.length) throw new Error("No fields to update");
      const result = await pool.query(
        `UPDATE about_profile SET ${fields.join(", ")}, updated_at = NOW() WHERE id = 1 RETURNING *`,
        values
      );
      return result.rows[0];
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
