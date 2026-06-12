"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  motion,
  MotionValue,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform
} from "framer-motion";
import { SpaceshipCursor } from "@/components/SpaceshipCursor";

type Star = {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
};

const STAR_LAYERS = [
  { count: 150, depth: 8, size: [0.8, 1.45] },
  { count: 120, depth: 18, size: [1, 2] },
  { count: 76, depth: 34, size: [1.25, 2.65] },
  { count: 44, depth: 52, size: [1.75, 3.4] }
] as const;

function seededRandom(seed: number) {
  const value = Math.sin(seed * 9301.37) * 10000;
  return value - Math.floor(value);
}

function round(value: number, precision = 4) {
  return Number(value.toFixed(precision));
}

function createStars(count: number, layer: number, sizeRange: readonly [number, number]) {
  return Array.from({ length: count }, (_, index) => {
    const seed = (layer + 1) * 1000 + index * 13;
    const size = sizeRange[0] + seededRandom(seed + 3) * (sizeRange[1] - sizeRange[0]);

    return {
      id: index,
      x: round(seededRandom(seed) * 100),
      y: round(seededRandom(seed + 1) * 100),
      size: round(size),
      opacity: round(0.28 + seededRandom(seed + 2) * 0.54, 6),
      duration: round(2.4 + seededRandom(seed + 4) * 4.8, 6),
      delay: round(-seededRandom(seed + 5) * 7, 6)
    };
  });
}

function StarLayer({
  stars,
  smoothX,
  smoothY,
  depth,
  verticalDepth
}: {
  stars: Star[];
  smoothX: MotionValue<number>;
  smoothY: MotionValue<number>;
  depth: number;
  verticalDepth: number;
}) {
  const x = useTransform(smoothX, [-0.5, 0.5], [depth, -depth]);
  const y = useTransform(smoothY, [-0.5, 0.5], [verticalDepth, -verticalDepth]);

  return (
    <motion.div
      aria-hidden="true"
      className="absolute inset-[-8%] transform-gpu"
      style={{ x, y }}
    >
      {stars.map((star) => (
        <span
          key={star.id}
          className="cosmic-star"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
            "--twinkle-duration": `${star.duration}s`,
            "--twinkle-delay": `${star.delay}s`
          } as React.CSSProperties}
        />
      ))}
    </motion.div>
  );
}

function NebulaLayer({
  smoothX,
  smoothY
}: {
  smoothX: MotionValue<number>;
  smoothY: MotionValue<number>;
}) {
  const x = useTransform(smoothX, [-0.5, 0.5], [10, -10]);
  const y = useTransform(smoothY, [-0.5, 0.5], [8, -8]);

  return (
    <motion.div
      className="nebula-field absolute inset-[-12%] transform-gpu"
      style={{ x, y }}
    />
  );
}

function DustField({
  smoothX,
  smoothY
}: {
  smoothX: MotionValue<number>;
  smoothY: MotionValue<number>;
}) {
  const x = useTransform(smoothX, [-0.5, 0.5], [5, -5]);
  const y = useTransform(smoothY, [-0.5, 0.5], [4, -4]);

  return (
    <motion.div
      className="cosmic-dust absolute inset-[-10%] transform-gpu"
      style={{ x, y }}
    />
  );
}

function DistantPlanets({
  smoothX,
  smoothY
}: {
  smoothX: MotionValue<number>;
  smoothY: MotionValue<number>;
}) {
  const largeX = useTransform(smoothX, [-0.5, 0.5], [14, -14]);
  const largeY = useTransform(smoothY, [-0.5, 0.5], [9, -9]);
  const smallX = useTransform(smoothX, [-0.5, 0.5], [24, -24]);
  const smallY = useTransform(smoothY, [-0.5, 0.5], [15, -15]);

  return (
    <>
      <motion.div
        className="distant-planet distant-planet-large absolute right-[-8rem] top-[10%] h-72 w-72 rounded-full sm:h-96 sm:w-96"
        style={{ x: largeX, y: largeY }}
      />
      <motion.div
        className="distant-planet distant-planet-small absolute bottom-[14%] left-[-3rem] h-28 w-28 rounded-full sm:h-40 sm:w-40"
        style={{ x: smallX, y: smallY }}
      />
    </>
  );
}

export function CosmicShell({ children }: { children: ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  const [isWarping, setIsWarping] = useState(false);
  const [isNight, setIsNight] = useState(false);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 48, damping: 22, mass: 0.8 });
  const smoothY = useSpring(pointerY, { stiffness: 48, damping: 22, mass: 0.8 });

  const starLayers = useMemo(
    () =>
      STAR_LAYERS.map((layer, index) => ({
        ...layer,
        stars: createStars(layer.count, index, layer.size)
      })),
    []
  );

  useEffect(() => {
    let warpTimer: number | undefined;

    function handleWarp(event: Event) {
      const detail = (event as CustomEvent<{ duration?: number }>).detail;
      setIsWarping(true);
      window.clearTimeout(warpTimer);
      warpTimer = window.setTimeout(() => setIsWarping(false), detail?.duration ?? 1100);
    }

    function handleNight(event: Event) {
      const detail = (event as CustomEvent<{ active?: boolean }>).detail;
      setIsNight(Boolean(detail?.active));
    }

    window.addEventListener("cosmic-warp", handleWarp);
    window.addEventListener("cosmic-night", handleNight);

    return () => {
      window.clearTimeout(warpTimer);
      window.removeEventListener("cosmic-warp", handleWarp);
      window.removeEventListener("cosmic-night", handleNight);
    };
  }, []);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (prefersReducedMotion) return;

    const nextX = event.clientX / window.innerWidth - 0.5;
    const nextY = event.clientY / window.innerHeight - 0.5;
    pointerX.set(nextX);
    pointerY.set(nextY);
  }

  return (
    <div
      className={[
        "cosmic-shell relative min-h-dvh overflow-hidden bg-void text-starlight",
        isWarping ? "is-warping" : "",
        isNight ? "is-night" : ""
      ].join(" ")}
      onPointerMove={handlePointerMove}
    >
      <div aria-hidden="true" className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(12,20,42,0.96),#03040a_58%,#010106_100%)]" />
        <NebulaLayer smoothX={smoothX} smoothY={smoothY} />
        <DistantPlanets smoothX={smoothX} smoothY={smoothY} />
        <DustField smoothX={smoothX} smoothY={smoothY} />
        {starLayers.map((layer, index) => (
          <StarLayer
            key={index}
            stars={layer.stars}
            smoothX={smoothX}
            smoothY={smoothY}
            depth={layer.depth}
            verticalDepth={layer.depth * 0.62}
          />
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.014)_1px,transparent_1px)] bg-[size:64px_64px] opacity-20 [mask-image:radial-gradient(circle_at_center,black,transparent_72%)]" />
      </div>
      <div className="relative z-10 min-h-dvh">{children}</div>
      <SpaceshipCursor />
    </div>
  );
}
