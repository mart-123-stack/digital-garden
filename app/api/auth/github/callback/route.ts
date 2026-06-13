import { NextRequest, NextResponse } from "next/server";
import { attachSession, signSession, upsertGitHubUser } from "@/lib/auth";
import { awardPoints } from "@/lib/points";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "github_oauth_state";
const NEXT_COOKIE = "github_oauth_next";

type GitHubUser = {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string | null;
  email: string | null;
};

type GitHubEmail = {
  email: string;
  primary: boolean;
  verified: boolean;
};

function redirectTo(request: NextRequest, path: string) {
  return new URL(path, process.env.NEXT_PUBLIC_SITE_URL || request.url);
}

async function exchangeCode(code: string, request: NextRequest) {
  const callbackUrl = redirectTo(request, "/api/auth/github/callback");
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: callbackUrl.toString()
    })
  });
  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || "GitHub token exchange failed");
  }

  return String(data.access_token);
}

async function fetchGitHubIdentity(token: string) {
  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });
  const user = (await userResponse.json()) as GitHubUser;

  if (!userResponse.ok || !user.id) {
    throw new Error("Failed to load GitHub profile");
  }

  if (user.email) return { user, email: user.email };

  const emailResponse = await fetch("https://api.github.com/user/emails", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });
  const emails = (await emailResponse.json()) as GitHubEmail[];
  const primary = Array.isArray(emails)
    ? emails.find((item) => item.primary && item.verified) || emails.find((item) => item.verified)
    : null;

  return {
    user,
    email: primary?.email || `${user.login}@users.noreply.github.com`
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = request.cookies.get(STATE_COOKIE)?.value;
  const next = request.cookies.get(NEXT_COOKIE)?.value || "/profile";

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(redirectTo(request, "/login?error=github_state"));
  }

  try {
    const token = await exchangeCode(code, request);
    const { user: githubUser, email } = await fetchGitHubIdentity(token);
    const result = await upsertGitHubUser({
      githubId: String(githubUser.id),
      email,
      name: githubUser.name || githubUser.login,
      nickname: githubUser.login,
      avatarUrl: githubUser.avatar_url
    });

    if ("error" in result) {
      throw new Error(result.error);
    }

    await awardPoints(result.user.id, "daily_login").catch(() => null);

    const session = await signSession(result.user);
    const response = attachSession(NextResponse.redirect(redirectTo(request, next)), session);
    response.cookies.set(STATE_COOKIE, "", { path: "/", maxAge: 0 });
    response.cookies.set(NEXT_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "github_login_failed";
    const response = NextResponse.redirect(redirectTo(request, `/login?error=${encodeURIComponent(message)}`));
    response.cookies.set(STATE_COOKIE, "", { path: "/", maxAge: 0 });
    response.cookies.set(NEXT_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  }
}
