CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_posts_full_text_search
ON posts
USING GIN ((
  setweight(to_tsvector('simple', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE(excerpt, '')), 'B') ||
  setweight(to_tsvector('simple', COALESCE(content, '')), 'C')
));

CREATE INDEX IF NOT EXISTS idx_posts_title_trgm
ON posts USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_posts_excerpt_trgm
ON posts USING GIN (excerpt gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_posts_content_trgm
ON posts USING GIN (content gin_trgm_ops);
