CREATE INDEX IF NOT EXISTS idx_points_user_action_created
ON star_points_ledger(user_id, action, created_at DESC);
