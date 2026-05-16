-- Gate 4 / C4.5: 回填 prompts.cover_url + 创建 trigger
-- 幂等：多次执行不会出错

ALTER TABLE prompts ADD COLUMN IF NOT EXISTS cover_url TEXT;

UPDATE prompts p
SET cover_url = (
  SELECT pi.url
  FROM prompt_images pi
  WHERE pi.prompt_id = p.id
  ORDER BY pi.sort_order ASC
  LIMIT 1
)
WHERE p.cover_url IS NULL;
