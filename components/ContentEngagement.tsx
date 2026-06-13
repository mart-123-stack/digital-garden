"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";

type TargetType = "post" | "note";

type ReactionRow = {
  reaction_type: "like" | "favorite";
  count: number;
};

type CommentRow = {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
  nickname?: string | null;
  name?: string | null;
};

export function ContentEngagement({
  targetType,
  targetSlug
}: {
  targetType: TargetType;
  targetSlug: string;
}) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<ReactionRow[]>([]);
  const [activeReactions, setActiveReactions] = useState<("like" | "favorite")[]>([]);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const counts = useMemo(
    () => ({
      like: reactions.find((item) => item.reaction_type === "like")?.count || 0,
      favorite: reactions.find((item) => item.reaction_type === "favorite")?.count || 0
    }),
    [reactions]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadEngagement() {
      setIsLoading(true);
      setMessage("");

      try {
        const [reactionResponse, commentResponse] = await Promise.all([
          fetch(`/api/reactions?targetType=${targetType}&targetSlug=${targetSlug}`, { cache: "no-store" }),
          fetch(`/api/comments?targetType=${targetType}&targetSlug=${targetSlug}`, { cache: "no-store" })
        ]);
        const reactionData = await reactionResponse.json();
        const commentData = await commentResponse.json();

        if (!reactionResponse.ok) throw new Error(reactionData.error || "互动舱暂未连接");
        if (!commentResponse.ok) throw new Error(commentData.error || "评论舱暂未连接");

        if (!cancelled) {
          setReactions(Array.isArray(reactionData.reactions) ? reactionData.reactions : []);
          setActiveReactions(Array.isArray(reactionData.active) ? reactionData.active : []);
          setComments(Array.isArray(commentData.comments) ? commentData.comments : []);
        }
      } catch {
        if (!cancelled) {
          setReactions([]);
          setActiveReactions([]);
          setComments([]);
          setMessage("互动舱暂未连接。数据库启动后，这里会显示评论、点赞和收藏。");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadEngagement();

    return () => {
      cancelled = true;
    };
  }, [targetSlug, targetType, user?.id]);

  async function toggleReaction(reactionType: "like" | "favorite") {
    if (!user) {
      setMessage("登录后才能留下星际指纹。");
      return;
    }

    try {
      const response = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetSlug, reactionType })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "操作失败");

      setReactions((current) => {
        const previous = current.find((item) => item.reaction_type === reactionType)?.count || 0;
        const nextCount = Math.max(0, previous + (data.active ? 1 : -1));
        const rest = current.filter((item) => item.reaction_type !== reactionType);
        return [...rest, { reaction_type: reactionType, count: nextCount }];
      });
      setActiveReactions((current) =>
        data.active ? [...new Set([...current, reactionType])] : current.filter((item) => item !== reactionType)
      );
      setMessage(data.active ? "已记录到你的航行日志。" : "已从航行日志移除。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "操作失败");
    }
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setMessage("登录后才能发表评论。");
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetSlug, content: trimmed })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "评论失败");

      setComments((current) => [...current, data.comment]);
      setContent("");
      setMessage("评论已落在这颗星球上。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "评论失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-5 rounded-[1.35rem] border border-white/12 bg-white/[0.06] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-comet/68">Engagement Deck</p>
          <p className="mt-1 text-sm text-starlight/48">
            {isLoading ? "正在同步星际互动..." : `${comments.length} 条评论`}
          </p>
        </div>
        <div className="flex gap-2">
          <motion.button
            type="button"
            onClick={() => void toggleReaction("like")}
            whileTap={{ scale: 0.92 }}
            aria-pressed={activeReactions.includes("like")}
            aria-label={activeReactions.includes("like") ? `取消点赞，当前 ${counts.like} 个点赞` : `点赞，当前 ${counts.like} 个点赞`}
            title={activeReactions.includes("like") ? "你已点赞，点击取消" : "点击点赞"}
            className={[
              "rounded-full border px-3 py-2 text-xs transition",
              activeReactions.includes("like")
                ? "border-rose-100/42 bg-rose-300/20 text-rose-50 shadow-[0_0_22px_rgba(251,113,133,0.22)]"
                : "border-rose-100/16 bg-rose-100/8 text-rose-100/75"
            ].join(" ")}
          >
            喜欢 {counts.like}
          </motion.button>
          <motion.button
            type="button"
            onClick={() => void toggleReaction("favorite")}
            whileTap={{ scale: 0.92 }}
            aria-pressed={activeReactions.includes("favorite")}
            aria-label={activeReactions.includes("favorite") ? `取消收藏，当前 ${counts.favorite} 个收藏` : `收藏，当前 ${counts.favorite} 个收藏`}
            title={activeReactions.includes("favorite") ? "你已收藏，点击取消" : "点击收藏"}
            className={[
              "rounded-full border px-3 py-2 text-xs transition",
              activeReactions.includes("favorite")
                ? "border-comet/46 bg-comet/18 text-comet shadow-[0_0_22px_rgba(245,200,75,0.2)]"
                : "border-comet/20 bg-comet/8 text-comet/80"
            ].join(" ")}
          >
            收藏 {counts.favorite}
          </motion.button>
        </div>
      </div>

      {message ? <p className="mt-3 rounded-2xl border border-white/10 bg-black/18 p-3 text-xs leading-6 text-starlight/50">{message}</p> : null}

      <div className="mt-4 space-y-3">
        {comments.slice(-4).map((comment) => (
          <article key={comment.id} className="rounded-2xl border border-white/10 bg-black/16 p-3">
            <p className="text-xs text-comet/70">{comment.nickname || comment.name || comment.author_name || "Pilot"}</p>
            <p className="mt-2 text-sm leading-6 text-starlight/62">{comment.content}</p>
          </article>
        ))}
        {!isLoading && comments.length === 0 ? <p className="text-sm text-starlight/38">还没有评论。第一条航迹等你留下。</p> : null}
      </div>

      {user ? (
        <form onSubmit={submitComment} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="写下一条温柔的星际批注"
            className="min-w-0 flex-1 rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm text-starlight outline-none placeholder:text-starlight/32"
          />
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="rounded-full border border-cyan-200/20 bg-cyan-200/10 px-5 py-3 text-xs uppercase tracking-[0.2em] text-cyan-100 disabled:opacity-45"
          >
            发送
          </button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-starlight/42">
          <Link href={`/login?next=/${targetType === "post" ? "blog" : "notes"}`} className="text-cyan-100">
            登录
          </Link>
          后可以点赞、收藏和评论。
        </p>
      )}
    </section>
  );
}
