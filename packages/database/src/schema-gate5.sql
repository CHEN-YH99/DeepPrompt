-- Gate 5 增量结构：埋点 + 错误事件 + 邀请码
-- 与 schema.sql 同样幂等：所有对象使用 IF NOT EXISTS / DO 块包装

DO $$
BEGIN
  CREATE TYPE telemetry_kind AS ENUM ('event', 'error');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS telemetry_events (
  id BIGSERIAL PRIMARY KEY,
  kind telemetry_kind NOT NULL DEFAULT 'event',
  name VARCHAR(96) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(64),
  route VARCHAR(255),
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  user_agent TEXT,
  ip_address VARCHAR(64),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_kind_time
  ON telemetry_events (kind, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_name_time
  ON telemetry_events (name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_user
  ON telemetry_events (user_id, occurred_at DESC)
  WHERE user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS invite_codes (
  code VARCHAR(32) PRIMARY KEY,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  max_uses SMALLINT NOT NULL DEFAULT 1 CHECK (max_uses BETWEEN 1 AND 1000),
  used_count SMALLINT NOT NULL DEFAULT 0,
  note VARCHAR(255),
  expires_at TIMESTAMPTZ,
  disabled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invite_codes_created
  ON invite_codes (created_at DESC);

CREATE TABLE IF NOT EXISTS invite_redemptions (
  invite_code VARCHAR(32) NOT NULL REFERENCES invite_codes(code) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (invite_code, user_id)
);

CREATE INDEX IF NOT EXISTS idx_invite_redemptions_user
  ON invite_redemptions (user_id);
