-- 添加 cover_thumb_url 列并更新 trigger 同步缩略图 URL

ALTER TABLE prompts ADD COLUMN IF NOT EXISTS cover_thumb_url TEXT;

UPDATE prompts p
SET cover_thumb_url = (
  SELECT pi.thumb_url
  FROM prompt_images pi
  WHERE pi.prompt_id = p.id
  ORDER BY pi.sort_order ASC
  LIMIT 1
)
WHERE p.cover_thumb_url IS NULL;

CREATE OR REPLACE FUNCTION sync_prompt_cover_url()
RETURNS TRIGGER AS $$
DECLARE
  target_prompt_id UUID;
  first_image RECORD;
BEGIN
  target_prompt_id := COALESCE(NEW.prompt_id, OLD.prompt_id);
  SELECT url, thumb_url INTO first_image
  FROM prompt_images
  WHERE prompt_id = target_prompt_id
  ORDER BY sort_order ASC
  LIMIT 1;

  UPDATE prompts
  SET cover_url = first_image.url,
      cover_thumb_url = first_image.thumb_url
  WHERE id = target_prompt_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
