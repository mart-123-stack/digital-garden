import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type StatsRow = {
  total_points: string;
  today_points: string;
  daily_login_points: string;
  daily_read_points: string;
  daily_comment_points: string;
  daily_game_win_points: string;
  daily_game_record_points: string;
};

type PetRow = {
  species: string;
  name: string;
  level: number;
  xp: number;
  owned_species: string[] | null;
};

type ActivityRow = {
  rose_favorites: string;
  notes_read: string;
  best_score: number | null;
};

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;

  try {
    await query(
      `INSERT INTO pets (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [auth.user!.id]
    );

    const [points, pet, activity] = await Promise.all([
      query<StatsRow>(
        `SELECT
           COALESCE(SUM(points), 0)::text AS total_points,
           COALESCE(SUM(points) FILTER (WHERE points > 0 AND created_at >= NOW() - INTERVAL '24 hours'), 0)::text AS today_points,
           COALESCE(SUM(points) FILTER (WHERE action = 'daily_login' AND points > 0 AND created_at >= NOW() - INTERVAL '24 hours'), 0)::text AS daily_login_points,
           COALESCE(SUM(points) FILTER (WHERE action = 'read_content' AND points > 0 AND created_at >= NOW() - INTERVAL '24 hours'), 0)::text AS daily_read_points,
           COALESCE(SUM(points) FILTER (WHERE action = 'comment' AND points > 0 AND created_at >= NOW() - INTERVAL '24 hours'), 0)::text AS daily_comment_points,
           COALESCE(SUM(points) FILTER (WHERE action = 'game_win' AND points > 0 AND created_at >= NOW() - INTERVAL '24 hours'), 0)::text AS daily_game_win_points,
           COALESCE(SUM(points) FILTER (WHERE action = 'game_record' AND points > 0 AND created_at >= NOW() - INTERVAL '24 hours'), 0)::text AS daily_game_record_points
         FROM star_points_ledger
         WHERE user_id = $1`,
        [auth.user!.id]
      ),
      query<PetRow>(
        `SELECT species, name, level, xp, owned_species
         FROM pets
         WHERE user_id = $1
         LIMIT 1`,
        [auth.user!.id]
      ),
      query<ActivityRow>(
        `SELECT
           (SELECT COUNT(*)::text
            FROM reactions
            WHERE user_id = $1 AND target_type = 'post' AND reaction_type = 'favorite') AS rose_favorites,
           (SELECT COUNT(*)::text
            FROM star_points_ledger
            WHERE user_id = $1 AND action = 'read_content' AND source_id = 'notes') AS notes_read,
           (SELECT MAX(score)
            FROM game_scores
            WHERE user_id = $1) AS best_score`,
        [auth.user!.id]
      )
    ]);

    return NextResponse.json({
      stats: {
        totalPoints: Number(points.rows[0]?.total_points || 0),
        todayPoints: Number(points.rows[0]?.today_points || 0),
        dailyLoginPoints: Number(points.rows[0]?.daily_login_points || 0),
        dailyReadPoints: Number(points.rows[0]?.daily_read_points || 0),
        dailyCommentPoints: Number(points.rows[0]?.daily_comment_points || 0),
        dailyGameWinPoints: Number(points.rows[0]?.daily_game_win_points || 0),
        dailyGameRecordPoints: Number(points.rows[0]?.daily_game_record_points || 0),
        roseFavorites: Number(activity.rows[0]?.rose_favorites || 0),
        notesRead: Number(activity.rows[0]?.notes_read || 0),
        bestScore: Number(activity.rows[0]?.best_score || 0)
      },
      pet: pet.rows[0] || {
        species: "egg",
        name: "未孵化的星际蛋",
        level: 1,
        xp: 0,
        owned_species: []
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load profile stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
