import type { Metadata } from "next";
import Link from "next/link";
import { query } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";

type TaggedPost = {
  title: string;
  slug: string;
  excerpt: string;
  published_at: string | null;
  created_at: string;
};

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);

  return {
    title: `#${decodedTag} | Little Prince Digital Garden`,
    description: `Browse Blog planet posts tagged with ${decodedTag}.`,
    alternates: { canonical: absoluteUrl(`/tags/${encodeURIComponent(decodedTag)}`) },
    openGraph: {
      title: `#${decodedTag} | Little Prince Digital Garden`,
      description: `Browse Blog planet posts tagged with ${decodedTag}.`,
      url: absoluteUrl(`/tags/${encodeURIComponent(decodedTag)}`)
    }
  };
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const posts = await query<TaggedPost>(
    `SELECT title, slug, excerpt, published_at, created_at
     FROM posts
     WHERE published = TRUE AND tags ? $1
     ORDER BY COALESCE(published_at, created_at) DESC`,
    [decodedTag]
  );

  return (
    <main className="relative z-10 min-h-dvh px-5 py-24 text-starlight sm:px-8 lg:px-12">
      <section className="mx-auto max-w-4xl">
        <Link href="/blog" className="rounded-full border border-comet/28 bg-comet/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-comet">
          返回 Blog 星球
        </Link>
        <h1 className="mt-8 font-display text-6xl text-starlight">#{decodedTag}</h1>
        <p className="mt-4 text-sm text-starlight/52">这片标签星云里有 {posts.rows.length} 篇已发布文章。</p>
        <div className="mt-8 grid gap-4">
          {posts.rows.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="rounded-[1.5rem] border border-white/12 bg-white/[0.07] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_18px_50px_rgba(2,6,23,0.24)] backdrop-blur-md transition hover:border-rose-100/24 hover:bg-rose-100/[0.08]"
            >
              <p className="text-[10px] uppercase tracking-[0.28em] text-rose-100/54">
                {new Date(post.published_at || post.created_at).toLocaleDateString("zh-CN")}
              </p>
              <h2 className="mt-3 font-display text-3xl text-starlight">{post.title}</h2>
              <p className="mt-3 text-sm leading-7 text-starlight/56">{post.excerpt}</p>
            </Link>
          ))}
          {posts.rows.length === 0 ? (
            <div className="rounded-[1.5rem] border border-white/12 bg-black/20 p-5 text-sm leading-7 text-starlight/52">
              这片标签星云暂时没有已发布文章。
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
