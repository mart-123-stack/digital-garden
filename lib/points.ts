import { query } from "@/lib/db";

const DAILY_CAPS: Record<string, number> = {
  daily_login: 10,
  read_content: 20,
  comment: 25,
  game_win: 15,
  game_record: 50
};

const POINT_VALUES: Record<string, number> = {
  daily_login: 10,
  read_content: 5,
  comment: 5,
  game_win: 5,
  game_record: 50
};

export async function awardPoints(userId: string, action: keyof typeof POINT_VALUES, sourceId?: string) {
  const value = POINT_VALUES[action];
  const cap = DAILY_CAPS[action];

  const existing = await query<{ total: string }>(
    `SELECT COALESCE(SUM(points), 0)::text AS total
     FROM star_points_ledger
     WHERE user_id = $1
       AND action = $2
       AND points > 0
       AND created_at >= NOW() - INTERVAL '24 hours'`,
    [userId, action]
  );

  const awardedToday = Number(existing.rows[0]?.total || 0);
  const remaining = Math.max(0, cap - awardedToday);
  const points = Math.min(value, remaining);

  if (points <= 0) {
    return { points: 0, capped: true };
  }

  await query(
    `INSERT INTO star_points_ledger (user_id, action, points, source_id)
     VALUES ($1, $2, $3, $4)`,
    [userId, action, points, sourceId || null]
  );

  await query(
    `INSERT INTO pets (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );

  await query(
    `UPDATE pets
     SET xp = xp + $2,
         level = GREATEST(1, FLOOR((xp + $2) / 100) + 1),
         updated_at = NOW()
     WHERE user_id = $1`,
    [userId, points]
  );

  return { points, capped: false };
}
