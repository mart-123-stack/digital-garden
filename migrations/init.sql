CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

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
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
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
  owned_species JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_full_text_search
ON posts
USING GIN ((
  setweight(to_tsvector('simple', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE(excerpt, '')), 'B') ||
  setweight(to_tsvector('simple', COALESCE(content, '')), 'C')
));
CREATE INDEX IF NOT EXISTS idx_posts_title_trgm ON posts USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_posts_excerpt_trgm ON posts USING GIN (excerpt gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_posts_content_trgm ON posts USING GIN (content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_notes_slug ON notes(slug);
CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_type, target_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reactions_target ON reactions(target_type, target_slug, reaction_type);
CREATE INDEX IF NOT EXISTS idx_game_scores_rank ON game_scores(game_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_points_user_day ON star_points_ledger(user_id, daily_bucket, action);
CREATE INDEX IF NOT EXISTS idx_points_user_action_created ON star_points_ledger(user_id, action, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_provider_identity ON users(auth_provider, provider_id) WHERE provider_id IS NOT NULL;

INSERT INTO about_profile (id, name, title, location, bio, avatar_url, interests, experiences)
VALUES (
  1,
  'Sylvie Chu',
  'Grade 1 · Data Science and Management Engineering',
  'Zhejiang University · Hangzhou',
  '你好！我是一名大数据专业的大一学生，目前正在探索编程世界的奥秘。

这个博客是我记录学习笔记、项目经验和日常生活的地方。我目前主要在学习 C/C++、Python 和前端开发基础，希望能够通过不断地实践和总结，逐步成长为一名合格的程序员。

课余时间我喜欢健身、摄影和阅读。如果你对博客内容有任何问题或建议，欢迎在评论区留言交流！

## 学习目标

- 打好计算机基础（数据结构、算法、操作系统）
- 参与开源项目，积累实战经验
- 建立自己的技术博客，记录成长过程',
  '/uploads/sylvie-about-avatar.png',
  '["C/C++", "Python", "HTML & CSS", "JavaScript", "Git & GitHub"]'::jsonb,
  '[{"label":"2025 - 至今","text":"商务大数据分析 本科生 · Zhejiang University"}]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
