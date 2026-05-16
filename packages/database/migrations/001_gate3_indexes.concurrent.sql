-- Gate 3 索引补齐（生产环境用 CONCURRENTLY 避免锁表）
-- 注意：CONCURRENTLY 不能在事务内执行，migrate.ts 会自动识别 .concurrent.sql 后缀并在事务外运行。
-- 如果索引已存在则跳过（IF NOT EXISTS）。

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prompts_copy_count
ON prompts (copy_count DESC)
WHERE status = 'approved';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prompts_like_count
ON prompts (like_count DESC)
WHERE status = 'approved';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prompts_collect_count
ON prompts (collect_count DESC)
WHERE status = 'approved';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prompts_usage_tags
ON prompts USING GIN (usage_tags);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prompts_color_tags
ON prompts USING GIN (color_tags);
