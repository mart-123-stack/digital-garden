import { NextRequest, NextResponse } from "next/server";
import { attachSession, registerUser, signSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await registerUser(body);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const token = await signSession(result.user);
    return attachSession(NextResponse.json({ user: result.user, token }, { status: 201 }), token);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
