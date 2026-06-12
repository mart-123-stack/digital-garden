"use client";

import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring
} from "framer-motion";

type PlanetId = "profile" | "blog" | "about" | "notes" | "games";

type Planet = {
  id: PlanetId;
  name: string;
  eyebrow: string;
  route: string;
  position: string;
  size: string;
  travel: { x: string; y: string };
  depth: number;
  orbit: string;
  delay: number;
};

const planets: Planet[] = [
  {
    id: "profile",
    name: "Profile",
    eyebrow: "访客星球",
    route: "/profile",
    position: "left-[8%] top-[17%]",
    size: "h-36 w-36 sm:h-44 sm:w-44",
    travel: { x: "42vw", y: "31vh" },
    depth: 0.72,
    orbit: "rotate-[-11deg]",
    delay: 0.18
  },
  {
    id: "blog",
    name: "Blog",
    eyebrow: "玫瑰花园",
    route: "/blog",
    position: "right-[12%] top-[14%]",
    size: "h-40 w-40 sm:h-52 sm:w-52",
    travel: { x: "-34vw", y: "32vh" },
    depth: 0.88,
    orbit: "rotate-[8deg]",
    delay: 0.36
  },
  {
    id: "about",
    name: "About Me",
    eyebrow: "路灯小站",
    route: "/about",
    position: "left-[14%] bottom-[13%]",
    size: "h-40 w-40 sm:h-48 sm:w-48",
    travel: { x: "35vw", y: "-32vh" },
    depth: 0.78,
    orbit: "rotate-[14deg]",
    delay: 0.54
  },
  {
    id: "notes",
    name: "Notes",
    eyebrow: "知识环带",
    route: "/notes",
    position: "right-[9%] bottom-[18%]",
    size: "h-36 w-36 sm:h-44 sm:w-44",
    travel: { x: "-36vw", y: "-27vh" },
    depth: 0.68,
    orbit: "rotate-[-16deg]",
    delay: 0.72
  },
  {
    id: "games",
    name: "Game",
    eyebrow: "玩具星球",
    route: "/game",
    position: "left-1/2 top-[52%]",
    size: "h-44 w-44 sm:h-56 sm:w-56",
    travel: { x: "0vw", y: "-2vh" },
    depth: 1,
    orbit: "rotate-[0deg]",
    delay: 0.9
  }
];

function dispatchSpaceEvent(name: string, duration = 900, active?: boolean) {
  window.dispatchEvent(new CustomEvent(name, { detail: { duration, active } }));
}

function useMagneticPlanet(ref: RefObject<HTMLButtonElement | null>, enabled = true) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 150, damping: 18, mass: 0.7 });
  const y = useSpring(rawY, { stiffness: 150, damping: 18, mass: 0.7 });

  useEffect(() => {
    if (!enabled) {
      rawX.set(0);
      rawY.set(0);
      return;
    }

    function handleMove(event: PointerEvent) {
      const element = ref.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = event.clientX - centerX;
      const deltaY = event.clientY - centerY;
      const distance = Math.hypot(deltaX, deltaY);

      if (distance > 230) {
        rawX.set(0);
        rawY.set(0);
        return;
      }

      const pull = 10 * (1 - distance / 230);
      rawX.set((deltaX / Math.max(distance, 1)) * pull);
      rawY.set((deltaY / Math.max(distance, 1)) * pull);
    }

    function reset() {
      rawX.set(0);
      rawY.set(0);
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerleave", reset);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerleave", reset);
    };
  }, [enabled, rawX, rawY, ref]);

  return { x, y };
}

function Cover({ onEnter }: { onEnter: () => void }) {
  return (
    <motion.section
      key="cover"
      className="absolute inset-0 z-20 flex items-center justify-center px-6 text-center"
      exit={{ opacity: 0, scale: 1.18, filter: "blur(14px)" }}
      transition={{ duration: 0.72, ease: [0.2, 0.84, 0.24, 1] }}
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl"
      >
        <p className="mb-5 text-xs uppercase tracking-[0.42em] text-comet/80">
          Flight Deck 001
        </p>
        <h1 className="whitespace-nowrap font-display text-2xl leading-tight text-starlight sm:text-5xl md:text-6xl lg:text-7xl">
          一座正在醒来的个人宇宙
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-balance text-base leading-8 text-starlight/62 sm:text-lg">
          驾驶微型飞船穿过星光，降落到这些由记忆、文章、笔记和游戏构成的小星球。
        </p>
        <motion.button
          type="button"
          onClick={onEnter}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.96 }}
          className="mt-10 rounded-full border border-comet/40 bg-comet/12 px-7 py-3 text-sm font-medium tracking-[0.22em] text-comet shadow-[0_0_34px_rgba(245,200,75,0.14)] backdrop-blur-md"
        >
          启动跃迁
        </motion.button>
      </motion.div>
    </motion.section>
  );
}

function WarpStreaks() {
  return (
    <motion.div
      key="warp"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0.15, 0] }}
      transition={{ duration: 1, ease: "easeInOut" }}
    >
      {Array.from({ length: 34 }, (_, index) => (
        <motion.span
          key={index}
          className="absolute left-1/2 top-1/2 h-px w-32 origin-left rounded-full bg-gradient-to-r from-starlight/0 via-starlight/70 to-comet/0"
          style={{ rotate: `${index * 10.6}deg` }}
          initial={{ scaleX: 0, x: 0, opacity: 0 }}
          animate={{ scaleX: [0, 1.8, 0.3], x: [0, 420, 780], opacity: [0, 0.88, 0] }}
          transition={{ duration: 0.88, delay: index * 0.006, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </motion.div>
  );
}

function DepthTunnel() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
      {Array.from({ length: 6 }, (_, index) => (
        <motion.span
          key={index}
          className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-comet/18"
          initial={{ scale: 0.08, opacity: 0.42, filter: "blur(6px)" }}
          animate={{ scale: [0.08, 3.8, 8.8], opacity: [0.42, 0.22, 0], filter: ["blur(6px)", "blur(1px)", "blur(12px)"] }}
          transition={{
            duration: 2.9,
            delay: index * 0.28,
            ease: [0.16, 1, 0.3, 1],
            repeat: Infinity,
            repeatDelay: 0.45
          }}
        />
      ))}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[18rem] w-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(245,200,75,0.12),transparent_58%)] blur-2xl"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: [0.4, 1.15, 0.9], opacity: [0, 0.7, 0.24] }}
        transition={{ duration: 1.8, ease: "easeInOut" }}
      />
    </div>
  );
}

function PlanetMap({
  isNight,
  dockingId,
  onToggleNight,
  onDock
}: {
  isNight: boolean;
  dockingId: PlanetId | null;
  onToggleNight: () => void;
  onDock: (planet: Planet) => void;
}) {
  return (
    <motion.section
      key="map"
      className="absolute inset-0 z-20 overflow-hidden [perspective:1100px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <DepthTunnel />

      <motion.div
        className="absolute left-6 top-6 max-w-xs sm:left-10 sm:top-8"
        initial={{ opacity: 0, y: -12, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.8, delay: 1.15, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="text-[10px] uppercase tracking-[0.38em] text-comet/70">Planetary Map</p>
        <h2 className="mt-2 font-display text-3xl text-starlight sm:text-4xl">选择一颗星球停靠</h2>
      </motion.div>

      <motion.div
        className="absolute inset-0 [transform-style:preserve-3d]"
        initial={{ scale: 0.7, rotateX: 14, filter: "blur(16px)", opacity: 0.2 }}
        animate={{ scale: 1, rotateX: 0, filter: "blur(0px)", opacity: 1 }}
        transition={{ duration: 1.35, ease: [0.16, 1, 0.3, 1] }}
      >
        {planets.map((planet) => (
          <PlanetNode
            key={planet.id}
            planet={planet}
            isNight={isNight}
            isDocking={dockingId === planet.id}
            onToggleNight={onToggleNight}
            onDock={() => onDock(planet)}
          />
        ))}
      </motion.div>

      <AnimatePresence>
        {isNight ? (
          <motion.div
            key="night"
            className="pointer-events-none absolute inset-0 z-30 bg-[#02030a]/46 mix-blend-multiply"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}

function PlanetNode({
  planet,
  isNight,
  isDocking,
  onToggleNight,
  onDock
}: {
  planet: Planet;
  isNight: boolean;
  isDocking: boolean;
  onToggleNight: () => void;
  onDock: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const magnetic = useMagneticPlanet(ref, planet.id !== "games");

  return (
    <motion.div
      className={[
        "absolute z-20 -translate-x-1/2 -translate-y-1/2",
        planet.position,
        planet.size
      ].join(" ")}
      initial={{ x: planet.travel.x, y: planet.travel.y, scale: 0.16, opacity: 0 }}
      animate={
        isDocking
          ? {
              x: 0,
              y: 0,
              scale: 2.15,
              opacity: 0,
              filter: "blur(22px) brightness(1.5)"
            }
          : {
              x: 0,
              y: 0,
              scale: planet.depth,
              opacity: 1,
              filter: "blur(0px) brightness(1)"
            }
      }
      transition={{
        type: "spring",
        stiffness: 78,
        damping: 16,
        mass: 1.05,
        delay: planet.delay
      }}
    >
      <motion.button
        ref={ref}
        type="button"
        aria-label={`停靠 ${planet.name} 星球`}
        onClick={onDock}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
        className="group relative flex h-full w-full items-center justify-center rounded-full outline-none"
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 260, damping: 16 }}
      >
        <motion.span
          className={[
            "relative flex h-full w-full items-center justify-center rounded-full",
            planet.orbit
          ].join(" ")}
          animate={{ scale: isHovered ? 1.06 : 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
          style={{ x: magnetic.x, y: magnetic.y }}
        >
          <span className="sr-only">{planet.eyebrow}</span>
          {planet.id === "profile" ? <ProfilePlanet isHovered={isHovered} /> : null}
          {planet.id === "blog" ? <BlogPlanet isHovered={isHovered} /> : null}
          {planet.id === "about" ? (
            <AboutPlanet isHovered={isHovered} isNight={isNight} onToggleNight={onToggleNight} />
          ) : null}
          {planet.id === "notes" ? <NotesPlanet isHovered={isHovered} /> : null}
          {planet.id === "games" ? <GamePlanet isHovered={isHovered} /> : null}
        </motion.span>
        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs uppercase tracking-[0.26em] text-starlight/60 opacity-0 transition-opacity group-hover:opacity-100">
          {planet.name}
        </span>
      </motion.button>
    </motion.div>
  );
}

function ProfilePlanet({ isHovered }: { isHovered: boolean }) {
  return (
    <div className="relative h-full w-full">
      <motion.div
        layoutId="profile-planet"
        className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_34%_26%,rgba(165,243,252,0.42),transparent_0_18%),radial-gradient(circle_at_62%_68%,rgba(15,23,42,0.75),transparent_0_56%),linear-gradient(135deg,#14325d,#1d4ed8_48%,#08111f)] shadow-[inset_18px_18px_28px_rgba(255,255,255,0.12),inset_-28px_-30px_44px_rgba(1,7,22,0.68),0_0_54px_rgba(59,130,246,0.26)]"
      />
      <span className="absolute left-[27%] top-[35%] h-3 w-8 rotate-[-18deg] rounded-full bg-cyan-200/35 blur-[1px]" />
      <span className="absolute right-[22%] top-[54%] h-4 w-10 rotate-[19deg] rounded-full bg-blue-950/45" />
      <AnimatePresence>
        {isHovered ? (
          <motion.div
            className="absolute -top-20 left-1/2 w-44 -translate-x-1/2 rounded-md border border-cyan-200/30 bg-cyan-200/10 p-3 text-left text-[10px] uppercase tracking-[0.18em] text-cyan-100 shadow-[0_0_32px_rgba(103,232,249,0.22)] backdrop-blur-md"
            initial={{ opacity: 0, y: 12, scale: 0.86 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(125,211,252,0.12)_51%)] bg-[size:100%_6px]" />
            <p>Visitor #B612-07</p>
            <p className="mt-1 text-cyan-100/62">Likes 12 · Notes 08 · Games 03</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function BlogPlanet({ isHovered }: { isHovered: boolean }) {
  const roses = useMemo(() => [-32, -8, 19, 43], []);

  return (
    <div className="relative h-full w-full">
      <motion.div
        layoutId="blog-planet"
        className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_32%_24%,rgba(255,255,255,0.44),transparent_0_17%),radial-gradient(circle_at_68%_78%,rgba(120,24,60,0.36),transparent_0_52%),linear-gradient(135deg,#ffd7e5,#fb7185_48%,#be185d)] shadow-[inset_18px_20px_30px_rgba(255,255,255,0.24),inset_-30px_-34px_48px_rgba(136,19,55,0.44),0_0_58px_rgba(251,113,133,0.28)]"
      />
      <AnimatePresence>
        {isHovered
          ? roses.map((left, index) => (
              <motion.span
                key={left}
                className="absolute top-[18%] flex flex-col items-center"
                style={{ left: `${50 + left / 3}%` }}
                initial={{ scale: 0, y: 22, rotate: -12 }}
                animate={{ scale: 1, y: 0, rotate: left / 4 }}
                exit={{ scale: 0, y: 16 }}
                transition={{ type: "spring", stiffness: 280, damping: 14, delay: index * 0.06 }}
              >
                <span className="h-8 w-1 rounded-full bg-emerald-300/80" />
                <span className="h-5 w-5 rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff1f2,#fb7185_45%,#be123c)] shadow-[0_0_16px_rgba(251,113,133,0.8)]" />
              </motion.span>
            ))
          : null}
      </AnimatePresence>
    </div>
  );
}

function AboutPlanet({
  isNight,
  onToggleNight
}: {
  isHovered: boolean;
  isNight: boolean;
  onToggleNight: () => void;
}) {
  return (
    <div className="relative h-full w-full">
      <motion.div
        layoutId="about-planet"
        className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_24%,rgba(255,255,255,0.42),transparent_0_17%),radial-gradient(circle_at_70%_76%,rgba(15,118,110,0.35),transparent_0_56%),linear-gradient(135deg,#d9fff0,#6ee7b7_52%,#047857)] shadow-[inset_16px_18px_30px_rgba(255,255,255,0.24),inset_-28px_-30px_44px_rgba(6,78,59,0.46),0_0_48px_rgba(110,231,183,0.22)]"
      />
      <span className="absolute bottom-[35%] left-[31%] h-2 w-12 rounded-full bg-emerald-950/45" />
      <span className="absolute bottom-[39%] left-[33%] h-1.5 w-9 rounded-full bg-amber-950/70" />
      <span className="absolute bottom-[36%] left-[36%] h-5 w-1 rounded-full bg-amber-950/60" />
      <span className="absolute bottom-[36%] left-[52%] h-5 w-1 rounded-full bg-amber-950/60" />
      <span
        aria-label="切换 About Me 星球昼夜"
        onClick={(event) => {
          event.stopPropagation();
          onToggleNight();
        }}
        className="absolute right-[31%] top-[27%] z-10 h-12 w-7 rounded-full"
      >
        <span className="absolute bottom-0 left-1/2 h-8 w-1 -translate-x-1/2 rounded-full bg-slate-700" />
        <span className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 rounded-full bg-amber-200 shadow-[0_0_22px_rgba(245,200,75,0.8)]" />
        {isNight ? (
          <span className="absolute left-1/2 top-[-20px] h-16 w-16 -translate-x-1/2 rounded-full bg-amber-200/20 blur-xl" />
        ) : null}
      </span>
    </div>
  );
}

function NotesPlanet({ isHovered }: { isHovered: boolean }) {
  return (
    <div className="relative h-full w-full">
      <motion.div
        layoutId="notes-planet"
        className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_32%_26%,rgba(255,255,255,0.34),transparent_0_16%),radial-gradient(circle_at_72%_72%,rgba(24,24,27,0.58),transparent_0_58%),linear-gradient(135deg,#d4d4d8,#71717a_50%,#27272a)] shadow-[inset_14px_18px_28px_rgba(255,255,255,0.16),inset_-28px_-30px_42px_rgba(24,24,27,0.58),0_0_48px_rgba(245,200,75,0.16)]"
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[116%] w-[146%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-comet/36"
        animate={{ rotate: 360, scale: isHovered ? 0.84 : 1 }}
        transition={{ rotate: { duration: 9, ease: "linear", repeat: Infinity }, scale: { type: "spring", stiffness: 180, damping: 12 } }}
      >
        {Array.from({ length: 18 }, (_, index) => (
          <motion.span
            key={index}
            className="absolute left-1/2 top-1/2 h-2.5 w-2.5 bg-comet/70 [clip-path:polygon(25%_0,75%_0,100%_50%,75%_100%,25%_100%,0_50%)]"
            style={{ transform: `rotate(${index * 20}deg) translateX(82px)` }}
            animate={{ scale: isHovered ? [1, 1.35, 0.85, 1.12] : 1 }}
            transition={{ duration: 0.8, delay: index * 0.02, repeat: isHovered ? Infinity : 0 }}
          />
        ))}
      </motion.div>
    </div>
  );
}

function GamePlanet({ isHovered }: { isHovered: boolean }) {
  return (
    <div className="relative h-full w-full">
      <motion.div
        layoutId="game-planet"
        className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_31%_24%,rgba(255,255,255,0.45),transparent_0_16%),radial-gradient(circle_at_68%_72%,rgba(30,41,59,0.42),transparent_0_52%),linear-gradient(135deg,#ef4444_0_31%,#facc15_31%_58%,#3b82f6_58%_100%)] shadow-[inset_18px_20px_30px_rgba(255,255,255,0.22),inset_-32px_-34px_46px_rgba(15,23,42,0.42),0_0_42px_rgba(250,204,21,0.16)]"
      />
      <span className="absolute left-[27%] top-[35%] h-7 w-7 rounded-md bg-blue-500 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.38),inset_-3px_-3px_5px_rgba(30,64,175,0.45)]" />
      <span className="absolute right-[29%] top-[42%] h-8 w-5 rotate-12 rounded bg-red-500 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.38),inset_-3px_-3px_5px_rgba(127,29,29,0.38)]" />
      <span className="absolute bottom-[27%] left-[42%] h-6 w-10 rounded-full bg-yellow-300 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.5),inset_-3px_-3px_5px_rgba(161,98,7,0.38)]" />
      <motion.span
        className="pointer-events-none absolute left-1/2 top-[-14px] h-8 w-8 -translate-x-1/2 bg-yellow-200 shadow-[0_0_18px_rgba(250,204,21,0.82)] [clip-path:polygon(50%_0,61%_35%,98%_35%,68%_56%,79%_91%,50%_70%,21%_91%,32%_56%,2%_35%,39%_35%)]"
        animate={{
          opacity: isHovered ? 1 : 0,
          y: isHovered ? 0 : 22,
          scale: isHovered ? [1, 1.18, 0.98, 1.08] : 0.2
        }}
        transition={{ duration: 0.42, ease: "easeInOut" }}
      />
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [view, setView] = useState<"cover" | "map">("cover");
  const [isWarping, setIsWarping] = useState(false);
  const [isNight, setIsNight] = useState(false);
  const [dockingId, setDockingId] = useState<PlanetId | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shouldReturnToMap =
      params.get("view") === "map" ||
      window.sessionStorage.getItem("return-to-planet-map") === "1";

    window.sessionStorage.removeItem("return-to-planet-map");
    if (!shouldReturnToMap) return;

    setView("map");
    if (params.get("view") === "map") {
      window.history.replaceState(null, "", "/");
    }
  }, [router]);

  function enterMap() {
    dispatchSpaceEvent("cosmic-warp", 1600);
    dispatchSpaceEvent("spaceship-boost", 1150);
    setIsWarping(true);
    window.setTimeout(() => {
      setView("map");
      setIsWarping(false);
    }, prefersReducedMotion ? 0 : 760);
  }

  function toggleNight() {
    const nextNight = !isNight;
    setIsNight(nextNight);
    dispatchSpaceEvent("cosmic-night", 0, nextNight);
  }

  function dockToPlanet(planet: Planet) {
    setDockingId(planet.id);
    dispatchSpaceEvent("spaceship-boost", 760);
    dispatchSpaceEvent("cosmic-warp", 780);
    window.setTimeout(() => router.push(planet.route), prefersReducedMotion ? 0 : 760);
  }

  return (
    <main className="relative z-10 min-h-dvh overflow-hidden px-5 text-center sm:px-8">
      <AnimatePresence mode="wait">
        {view === "cover" ? <Cover key="cover" onEnter={enterMap} /> : null}
        {view === "map" ? (
          <PlanetMap
            key="map"
            isNight={isNight}
            dockingId={dockingId}
            onToggleNight={toggleNight}
            onDock={dockToPlanet}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>{isWarping ? <WarpStreaks /> : null}</AnimatePresence>
    </main>
  );
}
