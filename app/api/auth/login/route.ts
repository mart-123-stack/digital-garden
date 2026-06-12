import { NextRequest, NextResponse } from "next/server";
import { attachSession, loginUser, signSession } from "@/lib/auth";
import { awardPoints } from "@/lib/points";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const result = await loginUser(email || "", password || "");

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    if (result.user.id !== "admin") {
      await awardPoints(result.user.id, "daily_login").catch(() => null);
    }

    const token = await signSession(result.user);
    return attachSession(NextResponse.json({ user: result.user, token }), token);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
