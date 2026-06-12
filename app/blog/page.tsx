"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform
} from "framer-motion";
import { ContentEngagement } from "@/components/ContentEngagement";

type Article = {
  id: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  content?: string;
  tint: string;
  status: string;
  links: string[];
  patch: {
    left: string;
    top: string;
    size: string;
  };
};

type PostApiRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  cover_url?: string | null;
  published?: boolean;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

const fallbackArticles: Article[] = [
  {
    id: "rose-protocol",
    title: "玫瑰协议：如何把日常经验写成可复访的星图",
    date: "06.11",
    category: "Garden Notes",
    excerpt: "关于记录、回看、修剪和重新命名。每一篇文章都像一朵需要被驯养的玫瑰。",
    tint: "rgba(251,113,133,0.54)",
    status: "Evergreen",
    links: ["写作系统", "复访", "标签花床"],
    patch: { left: "31%", top: "48%", size: "h-28 w-40" }
  },
  {
    id: "tiny-flight",
    title: "微型飞船的驾驶手册：给注意力一个温柔的控制台",
    date: "06.04",
    category: "Interface",
    excerpt: "交互不是按钮的堆叠，而是让读者知道自己正在哪里，准备去哪里。",
    tint: "rgba(245,200,75,0.46)",
    status: "Budding",
    links: ["飞船光标", "动效手感", "导航"],
    patch: { left: "53%", top: "35%", size: "h-24 w-36" }
  },
  {
    id: "memory-clay",
    title: "记忆的黏土质感：为什么数字花园不该像数据库",
    date: "05.28",
    category: "Essay",
    excerpt: "如果知识有温度，它就不应该只以列表存在。它应该有地貌、天气和光。",
    tint: "rgba(232,93,117,0.5)",
    status: "Seedling",
    links: ["知识地貌", "PKM", "材料感"],
    patch: { left: "42%", top: "67%", size: "h-24 w-32" }
  },
  {
    id: "quiet-map",
    title: "安静地图：在过度通知的时代保留一片低噪声宇宙",
    date: "05.16",
    category: "Practice",
    excerpt: "个人网站可以不是展示橱窗，而是飞船停靠、补给和重新校准方向的地方。",
    tint: "rgba(255,214,231,0.46)",
    status: "Tended",
    links: ["低噪声", "个人空间", "数字花园"],
    patch: { left: "63%", top: "57%", size: "h-20 w-36" }
  }
];

const scrambleChars = "✦✧⋆01B612ROSE<>/{}[]*+-";
const patchPresets = [
  { left: "31%", top: "48%", size: "h-28 w-40" },
  { left: "53%", top: "35%", size: "h-24 w-36" },
  { left: "42%", top: "67%", size: "h-24 w-32" },
  { left: "63%", top: "57%", size: "h-20 w-36" },
  { left: "25%", top: "62%", size: "h-20 w-32" },
  { left: "58%", top: "72%", size: "h-24 w-40" }
];
const tints = [
  "rgba(251,113,133,0.54)",
  "rgba(245,200,75,0.46)",
  "rgba(232,93,117,0.5)",
  "rgba(255,214,231,0.46)",
  "rgba(244,114,182,0.5)",
  "rgba(251,146,60,0.42)"
];

function dispatchSpaceEvent(name: string, duration = 900) {
  window.dispatchEvent(new CustomEvent(name, { detail: { duration } }));
}

function ScrambleText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    let frame = 0;
    let interval: number | undefined;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        frame += 1;
        const progress = Math.min(1, frame / 14);
        const locked = Math.floor(text.length * progress);

        setDisplay(
          text
            .split("")
            .map((char, index) => {
              if (char === " " || index < locked) return char;
              return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
            })
            .join("")
        );

        if (progress >= 1) {
          window.clearInterval(interval);
          setDisplay(text);
        }
      }, 28);
    }, delay);

    return () => {
      window.clearTimeout(start);
      window.clearInterval(interval);
    };
  }, [delay, text]);

  return <span>{display || text.replace(/[^\s]/g, "✦")}</span>;
}

function formatDate(value?: string | null) {
  if (!value) return "Draft";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Draft";
  return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function mapPostToArticle(post: PostApiRow, index: number): Article {
  return {
    id: post.slug,
    title: post.title,
    date: formatDate(post.published_at || post.created_at || post.updated_at),
    category: "Garden Post",
    excerpt: post.excerpt || "这篇文章还在长出第一片叶子。",
    content: post.content,
    tint: tints[index % tints.length],
    status: post.published ? "Evergreen" : "Seedling",
    links: ["Blog 星球", "Digital Garden"],
    patch: patchPresets[index % patchPresets.length]
  };
}

function RoseField({
  mouseX,
  mouseY,
  activeId
}: {
  mouseX: ReturnType<typeof useSpring>;
  mouseY: ReturnType<typeof useSpring>;
  activeId: string | null;
}) {
  const roses = useMemo(
    () =>
      Array.from({ length: 28 }, (_, index) => ({
        id: index,
        left: 7 + ((index * 19) % 76),
        top: 18 + ((index * 31) % 70),
        size: 0.68 + ((index * 7) % 8) / 10,
        delay: (index % 7) * 0.06
      })),
    []
  );
  const leanX = useTransform(mouseX, [0, 1], [-7, 9]);
  const leanY = useTransform(mouseY, [0, 1], [-4, 7]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {roses.map((rose) => (
        <motion.span
          key={rose.id}
          className="absolute flex origin-bottom flex-col items-center"
          style={{
            left: `${rose.left}%`,
            top: `${rose.top}%`,
            scale: rose.size,
            x: leanX,
            y: leanY
          }}
          initial={{ opacity: 0, y: 18, scale: 0.2 }}
          animate={{ opacity: [0.28, 0.82, 0.5], y: 0, scale: rose.size }}
          transition={{
            opacity: { duration: 2.6, delay: rose.delay, repeat: Infinity, repeatType: "mirror" },
            y: { duration: 0.8, delay: rose.delay, ease: [0.16, 1, 0.3, 1] },
            scale: { duration: 0.8, delay: rose.delay, ease: [0.16, 1, 0.3, 1] }
          }}
        >
          <span className="relative h-8 w-8 drop-shadow-[0_0_14px_rgba(251,113,133,0.7)]">
            <span className="absolute left-1/2 top-1/2 h-5 w-3 -translate-x-1/2 -translate-y-1/2 rounded-[70%_30%_70%_30%] bg-rose-200 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.7),inset_-2px_-2px_4px_rgba(190,18,60,0.35)]" />
            <span className="absolute left-[4px] top-[7px] h-4 w-3 -rotate-[32deg] rounded-[80%_25%_75%_35%] bg-rose-400 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.45),inset_-2px_-2px_3px_rgba(159,18,57,0.4)]" />
            <span className="absolute right-[4px] top-[7px] h-4 w-3 rotate-[32deg] rounded-[25%_80%_35%_75%] bg-rose-500 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.36),inset_-2px_-2px_3px_rgba(136,19,55,0.45)]" />
            <span className="absolute bottom-[4px] left-[7px] h-4 w-4 rounded-[65%_35%_70%_40%] bg-rose-600 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.25),inset_-2px_-2px_3px_rgba(76,5,25,0.38)]" />
            <span className="absolute left-[11px] top-[11px] h-2.5 w-2.5 rounded-full bg-pink-100/85 shadow-[0_0_10px_rgba(255,228,230,0.75)]" />
          </span>
          <span className="-mt-1 h-12 w-1 rounded-full bg-emerald-300/60 shadow-[0_0_12px_rgba(110,231,183,0.28)]" />
        </motion.span>
      ))}
      <AnimatePresence>
        {activeId ? (
          <motion.div
            key={activeId}
            className="absolute inset-0 bg-[radial-gradient(circle_at_46%_55%,rgba(255,228,230,0.16),transparent_34%)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SurfacePatches({ activeId, articles }: { activeId: string | null; articles: Article[] }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {articles.map((article) => {
        const active = article.id === activeId;

        return (
          <motion.span
            key={article.id}
            className={[
              "absolute rounded-[55%_45%_62%_38%] border border-rose-100/16 bg-rose-100/8 backdrop-blur-[1px]",
              article.patch.size
            ].join(" ")}
            style={{
              left: article.patch.left,
              top: article.patch.top,
              boxShadow: active
                ? `0 0 36px ${article.tint}, inset 0 0 22px rgba(255,255,255,0.16)`
                : "inset 0 0 18px rgba(255,255,255,0.07)"
            }}
            animate={{
              opacity: active ? 0.92 : 0.28,
              scale: active ? 1.08 : 1,
              rotate: active ? -2 : 0
            }}
            transition={{ type: "spring", stiffness: 150, damping: 18 }}
          />
        );
      })}
      <svg className="absolute inset-0 h-full w-full opacity-35" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M35 58 C 44 46, 51 47, 60 38" fill="none" stroke="rgba(255,228,230,0.32)" strokeWidth="0.22" strokeDasharray="1 1" />
        <path d="M38 67 C 45 61, 54 60, 67 61" fill="none" stroke="rgba(255,228,230,0.28)" strokeWidth="0.22" strokeDasharray="1 1" />
        <path d="M53 42 C 51 52, 47 60, 45 70" fill="none" stroke="rgba(255,228,230,0.22)" strokeWidth="0.2" strokeDasharray="1 1" />
      </svg>
    </div>
  );
}

function GlowParticles({ tint }: { tint: string }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {Array.from({ length: 11 }, (_, index) => (
        <motion.span
          key={index}
          className="absolute h-1.5 w-1.5 rounded-full blur-[1px]"
          style={{
            left: `${9 + ((index * 17) % 82)}%`,
            top: `${18 + ((index * 23) % 64)}%`,
            backgroundColor: tint
          }}
          initial={{ opacity: 0, scale: 0.2, y: 12 }}
          animate={{ opacity: [0, 0.9, 0], scale: [0.2, 1.2, 0.4], y: [-4, -24, -38] }}
          transition={{ duration: 0.9, delay: index * 0.025, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

function ArticleCard({
  article,
  index,
  onHover,
  onOpen
}: {
  article: Article;
  index: number;
  onHover: (id: string | null) => void;
  onOpen: (article: Article) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      type="button"
      onPointerEnter={() => {
        setHovered(true);
        onHover(article.id);
      }}
      onPointerLeave={() => {
        setHovered(false);
        onHover(null);
      }}
      onClick={() => onOpen(article)}
      className="relative block w-full cursor-pointer overflow-hidden rounded-2xl border border-white/14 bg-white/[0.075] p-5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_16px_40px_rgba(20,4,18,0.24)]"
      initial={{ opacity: 0, y: 24, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      whileHover={{ y: 8, scale: 0.992, rotateX: -3 }}
      transition={{ type: "spring", stiffness: 220, damping: 20, delay: 0.18 + index * 0.08 }}
    >
      <motion.div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-100/70 to-transparent"
        animate={{ x: hovered ? ["-120%", "120%"] : "-120%" }}
        transition={{ duration: 0.72, ease: "easeOut" }}
      />
      <AnimatePresence>{hovered ? <GlowParticles tint={article.tint} /> : null}</AnimatePresence>
      <div className="relative z-10 flex items-start justify-between gap-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-rose-100/58">
            {article.category}
          </p>
          <h2 className="mt-3 font-display text-2xl leading-tight text-starlight sm:text-3xl">
            <ScrambleText text={article.title} delay={180 + index * 90} />
          </h2>
        </div>
        <span className="rounded-full border border-rose-100/18 bg-rose-100/8 px-3 py-1 text-xs text-rose-100/70">
          {article.date}
        </span>
      </div>
      <p className="relative z-10 mt-4 text-sm leading-7 text-starlight/58">{article.excerpt}</p>
      <div className="relative z-10 mt-5 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-emerald-200/18 bg-emerald-200/8 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-emerald-100/70">
          {article.status}
        </span>
        {article.links.map((link) => (
          <span
            key={link}
            className="rounded-full border border-rose-100/12 bg-rose-100/7 px-3 py-1 text-xs text-rose-100/56"
          >
            [[{link}]]
          </span>
        ))}
      </div>
    </motion.button>
  );
}

function ArticleDetail({
  article,
  isLoading,
  onClose
}: {
  article: Article;
  isLoading: boolean;
  onClose: () => void;
}) {
  return (
    <motion.section
      className="fixed inset-x-4 bottom-5 top-20 z-50 mx-auto flex max-w-4xl flex-col rounded-[1.7rem] border border-rose-100/20 bg-[#1e0b18]/86 p-5 text-left shadow-[0_30px_110px_rgba(20,4,18,0.65),inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-xl sm:p-6"
      initial={{ opacity: 0, y: 42, scale: 0.94, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: 36, scale: 0.96, filter: "blur(12px)" }}
      transition={{ type: "spring", stiffness: 130, damping: 18 }}
    >
      <div className="flex shrink-0 items-start justify-between gap-5 border-b border-white/10 pb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.34em] text-comet/70">{article.category}</p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-starlight sm:text-6xl">{article.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-starlight/55">{article.excerpt}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-xs uppercase tracking-[0.2em] text-rose-100/75"
        >
          关闭
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto py-5 pr-1">
        {isLoading ? (
          <p className="text-sm text-starlight/50">正在穿过大气层读取正文...</p>
        ) : (
          <pre className="whitespace-pre-wrap break-words font-sans text-base leading-8 text-starlight/72">
            {article.content || "这篇文章还没有正文。可以去 /admin 写入 Markdown 后发布。"}
          </pre>
        )}
        <ContentEngagement targetType="post" targetSlug={article.id} />
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 border-t border-white/10 pt-4">
        {article.links.map((link) => (
          <span key={link} className="rounded-full border border-rose-100/14 bg-rose-100/8 px-3 py-1 text-xs text-rose-100/60">
            [[{link}]]
          </span>
        ))}
      </div>
    </motion.section>
  );
}

export default function BlogPage() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [leaving, setLeaving] = useState(false);
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>(fallbackArticles);
  const [sourceLabel, setSourceLabel] = useState("示例花田");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const rawMouseX = useMotionValue(0.55);
  const rawMouseY = useMotionValue(0.55);
  const mouseX = useSpring(rawMouseX, { stiffness: 55, damping: 22, mass: 0.8 });
  const mouseY = useSpring(rawMouseY, { stiffness: 55, damping: 22, mass: 0.8 });
  const planetX = useTransform(mouseX, [0, 1], [-18, 16]);
  const planetY = useTransform(mouseY, [0, 1], [-10, 12]);

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    rawMouseX.set(event.clientX / window.innerWidth);
    rawMouseY.set(event.clientY / window.innerHeight);
  }

  function returnToSpace() {
    setLeaving(true);
    window.sessionStorage.setItem("return-to-planet-map", "1");
    dispatchSpaceEvent("spaceship-boost", 900);
    dispatchSpaceEvent("cosmic-warp", 900);
    window.setTimeout(() => router.push("/?view=map"), prefersReducedMotion ? 0 : 620);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      try {
        const response = await fetch("/api/posts?limit=24&award=read", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "无法读取文章");
        const nextArticles = Array.isArray(data.posts) ? data.posts.map(mapPostToArticle) : [];
        if (!cancelled && nextArticles.length > 0) {
          setArticles(nextArticles);
          setSourceLabel("数据库花田");
        }
      } catch {
        if (!cancelled) setSourceLabel("示例花田");
      }
    }

    void loadPosts();

    return () => {
      cancelled = true;
    };
  }, []);

  async function openArticle(article: Article) {
    setSelectedArticle(article);
    setActiveArticleId(article.id);

    if (article.content) return;

    setIsLoadingDetail(true);
    try {
      const response = await fetch(`/api/posts/${article.id}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "无法读取正文");
      const hydrated = mapPostToArticle(data.post, articles.findIndex((item) => item.id === article.id));
      setSelectedArticle(hydrated);
      setArticles((current) => current.map((item) => (item.id === hydrated.id ? hydrated : item)));
    } catch {
      setSelectedArticle(article);
    } finally {
      setIsLoadingDetail(false);
    }
  }

  return (
    <motion.main
      onPointerMove={handlePointerMove}
      className="relative z-10 min-h-dvh overflow-hidden px-5 py-6 text-starlight sm:px-8 lg:px-12"
      initial={{ opacity: 0, scale: 1.06, filter: "blur(14px)" }}
      animate={
        leaving
          ? { opacity: 0, scale: 0.82, filter: "blur(18px)" }
          : { opacity: 1, scale: 1, filter: "blur(0px)" }
      }
      transition={{ duration: 0.64, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.button
        type="button"
        onClick={returnToSpace}
        whileHover={{ x: -3, scale: 1.03 }}
        whileTap={{ scale: 0.94 }}
        className="fixed left-5 top-5 z-40 rounded-full border border-comet/30 bg-[#2b1020]/45 px-4 py-2 text-xs uppercase tracking-[0.24em] text-comet shadow-[0_0_28px_rgba(245,200,75,0.12)] backdrop-blur-md sm:left-8 sm:top-8"
      >
        启动引擎 / 返航
      </motion.button>

      <section className="relative grid min-h-[calc(100dvh-3rem)] grid-cols-1 items-center gap-6 pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.86fr)] lg:pt-0">
        <div className="relative min-h-[42dvh] overflow-hidden rounded-[2rem] lg:min-h-[82dvh]">
          <motion.div
            layoutId="blog-planet"
            className="absolute -bottom-[42%] -left-[36%] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle_at_34%_24%,rgba(255,255,255,0.52),transparent_0_15%),radial-gradient(circle_at_68%_75%,rgba(120,24,60,0.5),transparent_0_58%),linear-gradient(135deg,#ffd7e5,#fb7185_45%,#be185d)] shadow-[inset_42px_50px_80px_rgba(255,255,255,0.24),inset_-90px_-86px_120px_rgba(136,19,55,0.52),0_0_110px_rgba(251,113,133,0.26)] sm:h-[48rem] sm:w-[48rem] lg:-bottom-[30%] lg:-left-[28%] lg:h-[58rem] lg:w-[58rem]"
            style={{ x: planetX, y: planetY }}
            transition={{ type: "spring", stiffness: 82, damping: 18, mass: 1.1 }}
          />
          <SurfacePatches activeId={activeArticleId} articles={articles} />
          <RoseField mouseX={mouseX} mouseY={mouseY} activeId={activeArticleId} />
          <div className="absolute left-6 top-7 max-w-md sm:left-10">
            <p className="text-[10px] uppercase tracking-[0.38em] text-rose-100/60">
              Atmospheric Descent
            </p>
            <h1 className="mt-3 font-display text-5xl leading-none text-starlight sm:text-7xl">
              Blog 星球
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-starlight/58">
              每篇文章都对应星球表面的一块地貌。掠过右侧卡片，左侧花田会亮起它的生长位置、反向链接和主题枝蔓。
            </p>
          </div>
        </div>

        <motion.aside
          className="flex max-h-[78dvh] min-h-0 flex-col rounded-[1.6rem] border border-white/20 bg-white/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_24px_90px_rgba(20,4,18,0.38)] backdrop-blur-md sm:p-5"
          initial={{ opacity: 0, x: 42 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.72, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="shrink-0 rounded-2xl border border-white/12 bg-[#2b1020]/58 p-4 text-left backdrop-blur-xl">
            <p className="text-[10px] uppercase tracking-[0.34em] text-comet/70">Rose Control Deck</p>
            <h2 className="mt-2 font-display text-3xl text-starlight">低空阅读航线</h2>
            <p className="mt-3 text-xs leading-6 text-starlight/48">
              Digital garden mode: 草稿会发芽，成熟文章会常青，双链以 [[主题]] 形式露出。
              <span className="mt-2 block text-comet/62">当前数据源：{sourceLabel}</span>
            </p>
          </div>
          <div className="mt-4 min-h-0 space-y-4 overflow-y-auto pr-1">
            {articles.map((article, index) => (
              <ArticleCard
                key={article.id}
                article={article}
                index={index}
                onHover={setActiveArticleId}
                onOpen={openArticle}
              />
            ))}
          </div>
        </motion.aside>
      </section>
      <AnimatePresence>
        {selectedArticle ? (
          <ArticleDetail
            article={selectedArticle}
            isLoading={isLoadingDetail}
            onClose={() => setSelectedArticle(null)}
          />
        ) : null}
      </AnimatePresence>
    </motion.main>
  );
}
