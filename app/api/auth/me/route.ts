import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  return NextResponse.json({ user });
}
