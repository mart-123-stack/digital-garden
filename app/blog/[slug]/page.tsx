import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentEngagement } from "@/components/ContentEngagement";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { query } from "@/lib/db";
import { absoluteUrl, siteUrl } from "@/lib/site";

type BlogPost = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_url: string | null;
  tags: string[];
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

async function getPost(slug: string) {
  const result = await query<BlogPost>(
    `SELECT title, slug, excerpt, content, cover_url, tags, published, published_at, created_at, updated_at
     FROM posts
     WHERE slug = $1 AND published = TRUE
     LIMIT 1`,
    [slug]
  );

  return result.rows[0] || null;
}

function postDate(post: BlogPost) {
  return post.published_at || post.created_at || post.updated_at;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: "Blog Post Not Found | Little Prince Digital Garden"
    };
  }

  const title = `${post.title} | Little Prince Digital Garden`;
  const description = post.excerpt || "A dispatch from the Blog planet in the Little Prince digital garden.";
  const url = absoluteUrl(`/blog/${post.slug}`);
  const images = post.cover_url ? [{ url: post.cover_url.startsWith("http") ? post.cover_url : absoluteUrl(post.cover_url) }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Little Prince Digital Garden",
      type: "article",
      publishedTime: postDate(post),
      modifiedTime: post.updated_at,
      tags: post.tags,
      images
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images?.map((image) => image.url)
    }
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) notFound();

  return (
    <main className="relative z-10 min-h-dvh px-5 py-24 text-starlight sm:px-8 lg:px-12">
      <article className="mx-auto max-w-4xl rounded-[2rem] border border-rose-100/18 bg-[#1b0815]/88 p-5 shadow-[0_30px_110px_rgba(20,4,18,0.62),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-xl sm:p-8">
        <Link
          href="/blog"
          className="inline-flex rounded-full border border-comet/28 bg-comet/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-comet"
        >
          返回 Blog 星球
        </Link>

        {post.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover_url}
            alt={post.title}
            className="mt-6 max-h-[24rem] w-full rounded-[1.5rem] border border-white/10 object-cover shadow-[0_18px_70px_rgba(2,6,23,0.42)]"
          />
        ) : null}

        <header className="mt-7 border-b border-white/10 pb-6">
          <p className="text-[10px] uppercase tracking-[0.36em] text-rose-100/58">Blog Planet Archive</p>
          <h1 className="mt-4 font-display text-5xl leading-none text-starlight sm:text-7xl">{post.title}</h1>
          <p className="mt-5 text-sm leading-7 text-starlight/58">{post.excerpt}</p>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-starlight/42">
            <time dateTime={postDate(post)}>{new Date(postDate(post)).toLocaleDateString("zh-CN")}</time>
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag)}`}
                className="rounded-full border border-rose-100/16 bg-rose-100/8 px-3 py-1 text-rose-100/64 transition hover:border-rose-100/32 hover:text-rose-50"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </header>

        <section className="mt-7 rounded-[1.5rem] bg-black/16 p-4 sm:p-6">
          <MarkdownRenderer content={post.content || "这篇文章还没有正文。"} />
        </section>

        <ContentEngagement targetType="post" targetSlug={post.slug} />
      </article>
    </main>
  );
}
