import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { awardPoints } from "@/lib/points";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get("gameId") || "toy-box";

  try {
    const result = await query(
      `SELECT gs.id, gs.game_id, gs.score, gs.metadata, gs.created_at,
              u.id AS user_id, u.nickname, u.name, u.avatar_url
       FROM game_scores gs
       LEFT JOIN users u ON u.id = gs.user_id
       WHERE gs.game_id = $1
       ORDER BY gs.score DESC, gs.created_at ASC
       LIMIT 20`,
      [gameId]
    );

    return NextResponse.json({ scores: result.rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load scores";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const gameId = body.gameId || "toy-box";
    const score = Math.max(0, Number(body.score || 0));

    const best = await query<{ score: number }>(
      `SELECT score FROM game_scores
       WHERE user_id = $1 AND game_id = $2
       ORDER BY score DESC
       LIMIT 1`,
      [auth.user?.id, gameId]
    );
    const previousBest = best.rows[0]?.score || 0;
    const isRecord = score > previousBest;

    const result = await query(
      `INSERT INTO game_scores (user_id, game_id, score, metadata)
       VALUES ($1, $2, $3, $4::jsonb)
       RETURNING id, game_id, score, metadata, created_at`,
      [auth.user?.id, gameId, score, JSON.stringify(body.metadata || {})]
    );

    if (score > 0) {
      await awardPoints(auth.user!.id, "game_win", gameId).catch(() => null);
    }
    if (isRecord) {
      await awardPoints(auth.user!.id, "game_record", gameId).catch(() => null);
    }

    return NextResponse.json({ score: result.rows[0], previousBest, isRecord }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit score";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
