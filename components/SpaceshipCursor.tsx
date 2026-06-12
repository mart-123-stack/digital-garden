"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform
} from "framer-motion";

function useIsFinePointer() {
  const isFinePointer = useRef(false);

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => {
      isFinePointer.current = media.matches;
    };

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isFinePointer;
}

const bodyShadow =
  "inset 2px 2px 4px rgba(255,255,255,0.86), inset -3px -3px 6px rgba(148,163,184,0.34), 0 7px 16px rgba(2,6,23,0.28), 0 0 22px rgba(245,200,75,0.20)";

const wingShadow =
  "inset 1px 2px 3px rgba(255,255,255,0.55), inset -2px -3px 5px rgba(146,64,14,0.30), 0 4px 9px rgba(2,6,23,0.24)";

const cockpitShadow =
  "inset 2px 2px 3px rgba(255,255,255,0.56), inset -2px -3px 5px rgba(12,74,110,0.42), 0 0 0 1px rgba(14,116,144,0.32), 0 3px 7px rgba(2,6,23,0.22)";

export function SpaceshipCursor() {
  const prefersReducedMotion = useReducedMotion();
  const [isBoosting, setIsBoosting] = useState(false);
  const isFinePointer = useIsFinePointer();
  const rawX = useMotionValue(-100);
  const rawY = useMotionValue(-100);
  const velocityX = useMotionValue(0);
  const velocityY = useMotionValue(0);
  const lastPoint = useRef({ x: -100, y: -100, time: 0 });

  const x = useSpring(rawX, { stiffness: 520, damping: 38, mass: 0.42 });
  const y = useSpring(rawY, { stiffness: 520, damping: 38, mass: 0.42 });
  const rotate = useSpring(
    useTransform([velocityX, velocityY], ([vx, vy]) => {
      if (Math.abs(vx as number) + Math.abs(vy as number) < 0.04) return 0;
      return Math.atan2(vy as number, vx as number) * (180 / Math.PI) + 90;
    }),
    { stiffness: 220, damping: 24, mass: 0.5 }
  );
  const tilt = useSpring(useTransform(velocityX, [-1.4, 1.4], [-10, 10]), {
    stiffness: 180,
    damping: 18,
    mass: 0.5
  });
  const thrust = useTransform([velocityX, velocityY], ([vx, vy]) => {
    const speed = Math.min(1, Math.hypot(vx as number, vy as number));
    return 0.54 + speed * 0.46;
  });

  useEffect(() => {
    if (prefersReducedMotion) return;

    function handleMove(event: PointerEvent) {
      if (!isFinePointer.current) return;

      const now = performance.now();
      const deltaTime = Math.max(16, now - lastPoint.current.time || 16);
      const dx = event.clientX - lastPoint.current.x;
      const dy = event.clientY - lastPoint.current.y;

      rawX.set(event.clientX);
      rawY.set(event.clientY);
      velocityX.set(dx / deltaTime);
      velocityY.set(dy / deltaTime);
      lastPoint.current = { x: event.clientX, y: event.clientY, time: now };
    }

    function handleLeave() {
      rawX.set(-100);
      rawY.set(-100);
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerleave", handleLeave);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerleave", handleLeave);
    };
  }, [isFinePointer, prefersReducedMotion, rawX, rawY, velocityX, velocityY]);

  useEffect(() => {
    let boostTimer: number | undefined;

    function handleBoost(event: Event) {
      const detail = (event as CustomEvent<{ duration?: number }>).detail;
      setIsBoosting(true);
      window.clearTimeout(boostTimer);
      boostTimer = window.setTimeout(() => setIsBoosting(false), detail?.duration ?? 900);
    }

    window.addEventListener("spaceship-boost", handleBoost);
    return () => {
      window.clearTimeout(boostTimer);
      window.removeEventListener("spaceship-boost", handleBoost);
    };
  }, []);

  if (prefersReducedMotion) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-50 hidden h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-amber-200/18 bg-starlight/[0.025] shadow-[0_0_0_1px_rgba(245,200,75,0.12),0_0_34px_rgba(232,93,117,0.14)] backdrop-blur-[1.5px] transform-gpu md:flex"
      style={{ x, y }}
    >
      <motion.div
        className="relative h-14 w-14 transform-gpu"
        animate={
          isBoosting
            ? {
                scale: [1, 0.82, 0.88, 1],
                x: [0, -1.4, 1.2, -0.9, 0.7, 0],
                y: [0, 1.1, -1.2, 0.9, -0.6, 0]
              }
            : { scale: 1, x: 0, y: 0 }
        }
        transition={{ duration: 0.54, ease: "easeInOut" }}
        style={{ rotate, skewX: tilt }}
      >
        {/* 果冻尾焰：用圆形粒子代替尖锐火焰，靠透明度和 blur 做软糯能量感。 */}
        <motion.div
          className="absolute left-1/2 top-[38px] z-0 h-8 w-8 -translate-x-1/2 origin-top"
          animate={{ scaleY: [0.9, 1.18, 0.96], scaleX: [1.08, 0.88, 1.04] }}
          transition={{ duration: 0.86, ease: "easeInOut", repeat: Infinity }}
          style={{ opacity: thrust }}
        >
          <span className="absolute left-[9px] top-0 h-4 w-4 rounded-full bg-amber-300/75 blur-[1px]" />
          <span className="absolute left-[5px] top-[9px] h-4 w-4 rounded-full bg-orange-400/60 blur-sm" />
          <span className="absolute left-[16px] top-[8px] h-3.5 w-3.5 rounded-full bg-roseglow/58 blur-sm" />
          <span className="absolute left-[11px] top-[17px] h-3 w-3 rounded-full bg-yellow-100/70 blur-[2px]" />
        </motion.div>

        {/* 卡通小机翼：短、圆、厚，明黄色负责“小王子”撞色。 */}
        <div
          className="absolute left-[6px] top-[27px] z-10 h-4 w-6 -rotate-[28deg] rounded-full bg-amber-400"
          style={{ boxShadow: wingShadow }}
        />
        <div
          className="absolute right-[6px] top-[27px] z-10 h-4 w-6 rotate-[28deg] rounded-full bg-amber-400"
          style={{ boxShadow: wingShadow }}
        />

        {/* 胶囊机身：多重 inset 阴影塑造白瓷/塑料的胖乎乎体积。 */}
        <div
          className="absolute left-1/2 top-[8px] z-20 h-8 w-5 -translate-x-1/2 rounded-[52%_52%_42%_42%] bg-slate-50"
          style={{ boxShadow: bodyShadow }}
        >
          {/* 机身高光：斜向亮斑让表面更像皮克斯式抛光材质。 */}
          <span className="absolute left-[4px] top-[4px] h-4 w-2 rounded-full bg-white/70 blur-[0.4px] [transform:rotate(18deg)]" />
          <span className="absolute right-[3px] top-[18px] h-1.5 w-1.5 rounded-full bg-slate-300/55" />
          <span className="absolute left-[3px] top-[21px] h-1 w-1 rounded-full bg-slate-300/60" />

          {/* 复古大座舱：宝石蓝玻璃 + 内阴影 + 白色斜切反光板。 */}
          <div
            className="absolute left-1/2 top-[5px] h-[14px] w-[14px] -translate-x-1/2 overflow-hidden rounded-full bg-sky-400"
            style={
              {
                boxShadow: cockpitShadow,
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.78) 0 18%, transparent 19% 38%, rgba(56,189,248,1) 39% 100%)"
              } satisfies CSSProperties
            }
          >
            <span className="absolute bottom-[2px] right-[2px] h-1.5 w-1.5 rounded-full bg-sky-700/35 blur-[0.5px]" />
          </div>
        </div>

        {/* 圆嘟嘟喷口：暗色橡胶圈压在尾焰前面，增加玩具模型的层次。 */}
        <div className="absolute left-1/2 top-[36px] z-30 h-2.5 w-4 -translate-x-1/2 rounded-full bg-slate-500 shadow-[inset_0_1px_2px_rgba(255,255,255,0.36),inset_0_-2px_3px_rgba(15,23,42,0.45)]" />
      </motion.div>
    </motion.div>
  );
}
