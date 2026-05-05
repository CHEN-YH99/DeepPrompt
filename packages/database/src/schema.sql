CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  CREATE TYPE prompt_format AS ENUM ('text', 'tag', 'hybrid');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'creator', 'moderator', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE prompt_status AS ENUM ('draft', 'pending', 'approved', 'rejected', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE interaction_type AS ENUM ('like', 'collect', 'copy', 'view');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE point_action AS ENUM (
    'publish_prompt',
    'prompt_copied',
    'prompt_collected',
    'prompt_liked',
    'daily_login',
    'post_comment',
    'invite_user',
    'admin_adjust'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS model_registry (
  id VARCHAR(64) PRIMARY KEY,
  display_name VARCHAR(128) NOT NULL,
  vendor VARCHAR(128) NOT NULL,
  logo_url TEXT,
  official_url TEXT,
  prompt_format prompt_format NOT NULL DEFAULT 'text',
  supports_neg BOOLEAN NOT NULL DEFAULT FALSE,
  param_schema JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order SMALLINT NOT NULL DEFAULT 99,
  feature_tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_model_active_sort ON model_registry (is_active, sort_order);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(320) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  nickname VARCHAR(64) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  social_links JSONB NOT NULL DEFAULT '{}',
  role user_role NOT NULL DEFAULT 'user',
  points INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_points ON users (points DESC);

CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  prompt_text TEXT NOT NULL,
  negative_prompt TEXT,
  model_ids TEXT[] NOT NULL,
  style_tags VARCHAR(64)[] NOT NULL DEFAULT '{}',
  usage_tags VARCHAR(64)[] NOT NULL DEFAULT '{}',
  color_tags VARCHAR(32)[] NOT NULL DEFAULT '{}',
  params_json JSONB NOT NULL DEFAULT '{}',
  usage_note TEXT,
  author_id UUID NOT NULL REFERENCES users(id),
  status prompt_status NOT NULL DEFAULT 'pending',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  like_count INTEGER NOT NULL DEFAULT 0,
  collect_count INTEGER NOT NULL DEFAULT 0,
  copy_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompts_status_created
ON prompts (status, created_at DESC)
WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_prompts_author ON prompts (author_id, status);
CREATE INDEX IF NOT EXISTS idx_prompts_model_ids ON prompts USING GIN (model_ids);
CREATE INDEX IF NOT EXISTS idx_prompts_style_tags ON prompts USING GIN (style_tags);

CREATE INDEX IF NOT EXISTS idx_prompts_featured
ON prompts (is_featured, like_count DESC)
WHERE status = 'approved' AND is_featured = TRUE;

CREATE INDEX IF NOT EXISTS idx_prompts_search ON prompts USING GIN (search_vector);

CREATE OR REPLACE FUNCTION update_prompt_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', NEW.title), 'A') ||
    setweight(to_tsvector('simple', NEW.prompt_text), 'B') ||
    setweight(to_tsvector('simple', array_to_string(NEW.style_tags, ' ')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prompt_search ON prompts;
CREATE TRIGGER trg_prompt_search
BEFORE INSERT OR UPDATE ON prompts
FOR EACH ROW EXECUTE FUNCTION update_prompt_search_vector();

CREATE TABLE IF NOT EXISTS prompt_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumb_url TEXT,
  width SMALLINT NOT NULL,
  height SMALLINT NOT NULL,
  file_size INTEGER NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompt_images_prompt ON prompt_images (prompt_id, sort_order);

CREATE TABLE IF NOT EXISTS interactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  prompt_id UUID NOT NULL REFERENCES prompts(id),
  type interaction_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_interactions_like
ON interactions (user_id, prompt_id, type)
WHERE type IN ('like', 'collect');

CREATE INDEX IF NOT EXISTS idx_interactions_prompt ON interactions (prompt_id, type);
CREATE INDEX IF NOT EXISTS idx_interactions_user ON interactions (user_id, type, created_at DESC);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  parent_id UUID REFERENCES comments(id) ON DELETE SET NULL,
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 1000),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_prompt
ON comments (prompt_id, created_at DESC)
WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_comments_parent
ON comments (parent_id)
WHERE parent_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(64) NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collection_prompts (
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (collection_id, prompt_id)
);

CREATE TABLE IF NOT EXISTS point_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  action point_action NOT NULL,
  delta SMALLINT NOT NULL,
  ref_id UUID,
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_point_logs_user ON point_logs (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash VARCHAR(255) NOT NULL,
  user_agent TEXT,
  ip_address VARCHAR(64),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions (user_id, expires_at DESC);
