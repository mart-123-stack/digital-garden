"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { ContentEngagement } from "@/components/ContentEngagement";

type NoteStatus = "seedling" | "budding" | "evergreen";

type Note = {
  id: string;
  title: string;
  summary: string;
  cluster: "PKM" | "Interface" | "Writing" | "Systems" | "Life";
  status: NoteStatus;
  content?: string;
  featured?: boolean;
  tags: string[];
  links: string[];
  size: number;
  shape: string;
  tint: string;
};

type VisibleNote = Note & {
  angle: number;
  radius: number;
};

type NoteApiRow = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content?: string;
  cluster?: string;
  status?: string;
  tags?: unknown;
  links?: unknown;
  published?: boolean;
};

const MAX_RING_NOTES = 16;
const clusters = ["All", "PKM", "Interface", "Writing", "Systems", "Life"] as const;
const statuses = ["all", "seedling", "budding", "evergreen"] as const;

const rockShapes = [
  "polygon(18% 5%, 78% 0, 100% 34%, 84% 88%, 28% 100%, 0 60%)",
  "polygon(25% 0, 92% 14%, 84% 78%, 42% 100%, 0 68%, 8% 22%)",
  "polygon(8% 18%, 62% 0, 100% 28%, 88% 74%, 52% 100%, 0 82%)",
  "polygon(31% 0, 100% 20%, 78% 92%, 24% 100%, 0 44%)",
  "polygon(20% 8%, 70% 0, 100% 46%, 72% 94%, 22% 100%, 0 42%)"
];

const rockTints = [
  "rgba(245,200,75,0.52)",
  "rgba(148,163,184,0.62)",
  "rgba(232,93,117,0.42)",
  "rgba(110,231,183,0.48)",
  "rgba(125,211,252,0.46)"
];

function normalizeStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

function normalizeCluster(value: string | undefined): Note["cluster"] {
  return clusters.includes(value as Note["cluster"]) && value !== "All" ? (value as Note["cluster"]) : "PKM";
}

function normalizeStatus(value: string | undefined): NoteStatus {
  return value === "budding" || value === "evergreen" ? value : "seedling";
}

function mapApiNote(note: NoteApiRow, index: number): Note {
  const safeIndex = Math.max(index, 0);

  return {
    id: note.slug,
    title: note.title,
    summary: note.summary || "这块碎片还没有摘要。",
    content: note.content,
    cluster: normalizeCluster(note.cluster),
    status: normalizeStatus(note.status),
    featured: index < 6,
    tags: normalizeStringList(note.tags),
    links: normalizeStringList(note.links),
    size: 54 + ((safeIndex * 11) % 28),
    shape: rockShapes[safeIndex % rockShapes.length],
    tint: rockTints[safeIndex % rockTints.length]
  };
}

function dispatchSpaceEvent(name: string, duration = 900) {
  window.dispatchEvent(new CustomEvent(name, { detail: { duration } }));
}

function layoutNotes(items: Note[]): VisibleNote[] {
  const count = Math.min(items.length, MAX_RING_NOTES);

  return items.slice(0, MAX_RING_NOTES).map((note, index) => ({
    ...note,
    angle: -90 + (360 / Math.max(count, 1)) * index,
    radius: 196 + ((index * 37) % 66)
  }));
}

function polarToPoint(angle: number, radius: number) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: Math.cos(radians) * radius,
    y: Math.sin(radians) * radius
  };
}

function FragmentRock({
  note,
  mouse,
  selected,
  onHover,
  onSelect
}: {
  note: VisibleNote;
  mouse: { x: number; y: number };
  selected: boolean;
  onHover: (note: VisibleNote | null) => void;
  onSelect: (note: VisibleNote) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 130, damping: 16, mass: 0.8 });
  const y = useSpring(rawY, { stiffness: 130, damping: 16, mass: 0.8 });
  const base = polarToPoint(note.angle, note.radius);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = mouse.x - centerX;
    const dy = mouse.y - centerY;
    const distance = Math.hypot(dx, dy);

    if (distance > 190) {
      rawX.set(0);
      rawY.set(0);
      return;
    }

    const force = -22 * (1 - distance / 190);
    rawX.set((dx / Math.max(distance, 1)) * force);
    rawY.set((dy / Math.max(distance, 1)) * force);
  }, [mouse, rawX, rawY]);

  return (
    <div
      className="absolute left-1/2 top-1/2 z-20"
      style={{
        width: note.size,
        height: note.size,
        marginLeft: -note.size / 2,
        marginTop: -note.size / 2,
        transform: `translate3d(${base.x}px, ${base.y}px, 0)`
      }}
    >
      <motion.button
        ref={ref}
        type="button"
        aria-label={`打开笔记：${note.title}`}
        onPointerEnter={() => onHover(note)}
        onPointerLeave={() => onHover(null)}
        onClick={() => onSelect(note)}
        className="relative flex h-full w-full items-center justify-center outline-none"
        style={{
          x,
          y
        }}
        whileTap={{ scale: 0.92 }}
      >
        <motion.span
          className="relative block h-full w-full bg-[linear-gradient(135deg,#d4d4d8,#71717a_48%,#27272a)]"
          style={{
            clipPath: note.shape,
            boxShadow: selected
              ? `inset 8px 9px 16px rgba(255,255,255,0.18), inset -14px -16px 26px rgba(24,24,27,0.64), 0 0 46px ${note.tint}`
              : "inset 7px 8px 14px rgba(255,255,255,0.14), inset -12px -14px 24px rgba(24,24,27,0.62), 0 12px 26px rgba(2,6,23,0.32)"
          }}
          animate={{ rotate: selected ? 4 : 0, scale: selected ? 1.12 : 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 15 }}
        >
          <span className="absolute left-[18%] top-[22%] h-px w-[62%] rotate-12 bg-comet/40" />
          <span className="absolute left-[34%] top-[18%] h-[58%] w-px -rotate-12 bg-white/18" />
          <span className="absolute right-[22%] top-[45%] h-px w-[35%] -rotate-6 bg-white/16" />
        </motion.span>
      </motion.button>
      <motion.span
        className="pointer-events-none absolute top-full mt-3 w-40 rounded-xl border border-white/12 bg-black/35 px-3 py-2 text-center text-xs leading-5 text-starlight/80 backdrop-blur-md"
        initial={false}
        animate={{ opacity: selected ? 1 : 0, y: selected ? 0 : -6 }}
      >
        {note.title}
      </motion.span>
    </div>
  );
}

function ConstellationLines({ visibleNotes }: { visibleNotes: VisibleNote[] }) {
  const connections = visibleNotes
    .flatMap((note, index) =>
      visibleNotes
        .slice(index + 1)
        .map((target, offset) => ({ note, target, from: index, to: index + offset + 1 }))
        .filter(({ note, target }) =>
          note.tags.some((tag) => target.tags.includes(tag)) ||
          note.links.some((link) => target.title.includes(link) || target.tags.includes(link))
        )
    )
    .slice(0, 18);

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 opacity-55"
      viewBox="-310 -310 620 620"
    >
      {connections.map(({ note, target, from, to }) => {
        const start = polarToPoint(note.angle, note.radius);
        const end = polarToPoint(target.angle, target.radius);

        return (
          <line
            key={`${from}-${to}`}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke="rgba(245,200,75,0.22)"
            strokeWidth="1"
            strokeDasharray="4 8"
          />
        );
      })}
    </svg>
  );
}

function BentoPanel({ note, isLoading, onClose }: { note: Note; isLoading: boolean; onClose: () => void }) {
  return (
    <>
      <motion.div
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-slate-950/90 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
      />
      <motion.section
        key={note.id}
        className="fixed inset-x-5 bottom-5 top-24 z-50 mx-auto flex max-w-5xl flex-col overflow-hidden rounded-[1.7rem] border border-white/20 bg-[#020617] p-4 text-left shadow-[0_24px_90px_rgba(0,0,0,0.86),inset_0_1px_0_rgba(255,255,255,0.16)] sm:p-5 lg:top-20"
        initial={{ opacity: 0, scale: 0.72, y: 80, filter: "blur(12px)" }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, scale: 0.78, y: 60, filter: "blur(12px)" }}
        transition={{ type: "spring", stiffness: 130, damping: 18, mass: 0.9 }}
      >
      <button
        type="button"
        onClick={onClose}
        className="mb-4 rounded-full border border-white/16 bg-white/8 px-4 py-2 text-xs uppercase tracking-[0.22em] text-comet/80"
      >
        返回星环
      </button>
      <div className="min-h-0 flex-1 overflow-y-auto rounded-[1.35rem] bg-slate-950/96 pr-1">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-3xl border border-white/12 bg-slate-900/92 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <p className="text-[10px] uppercase tracking-[0.36em] text-comet/70">Flattened Fragment</p>
          <h1 className="mt-4 font-display text-4xl leading-tight text-starlight sm:text-6xl">
            {note.title}
          </h1>
          <p className="mt-5 text-base leading-8 text-starlight/62">{note.summary}</p>
          {isLoading ? (
            <p className="mt-6 rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm leading-7 text-starlight/48">
              正在解析这块知识碎片的晶体脉络...
            </p>
          ) : note.content ? (
            <pre className="mt-6 max-h-72 overflow-y-auto whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-black/32 p-5 font-sans text-sm leading-7 text-starlight/76">
              {note.content}
            </pre>
          ) : (
            <p className="mt-6 rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm leading-7 text-starlight/45">
              这块碎片还没有正文。可以在 /admin 里继续给它嫁接 Markdown 内容。
            </p>
          )}
          <p className="mt-6 inline-flex rounded-full border border-emerald-200/18 bg-emerald-200/8 px-3 py-1 text-xs uppercase tracking-[0.24em] text-emerald-100/74">
            {note.status}
          </p>
          <ContentEngagement targetType="note" targetSlug={note.id} />
        </article>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-3xl border border-white/12 bg-slate-900/88 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-starlight/44">Tags</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {note.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-comet/18 bg-comet/8 px-3 py-1 text-xs text-comet/80">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-white/12 bg-slate-900/88 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-starlight/44">Linked Notes</p>
            <div className="mt-4 space-y-2">
              {note.links.map((link) => (
                <p key={link} className="rounded-2xl bg-white/[0.06] px-3 py-2 text-sm text-starlight/64">
                  [[{link}]]
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
      </motion.section>
    </>
  );
}

export default function NotesPage() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [notes, setNotes] = useState<Note[]>([]);
  const [sourceLabel, setSourceLabel] = useState("数据库星环");
  const [activeCluster, setActiveCluster] = useState<(typeof clusters)[number]>("All");
  const [activeStatus, setActiveStatus] = useState<(typeof statuses)[number]>("all");
  const [query, setQuery] = useState("");
  const [hovered, setHovered] = useState<VisibleNote | null>(null);
  const [selected, setSelected] = useState<Note | null>(null);
  const [isLoadingSelected, setIsLoadingSelected] = useState(false);
  const filteredNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return notes.filter((note) => {
      const clusterMatches = activeCluster === "All" || note.cluster === activeCluster;
      const statusMatches = activeStatus === "all" || note.status === activeStatus;
      const queryMatches =
        normalizedQuery.length === 0 ||
        [note.title, note.summary, note.cluster, note.status, ...note.tags, ...note.links]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return clusterMatches && statusMatches && queryMatches;
    });
  }, [activeCluster, activeStatus, query]);
  const visibleNotes = useMemo(() => layoutNotes(filteredNotes), [filteredNotes]);

  useEffect(() => {
    let cancelled = false;

    async function loadNotes() {
      try {
        const response = await fetch("/api/notes?award=read", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "无法读取笔记");
        const nextNotes = Array.isArray(data.notes) ? data.notes.map(mapApiNote) : [];
        if (!cancelled && nextNotes.length > 0) {
          setNotes(nextNotes);
          setSourceLabel("数据库星环");
        }
      } catch {
        if (!cancelled) setSourceLabel("数据库暂未连接");
      }
    }

    void loadNotes();

    return () => {
      cancelled = true;
    };
  }, []);

  function prepareReturnToMap() {
    window.sessionStorage.setItem("return-to-planet-map", "1");
    dispatchSpaceEvent("spaceship-boost", 860);
    dispatchSpaceEvent("cosmic-warp", 860);
  }

  async function openNote(note: VisibleNote) {
    setSelected(note);

    if (note.content) return;

    setIsLoadingSelected(true);
    try {
      const response = await fetch(`/api/notes/${note.id}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "无法读取笔记正文");
      const hydrated = mapApiNote(data.note, notes.findIndex((item) => item.id === note.id));
      setSelected(hydrated);
      setNotes((current) => current.map((item) => (item.id === hydrated.id ? hydrated : item)));
    } catch {
      setSelected(note);
    } finally {
      setIsLoadingSelected(false);
    }
  }

  return (
    <motion.main
      onPointerMove={(event) => setMouse({ x: event.clientX, y: event.clientY })}
      className="relative z-10 min-h-dvh overflow-hidden px-5 py-6 text-starlight sm:px-8 lg:px-12"
      initial={{ opacity: 0, scale: 1.04, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.68, ease: [0.16, 1, 0.3, 1] }}
    >
      <a
        href="/?view=map"
        onClick={prepareReturnToMap}
        className="fixed left-5 top-5 z-50 rounded-full border border-comet/30 bg-[#090b10]/55 px-4 py-2 text-xs uppercase tracking-[0.24em] text-comet shadow-[0_0_28px_rgba(245,200,75,0.12)] backdrop-blur-md sm:left-8 sm:top-8"
      >
        启动引擎 / 返航
      </a>

      <motion.div
        aria-hidden="true"
        layoutId="notes-planet"
        className="absolute -bottom-[42rem] left-1/2 h-[68rem] w-[86rem] -translate-x-1/2 rounded-[50%_50%_0_0] bg-[radial-gradient(circle_at_36%_16%,rgba(255,255,255,0.32),transparent_0_14%),radial-gradient(circle_at_72%_54%,rgba(24,24,27,0.6),transparent_0_58%),linear-gradient(135deg,#d4d4d8,#71717a_48%,#27272a)] shadow-[inset_42px_50px_88px_rgba(255,255,255,0.13),inset_-88px_-82px_120px_rgba(24,24,27,0.62),0_0_90px_rgba(245,200,75,0.1)]"
        transition={{ type: "spring", stiffness: 80, damping: 18, mass: 1.1 }}
      />

      <section className="relative mx-auto flex min-h-[calc(100dvh-3rem)] max-w-7xl flex-col items-center justify-center pt-20">
        <div className="absolute left-5 top-24 max-w-sm text-left sm:left-8 lg:left-0">
          <p className="text-[10px] uppercase tracking-[0.38em] text-comet/70">Knowledge Belt</p>
          <h1 className="mt-3 font-display text-5xl leading-none text-starlight sm:text-7xl">
            Notes 星环
          </h1>
          <p className="mt-5 text-sm leading-7 text-starlight/58">
            笔记不是列表，而是一圈受飞船气流拨动的碎石。星环只显示当前主题簇中的精选碎片，完整知识库通过搜索和过滤进入。
            <span className="mt-2 block text-comet/62">当前数据源：{sourceLabel}</span>
          </p>
          <div className="mt-5 rounded-2xl border border-white/12 bg-black/22 p-3 backdrop-blur-md">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索碎片、标签、反链"
              className="w-full rounded-xl border border-white/12 bg-white/8 px-3 py-2 text-sm text-starlight outline-none placeholder:text-starlight/34"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {clusters.map((cluster) => (
                <button
                  key={cluster}
                  type="button"
                  onClick={() => setActiveCluster(cluster)}
                  className={[
                    "rounded-full border px-3 py-1 text-[11px]",
                    activeCluster === cluster
                      ? "border-comet/42 bg-comet/16 text-comet"
                      : "border-white/12 bg-white/6 text-starlight/54"
                  ].join(" ")}
                >
                  {cluster}
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {statuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setActiveStatus(status)}
                  className={[
                    "rounded-full border px-3 py-1 text-[11px]",
                    activeStatus === status
                      ? "border-emerald-200/36 bg-emerald-200/12 text-emerald-100"
                      : "border-white/12 bg-white/6 text-starlight/48"
                  ].join(" ")}
                >
                  {status}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-starlight/42">
              显示 {visibleNotes.length} / {filteredNotes.length} 个匹配碎片，星环上限 {MAX_RING_NOTES}。
            </p>
          </div>
        </div>

        <div className="relative h-[650px] w-full max-w-[760px]">
          <ConstellationLines visibleNotes={visibleNotes} />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-comet/16"
            animate={{ rotate: 360 }}
            transition={{ duration: 86, ease: "linear", repeat: Infinity }}
          >
            <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-comet/50 shadow-[0_0_18px_rgba(245,200,75,0.5)]" />
            <span className="absolute bottom-8 right-24 h-1.5 w-1.5 rounded-full bg-sky-200/50 shadow-[0_0_14px_rgba(125,211,252,0.45)]" />
          </motion.div>
          <div
            className="absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2"
          >
            {visibleNotes.map((note) => (
              <FragmentRock
                key={note.id}
                note={note}
                mouse={mouse}
                selected={hovered?.id === note.id || selected?.id === note.id}
                onHover={setHovered}
                onSelect={(item) => void openNote(item)}
              />
            ))}
          </div>
          {visibleNotes.length === 0 ? (
            <div className="absolute left-1/2 top-1/2 z-20 w-72 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/12 bg-black/30 p-5 text-center text-sm leading-7 text-starlight/60 backdrop-blur-md">
              这片星环暂时没有匹配碎片。换个主题簇或搜索词试试。
            </div>
          ) : null}
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-comet/20 bg-comet/5 shadow-[0_0_50px_rgba(245,200,75,0.08)]" />
          <AnimatePresence>
            {hovered ? (
              <motion.div
                className="pointer-events-none absolute bottom-10 left-1/2 z-30 w-[min(92vw,28rem)] -translate-x-1/2 rounded-2xl border border-white/14 bg-black/34 p-4 text-center shadow-[0_18px_60px_rgba(2,6,23,0.32)] backdrop-blur-md"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <p className="text-[10px] uppercase tracking-[0.32em] text-comet/70">
                  Fragment Signal
                </p>
                <p className="mt-2 font-display text-2xl text-starlight">{hovered.title}</p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </section>

      <AnimatePresence>
        {selected ? <BentoPanel note={selected} isLoading={isLoadingSelected} onClose={() => setSelected(null)} /> : null}
      </AnimatePresence>
    </motion.main>
  );
}
