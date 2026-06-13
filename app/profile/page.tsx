"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useAuth } from "@/lib/auth-context";

type CollectibleStar = {
  id: string;
  left: string;
  top: string;
  value: number;
};

type ProfileStats = {
  totalPoints: number;
  todayPoints: number;
  roseFavorites: number;
  notesRead: number;
  bestScore: number;
};

type StarPet = {
  species: string;
  name: string;
  level: number;
  xp: number;
};

type ProfileSnapshot = {
  name: string;
  nickname: string;
  avatarUrl: string;
  bio: string;
  interests: string;
};

type ReactionRecord = {
  target_type: "post" | "note";
  target_slug: string;
  reaction_type: "like" | "favorite";
  created_at: string;
  title: string;
  summary: string;
  cover_url?: string | null;
  href: string;
};

const collectibleStars: CollectibleStar[] = [
  { id: "north", left: "18%", top: "24%", value: 10 },
  { id: "east", left: "83%", top: "36%", value: 10 },
  { id: "south", left: "72%", top: "78%", value: 10 }
];

function dispatchSpaceEvent(name: string, duration = 900) {
  window.dispatchEvent(new CustomEvent(name, { detail: { duration } }));
}

function prepareReturnToMap() {
  window.sessionStorage.setItem("return-to-planet-map", "1");
  dispatchSpaceEvent("spaceship-boost", 860);
  dispatchSpaceEvent("cosmic-warp", 860);
}

function createVisitorId() {
  const stamp = new Date().getFullYear();
  const code = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `PILOT-ZJU-${stamp}-${code}`;
}

function readNumber(key: string, fallback = 0) {
  const value = window.localStorage.getItem(key);
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function PilotLicenseCard({
  visitorId,
  xp,
  collectedCount
}: {
  visitorId: string;
  xp: number;
  collectedCount: number;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 120, damping: 18, mass: 0.8 });
  const springY = useSpring(y, { stiffness: 120, damping: 18, mass: 0.8 });

  return (
    <motion.section
      className="group relative overflow-hidden rounded-[2rem] border border-cyan-300/24 bg-slate-950/46 p-5 text-left shadow-[0_28px_90px_rgba(8,47,73,0.42),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-xl sm:p-7"
      style={{ rotateX: springY, rotateY: springX }}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        x.set(((event.clientX - rect.left) / rect.width - 0.5) * 7);
        y.set(-((event.clientY - rect.top) / rect.height - 0.5) * 7);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,transparent,rgba(103,232,249,0.18),transparent)] opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:animate-[profileBeam_1.4s_ease-in-out_infinite]" />
      <span className="absolute left-4 top-4 h-8 w-8 border-l-2 border-t-2 border-cyan-200/55" />
      <span className="absolute right-4 top-4 h-8 w-8 border-r-2 border-t-2 border-cyan-200/55" />
      <span className="absolute bottom-4 left-4 h-8 w-8 border-b-2 border-l-2 border-cyan-200/55" />
      <span className="absolute bottom-4 right-4 h-8 w-8 border-b-2 border-r-2 border-cyan-200/55" />

      <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.42em] text-cyan-200/70">Cosmic Pilot License</p>
          <h1 className="mt-4 font-display text-4xl leading-none text-starlight sm:text-6xl">
            星际航行执照
          </h1>
          <p className="mt-4 text-sm leading-7 text-starlight/58">
            这张执照记录你在这座个人宇宙里留下的航迹：收藏、阅读、小游戏，以及偶然撞见的星光。
          </p>
        </div>
        <div className="rounded-2xl border border-cyan-200/20 bg-cyan-200/8 p-4 text-right">
          <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-100/54">Visitor ID</p>
          <p className="mt-2 font-mono text-sm text-cyan-100">{visitorId}</p>
          <motion.p
            key={xp}
            className="mt-5 font-display text-4xl text-comet"
            initial={{ scale: 0.75, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 14 }}
          >
            {xp}xp
          </motion.p>
          <p className="mt-1 text-xs text-starlight/45">Collected stars {collectedCount}/3</p>
        </div>
      </div>

      <div className="relative z-10 mt-7 grid gap-3 sm:grid-cols-3">
        {[
          ["Issued", new Date().toLocaleDateString("zh-CN")],
          ["Rank", xp >= 30 ? "Little Prince Class" : "Cadet"],
          ["Signal", "B-612 CLEAR"]
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
            <p className="text-[10px] uppercase tracking-[0.28em] text-starlight/38">{label}</p>
            <p className="mt-2 text-sm text-starlight/78">{value}</p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

function ActivityBento({
  roseCount,
  notesRead,
  gameBest,
  xp,
  todayPoints
}: {
  roseCount: number;
  notesRead: number;
  gameBest: number;
  xp: number;
  todayPoints: number;
}) {
  const items = [
    {
      label: "玫瑰收藏夹",
      value: `${roseCount} 篇`,
      detail: roseCount > 0 ? "Blog 星球已同步收藏记录" : "等待第一朵玫瑰被收藏",
      tint: "from-rose-300/18 to-pink-500/8"
    },
    {
      label: "能量碎片",
      value: `${notesRead} 枚`,
      detail: notesRead > 0 ? "Notes 星环阅读轨迹已点亮" : "尚未记录阅读碎片",
      tint: "from-slate-200/16 to-cyan-300/8"
    },
    {
      label: "游戏勋章",
      value: `${gameBest} 分`,
      detail: gameBest > 0 ? "Game 星球已生成高分勋章" : "第一枚玩具勋章还在等待",
      tint: "from-yellow-300/18 to-blue-400/8"
    },
    {
      label: "星际能量值",
      value: `${xp} xp`,
      detail: `今日已获得 ${todayPoints} 点，登录、阅读、评论和游戏会继续补能`,
      tint: "from-cyan-300/18 to-blue-500/8"
    }
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2">
      {items.map((item, index) => (
        <motion.article
          key={item.label}
          className={[
            "rounded-[1.5rem] border border-white/12 bg-gradient-to-br p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_18px_48px_rgba(2,6,23,0.22)] backdrop-blur-md",
            item.tint
          ].join(" ")}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 130, damping: 18, delay: 0.08 * index }}
        >
          <p className="text-[10px] uppercase tracking-[0.3em] text-starlight/42">{item.label}</p>
          <p className="mt-4 font-display text-4xl text-starlight">{item.value}</p>
          <p className="mt-3 text-sm leading-6 text-starlight/50">{item.detail}</p>
        </motion.article>
      ))}
    </section>
  );
}

function PetPanel({ pet }: { pet: StarPet }) {
  const progress = Math.min(100, pet.xp % 100);
  const isEgg = pet.species === "egg";

  return (
    <motion.section
      className="relative overflow-hidden rounded-[1.5rem] border border-yellow-200/16 bg-white/[0.055] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_18px_48px_rgba(2,6,23,0.22)] backdrop-blur-md"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 130, damping: 18 }}
    >
      <div className="flex items-center gap-5">
        <motion.div
          className={[
            "relative h-24 w-20 rounded-[48%_52%_46%_54%] shadow-[inset_10px_12px_18px_rgba(255,255,255,0.26),inset_-16px_-18px_26px_rgba(113,63,18,0.34),0_0_34px_rgba(250,204,21,0.18)]",
            isEgg
              ? "bg-[radial-gradient(circle_at_34%_24%,rgba(255,255,255,0.8),transparent_0_18%),linear-gradient(135deg,#fef3c7,#fbbf24)]"
              : "bg-[radial-gradient(circle_at_34%_24%,rgba(255,255,255,0.7),transparent_0_16%),linear-gradient(135deg,#bae6fd,#22d3ee)]"
          ].join(" ")}
          animate={{ y: [0, -5, 0], rotate: [-2, 2, -2] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="absolute left-5 top-8 h-2 w-2 rounded-full bg-slate-900/62" />
          <span className="absolute right-5 top-8 h-2 w-2 rounded-full bg-slate-900/62" />
          <span className="absolute bottom-8 left-1/2 h-1 w-5 -translate-x-1/2 rounded-full bg-slate-900/26" />
        </motion.div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.32em] text-yellow-100/62">Star Pet</p>
          <h2 className="mt-2 font-display text-3xl text-starlight">{pet.name}</h2>
          <p className="mt-2 text-sm text-starlight/50">
            Lv.{pet.level} · {pet.xp} xp · {isEgg ? "免费初始蛋，等待积分孵化" : pet.species}
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-yellow-200 to-cyan-200"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
            />
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function WeeklyMissions({
  todayPoints,
  roseCount,
  notesRead,
  gameBest
}: {
  todayPoints: number;
  roseCount: number;
  notesRead: number;
  gameBest: number;
}) {
  const missions = [
    { label: "每日登录", current: Math.min(todayPoints, 10), total: 10, detail: "+10 xp" },
    { label: "阅读花田/星环", current: Math.min(notesRead * 5, 20), total: 20, detail: "上限 +20 xp" },
    { label: "收藏玫瑰", current: Math.min(roseCount * 5, 25), total: 25, detail: "给喜欢的文章做标记" },
    { label: "刷新游戏纪录", current: gameBest > 0 ? 50 : 0, total: 50, detail: "破纪录 +50 xp" }
  ];

  return (
    <section className="rounded-[1.5rem] border border-cyan-200/14 bg-white/[0.055] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_18px_48px_rgba(2,6,23,0.22)] backdrop-blur-md">
      <p className="text-[10px] uppercase tracking-[0.32em] text-cyan-100/58">Weekly Missions</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {missions.map((mission) => {
          const progress = Math.min(100, (mission.current / mission.total) * 100);
          return (
            <article key={mission.label} className="rounded-2xl border border-white/10 bg-black/16 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-starlight/78">{mission.label}</p>
                <p className="text-xs text-comet/72">{mission.detail}</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-200 to-comet"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 18 }}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function PetShop({ xp }: { xp: number }) {
  const pets = [
    { name: "星尘狐狸", cost: 120, tint: "from-orange-200 to-rose-300" },
    { name: "月光鲸", cost: 260, tint: "from-cyan-200 to-blue-300" },
    { name: "薄荷鹿", cost: 420, tint: "from-emerald-200 to-lime-300" }
  ];

  return (
    <section className="rounded-[1.5rem] border border-yellow-200/16 bg-white/[0.055] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_18px_48px_rgba(2,6,23,0.22)] backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.32em] text-yellow-100/62">Pet Bazaar</p>
        <p className="text-xs text-starlight/42">可用能量 {xp} xp</p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {pets.map((pet) => (
          <article key={pet.name} className="rounded-2xl border border-white/10 bg-black/16 p-4 text-center">
            <div className={`mx-auto h-16 w-16 rounded-[48%_52%_46%_54%] bg-gradient-to-br ${pet.tint} shadow-[inset_8px_9px_14px_rgba(255,255,255,0.28),inset_-12px_-14px_18px_rgba(15,23,42,0.22),0_0_26px_rgba(250,204,21,0.12)]`} />
            <p className="mt-3 text-sm text-starlight/76">{pet.name}</p>
            <button
              type="button"
              disabled={xp < pet.cost}
              className="mt-3 rounded-full border border-yellow-100/18 bg-yellow-100/8 px-3 py-1 text-xs text-yellow-100/70 disabled:opacity-35"
            >
              {pet.cost} xp
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProfileEditor() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [snapshot, setSnapshot] = useState<ProfileSnapshot | null>(null);

  useEffect(() => {
    if (!user) return;

    async function loadProfile() {
      const response = await fetch("/api/profile", { cache: "no-store" });
      if (!response.ok) return;

      const data = await response.json();
      const profile = data.profile;
      setName(profile.name || "");
      setNickname(profile.nickname || "");
      setAvatarUrl(profile.avatar_url || "");
      setBio(profile.bio || "");
      setInterests(Array.isArray(profile.interests) ? profile.interests.join(", ") : "");
      setSnapshot({
        name: profile.name || "",
        nickname: profile.nickname || "",
        avatarUrl: profile.avatar_url || "",
        bio: profile.bio || "",
        interests: Array.isArray(profile.interests) ? profile.interests.join(", ") : ""
      });
    }

    void loadProfile();
  }, [user]);

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setMessage("");
    setIsUploadingAvatar(true);

    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "头像上传失败");
        return;
      }

      setAvatarUrl(data.url);
      setMessage("头像已上传，保存 Profile 后会同步到登录身份。");
    } catch {
      setMessage("无法连接头像上传服务");
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          nickname,
          avatarUrl,
          bio,
          interests: interests
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        })
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "保存失败");
        return;
      }

      await refresh();
      setSnapshot({ name, nickname, avatarUrl, bio, interests });
      setIsEditing(false);
      setMessage("Profile 已保存");
    } catch {
      setMessage("无法连接 Profile 服务");
    } finally {
      setIsSaving(false);
    }
  }

  if (!user) {
    return (
      <section className="rounded-[1.5rem] border border-cyan-200/14 bg-white/[0.055] p-5 text-sm leading-7 text-starlight/56 backdrop-blur-md">
        登录后可以修改自己的昵称、头像、介绍和兴趣，并把评论、收藏、游戏分数同步到这张航行执照。
        <div className="mt-4 flex gap-2">
          <Link href="/login" className="rounded-full border border-cyan-200/24 bg-cyan-200/10 px-4 py-2 text-cyan-100">
            登录
          </Link>
          <Link href="/register" className="rounded-full border border-white/12 bg-white/8 px-4 py-2">
            注册
          </Link>
        </div>
      </section>
    );
  }

  if (!isEditing) {
    const display = snapshot || { name, nickname, avatarUrl, bio, interests };
    const displayName = display.nickname || display.name || user.nickname || user.email;

    return (
      <section className="rounded-[1.5rem] border border-cyan-200/14 bg-white/[0.055] p-5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_18px_48px_rgba(2,6,23,0.22)] backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-[32%_68%_55%_45%] border border-cyan-200/20 bg-cyan-200/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_0_28px_rgba(103,232,249,0.12)]">
              {display.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={display.avatarUrl} alt="头像" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center font-display text-3xl text-cyan-100/70">
                  {displayName.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-cyan-100/58">Pilot Profile</p>
              <h2 className="mt-2 font-display text-3xl text-starlight">{displayName}</h2>
              <p className="mt-1 text-sm text-starlight/46">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-full border border-comet/35 bg-comet/14 px-5 py-2 text-xs uppercase tracking-[0.22em] text-comet"
          >
            编辑资料
          </button>
        </div>
        <p className="mt-5 text-sm leading-7 text-starlight/58">{display.bio || "这位飞行员还没有写下自己的航行简介。"}</p>
        {display.interests ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {display.interests.split(",").map((item) => item.trim()).filter(Boolean).map((item) => (
              <span key={item} className="rounded-full border border-cyan-100/14 bg-cyan-100/8 px-3 py-1 text-xs text-cyan-100/64">
                {item}
              </span>
            ))}
          </div>
        ) : null}
        {message ? <p className="mt-4 text-sm text-starlight/52">{message}</p> : null}
      </section>
    );
  }

  return (
    <motion.form
      onSubmit={submit}
      className="rounded-[1.5rem] border border-cyan-200/14 bg-white/[0.055] p-5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_18px_48px_rgba(2,6,23,0.22)] backdrop-blur-md"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 130, damping: 18 }}
    >
      <p className="text-[10px] uppercase tracking-[0.32em] text-cyan-100/58">Editable Pilot Profile</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs uppercase tracking-[0.24em] text-starlight/42">
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm normal-case tracking-normal text-starlight outline-none focus:border-cyan-200/35"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.24em] text-starlight/42">
          Nickname
          <input
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm normal-case tracking-normal text-starlight outline-none focus:border-cyan-200/35"
          />
        </label>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-end">
        <div className="flex items-center gap-3">
          <div className="relative h-20 w-20 overflow-hidden rounded-[32%_68%_55%_45%] border border-cyan-200/20 bg-cyan-200/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_0_28px_rgba(103,232,249,0.12)]">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="当前头像预览" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center font-display text-3xl text-cyan-100/70">
                {(nickname || name || user.nickname || user.email).slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <label className="cursor-pointer rounded-full border border-cyan-200/24 bg-cyan-200/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-cyan-100 transition hover:bg-cyan-200/14">
            {isUploadingAvatar ? "上传中" : "上传头像"}
            <input
              type="file"
              accept="image/*"
              disabled={isUploadingAvatar}
              className="sr-only"
              onChange={(event) => void uploadAvatar(event)}
            />
          </label>
        </div>
        <label className="block text-xs uppercase tracking-[0.24em] text-starlight/42">
          Avatar URL
          <input
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm normal-case tracking-normal text-starlight outline-none focus:border-cyan-200/35"
          />
        </label>
      </div>
      <label className="mt-3 block text-xs uppercase tracking-[0.24em] text-starlight/42">
        Bio
        <textarea
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          rows={4}
          className="mt-2 w-full rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm normal-case tracking-normal text-starlight outline-none focus:border-cyan-200/35"
        />
      </label>
      <label className="mt-3 block text-xs uppercase tracking-[0.24em] text-starlight/42">
        Interests
        <input
          value={interests}
          onChange={(event) => setInterests(event.target.value)}
          placeholder="写作, 游戏, 动画"
          className="mt-2 w-full rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm normal-case tracking-normal text-starlight outline-none placeholder:text-starlight/30 focus:border-cyan-200/35"
        />
      </label>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-full border border-comet/35 bg-comet/14 px-5 py-2 text-xs uppercase tracking-[0.22em] text-comet disabled:opacity-50"
        >
          {isSaving ? "保存中" : "保存 Profile"}
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="rounded-full border border-white/12 bg-white/8 px-5 py-2 text-xs uppercase tracking-[0.22em] text-starlight/58"
        >
          取消
        </button>
        {message ? <p className="text-sm text-starlight/52">{message}</p> : null}
      </div>
    </motion.form>
  );
}

function ReactionArchive() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "like" | "favorite">("all");
  const [items, setItems] = useState<ReactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function loadArchive() {
      setIsLoading(true);
      setMessage("");

      try {
        const suffix = filter === "all" ? "" : `?reactionType=${filter}`;
        const response = await fetch(`/api/reactions${suffix}`, { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          setMessage(data.error || "无法读取互动记录");
          return;
        }

        if (!cancelled) setItems(data.items || []);
      } catch {
        if (!cancelled) setMessage("无法连接互动记录服务");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadArchive();

    return () => {
      cancelled = true;
    };
  }, [filter, user]);

  async function cancelReaction(item: ReactionRecord) {
    setMessage("");

    try {
      const response = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: item.target_type,
          targetSlug: item.target_slug,
          reactionType: item.reaction_type
        })
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "取消失败");
        return;
      }

      setItems((current) =>
        current.filter(
          (record) =>
            !(
              record.target_type === item.target_type &&
              record.target_slug === item.target_slug &&
              record.reaction_type === item.reaction_type
            )
        )
      );
      setMessage(item.reaction_type === "favorite" ? "已取消收藏" : "已取消点赞");
    } catch {
      setMessage("无法连接互动记录服务");
    }
  }

  if (!user) return null;

  return (
    <section className="rounded-[1.5rem] border border-rose-200/16 bg-white/[0.055] p-5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_18px_48px_rgba(2,6,23,0.22)] backdrop-blur-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-rose-100/62">Rose Archive</p>
          <h2 className="mt-2 font-display text-3xl text-starlight">点赞与收藏记录</h2>
        </div>
        <div className="flex rounded-full border border-white/12 bg-black/18 p-1">
          {[
            ["all", "全部"],
            ["favorite", "收藏"],
            ["like", "点赞"]
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value as "all" | "like" | "favorite")}
              className={[
                "rounded-full px-3 py-1.5 text-xs transition",
                filter === value ? "bg-rose-200/18 text-rose-50" : "text-starlight/45 hover:text-starlight/72"
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {isLoading ? (
          <p className="rounded-2xl border border-white/10 bg-black/16 p-4 text-sm text-starlight/48">
            正在同步你的玫瑰航迹...
          </p>
        ) : null}
        {!isLoading && items.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-black/16 p-4 text-sm leading-7 text-starlight/48">
            这里还没有记录。去 Blog 星球给喜欢的文章点亮一朵玫瑰，它就会回到你的执照里。
          </p>
        ) : null}
        {items.map((item) => (
          <motion.article
            key={`${item.target_type}-${item.target_slug}-${item.reaction_type}`}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/18 p-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 18 }}
          >
            <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-rose-200 via-comet to-cyan-200 opacity-70" />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-rose-100/18 bg-rose-100/10 px-2.5 py-1 text-[11px] text-rose-50/70">
                    {item.reaction_type === "favorite" ? "收藏" : "点赞"}
                  </span>
                  <span className="rounded-full border border-cyan-100/14 bg-cyan-100/8 px-2.5 py-1 text-[11px] text-cyan-50/58">
                    {item.target_type === "post" ? "Blog" : "Notes"}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-starlight">{item.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-starlight/48">{item.summary || "这条记录还没有摘要。"}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link
                  href={item.href}
                  className="rounded-full border border-cyan-200/22 bg-cyan-200/10 px-4 py-2 text-xs text-cyan-100 transition hover:bg-cyan-200/16"
                >
                  进入
                </Link>
                <button
                  type="button"
                  onClick={() => void cancelReaction(item)}
                  className="rounded-full border border-rose-200/22 bg-rose-200/10 px-4 py-2 text-xs text-rose-100 transition hover:bg-rose-200/16"
                >
                  取消
                </button>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
      {message ? <p className="mt-4 text-sm text-starlight/52">{message}</p> : null}
    </section>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [visitorId, setVisitorId] = useState("PILOT-ZJU-LOADING");
  const [xp, setXp] = useState(0);
  const [roseCount, setRoseCount] = useState(0);
  const [notesRead, setNotesRead] = useState(0);
  const [gameBest, setGameBest] = useState(0);
  const [todayPoints, setTodayPoints] = useState(0);
  const [pet, setPet] = useState<StarPet>({
    species: "egg",
    name: "未孵化的星际蛋",
    level: 1,
    xp: 0
  });
  const [collected, setCollected] = useState<string[]>([]);

  useEffect(() => {
    const storedId = window.localStorage.getItem("profile:visitor-id") || createVisitorId();
    window.localStorage.setItem("profile:visitor-id", storedId);

    const storedCollected = JSON.parse(window.localStorage.getItem("profile:collected-stars") || "[]") as string[];
    const storedXp = readNumber("profile:xp", storedCollected.length * 10);

    setVisitorId(storedId);
    setCollected(storedCollected);
    setXp(storedXp);
    setRoseCount(readNumber("blog:favorite-count", 0));
    setNotesRead(readNumber("notes:read-count", 0));
    setGameBest(readNumber("game:best-score", 0));
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function loadStats() {
      try {
        const response = await fetch("/api/profile/stats", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "stats unavailable");

        const stats = data.stats as ProfileStats;
        if (!cancelled) {
          setXp(stats.totalPoints);
          setTodayPoints(stats.todayPoints);
          setRoseCount(stats.roseFavorites);
          setNotesRead(stats.notesRead);
          setGameBest(stats.bestScore);
          setPet(data.pet as StarPet);
        }
      } catch {
        if (!cancelled) setTodayPoints(0);
      }
    }

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, [user]);

  function collectStar(star: CollectibleStar) {
    if (collected.includes(star.id)) return;

    const nextCollected = [...collected, star.id];
    const nextXp = xp + star.value;

    setCollected(nextCollected);
    setXp(nextXp);
    window.localStorage.setItem("profile:collected-stars", JSON.stringify(nextCollected));
    window.localStorage.setItem("profile:xp", String(nextXp));
  }

  return (
    <motion.main
      className="relative z-10 min-h-dvh overflow-hidden px-5 py-6 text-starlight sm:px-8 lg:px-12"
      initial={{ opacity: 0, scale: 1.04, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
    >
      <a
        href="/?view=map"
        onClick={prepareReturnToMap}
        className="fixed left-5 top-5 z-50 rounded-full border border-comet/30 bg-[#090b10]/55 px-4 py-2 text-xs uppercase tracking-[0.24em] text-comet shadow-[0_0_28px_rgba(245,200,75,0.12)] backdrop-blur-md sm:left-8 sm:top-8"
      >
        启动引擎 / 返航
      </a>

      <motion.div
        layoutId="profile-planet"
        aria-hidden="true"
        className="absolute -right-[30rem] top-1/2 h-[58rem] w-[58rem] -translate-y-1/2 rounded-full border border-cyan-200/14 bg-[radial-gradient(circle_at_32%_28%,rgba(103,232,249,0.28),transparent_0_18%),radial-gradient(circle_at_50%_50%,rgba(29,78,216,0.26),transparent_0_62%),linear-gradient(135deg,rgba(15,23,42,0.58),rgba(14,116,144,0.14))] shadow-[inset_42px_48px_90px_rgba(255,255,255,0.08),inset_-80px_-84px_130px_rgba(2,6,23,0.62),0_0_110px_rgba(34,211,238,0.12)]"
      >
        <div className="absolute inset-0 rounded-full bg-[linear-gradient(rgba(103,232,249,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,0.08)_1px,transparent_1px)] bg-[size:42px_42px]" />
        <motion.div
          className="absolute inset-0 rounded-full bg-[linear-gradient(transparent_48%,rgba(103,232,249,0.13)_50%,transparent_52%)] bg-[size:100%_18px]"
          animate={{ y: [0, 18] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      {collectibleStars
        .filter((star) => !collected.includes(star.id))
        .map((star) => (
          <motion.button
            key={star.id}
            type="button"
            aria-label={`收集 ${star.id} 星星`}
            onClick={() => collectStar(star)}
            className="absolute z-40 h-6 w-6 -translate-x-1/2 -translate-y-1/2"
            style={{ left: star.left, top: star.top }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1, 1.2, 1], opacity: 1, rotate: [0, 12, 0] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
            whileTap={{ scale: 1.8, opacity: 0 }}
          >
            <span className="block h-full w-full bg-yellow-200 shadow-[0_0_20px_rgba(250,204,21,0.9)] [clip-path:polygon(50%_0,61%_35%,98%_35%,68%_56%,79%_91%,50%_70%,21%_91%,32%_56%,2%_35%,39%_35%)]" />
          </motion.button>
        ))}

      <section className="relative mx-auto flex min-h-[calc(100dvh-3rem)] max-w-6xl flex-col justify-center gap-5 pt-20">
        <PilotLicenseCard visitorId={visitorId} xp={xp} collectedCount={collected.length} />
        {user ? (
          <section className="rounded-[1.5rem] border border-cyan-200/14 bg-cyan-200/[0.055] p-5 text-sm leading-7 text-cyan-50/70 backdrop-blur-md">
            已同步登录身份：{user.nickname || user.name || user.email} · 权限 {user.role}
          </section>
        ) : null}
        <PetPanel pet={pet} />
        <ProfileEditor />
        <ReactionArchive />
        <WeeklyMissions todayPoints={todayPoints} roseCount={roseCount} notesRead={notesRead} gameBest={gameBest} />
        <PetShop xp={xp} />
        <ActivityBento roseCount={roseCount} notesRead={notesRead} gameBest={gameBest} xp={xp} todayPoints={todayPoints} />
      </section>
    </motion.main>
  );
}
