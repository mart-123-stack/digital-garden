CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT NOT NULL DEFAULT '',
  nickname TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  bio TEXT NOT NULL DEFAULT '',
  interests JSONB NOT NULL DEFAULT '[]'::jsonb,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  auth_provider TEXT NOT NULL DEFAULT 'credentials',
  provider_id TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  cover_url TEXT,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  cluster TEXT NOT NULL DEFAULT 'PKM',
  status TEXT NOT NULL DEFAULT 'seedling',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  links JSONB NOT NULL DEFAULT '[]'::jsonb,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'note')),
  target_slug TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'note')),
  target_slug TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'favorite')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(target_type, target_slug, user_id, reaction_type)
);

CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS about_profile (
  id INTEGER PRIMARY KEY DEFAULT 1,
  name TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  interests JSONB NOT NULL DEFAULT '[]'::jsonb,
  experiences JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS star_points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  points INTEGER NOT NULL,
  source_id TEXT,
  daily_bucket DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  species TEXT NOT NULL DEFAULT 'egg',
  name TEXT NOT NULL DEFAULT '未孵化的星际蛋',
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_slug ON notes(slug);
CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_type, target_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reactions_target ON reactions(target_type, target_slug, reaction_type);
CREATE INDEX IF NOT EXISTS idx_game_scores_rank ON game_scores(game_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_points_user_day ON star_points_ledger(user_id, daily_bucket, action);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_provider_identity ON users(auth_provider, provider_id) WHERE provider_id IS NOT NULL;

INSERT INTO about_profile (id, name, title, location, bio, interests, experiences)
VALUES (
  1,
  'Sylvie Chu',
  'Digital Garden Pilot',
  'B-612 Orbit',
  '一个在个人宇宙里整理文章、笔记、游戏和生活轨迹的数字花园主人。',
  '["写作", "前端动画", "数字花园", "游戏化体验"]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
