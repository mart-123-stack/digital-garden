import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "github_oauth_state";
const NEXT_COOKIE = "github_oauth_next";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/profile";
  return value;
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json({ error: "GITHUB_CLIENT_ID is not configured" }, { status: 500 });
  }

  const state = randomBytes(24).toString("hex");
  const next = safeNext(new URL(request.url).searchParams.get("next"));
  const callbackUrl = new URL("/api/auth/github/callback", process.env.NEXT_PUBLIC_SITE_URL || request.url);
  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");

  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", callbackUrl.toString());
  authorizeUrl.searchParams.set("scope", "read:user user:email");
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10
  });
  response.cookies.set(NEXT_COOKIE, next, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10
  });

  return response;
}
