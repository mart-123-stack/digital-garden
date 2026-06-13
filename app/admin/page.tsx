"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";

type ContentMode = "post" | "note" | "about";

type ContentItem = {
  title: string;
  slug: string;
  published: boolean;
  updated_at?: string;
  created_at?: string;
};

type EditorForm = {
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverUrl: string;
  cluster: string;
  status: string;
  tags: string;
  links: string;
  published: boolean;
};

type AboutForm = {
  name: string;
  title: string;
  location: string;
  bio: string;
  avatarUrl: string;
  interests: string;
  experiences: string;
};

const emptyForm: EditorForm = {
  title: "",
  slug: "",
  summary: "",
  content: "",
  coverUrl: "",
  cluster: "PKM",
  status: "seedling",
  tags: "",
  links: "",
  published: false
};

const emptyAboutForm: AboutForm = {
  name: "",
  title: "",
  location: "",
  bio: "",
  avatarUrl: "",
  interests: "",
  experiences: ""
};

function normalizeList(payload: unknown, mode: ContentMode): ContentItem[] {
  if (!payload || typeof payload !== "object") return [];
  const value = mode === "post" ? (payload as { posts?: ContentItem[] }).posts : (payload as { notes?: ContentItem[] }).notes;
  return Array.isArray(value) ? value : [];
}

function stringifyList(value: unknown) {
  return Array.isArray(value) ? value.join(", ") : "";
}

function parseCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const [mode, setMode] = useState<ContentMode>("post");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [form, setForm] = useState<EditorForm>(emptyForm);
  const [aboutForm, setAboutForm] = useState<AboutForm>(emptyAboutForm);
  const [activeSlug, setActiveSlug] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement | null>(null);

  const canAdmin = user?.role === "admin";
  const modeLabel = mode === "post" ? "Blog" : mode === "note" ? "Notes" : "绿色星球";

  useEffect(() => {
    if (!canAdmin) return;
    if (mode === "about") {
      void loadAbout();
      return;
    }
    void loadList(mode);
  }, [canAdmin, mode]);

  async function loadList(nextMode: ContentMode) {
    setMessage("");
    try {
      const response = await fetch(`/api/${nextMode === "post" ? "posts" : "notes"}?drafts=true&limit=100`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "载入失败");
      setItems(normalizeList(data, nextMode));
    } catch (error) {
      setItems([]);
      setMessage(error instanceof Error ? error.message : "载入失败");
    }
  }

  async function loadDetail(item: ContentItem) {
    setMessage("");
    try {
      const response = await fetch(`/api/${mode === "post" ? "posts" : "notes"}/${item.slug}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "读取内容失败");
      const record = mode === "post" ? data.post : data.note;
      setActiveSlug(record.slug);
      setForm({
        title: record.title || "",
        slug: record.slug || "",
        summary: record.excerpt || record.summary || "",
        content: record.content || "",
        coverUrl: record.cover_url || "",
        cluster: record.cluster || "PKM",
        status: record.status || "seedling",
        tags: stringifyList(record.tags),
        links: stringifyList(record.links),
        published: Boolean(record.published)
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "读取内容失败");
    }
  }

  function switchMode(nextMode: ContentMode) {
    setMode(nextMode);
    setItems([]);
    setForm(emptyForm);
    setActiveSlug("");
    setMessage("");
  }

  async function loadAbout() {
    setMessage("");
    try {
      const response = await fetch("/api/about", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "读取 About 失败");
      const about = data.about || {};
      setAboutForm({
        name: about.name || "Sylvie Chu",
        title: about.title || "",
        location: about.location || "",
        bio: about.bio || "",
        avatarUrl: about.avatar_url || "",
        interests: stringifyList(about.interests),
        experiences: Array.isArray(about.experiences)
          ? about.experiences.map((item: { label?: string; text?: string }) => `${item.label || "Now"}: ${item.text || ""}`).join("\n")
          : ""
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "读取 About 失败");
    }
  }

  function parseExperiences(value: string) {
    return value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, ...rest] = line.split(":");
        return {
          label: label.trim() || "Now",
          text: rest.join(":").trim() || line
        };
      });
  }

  async function saveAbout() {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/about", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: aboutForm.name,
          title: aboutForm.title,
          location: aboutForm.location,
          bio: aboutForm.bio,
          avatarUrl: aboutForm.avatarUrl || null,
          interests: parseCsv(aboutForm.interests),
          experiences: parseExperiences(aboutForm.experiences)
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "保存 About 失败");
      setMessage("绿色星球已更新。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存 About 失败");
    } finally {
      setIsSaving(false);
    }
  }

  function updateField<Key extends keyof EditorForm>(key: Key, value: EditorForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function newDraft() {
    setActiveSlug("");
    setForm(emptyForm);
    setMessage("新的草稿舱已经清空。");
  }

  async function uploadImage(file: File) {
    setIsUploading(true);
    setMessage("");

    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "上传失败");

      const markdown = `\n![${file.name}](${data.url})\n`;
      const element = contentRef.current;
      const start = element?.selectionStart ?? form.content.length;
      const end = element?.selectionEnd ?? form.content.length;
      const nextContent = `${form.content.slice(0, start)}${markdown}${form.content.slice(end)}`;
      setForm((current) => ({
        ...current,
        content: nextContent,
        coverUrl: current.coverUrl || data.url
      }));
      setMessage("图片已上传，并插入到 Markdown 正文。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "上传失败");
    } finally {
      setIsUploading(false);
    }
  }

  async function uploadAboutAvatar(file: File) {
    setIsUploading(true);
    setMessage("");

    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "头像上传失败");

      setAboutForm((current) => ({ ...current, avatarUrl: data.url }));
      setMessage("舰长头像已上传。保存绿色星球后会正式显示。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "头像上传失败");
    } finally {
      setIsUploading(false);
    }
  }

  async function saveContent() {
    setIsSaving(true);
    setMessage("");

    try {
      const endpoint = mode === "post" ? "posts" : "notes";
      const payload =
        mode === "post"
          ? {
              title: form.title,
              slug: form.slug,
              excerpt: form.summary,
              content: form.content,
              coverUrl: form.coverUrl || null,
              tags: parseCsv(form.tags),
              published: form.published
            }
          : {
              title: form.title,
              slug: form.slug,
              summary: form.summary,
              content: form.content,
              cluster: form.cluster,
              status: form.status,
              tags: parseCsv(form.tags),
              links: parseCsv(form.links),
              published: form.published
            };

      const response = await fetch(activeSlug ? `/api/${endpoint}/${activeSlug}` : `/api/${endpoint}`, {
        method: activeSlug ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "保存失败");

      const saved = mode === "post" ? data.post : data.note;
      setActiveSlug(saved.slug);
      setForm((current) => ({ ...current, slug: saved.slug, published: Boolean(saved.published) }));
      setMessage(form.published ? "已发布到星图。" : "草稿已保存。");
      await loadList(mode);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    } finally {
      setIsSaving(false);
    }
  }

  const wordCount = useMemo(() => form.content.trim().split(/\s+/).filter(Boolean).length, [form.content]);

  if (isLoading) {
    return <main className="relative z-10 min-h-dvh" />;
  }

  if (!canAdmin) {
    return (
      <main className="relative z-10 flex min-h-dvh items-center justify-center px-5 py-24 text-starlight">
        <motion.section
          className="w-full max-w-xl rounded-[2rem] border border-cyan-200/18 bg-slate-950/55 p-8 text-center shadow-[0_30px_100px_rgba(8,47,73,0.45),inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-xl"
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 130, damping: 18 }}
        >
          <p className="text-[10px] uppercase tracking-[0.44em] text-cyan-100/55">Admin Hatch</p>
          <h1 className="mt-4 font-display text-5xl text-starlight">管理舱需要舰长权限</h1>
          <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-starlight/55">
            登录管理员账号后，可以上传图片、编辑 Blog 与 Notes，并把 Markdown 内容发布到数字花园。
          </p>
          <Link
            href="/login?next=/admin"
            className="mt-7 inline-flex rounded-full border border-comet/35 bg-comet/14 px-6 py-3 text-sm font-medium tracking-[0.2em] text-comet"
          >
            请求进入
          </Link>
        </motion.section>
      </main>
    );
  }

  return (
    <main className="relative z-10 min-h-dvh overflow-hidden px-4 py-20 text-starlight sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-24 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.18),transparent_62%)]" />
      <div className="mx-auto grid w-full max-w-7xl gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <motion.aside
          className="rounded-[1.75rem] border border-white/12 bg-slate-950/50 p-4 shadow-[0_24px_80px_rgba(2,6,23,0.35),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 130, damping: 20 }}
        >
          <div className="flex rounded-full border border-white/10 bg-white/5 p-1">
            {(["post", "note", "about"] as ContentMode[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => switchMode(item)}
                className={`flex-1 rounded-full px-4 py-2 text-xs font-medium tracking-[0.2em] transition ${
                  mode === item ? "bg-cyan-100 text-slate-950" : "text-starlight/55 hover:text-starlight"
                }`}
              >
                {item === "post" ? "BLOG" : item === "note" ? "NOTES" : "绿星球"}
              </button>
            ))}
          </div>

          {mode === "about" ? (
            <button
              type="button"
              onClick={() => void loadAbout()}
              className="mt-4 w-full rounded-2xl border border-emerald-200/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
            >
              重新读取绿色星球
            </button>
          ) : (
            <button
              type="button"
              onClick={newDraft}
              className="mt-4 w-full rounded-2xl border border-amber-200/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
            >
              新建 {modeLabel}
            </button>
          )}

          <div className="mt-5 space-y-2">
            {items.map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => void loadDetail(item)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  activeSlug === item.slug
                    ? "border-cyan-200/35 bg-cyan-200/12"
                    : "border-white/10 bg-white/5 hover:border-white/18 hover:bg-white/8"
                }`}
              >
                <span className="block truncate text-sm text-starlight">{item.title || "未命名草稿"}</span>
                <span className="mt-1 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-starlight/35">
                  <span>{item.slug}</span>
                  <span>{item.published ? "Live" : "Draft"}</span>
                </span>
              </button>
            ))}
            {mode === "about" ? (
              <p className="rounded-2xl border border-emerald-100/12 bg-emerald-100/6 p-4 text-sm leading-7 text-emerald-50/56">
                这里直接修改 About Me 绿色星球：舰长头像、姓名、介绍、兴趣和经历都会同步到前台。
              </p>
            ) : null}
            {mode !== "about" && items.length === 0 ? <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-starlight/45">暂无内容或数据库未连接。</p> : null}
          </div>
        </motion.aside>

        <motion.section
          className="rounded-[2rem] border border-white/12 bg-slate-950/48 p-4 shadow-[0_34px_110px_rgba(2,6,23,0.42),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-xl sm:p-6"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        >
          <header className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.44em] text-cyan-100/50">Garden Console</p>
              <h1 className="mt-3 font-display text-4xl text-starlight sm:text-5xl">
                {mode === "about" ? "绿色星球编辑台" : "星际内容管理舱"}
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              {mode !== "about" ? (
                <label className="cursor-pointer rounded-full border border-white/12 bg-white/7 px-4 py-2 text-xs tracking-[0.2em] text-starlight/65 transition hover:bg-white/10">
                  {isUploading ? "上传中" : "上传图片"}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadImage(file);
                      event.target.value = "";
                    }}
                  />
                </label>
              ) : null}
              <button
                type="button"
                onClick={() => void (mode === "about" ? saveAbout() : saveContent())}
                disabled={isSaving || (mode !== "about" && !form.title.trim())}
                className="rounded-full border border-comet/35 bg-comet/16 px-5 py-2 text-xs font-medium tracking-[0.22em] text-comet disabled:opacity-45"
              >
                {isSaving ? "保存中" : mode === "about" ? "保存绿色星球" : form.published ? "发布" : "保存草稿"}
              </button>
            </div>
          </header>

          {message ? <p className="mt-4 rounded-2xl border border-cyan-200/16 bg-cyan-200/8 p-3 text-sm text-cyan-50/75">{message}</p> : null}

          {mode === "about" ? (
            <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-xs uppercase tracking-[0.22em] text-starlight/42">
                    舰长姓名
                    <input
                      value={aboutForm.name}
                      onChange={(event) => setAboutForm((current) => ({ ...current, name: event.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/7 px-4 py-3 text-sm normal-case tracking-normal text-starlight outline-none focus:border-cyan-200/30"
                      placeholder="Sylvie Chu"
                    />
                  </label>
                  <label className="text-xs uppercase tracking-[0.22em] text-starlight/42">
                    绿色星球标题
                    <input
                      value={aboutForm.title}
                      onChange={(event) => setAboutForm((current) => ({ ...current, title: event.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/7 px-4 py-3 text-sm normal-case tracking-normal text-starlight outline-none focus:border-cyan-200/30"
                      placeholder="Sylvie Chu 的宇宙驾驶舱"
                    />
                  </label>
                </div>
                <label className="block text-xs uppercase tracking-[0.22em] text-starlight/42">
                  位置 / Eyebrow
                  <input
                    value={aboutForm.location}
                    onChange={(event) => setAboutForm((current) => ({ ...current, location: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/7 px-4 py-3 text-sm normal-case tracking-normal text-starlight outline-none focus:border-cyan-200/30"
                    placeholder="B-612 Captain Station"
                  />
                </label>
                <label className="block text-xs uppercase tracking-[0.22em] text-starlight/42">
                  绿色星球正文 / 关于 Sylvie Chu
                  <textarea
                    value={aboutForm.bio}
                    onChange={(event) => setAboutForm((current) => ({ ...current, bio: event.target.value }))}
                    rows={10}
                    className="mt-2 w-full resize-y rounded-[1.5rem] border border-white/10 bg-slate-950/64 px-4 py-4 text-sm normal-case leading-7 tracking-normal text-cyan-50/82 outline-none focus:border-cyan-200/30"
                    placeholder={"用空行分段。这里会显示在 About 星球右侧，介绍这个宇宙的主人/舰长。"}
                  />
                </label>
              </div>
              <aside className="space-y-4">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 text-xs uppercase tracking-[0.22em] text-starlight/42">
                  <div className="flex items-center justify-between gap-3">
                    <span>舰长头像</span>
                    <label className="cursor-pointer rounded-full border border-emerald-100/18 bg-emerald-100/10 px-3 py-1.5 text-[11px] text-emerald-50/76 transition hover:bg-emerald-100/15">
                      {isUploading ? "上传中" : "上传头像"}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploading}
                        className="sr-only"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void uploadAboutAvatar(file);
                          event.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="relative h-20 w-20 overflow-hidden rounded-[42%_58%_50%_50%] border border-emerald-100/18 bg-emerald-100/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_0_30px_rgba(110,231,183,0.16)]">
                      {aboutForm.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={aboutForm.avatarUrl} alt="舰长头像预览" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center font-display text-3xl text-emerald-50/70">
                          {(aboutForm.name || "S").slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <label className="block">
                        Avatar URL
                        <input
                          value={aboutForm.avatarUrl}
                          onChange={(event) => setAboutForm((current) => ({ ...current, avatarUrl: event.target.value }))}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/7 px-4 py-3 text-sm normal-case tracking-normal text-starlight outline-none"
                          placeholder="/uploads/sylvie.png"
                        />
                      </label>
                    </div>
                  </div>
                </div>
                <label className="block rounded-[1.5rem] border border-white/10 bg-white/6 p-4 text-xs uppercase tracking-[0.22em] text-starlight/42">
                  Traits / Interests
                  <input
                    value={aboutForm.interests}
                    onChange={(event) => setAboutForm((current) => ({ ...current, interests: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/7 px-4 py-3 text-sm normal-case tracking-normal text-starlight outline-none"
                    placeholder="Creative Frontend, AI Native Workflow"
                  />
                </label>
                <label className="block rounded-[1.5rem] border border-white/10 bg-white/6 p-4 text-xs uppercase tracking-[0.22em] text-starlight/42">
                  Timeline
                  <textarea
                    value={aboutForm.experiences}
                    onChange={(event) => setAboutForm((current) => ({ ...current, experiences: event.target.value }))}
                    rows={7}
                    className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-white/7 px-4 py-3 text-sm normal-case leading-7 tracking-normal text-starlight outline-none"
                    placeholder={"Now: 正在修剪数字花园\nNext: 让星球彼此连线"}
                  />
                </label>
              </aside>
            </div>
          ) : (
          <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-xs uppercase tracking-[0.22em] text-starlight/42">
                  标题
                  <input
                    value={form.title}
                    onChange={(event) => updateField("title", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/7 px-4 py-3 text-sm normal-case tracking-normal text-starlight outline-none focus:border-cyan-200/30"
                    placeholder="一朵玫瑰的飞行日志"
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.22em] text-starlight/42">
                  Slug
                  <input
                    value={form.slug}
                    onChange={(event) => updateField("slug", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/7 px-4 py-3 text-sm normal-case tracking-normal text-starlight outline-none focus:border-cyan-200/30"
                    placeholder="rose-flight-log"
                  />
                </label>
              </div>

              <label className="block text-xs uppercase tracking-[0.22em] text-starlight/42">
                摘要
                <textarea
                  value={form.summary}
                  onChange={(event) => updateField("summary", event.target.value)}
                  rows={3}
                  className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/7 px-4 py-3 text-sm normal-case leading-7 tracking-normal text-starlight outline-none focus:border-cyan-200/30"
                  placeholder="这篇内容会如何出现在星球表面？"
                />
              </label>

              <label className="block text-xs uppercase tracking-[0.22em] text-starlight/42">
                Markdown
                <textarea
                  ref={contentRef}
                  value={form.content}
                  onChange={(event) => updateField("content", event.target.value)}
                  rows={18}
                  className="mt-2 w-full resize-y rounded-[1.5rem] border border-white/10 bg-slate-950/64 px-4 py-4 font-mono text-sm normal-case leading-7 tracking-normal text-cyan-50/82 outline-none focus:border-cyan-200/30"
                  placeholder={"# 标题\n\n写下你的星际笔记。上传图片后会自动插入 Markdown 图片语法。"}
                />
              </label>
            </div>

            <aside className="space-y-4">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
                <label className="flex items-center justify-between gap-3 text-sm text-starlight/70">
                  <span>发布到公开宇宙</span>
                  <input
                    checked={form.published}
                    onChange={(event) => updateField("published", event.target.checked)}
                    type="checkbox"
                    className="h-5 w-5 accent-cyan-200"
                  />
                </label>
                <p className="mt-3 text-xs leading-6 text-starlight/38">
                  当前 {wordCount} 个词块。草稿只有管理员列表可见；发布后会进入对应星球 API。
                </p>
              </div>

              {mode === "post" ? (
                <div className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
                  <label className="block text-xs uppercase tracking-[0.22em] text-starlight/42">
                    封面图 URL
                    <input
                      value={form.coverUrl}
                      onChange={(event) => updateField("coverUrl", event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/7 px-4 py-3 text-sm normal-case tracking-normal text-starlight outline-none"
                      placeholder="/uploads/rose.png"
                    />
                  </label>
                  <label className="block text-xs uppercase tracking-[0.22em] text-starlight/42">
                    Tags
                    <input
                      value={form.tags}
                      onChange={(event) => updateField("tags", event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/7 px-4 py-3 text-sm normal-case tracking-normal text-starlight outline-none"
                      placeholder="前端, 动画, 随笔"
                    />
                  </label>
                </div>
              ) : (
                <div className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
                  <label className="block text-xs uppercase tracking-[0.22em] text-starlight/42">
                    星群
                    <input
                      value={form.cluster}
                      onChange={(event) => updateField("cluster", event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/7 px-4 py-3 text-sm normal-case tracking-normal text-starlight outline-none"
                    />
                  </label>
                  <label className="block text-xs uppercase tracking-[0.22em] text-starlight/42">
                    状态
                    <select
                      value={form.status}
                      onChange={(event) => updateField("status", event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm normal-case tracking-normal text-starlight outline-none"
                    >
                      <option value="seedling">seedling</option>
                      <option value="budding">budding</option>
                      <option value="evergreen">evergreen</option>
                    </select>
                  </label>
                  <label className="block text-xs uppercase tracking-[0.22em] text-starlight/42">
                    Tags
                    <input
                      value={form.tags}
                      onChange={(event) => updateField("tags", event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/7 px-4 py-3 text-sm normal-case tracking-normal text-starlight outline-none"
                      placeholder="前端, 动画, 随笔"
                    />
                  </label>
                  <label className="block text-xs uppercase tracking-[0.22em] text-starlight/42">
                    Links
                    <input
                      value={form.links}
                      onChange={(event) => updateField("links", event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/7 px-4 py-3 text-sm normal-case tracking-normal text-starlight outline-none"
                      placeholder="related-note, another-note"
                    />
                  </label>
                </div>
              )}

              <div className="max-h-72 overflow-auto rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-4">
                <p className="text-[10px] uppercase tracking-[0.32em] text-starlight/35">Preview</p>
                <h2 className="mt-3 text-lg font-semibold text-starlight">{form.title || "未命名内容"}</h2>
                <p className="mt-2 text-sm leading-6 text-starlight/52">{form.summary || "摘要会出现在这里。"}</p>
                <pre className="mt-4 whitespace-pre-wrap break-words border-t border-white/10 pt-4 font-mono text-xs leading-6 text-cyan-50/62">
                  {form.content || "Markdown 预览舱等待输入。"}
                </pre>
              </div>
            </aside>
          </div>
          )}
        </motion.section>
      </div>
    </main>
  );
}
