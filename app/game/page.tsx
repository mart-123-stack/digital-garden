"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";

type ToyId = "star-catcher" | "logic-bot" | "ufo-dodge" | "color-blocks";

type Toy = {
  id: ToyId;
  name: string;
  label: string;
  position: string;
  rotate: number;
};

type ScoreRow = {
  id: string;
  score: number;
  nickname?: string | null;
  name?: string | null;
  created_at: string;
};

type ScoreEvent = {
  gameId: ToyId;
  score: number;
  metadata?: Record<string, unknown>;
};

const toys: Toy[] = [
  {
    id: "star-catcher",
    name: "星星收集",
    label: "圆嘟嘟小星星",
    position: "left-[5%] top-[30%] sm:left-[11%] sm:top-[23%]",
    rotate: -10
  },
  {
    id: "logic-bot",
    name: "逻辑积木",
    label: "三层小机器人",
    position: "right-[4%] top-[30%] sm:right-[18%] sm:top-[24%]",
    rotate: 7
  },
  {
    id: "ufo-dodge",
    name: "飞碟避让",
    label: "发光飞碟",
    position: "left-[4%] top-[58%] sm:left-[24%] sm:top-[62%]",
    rotate: 4
  },
  {
    id: "color-blocks",
    name: "色块消除",
    label: "软糖方块",
    position: "right-[4%] top-[58%] sm:right-[12%] sm:top-[62%]",
    rotate: -8
  }
];

function dispatchSpaceEvent(name: string, duration = 900) {
  window.dispatchEvent(new CustomEvent(name, { detail: { duration } }));
}

function prepareReturnToMap() {
  window.sessionStorage.setItem("return-to-planet-map", "1");
  dispatchSpaceEvent("spaceship-boost", 860);
  dispatchSpaceEvent("cosmic-warp", 860);
}

function StarToy() {
  return (
    <div className="relative h-28 w-28">
      <div className="absolute inset-2 bg-[linear-gradient(135deg,#fff7ad,#facc15_48%,#f97316)] shadow-[inset_5px_6px_9px_rgba(255,255,255,0.68),inset_-8px_-9px_14px_rgba(161,98,7,0.36),0_22px_34px_rgba(2,6,23,0.28),0_0_30px_rgba(250,204,21,0.36)] [clip-path:polygon(50%_0,62%_34%,98%_34%,69%_55%,80%_91%,50%_70%,20%_91%,31%_55%,2%_34%,38%_34%)]" />
      <span className="absolute left-8 top-8 h-4 w-4 rounded-full bg-white/75 blur-[1px]" />
      <span className="absolute right-8 top-9 h-2.5 w-2.5 rounded-full bg-amber-950/45" />
      <span className="absolute left-1/2 top-[55%] h-2 w-8 -translate-x-1/2 rounded-full bg-amber-950/35" />
    </div>
  );
}

function BotToy() {
  return (
    <div className="relative h-32 w-28">
      <span className="absolute left-1/2 top-0 h-5 w-1.5 -translate-x-1/2 rounded-full bg-slate-700 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.5)]" />
      <span className="absolute left-1/2 top-[-8px] h-4 w-4 -translate-x-1/2 rounded-full bg-red-400 shadow-[0_0_18px_rgba(248,113,113,0.7)]" />
      <div className="absolute left-1/2 top-4 h-20 w-24 -translate-x-1/2 rounded-[1.35rem] bg-[linear-gradient(135deg,#93c5fd,#2563eb_58%,#1e3a8a)] shadow-[inset_6px_7px_10px_rgba(255,255,255,0.46),inset_-8px_-10px_16px_rgba(30,58,138,0.52),0_22px_32px_rgba(2,6,23,0.3)]">
        <span className="absolute left-6 top-7 h-4 w-4 rounded-full bg-cyan-100 shadow-[0_0_12px_rgba(165,243,252,0.8)]" />
        <span className="absolute right-6 top-7 h-4 w-4 rounded-full bg-cyan-100 shadow-[0_0_12px_rgba(165,243,252,0.8)]" />
        <span className="absolute bottom-6 left-1/2 h-2 w-9 -translate-x-1/2 rounded-full bg-blue-950/45" />
      </div>
      <div className="absolute bottom-5 left-4 h-9 w-20 rounded-2xl bg-[linear-gradient(135deg,#fef08a,#facc15_55%,#ca8a04)] shadow-[inset_4px_5px_8px_rgba(255,255,255,0.5),inset_-6px_-7px_11px_rgba(133,77,14,0.42),0_16px_22px_rgba(2,6,23,0.24)]" />
      <span className="absolute bottom-0 left-5 h-7 w-6 rounded-xl bg-red-500 shadow-[inset_3px_3px_5px_rgba(255,255,255,0.38),inset_-4px_-5px_8px_rgba(127,29,29,0.45)]" />
      <span className="absolute bottom-0 right-5 h-7 w-6 rounded-xl bg-red-500 shadow-[inset_3px_3px_5px_rgba(255,255,255,0.38),inset_-4px_-5px_8px_rgba(127,29,29,0.45)]" />
    </div>
  );
}

function UfoToy() {
  return (
    <div className="relative h-24 w-36">
      <span className="absolute left-1/2 top-2 h-16 w-20 -translate-x-1/2 rounded-[50%_50%_42%_42%] bg-[linear-gradient(135deg,#bae6fd,#38bdf8_54%,#0369a1)] shadow-[inset_6px_7px_10px_rgba(255,255,255,0.58),inset_-8px_-8px_14px_rgba(12,74,110,0.44),0_0_28px_rgba(56,189,248,0.34)]" />
      <span className="absolute left-2 top-10 h-10 w-32 rounded-[50%] bg-[linear-gradient(135deg,#f8fafc,#cbd5e1_44%,#64748b)] shadow-[inset_6px_6px_9px_rgba(255,255,255,0.75),inset_-9px_-9px_16px_rgba(71,85,105,0.42),0_24px_32px_rgba(2,6,23,0.32)]" />
      <span className="absolute left-9 top-[3.15rem] h-3 w-3 rounded-full bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.75)]" />
      <span className="absolute left-[4.1rem] top-[3.35rem] h-3 w-3 rounded-full bg-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.75)]" />
      <span className="absolute right-9 top-[3.15rem] h-3 w-3 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.75)]" />
      <span className="absolute bottom-0 left-1/2 h-8 w-20 -translate-x-1/2 rounded-full bg-cyan-200/20 blur-lg" />
    </div>
  );
}

function BlocksToy() {
  return (
    <div className="grid h-28 w-28 grid-cols-2 gap-2">
      {[
        "bg-red-500 shadow-red-950/30",
        "bg-yellow-300 shadow-yellow-950/25",
        "bg-blue-500 shadow-blue-950/30",
        "bg-emerald-400 shadow-emerald-950/25"
      ].map((color, index) => (
        <span
          key={color}
          className={[
            "rounded-2xl shadow-[inset_5px_5px_8px_rgba(255,255,255,0.42),inset_-7px_-8px_12px_rgba(15,23,42,0.22),0_18px_26px_var(--tw-shadow-color)]",
            color,
            index % 2 === 0 ? "rotate-[-5deg]" : "rotate-[6deg]"
          ].join(" ")}
        />
      ))}
    </div>
  );
}

function ToyBody({ id }: { id: ToyId }) {
  if (id === "star-catcher") return <StarToy />;
  if (id === "logic-bot") return <BotToy />;
  if (id === "ufo-dodge") return <UfoToy />;
  return <BlocksToy />;
}

function ToyShelfButton({
  toy,
  isActive,
  onSelect
}: {
  toy: Toy;
  isActive: boolean;
  onSelect: (toy: Toy) => void;
}) {
  return (
    <motion.button
      type="button"
      aria-label={`选择小游戏：${toy.name}`}
      aria-pressed={isActive}
      onClick={() => onSelect(toy)}
      className={[
        "relative flex min-h-36 flex-col items-center justify-end gap-2 rounded-[1.5rem] border p-3 outline-none",
        "bg-white/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_18px_42px_rgba(2,6,23,0.2)] backdrop-blur-md",
        isActive ? "border-comet/55 ring-2 ring-comet/20" : "border-white/12"
      ].join(" ")}
      whileHover={{ y: -6, scale: 1.03 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 220, damping: 13, mass: 1.25 }}
    >
      <motion.div
        className="origin-bottom scale-[0.64]"
        animate={{ rotate: isActive ? [toy.rotate, toy.rotate + 3, toy.rotate] : toy.rotate }}
        transition={{ duration: 1.2, repeat: isActive ? Infinity : 0, ease: "easeInOut" }}
      >
        <ToyBody id={toy.id} />
      </motion.div>
      <span className="rounded-full border border-white/20 bg-black/24 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-starlight/70 backdrop-blur-md">
        {toy.name}
      </span>
    </motion.button>
  );
}

function GameFrame({ children, hint }: { children: ReactNode; hint: string }) {
  return (
    <div className="mt-5 rounded-[1.5rem] border border-white/12 bg-slate-950/35 p-4">
      {children}
      <p className="mt-3 text-xs leading-6 text-starlight/50">{hint}</p>
    </div>
  );
}

function StarCatcherGame({ activeToy, onScore }: { activeToy: Toy; onScore: (event: ScoreEvent) => void }) {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [misses, setMisses] = useState(0);
  const [target, setTarget] = useState(4);
  const [timeLeft, setTimeLeft] = useState(12);
  const cells = useMemo(() => Array.from({ length: 9 }, (_, index) => index), []);

  function nextTarget() {
    setTarget((value) => (value * 5 + 3) % 9);
    setTimeLeft(12);
  }

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft((value) => {
        if (value > 1) return value - 1;
        setMisses((current) => current + 1);
        setStreak(0);
        nextTarget();
        return 12;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  function collect(index: number) {
    if (index !== target) {
      setMisses((value) => value + 1);
      setStreak(0);
      return;
    }

    setScore((value) => value + 10 + streak * 2);
    onScore({
      gameId: activeToy.id,
      score: score + 10 + streak * 2,
      metadata: { streak: streak + 1, misses }
    });
    setStreak((value) => value + 1);
    nextTarget();
  }

  return (
    <GameFrame hint={`${activeToy.label} 唤起了限时找星游戏：12 秒内点亮真正发光的星星，连击会提高得分，点错或超时会记一次 Miss。`}>
      <div className="rounded-[1.2rem] border border-white/12 bg-[radial-gradient(circle_at_50%_18%,rgba(250,204,21,0.18),transparent_0_28%),linear-gradient(180deg,rgba(15,23,42,0.86),rgba(2,6,23,0.92))] p-4">
        <div className="mb-4 grid grid-cols-4 gap-2 text-center text-xs text-starlight/70">
          <div className="rounded-full border border-white/12 bg-white/8 py-2">Score {score}</div>
          <div className="rounded-full border border-white/12 bg-white/8 py-2">Combo {streak}</div>
          <div className="rounded-full border border-white/12 bg-white/8 py-2">Time {timeLeft}</div>
          <div className="rounded-full border border-white/12 bg-white/8 py-2">Miss {misses}</div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {cells.map((index) => {
            const isTarget = index === target;

            return (
              <motion.button
                key={index}
                type="button"
                aria-label={isTarget ? "收集目标星星" : "干扰星星"}
                onClick={() => collect(index)}
                className={[
                  "flex aspect-square items-center justify-center rounded-[1.2rem] border shadow-[inset_5px_6px_10px_rgba(255,255,255,0.24),inset_-8px_-9px_16px_rgba(15,23,42,0.34)]",
                  isTarget
                    ? "border-yellow-100/60 bg-yellow-300/22 shadow-yellow-300/30"
                    : "border-white/10 bg-white/[0.055]"
                ].join(" ")}
                animate={{ scale: isTarget ? [1, 1.08, 1] : 1 }}
                transition={{ duration: 0.7, repeat: isTarget ? Infinity : 0 }}
              >
                <span
                  className={[
                    "h-9 w-9 [clip-path:polygon(50%_0,61%_35%,98%_35%,68%_56%,79%_91%,50%_70%,21%_91%,32%_56%,2%_35%,39%_35%)]",
                    isTarget
                      ? "bg-yellow-200 shadow-[0_0_24px_rgba(250,204,21,0.95)]"
                      : "bg-slate-400/35"
                  ].join(" ")}
                />
              </motion.button>
            );
          })}
        </div>
      </div>
    </GameFrame>
  );
}

function LogicBotGame({ activeToy, onScore }: { activeToy: Toy; onScore: (event: ScoreEvent) => void }) {
  const fullSequence = useMemo(
    () => ["red", "blue", "yellow", "green", "blue", "red", "green", "yellow"],
    []
  );
  const palette = useMemo(() => ["red", "blue", "yellow", "green"], []);
  const [round, setRound] = useState(1);
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [mistake, setMistake] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(true);
  const sequence = fullSequence.slice(0, Math.min(2 + round, fullSequence.length));
  const colors: Record<string, string> = {
    red: "bg-red-500 shadow-red-500/45",
    blue: "bg-blue-500 shadow-blue-500/45",
    yellow: "bg-yellow-300 shadow-yellow-300/45",
    green: "bg-emerald-400 shadow-emerald-400/45"
  };

  function press(color: string) {
    if (isPreviewing) return;

    if (color !== sequence[step]) {
      setMistake(true);
      setStep(0);
      setIsPreviewing(true);
      return;
    }

    setMistake(false);
    if (step === sequence.length - 1) {
      setScore((value) => value + sequence.length * 5);
      onScore({
        gameId: activeToy.id,
        score: score + sequence.length * 5,
        metadata: { round, sequenceLength: sequence.length }
      });
      setRound((value) => Math.min(value + 1, fullSequence.length - 2));
      setStep(0);
      setIsPreviewing(true);
      return;
    }

    setStep((value) => value + 1);
  }

  return (
    <GameFrame hint={`${activeToy.label} 唤起了记忆序列游戏：先看机器人给出的色块路径，点击“开始输入”后隐藏提示，按顺序复现；每轮会变长。`}>
      <div className="grid gap-4 rounded-[1.2rem] border border-white/12 bg-[linear-gradient(180deg,rgba(15,23,42,0.78),rgba(2,6,23,0.9))] p-4 sm:grid-cols-[0.9fr_1.1fr]">
        <div className="relative min-h-56 rounded-[1.1rem] border border-white/10 bg-blue-950/30 p-4">
          <div className="mx-auto h-28 w-36 rounded-[2rem] bg-[linear-gradient(135deg,#93c5fd,#2563eb_58%,#1e3a8a)] shadow-[inset_8px_9px_13px_rgba(255,255,255,0.38),inset_-10px_-12px_18px_rgba(30,58,138,0.56),0_24px_34px_rgba(2,6,23,0.34)]" />
          <motion.span
            className="absolute left-[34%] top-16 h-5 w-5 rounded-full bg-cyan-100 shadow-[0_0_16px_rgba(165,243,252,0.9)]"
            animate={{ scale: [1, 1.35, 1] }}
            transition={{ duration: 0.7, repeat: Infinity }}
          />
          <motion.span
            className="absolute right-[34%] top-16 h-5 w-5 rounded-full bg-cyan-100 shadow-[0_0_16px_rgba(165,243,252,0.9)]"
            animate={{ scale: [1.3, 1, 1.3] }}
            transition={{ duration: 0.7, repeat: Infinity }}
          />
          <div className="mt-5 flex justify-center gap-2">
            {sequence.map((color, index) => (
              <span
                key={`${color}-${index}`}
                className={[
                  "h-4 w-4 rounded-md border border-white/18",
                  isPreviewing || index < step ? colors[color] : "bg-slate-700/70",
                  index === step && !isPreviewing ? "ring-2 ring-white/70" : "opacity-70"
                ].join(" ")}
              />
            ))}
          </div>
          <p className="mt-4 text-center text-xs uppercase tracking-[0.24em] text-starlight/50">
            Round {round} · Step {step + 1} / {sequence.length} · Score {score}
          </p>
          <button
            type="button"
            aria-label="开始输入记忆序列"
            onClick={() => {
              setMistake(false);
              setIsPreviewing(false);
              setStep(0);
            }}
            className="mx-auto mt-4 block rounded-full border border-cyan-100/24 bg-cyan-100/12 px-4 py-2 text-xs text-cyan-100"
          >
            {isPreviewing ? "开始输入" : "正在输入"}
          </button>
          {mistake ? <p className="mt-3 text-center text-xs text-rose-200">序列重置，再来一次。</p> : null}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {palette.map((color) => (
            <motion.button
              key={color}
              type="button"
              aria-label={`按下 ${color} 色块`}
              onClick={() => press(color)}
              className={[
                "min-h-24 rounded-[1.4rem] shadow-[inset_6px_7px_11px_rgba(255,255,255,0.4),inset_-9px_-10px_15px_rgba(15,23,42,0.3),0_18px_30px_var(--tw-shadow-color)]",
                colors[color],
                sequence[step] === color ? "ring-4 ring-white/45" : ""
              ].join(" ")}
              whileTap={{ scale: 0.88 }}
              transition={{ type: "spring", stiffness: 360, damping: 14 }}
            />
          ))}
        </div>
      </div>
    </GameFrame>
  );
}

function UfoDodgeGame({ activeToy, onScore }: { activeToy: Toy; onScore: (event: ScoreEvent) => void }) {
  const [lane, setLane] = useState(1);
  const [meteorLane, setMeteorLane] = useState(0);
  const [wave, setWave] = useState(1);
  const [score, setScore] = useState(0);
  const [shields, setShields] = useState(2);
  const [status, setStatus] = useState("选择轨道，躲开下一颗陨石。");
  const lanes = useMemo(() => [16, 50, 84], []);

  function nextWave(blockWithShield = false) {
    if (lane === meteorLane && !blockWithShield) {
      setScore((value) => Math.max(0, value - 3));
      setStatus("撞上陨石，扣 3 分。");
    } else {
      const gained = blockWithShield ? 6 : 10;
      const nextScore = score + gained;
      setScore(nextScore);
      onScore({
        gameId: activeToy.id,
        score: nextScore,
        metadata: { wave, shields, blockWithShield }
      });
      setStatus(blockWithShield ? "护盾挡下陨石，+6。" : "漂亮闪避，+10。");
    }

    setWave((value) => value + 1);
    setMeteorLane((value) => (value + wave * 2 + 1) % 3);
  }

  function useShield() {
    if (shields <= 0) {
      setStatus("护盾已经用完了。");
      return;
    }

    setShields((value) => value - 1);
    nextWave(true);
  }

  return (
    <GameFrame hint={`${activeToy.label} 唤起了三轨道避让游戏：先看陨石预警，移动飞碟到安全轨道，结算一波；护盾有限，用来救急。`}>
      <div className="relative h-72 overflow-hidden rounded-[1.2rem] border border-white/12 bg-[radial-gradient(circle_at_50%_80%,rgba(56,189,248,0.18),transparent_0_34%),linear-gradient(180deg,rgba(2,6,23,0.92),rgba(12,74,110,0.52))]">
        <div className="absolute left-4 top-4 z-20 rounded-full border border-white/14 bg-white/10 px-3 py-1 text-xs text-starlight/70">
          Score {score} · Wave {wave} · Shield {shields}
        </div>
        {lanes.map((left, index) => (
          <button
            key={left}
            type="button"
            aria-label={`移动到 ${index + 1} 号轨道`}
            onClick={() => setLane(index)}
            className={[
              "absolute bottom-4 top-14 w-[28%] -translate-x-1/2 rounded-2xl border",
              lane === index ? "border-cyan-100/45 bg-cyan-100/10" : "border-white/8 bg-white/[0.025]"
            ].join(" ")}
            style={{ left: `${left}%` }}
          />
        ))}
        <motion.span
          key={wave}
          className="absolute top-16 h-11 w-11 -translate-x-1/2 rounded-[45%] bg-[linear-gradient(135deg,#fca5a5,#ef4444_55%,#7f1d1d)] shadow-[inset_4px_4px_7px_rgba(255,255,255,0.38),0_0_22px_rgba(248,113,113,0.52)]"
          style={{ left: `${lanes[meteorLane]}%` }}
          initial={{ y: 0, rotate: -20 }}
          animate={{ y: [0, 42, 0], rotate: [0, 80, 160] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-12 h-12 w-28 rounded-[50%] border border-cyan-100/35 bg-cyan-200/16 shadow-[0_0_34px_rgba(125,211,252,0.45),inset_0_0_18px_rgba(255,255,255,0.22)]"
          animate={{ left: `${lanes[lane]}%`, x: "-50%" }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
        />
        <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-2">
          <button
            type="button"
            aria-label="结算飞碟闪避"
            onClick={() => nextWave(false)}
            className="rounded-full border border-comet/28 bg-comet/12 px-4 py-2 text-xs text-comet"
          >
            结算闪避
          </button>
          <button
            type="button"
            aria-label="使用飞碟护盾"
            onClick={useShield}
            className="rounded-full border border-cyan-100/24 bg-cyan-100/12 px-4 py-2 text-xs text-cyan-100"
          >
            使用护盾
          </button>
        </div>
        <p className="absolute left-4 right-4 top-12 z-20 text-xs text-starlight/50">{status}</p>
      </div>
    </GameFrame>
  );
}

function ColorBlocksGame({ activeToy, onScore }: { activeToy: Toy; onScore: (event: ScoreEvent) => void }) {
  const initialBlocks = useMemo(
    () => ["red", "blue", "yellow", "green", "blue", "yellow", "green", "red", "yellow", "green", "red", "blue"],
    []
  );
  const [blocks, setBlocks] = useState(initialBlocks);
  const [score, setScore] = useState(0);
  const colorClass: Record<string, string> = {
    red: "bg-red-500 shadow-red-500/45",
    blue: "bg-blue-500 shadow-blue-500/45",
    yellow: "bg-yellow-300 shadow-yellow-300/45",
    green: "bg-emerald-400 shadow-emerald-400/45"
  };

  function popBlock(index: number) {
    setBlocks((current) => current.filter((_, blockIndex) => blockIndex !== index));
    setScore((value) => value + 1);
    onScore({
      gameId: activeToy.id,
      score: score + 1,
      metadata: { remaining: Math.max(0, blocks.length - 1) }
    });
  }

  function reset() {
    setBlocks(initialBlocks);
    setScore(0);
  }

  return (
    <GameFrame hint={`${activeToy.label} 唤起了消除游戏：点击软糖色块把它们弹出玩具盒，清空后可以重置。`}>
      <div className="rounded-[1.2rem] border border-white/12 bg-[linear-gradient(180deg,rgba(15,23,42,0.74),rgba(2,6,23,0.9))] p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.24em] text-starlight/55">Cleared {score}</p>
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-white/14 bg-white/8 px-3 py-1 text-xs text-starlight/68"
          >
            重置
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <AnimatePresence>
            {blocks.map((block, index) => (
              <motion.button
                key={`${block}-${index}`}
                type="button"
                aria-label={`消除 ${block} 色块`}
                onClick={() => popBlock(index)}
                className={[
                  "aspect-square rounded-[1.15rem] shadow-[inset_5px_6px_9px_rgba(255,255,255,0.42),inset_-8px_-9px_13px_rgba(15,23,42,0.26),0_16px_24px_var(--tw-shadow-color)]",
                  colorClass[block]
                ].join(" ")}
                initial={{ opacity: 0, scale: 0.5, y: -18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.45, rotate: 18, filter: "blur(8px)" }}
                whileTap={{ scale: 0.82 }}
                transition={{ type: "spring", stiffness: 260, damping: 15 }}
              />
            ))}
          </AnimatePresence>
        </div>
        {blocks.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-comet/20 bg-comet/10 p-3 text-center text-sm text-comet">
            玩具盒清空了，漂亮。
          </p>
        ) : null}
      </div>
    </GameFrame>
  );
}

function MiniGame({ activeToy, onScore }: { activeToy: Toy; onScore: (event: ScoreEvent) => void }) {
  if (activeToy.id === "logic-bot") return <LogicBotGame activeToy={activeToy} onScore={onScore} />;
  if (activeToy.id === "ufo-dodge") return <UfoDodgeGame activeToy={activeToy} onScore={onScore} />;
  if (activeToy.id === "color-blocks") return <ColorBlocksGame activeToy={activeToy} onScore={onScore} />;
  return <StarCatcherGame activeToy={activeToy} onScore={onScore} />;
}

function ScoreDock({
  toy,
  localBest,
  message,
  leaderboard
}: {
  toy: Toy;
  localBest: number;
  message: string;
  leaderboard: ScoreRow[];
}) {
  return (
    <aside className="mt-5 grid gap-3 lg:grid-cols-[0.7fr_1fr]">
      <div className="rounded-[1.4rem] border border-comet/18 bg-comet/8 p-4">
        <p className="text-[10px] uppercase tracking-[0.3em] text-comet/70">Score Relay</p>
        <p className="mt-3 font-display text-4xl text-starlight">{localBest}</p>
        <p className="mt-2 text-xs leading-6 text-starlight/48">
          {message || `${toy.name} 的本地最佳分。登录后会同步到排行榜和 Profile 游戏勋章。`}
        </p>
      </div>
      <div className="rounded-[1.4rem] border border-white/12 bg-white/[0.055] p-4">
        <p className="text-[10px] uppercase tracking-[0.3em] text-starlight/45">Leaderboard</p>
        <div className="mt-3 space-y-2">
          {leaderboard.slice(0, 5).map((row, index) => (
            <div key={row.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/16 px-3 py-2 text-sm">
              <span className="text-starlight/62">
                #{index + 1} {row.nickname || row.name || "Pilot"}
              </span>
              <span className="font-mono text-comet">{row.score}</span>
            </div>
          ))}
          {leaderboard.length === 0 ? <p className="text-sm text-starlight/40">排行榜等待数据库连接后点亮。</p> : null}
        </div>
      </div>
    </aside>
  );
}

function GameConsole({
  toy,
  onSelect,
  onScore,
  localBest,
  scoreMessage,
  leaderboard
}: {
  toy: Toy;
  onSelect: (toy: Toy) => void;
  onScore: (event: ScoreEvent) => void;
  localBest: number;
  scoreMessage: string;
  leaderboard: ScoreRow[];
}) {
  return (
    <motion.section
      className="relative z-30 w-full rounded-[2rem] border border-white/18 bg-white/10 p-4 text-left shadow-[0_34px_110px_rgba(2,6,23,0.46),inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-xl sm:p-5"
      initial={{ opacity: 0, y: 28, scale: 0.96, rotateX: 8, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0, filter: "blur(0px)" }}
      transition={{ type: "spring", stiffness: 135, damping: 15, mass: 0.95 }}
    >
      <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.36em] text-comet/75">Toy Cartridge</p>
          <h2 className="mt-2 font-display text-4xl text-starlight sm:text-5xl">{toy.name}</h2>
        </div>
        <div className="rounded-full border border-comet/24 bg-comet/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-comet">
          Playing
        </div>
      </div>
      <div className="relative z-40 mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {toys.map((mode) => (
          <button
            key={mode.id}
            type="button"
            aria-label={`切换小游戏：${mode.name}`}
            onClick={() => onSelect(mode)}
            className={[
              "rounded-full border px-3 py-2 text-xs transition-colors",
              toy.id === mode.id
                ? "border-comet/45 bg-comet/16 text-comet"
                : "border-white/12 bg-white/6 text-starlight/58 hover:text-starlight"
            ].join(" ")}
          >
            {mode.name}
          </button>
        ))}
      </div>
      <MiniGame activeToy={toy} onScore={onScore} />
      <ScoreDock toy={toy} localBest={localBest} message={scoreMessage} leaderboard={leaderboard} />
    </motion.section>
  );
}

export default function GamePage() {
  const { user } = useAuth();
  const [activeToy, setActiveToy] = useState<Toy>(toys[0]);
  const [leaderboard, setLeaderboard] = useState<ScoreRow[]>([]);
  const [localBestByGame, setLocalBestByGame] = useState<Record<ToyId, number>>({
    "star-catcher": 0,
    "logic-bot": 0,
    "ufo-dodge": 0,
    "color-blocks": 0
  });
  const [scoreMessage, setScoreMessage] = useState("");
  const prefersReducedMotion = useReducedMotion();
  const activeBest = localBestByGame[activeToy.id] || 0;

  useEffect(() => {
    const nextBest = { ...localBestByGame };
    for (const toy of toys) {
      const value = Number(window.localStorage.getItem(`game:best:${toy.id}`) || 0);
      if (Number.isFinite(value)) nextBest[toy.id] = value;
    }
    setLocalBestByGame(nextBest);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadLeaderboard() {
      try {
        const response = await fetch(`/api/game/score?gameId=${activeToy.id}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "leaderboard unavailable");
        if (!cancelled) setLeaderboard(Array.isArray(data.scores) ? data.scores : []);
      } catch {
        if (!cancelled) setLeaderboard([]);
      }
    }

    setScoreMessage(user ? "正在同步排行榜..." : "登录后会把分数同步到排行榜。");
    void loadLeaderboard();

    return () => {
      cancelled = true;
    };
  }, [activeToy.id, user]);

  async function handleScore(event: ScoreEvent) {
    const currentBest = localBestByGame[event.gameId] || 0;
    const isLocalRecord = event.score > currentBest;

    if (isLocalRecord) {
      setLocalBestByGame((current) => ({ ...current, [event.gameId]: event.score }));
      window.localStorage.setItem(`game:best:${event.gameId}`, String(event.score));
      window.localStorage.setItem("game:best-score", String(Math.max(event.score, Number(window.localStorage.getItem("game:best-score") || 0))));
    }

    if (!user) {
      setScoreMessage(isLocalRecord ? "本地新纪录！登录后可同步到星际排行榜。" : "分数已记录在本地。");
      return;
    }

    try {
      const response = await fetch("/api/game/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: event.gameId,
          score: event.score,
          metadata: event.metadata || {}
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "提交失败");

      setScoreMessage(data.isRecord ? "后端新纪录！+50 星际积分已尝试结算。" : "分数已同步，胜利积分已尝试结算。");
      const board = await fetch(`/api/game/score?gameId=${event.gameId}`, { cache: "no-store" });
      const boardData = await board.json();
      if (board.ok) setLeaderboard(Array.isArray(boardData.scores) ? boardData.scores : []);
    } catch (error) {
      setScoreMessage(error instanceof Error ? error.message : "数据库未连接，分数已保留在本地。");
    }
  }

  return (
    <motion.main
      className="relative z-10 min-h-dvh overflow-hidden px-5 py-6 text-starlight sm:px-8 lg:px-12"
      initial={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.72, ease: [0.16, 1, 0.3, 1] }}
    >
      <a
        href="/?view=map"
        onClick={prepareReturnToMap}
        className="fixed left-5 top-5 z-50 rounded-full border border-comet/30 bg-[#090b10]/55 px-4 py-2 text-xs uppercase tracking-[0.24em] text-comet shadow-[0_0_28px_rgba(245,200,75,0.12)] backdrop-blur-md sm:left-8 sm:top-8"
      >
        启动引擎 / 返航
      </a>

      <motion.div
        layoutId="game-planet"
        aria-hidden="true"
        className="absolute -bottom-[38rem] left-1/2 h-[66rem] w-[88rem] -translate-x-1/2 rounded-[50%_50%_0_0] bg-[radial-gradient(circle_at_30%_16%,rgba(255,255,255,0.36),transparent_0_18%),linear-gradient(135deg,#ef4444_0_30%,#facc15_30%_57%,#3b82f6_57%_100%)] shadow-[inset_44px_54px_90px_rgba(255,255,255,0.22),inset_-90px_-88px_130px_rgba(15,23,42,0.44),0_0_100px_rgba(250,204,21,0.16)]"
        transition={{ type: "spring", stiffness: 82, damping: 16, mass: 1.18 }}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[38dvh] bg-[radial-gradient(ellipse_at_50%_100%,rgba(146,64,14,0.62),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[24dvh] rounded-t-[50%] bg-[linear-gradient(180deg,rgba(180,83,9,0.12),rgba(120,53,15,0.74))] shadow-[inset_0_24px_52px_rgba(255,237,213,0.14)]" />

      <section className="relative mx-auto grid min-h-[calc(100dvh-3rem)] max-w-7xl gap-4 pt-16 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-6 lg:pt-12">
        <div className="relative z-30 max-w-xl">
          <p className="text-[10px] uppercase tracking-[0.38em] text-comet/70">Toy Box Sandbox</p>
          <h1 className="mt-2 font-display text-4xl leading-none text-starlight sm:text-7xl">
            Game 玩具箱
          </h1>
          <p className="mt-4 text-sm leading-6 text-starlight/58 sm:leading-7">
            选择一枚玩具卡带，中央游戏机台会立即切换玩法。分数、进度和反馈都固定在可操作区域里，不再让你追着右下角的小东西跑。
          </p>
        </div>

        <GameConsole
          toy={activeToy}
          onSelect={setActiveToy}
          onScore={handleScore}
          localBest={activeBest}
          scoreMessage={scoreMessage}
          leaderboard={leaderboard}
        />

        <div className="relative z-30 grid grid-cols-2 gap-3 lg:col-start-1 lg:row-start-2">
          {toys.map((toy) => (
            <ToyShelfButton
              key={toy.id}
              toy={toy}
              isActive={activeToy.id === toy.id}
              onSelect={setActiveToy}
            />
          ))}
        </div>
      </section>
    </motion.main>
  );
}
