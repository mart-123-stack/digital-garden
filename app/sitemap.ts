import type { MetadataRoute } from "next";
import { query } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), priority: 1, changeFrequency: "weekly" },
    { url: absoluteUrl("/blog"), priority: 0.9, changeFrequency: "weekly" },
    { url: absoluteUrl("/notes"), priority: 0.8, changeFrequency: "weekly" },
    { url: absoluteUrl("/about"), priority: 0.7, changeFrequency: "monthly" },
    { url: absoluteUrl("/profile"), priority: 0.6, changeFrequency: "monthly" },
    { url: absoluteUrl("/game"), priority: 0.5, changeFrequency: "monthly" }
  ];

  try {
    const [posts, notes] = await Promise.all([
      query<{ slug: string; updated_at: string; published_at: string | null }>(
        `SELECT slug, updated_at, published_at
         FROM posts
         WHERE published = TRUE
         ORDER BY COALESCE(published_at, updated_at) DESC`
      ),
      query<{ slug: string; updated_at: string }>(
        `SELECT slug, updated_at
         FROM notes
         WHERE published = TRUE
         ORDER BY updated_at DESC`
      )
    ]);

    return [
      ...staticRoutes,
      ...posts.rows.map((post) => ({
        url: absoluteUrl(`/blog/${post.slug}`),
        priority: 0.82,
        changeFrequency: "monthly" as const,
        lastModified: new Date(post.published_at || post.updated_at)
      })),
      ...notes.rows.map((note) => ({
        url: absoluteUrl(`/notes?note=${encodeURIComponent(note.slug)}`),
        priority: 0.64,
        changeFrequency: "monthly" as const,
        lastModified: new Date(note.updated_at)
      }))
    ];
  } catch {
    return staticRoutes;
  }
}
