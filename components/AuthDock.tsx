"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export function AuthDock() {
  const { user, isLoading, logout } = useAuth();

  return (
    <div className="fixed right-5 top-5 z-[70] flex items-center gap-2 rounded-full border border-cyan-200/16 bg-black/30 px-3 py-2 text-xs text-starlight/68 shadow-[0_0_28px_rgba(34,211,238,0.08)] backdrop-blur-md">
      {isLoading ? (
        <span className="px-2">SYNC</span>
      ) : user ? (
        <>
          <Link href="/profile" className="max-w-28 truncate text-cyan-100">
            {user.nickname || user.name || user.email}
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-full border border-white/12 bg-white/8 px-2 py-1 text-starlight/58"
          >
            退出
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className="rounded-full border border-cyan-200/16 bg-cyan-200/8 px-3 py-1 text-cyan-100">
            登录
          </Link>
          <Link href="/register" className="rounded-full border border-white/12 bg-white/8 px-3 py-1">
            注册
          </Link>
        </>
      )}
    </div>
  );
}
