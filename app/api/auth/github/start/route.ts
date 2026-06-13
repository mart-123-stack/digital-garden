import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "github_oauth_state";
const NEXT_COOKIE = "github_oauth_next";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/profile";
  return value;
}

function appUrl(request: NextRequest, path: string) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return new URL(path, configured);

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  const proto = forwardedProto || new URL(request.url).protocol.replace(":", "");

  return new URL(path, host ? `${proto}://${host}` : request.url);
}

function useSecureCookies() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) return siteUrl.startsWith("https://");
  return process.env.NODE_ENV === "production";
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const next = safeNext(new URL(request.url).searchParams.get("next"));

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      appUrl(request, `/login?next=${encodeURIComponent(next)}&error=github_oauth_not_configured`)
    );
  }

  const state = randomBytes(24).toString("hex");
  const callbackUrl = appUrl(request, "/api/auth/github/callback");
  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");

  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", callbackUrl.toString());
  authorizeUrl.searchParams.set("scope", "read:user user:email");
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: useSecureCookies(),
    path: "/",
    maxAge: 60 * 10
  });
  response.cookies.set(NEXT_COOKIE, next, {
    httpOnly: true,
    sameSite: "lax",
    secure: useSecureCookies(),
    path: "/",
    maxAge: 60 * 10
  });

  return response;
}
