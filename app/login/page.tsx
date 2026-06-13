"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nextPath = searchParams.get("next") || "/profile";
  const oauthError = searchParams.get("error");

  function formatOAuthError(value: string) {
    if (value === "github_oauth_not_configured") return "GitHub OAuth 还没有配置 Client ID / Secret。";
    if (value === "github_state") return "GitHub 登录状态已失效，请重新点击登录。";
    if (value.includes("redirect_uri")) return "GitHub 回调地址不匹配，请检查 OAuth App callback URL。";
    if (value.includes("token") || value.includes("exchange")) return "GitHub 授权交换失败，请稍后重试。";
    return value;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "登录失败");
        return;
      }

      await refresh();
      router.push(searchParams.get("next") || "/profile");
    } catch {
      setError("无法连接登录服务");
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
        <p className="text-[10px] uppercase tracking-[0.4em] text-cyan-100/60">Pilot Gate</p>
        <h1 className="mt-3 font-display text-5xl text-starlight">登录航行证</h1>
        <p className="mt-4 text-sm leading-7 text-starlight/50">
          登录后可以评论、收藏、记录游戏分数，并编辑自己的 Profile。
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
          Password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            required
            className="mt-2 w-full rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm text-starlight outline-none focus:border-cyan-200/35"
          />
        </label>

        {error || oauthError ? (
          <p className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-500/10 p-3 text-sm text-rose-100">
            {error || `GitHub 登录失败：${formatOAuthError(oauthError || "")}`}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full rounded-full border border-comet/35 bg-comet/14 px-5 py-3 text-sm font-medium tracking-[0.22em] text-comet disabled:opacity-50"
        >
          {isSubmitting ? "校验中" : "进入宇宙"}
        </button>

        <Link
          href={`/api/auth/github/start?next=${encodeURIComponent(nextPath)}`}
          className="mt-3 flex w-full items-center justify-center rounded-full border border-white/14 bg-white/8 px-5 py-3 text-sm font-medium tracking-[0.14em] text-starlight/78"
        >
          使用 GitHub 进入
        </Link>

        <p className="mt-5 text-center text-sm text-starlight/48">
          还没有航行证？ <Link href="/register" className="text-cyan-100">创建一个</Link>
        </p>
      </motion.form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="relative z-10 min-h-dvh" />}>
      <LoginForm />
    </Suspense>
  );
}
