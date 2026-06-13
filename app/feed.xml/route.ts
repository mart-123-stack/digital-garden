import { query } from "@/lib/db";
import { absoluteUrl, siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

type FeedPost = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function cdata(value: string) {
  return value.replaceAll("]]>", "]]]]><![CDATA[>");
}

export async function GET() {
  const posts = await query<FeedPost>(
    `SELECT title, slug, excerpt, content, published_at, created_at, updated_at
     FROM posts
     WHERE published = TRUE
     ORDER BY COALESCE(published_at, created_at) DESC
     LIMIT 50`
  );

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Little Prince Digital Garden</title>
    <link>${siteUrl()}</link>
    <description>A poetic personal universe for essays, notes, games, and memory.</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${absoluteUrl("/feed.xml")}" rel="self" type="application/rss+xml"/>
${posts.rows
  .map((post) => {
    const link = absoluteUrl(`/blog/${post.slug}`);
    const pubDate = new Date(post.published_at || post.created_at || post.updated_at).toUTCString();
    return `    <item>
      <title><![CDATA[${cdata(post.title)}]]></title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${cdata(post.excerpt || "")}]]></description>
      <content:encoded><![CDATA[${cdata((post.content || "").slice(0, 500))}]]></content:encoded>
    </item>`;
  })
  .join("\n")}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
