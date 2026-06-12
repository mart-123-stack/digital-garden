"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nickname, password })
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "注册失败");
        return;
      }

      await refresh();
      router.push("/profile");
    } catch {
      setError("无法连接注册服务");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative z-10 flex min-h-dvh items-center justify-center px-5 py-20 text-starlight">
      <motion.form
        onSubmit={submit}
        className="w-full max-w-md rounded-[2rem] border border-cyan-200/18 bg-slate-950/48 p-6 shadow-[0_28px_90px_rgba(8,47,73,0.42),inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-xl"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 130, damping: 18 }}
      >
        <p className="text-[10px] uppercase tracking-[0.4em] text-cyan-100/60">New Pilot</p>
        <h1 className="mt-3 font-display text-5xl text-starlight">创建航行证</h1>
        <p className="mt-4 text-sm leading-7 text-starlight/50">
          初始会为你预留一颗免费的星际宠物蛋，后续积分会驱动它成长。
        </p>

        <label className="mt-7 block text-xs uppercase tracking-[0.24em] text-starlight/45">
          Email
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
            className="mt-2 w-full rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm text-starlight outline-none focus:border-cyan-200/35"
          />
        </label>

        <label className="mt-4 block text-xs uppercase tracking-[0.24em] text-starlight/45">
          Nickname
          <input
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm text-starlight outline-none focus:border-cyan-200/35"
          />
        </label>

        <label className="mt-4 block text-xs uppercase tracking-[0.24em] text-starlight/45">
          Password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            minLength={8}
            required
            className="mt-2 w-full rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm text-starlight outline-none focus:border-cyan-200/35"
          />
        </label>

        {error ? <p className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full rounded-full border border-comet/35 bg-comet/14 px-5 py-3 text-sm font-medium tracking-[0.22em] text-comet disabled:opacity-50"
        >
          {isSubmitting ? "生成中" : "领取航行证"}
        </button>

        <Link
          href="/api/auth/github/start?next=/profile"
          className="mt-3 flex w-full items-center justify-center rounded-full border border-white/14 bg-white/8 px-5 py-3 text-sm font-medium tracking-[0.14em] text-starlight/78"
        >
          使用 GitHub 创建/进入
        </Link>

        <p className="mt-5 text-center text-sm text-starlight/48">
          已有账号？ <Link href="/login" className="text-cyan-100">登录</Link>
        </p>
      </motion.form>
    </main>
  );
}
