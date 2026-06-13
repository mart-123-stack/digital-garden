"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import aboutContent from "@/content/about.json";

type AboutContent = typeof aboutContent;

type AboutProfile = {
  name: string;
  title: string;
  location: string;
  bio: string;
  avatar_url: string | null;
  interests: unknown[];
  experiences: unknown[];
};

function dispatchSpaceEvent(name: string, duration = 900, active?: boolean) {
  window.dispatchEvent(new CustomEvent(name, { detail: { duration, active } }));
}

function Bench({ isNight }: { isNight: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="absolute bottom-[18%] left-[18%] h-28 w-56"
    >
      <div
        className="absolute left-5 top-5 h-4 w-44 rounded-full bg-amber-700"
        style={{
          boxShadow: isNight
            ? "inset 2px 2px 4px rgba(255,244,214,0.34), inset -4px -4px 8px rgba(69,26,3,0.48), 0 0 18px rgba(245,200,75,0.18)"
            : "inset 2px 2px 4px rgba(255,244,214,0.34), inset -4px -4px 8px rgba(69,26,3,0.42)"
        }}
      />
      <div className="absolute left-7 top-10 h-4 w-48 rounded-full bg-amber-800 shadow-[inset_2px_2px_4px_rgba(255,244,214,0.25),inset_-4px_-4px_8px_rgba(69,26,3,0.48)]" />
      <div className="absolute left-9 top-16 h-5 w-44 rounded-full bg-amber-900 shadow-[inset_2px_2px_4px_rgba(255,244,214,0.18),inset_-4px_-4px_8px_rgba(69,26,3,0.52)]" />
      <div className="absolute bottom-0 left-12 h-16 w-3 rounded-full bg-slate-600 shadow-[inset_1px_1px_3px_rgba(255,255,255,0.22),inset_-2px_-2px_5px_rgba(15,23,42,0.55)]" />
      <div className="absolute bottom-0 right-12 h-16 w-3 rounded-full bg-slate-600 shadow-[inset_1px_1px_3px_rgba(255,255,255,0.22),inset_-2px_-2px_5px_rgba(15,23,42,0.55)]" />
      <div className="absolute bottom-0 left-6 h-3 w-20 rounded-full bg-slate-700" />
      <div className="absolute bottom-0 right-6 h-3 w-20 rounded-full bg-slate-700" />
    </div>
  );
}

function Lamppost({
  isNight,
  onToggle
}: {
  isNight: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-label="切换昼夜路灯"
      onClick={onToggle}
      className="absolute bottom-[16%] left-[52%] z-30 h-72 w-32 -translate-x-1/2 outline-none transition-transform duration-300 active:scale-[0.98]"
    >
      <span
        aria-hidden="true"
        className={[
          "pointer-events-none absolute left-1/2 top-[-18%] h-80 w-80 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,216,128,0.30),rgba(245,200,75,0.10)_38%,transparent_70%)] transition-opacity duration-500",
          isNight ? "opacity-100" : "opacity-0"
        ].join(" ")}
      />
      <span className="absolute bottom-0 left-1/2 h-52 w-3 -translate-x-1/2 rounded-full bg-slate-700 shadow-[inset_1px_1px_3px_rgba(255,255,255,0.28),inset_-3px_-4px_8px_rgba(15,23,42,0.58)]" />
      <span className="absolute bottom-48 left-1/2 h-4 w-16 -translate-x-1/2 rounded-full bg-slate-600 shadow-[inset_1px_1px_3px_rgba(255,255,255,0.24),inset_-3px_-3px_8px_rgba(15,23,42,0.5)]" />
      <span className="absolute bottom-[12.5rem] left-1/2 h-16 w-16 -translate-x-1/2 rounded-[50%_50%_42%_42%] border border-amber-100/28 bg-[radial-gradient(circle_at_36%_28%,rgba(255,255,255,0.72),rgba(253,230,138,0.36)_34%,rgba(120,53,15,0.22)_100%)] shadow-[inset_3px_3px_8px_rgba(255,255,255,0.55),inset_-5px_-6px_12px_rgba(120,53,15,0.34),0_0_24px_rgba(245,200,75,0.28)]" />
      <span
        className={[
          "absolute bottom-[14.45rem] left-1/2 h-5 w-5 -translate-x-1/2 rounded-full bg-amber-200 transition-opacity duration-300",
          isNight ? "opacity-100 shadow-[0_0_34px_rgba(245,200,75,0.82)]" : "opacity-40 shadow-[0_0_10px_rgba(245,200,75,0.24)]"
        ].join(" ")}
      />
      <span className="absolute bottom-0 left-1/2 h-4 w-24 -translate-x-1/2 rounded-full bg-slate-800" />
    </button>
  );
}

function normalizeStringList(value: unknown[]): string[] {
  return value.map((item) => String(item)).filter(Boolean);
}

function normalizeTimeline(value: unknown[]): AboutContent["timeline"] {
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as { label?: unknown; text?: unknown; title?: unknown; period?: unknown };
      return {
        label: String(record.label || record.period || record.title || "Now"),
        text: String(record.text || record.title || "")
      };
    })
    .filter((item): item is AboutContent["timeline"][number] => Boolean(item?.text));
}

function mapProfileToContent(profile: AboutProfile | null): AboutContent {
  if (!profile) return aboutContent;

  const intro = profile.bio
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const traits = normalizeStringList(profile.interests);
  const timeline = normalizeTimeline(profile.experiences);

  return {
    eyebrow: profile.location || "Captain Station",
    title: profile.title || `${profile.name || "Sylvie Chu"} 的宇宙驾驶舱`,
    intro: intro.length > 0 ? intro : aboutContent.intro,
    traits: traits.length > 0 ? traits : aboutContent.traits,
    timeline: timeline.length > 0 ? timeline : aboutContent.timeline
  };
}

function AboutCopy({
  isNight,
  content,
  avatarUrl
}: {
  isNight: boolean;
  content: AboutContent;
  avatarUrl?: string | null;
}) {
  return (
    <motion.section
      className={[
        "relative z-20 rounded-[1.6rem] border p-6 text-left sm:p-8",
        isNight
          ? "border-amber-100/18 bg-[#27190b]/54 shadow-[0_0_36px_rgba(245,200,75,0.10)]"
          : "border-white/18 bg-white/12 shadow-[0_24px_70px_rgba(8,47,73,0.18)] backdrop-blur-md"
      ].join(" ")}
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0, transition: { staggerChildren: 0.13, delayChildren: 0.18 } }
      }}
    >
      <motion.p
        variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
        className="text-[10px] uppercase tracking-[0.38em] text-comet/80"
      >
        {content.eyebrow}
      </motion.p>
      {avatarUrl ? (
        <motion.div
          variants={{ hidden: { opacity: 0, y: 12, scale: 0.92 }, show: { opacity: 1, y: 0, scale: 1 } }}
          className={[
            "mt-5 h-24 w-24 overflow-hidden rounded-[42%_58%_50%_50%] border shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_18px_45px_rgba(2,6,23,0.22)]",
            isNight ? "border-amber-100/24 shadow-[0_0_40px_rgba(245,200,75,0.18)]" : "border-emerald-100/24"
          ].join(" ")}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarUrl} alt="Sylvie Chu 头像" className="h-full w-full object-cover" />
        </motion.div>
      ) : null}
      <motion.h1
        variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
        className={["mt-4 font-display text-4xl leading-tight sm:text-6xl", isNight ? "text-amber-100" : "text-starlight"].join(" ")}
      >
        {content.title}
      </motion.h1>
      <div className="mt-6 space-y-4">
        {content.intro.map((paragraph) => (
          <motion.p
            key={paragraph}
            variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
            className={["text-sm leading-8 sm:text-base", isNight ? "text-amber-100/74" : "text-starlight/62"].join(" ")}
          >
            {paragraph}
          </motion.p>
        ))}
      </div>
      <motion.div
        variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
        className="mt-7 flex flex-wrap gap-2"
      >
        {content.traits.map((trait) => (
          <span
            key={trait}
            className="rounded-full border border-comet/18 bg-comet/8 px-3 py-1 text-xs text-comet/80"
          >
            {trait}
          </span>
        ))}
      </motion.div>
      <div className="mt-8 grid gap-3">
        {content.timeline.map((item) => (
          <motion.div
            key={item.label}
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            className="rounded-2xl border border-white/10 bg-white/[0.055] p-4"
          >
            <p className="text-xs uppercase tracking-[0.28em] text-emerald-100/60">{item.label}</p>
            <p className={["mt-2 text-sm leading-7", isNight ? "text-amber-100/68" : "text-starlight/58"].join(" ")}>
              {item.text}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

export default function AboutPage() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [isNight, setIsNight] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [profile, setProfile] = useState<AboutProfile | null>(null);
  const content = useMemo(() => mapProfileToContent(profile), [profile]);

  useEffect(() => {
    let cancelled = false;

    async function loadAbout() {
      try {
        const response = await fetch("/api/about", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "无法读取 About");
        if (!cancelled && data.about) setProfile(data.about);
      } catch {
        if (!cancelled) setProfile(null);
      }
    }

    void loadAbout();

    return () => {
      cancelled = true;
    };
  }, []);

  function toggleNight() {
    setIsNight((value) => !value);
  }

  function returnToMap() {
    setLeaving(true);
    window.sessionStorage.setItem("return-to-planet-map", "1");
    dispatchSpaceEvent("spaceship-boost", 860);
    dispatchSpaceEvent("cosmic-warp", 860);
    window.setTimeout(() => router.push("/?view=map"), prefersReducedMotion ? 0 : 620);
  }

  return (
    <motion.main
      className={[
        "relative z-10 min-h-dvh overflow-hidden px-5 py-6 transition-colors duration-700 sm:px-8 lg:px-12",
        isNight ? "bg-[#01020a]/72" : "bg-[#0d3b4a]/18"
      ].join(" ")}
      initial={{ opacity: 0, scale: 1.05, filter: "blur(12px)" }}
      animate={
        leaving
          ? { opacity: 0, scale: 0.82, filter: "blur(18px)" }
          : { opacity: 1, scale: 1, filter: "blur(0px)" }
      }
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.button
        type="button"
        onClick={returnToMap}
        whileHover={{ x: -3, scale: 1.03 }}
        whileTap={{ scale: 0.94 }}
        className="fixed left-5 top-5 z-50 rounded-full border border-comet/30 bg-[#07151a]/45 px-4 py-2 text-xs uppercase tracking-[0.24em] text-comet shadow-[0_0_28px_rgba(245,200,75,0.12)] backdrop-blur-md sm:left-8 sm:top-8"
      >
        启动引擎 / 返航
      </motion.button>

      <motion.div
        aria-hidden="true"
        layoutId="about-planet"
        className="absolute -bottom-[44rem] left-1/2 h-[70rem] w-[88rem] -translate-x-1/2 rounded-[50%_50%_0_0] bg-[radial-gradient(circle_at_38%_18%,rgba(255,255,255,0.44),transparent_0_16%),radial-gradient(circle_at_62%_52%,rgba(15,118,110,0.35),transparent_0_58%),linear-gradient(135deg,#d9fff0,#6ee7b7_48%,#047857)] shadow-[inset_42px_52px_90px_rgba(255,255,255,0.22),inset_-90px_-80px_130px_rgba(6,78,59,0.48),0_0_120px_rgba(110,231,183,0.18)]"
        transition={{ type: "spring", stiffness: 80, damping: 18, mass: 1.1 }}
      />
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-0 transition-opacity duration-700",
          isNight ? "opacity-0" : "opacity-100"
        ].join(" ")}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_42%_34%,rgba(255,255,255,0.12),transparent_38%),linear-gradient(rgba(13,59,74,0.05),rgba(13,59,74,0.18))]" />
      </div>
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-0 transition-opacity duration-700",
          isNight ? "opacity-100" : "opacity-0"
        ].join(" ")}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_43%_35%,rgba(245,200,75,0.18),transparent_34%),linear-gradient(rgba(1,2,10,0.08),rgba(1,2,10,0.72))]" />
      </div>

      <section className="relative mx-auto grid min-h-[calc(100dvh-3rem)] max-w-7xl grid-cols-1 items-center gap-8 pt-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)] lg:pt-0">
        <div className="relative min-h-[56dvh] lg:min-h-[78dvh]">
          <Bench isNight={isNight} />
          <Lamppost isNight={isNight} onToggle={toggleNight} />
          <motion.p
            className={["absolute bottom-[8%] left-[15%] max-w-sm text-left text-sm leading-7", isNight ? "text-amber-100/68" : "text-starlight/54"].join(" ")}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7 }}
          >
            点击路灯切换昼夜。白天适合介绍自己，夜晚适合承认那些安静但重要的心事。
          </motion.p>
        </div>
        <AboutCopy isNight={isNight} content={content} avatarUrl={profile?.avatar_url} />
      </section>
    </motion.main>
  );
}
