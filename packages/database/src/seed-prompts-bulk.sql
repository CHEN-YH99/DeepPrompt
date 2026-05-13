-- Gate 5 冷启动种子内容：在已有 4 条精选 Prompt 基础上批量生成 ~512 条 approved Prompt
-- 通过 plpgsql 循环 + 多模板矩阵，覆盖三大模型、风格 / 用途 / 色调多维组合
-- 重复执行幂等：以固定 UUID 前缀做主键、ON CONFLICT 跳过

DO $$
DECLARE
  v_author UUID;
  v_models TEXT[][] := ARRAY[
    ARRAY['gpt-image-2'],
    ARRAY['midjourney-v6'],
    ARRAY['banana-flux'],
    ARRAY['gpt-image-2','midjourney-v6'],
    ARRAY['gpt-image-2','banana-flux'],
    ARRAY['midjourney-v6','banana-flux']
  ];
  v_styles TEXT[][] := ARRAY[
    ARRAY['REALISM','FILM GRAIN','CINEMATIC'],
    ARRAY['CYBERPUNK','NEON','RAIN'],
    ARRAY['WATERCOLOR','SOFT EDGE','PASTEL'],
    ARRAY['INK','MONOCHROME','BRUSH'],
    ARRAY['ISOMETRIC','LOW POLY','TOY'],
    ARRAY['BRUTALIST','EDITORIAL','HIGH CONTRAST'],
    ARRAY['ANIME','LINEART','CLEAN SHADING'],
    ARRAY['SCI-FI','VOLUMETRIC LIGHT','HARD SURFACE']
  ];
  v_usages TEXT[][] := ARRAY[
    ARRAY['PORTRAIT','KEY VISUAL'],
    ARRAY['PRODUCT','AD'],
    ARRAY['LANDSCAPE','COVER'],
    ARRAY['CONCEPT ART','UI'],
    ARRAY['POSTER','EDITORIAL'],
    ARRAY['CHARACTER SHEET','REFERENCE']
  ];
  v_colors TEXT[][] := ARRAY[
    ARRAY['COLD','BLUE'],
    ARRAY['RED','MONO'],
    ARRAY['WARM','GOLD'],
    ARRAY['BLACK','WHITE'],
    ARRAY['NEON','PURPLE'],
    ARRAY['EARTH','OLIVE']
  ];
  v_titles TEXT[] := ARRAY[
    'TACTICAL PORTRAIT','PRODUCT STAGE','CONTROL ROOM','URBAN NIGHTSCAPE',
    'EDITORIAL POSTER','MECHANICAL CREATURE','RUIN ARCHITECTURE','FLOATING ISLAND',
    'STREET CYBER','MARKETING HERO','EXPLODED VIEW','FIELD RECON',
    'STUDIO PORTRAIT','BRUTAL TYPOGRAPHY','HOLOGRAM INTERFACE','RACING SHOT',
    'WET MARKET','NEON ALLEY','BLACK COFFEE','MEDIA ROOM',
    'AIRSHIP DOCK','CHAR STUDY','DESERT CONVOY','SNOW STATION',
    'PIXEL CITY','MICRO MACHINE','HARD LIGHT BAG','RUNTIME BOOTH',
    'OPS BUNKER','SAMPLE PACK','HEAVY METAL TYPE','SOFT LANDSCAPE'
  ];
  v_prompt_seeds TEXT[] := ARRAY[
    'ultra realistic shot, dramatic rim light, fine skin texture, 85mm lens, shallow depth',
    'editorial product photography, hazard red lines, brutalist pedestal, studio precision',
    'wide editorial landscape, tactical fog, long horizon, restrained geometry',
    'retro futurist control room, dense telemetry screens, aviation warning bands',
    'painterly concept art, atmospheric perspective, soft volumetric light',
    'illustrated character sheet, multiple angles, clean lineart, flat color blocks',
    'cyberpunk alley, neon signage, rain reflection, anamorphic flare, low key',
    'minimal poster design, large typography, generous negative space, swiss grid'
  ];
  v_notes TEXT[] := ARRAY[
    '建议搭配冷色城市背景使用，可作首页 banner。',
    '适合产品发布物料，配合品牌色卡微调。',
    '推荐做搜索结果页背景，留白充足。',
    '可作模型专区头图，密集 UI 风格突出。',
    '适合 KV 主视觉，配合大字标题更稳。',
    '适合素材合集封面，保留可替换文字空间。'
  ];
  v_negative TEXT[] := ARRAY[
    'low detail, blurry eyes, extra fingers, flat lighting, cartoon rendering',
    'rounded shapes, toy aesthetics, soft bloom, cluttered background',
    NULL,
    'cute icons, consumer UI, glassmorphism, rounded buttons',
    'oversaturated skin, plastic look, posterized colors',
    'watermark, signature, jpeg artifact, low resolution'
  ];
  v_images TEXT[] := ARRAY[
    'https://images.unsplash.com/photo-1516321497487-e288fb19713f',
    'https://images.unsplash.com/photo-1518770660439-4636190af475',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',
    'https://images.unsplash.com/photo-1542831371-29b0f74f9713',
    'https://images.unsplash.com/photo-1526378722484-bd91ca387e72',
    'https://images.unsplash.com/photo-1502136969935-8d8eef54d77b',
    'https://images.unsplash.com/photo-1517059224940-d4af9eec41b7',
    'https://images.unsplash.com/photo-1520975922323-7badbb3b8b3e',
    'https://images.unsplash.com/photo-1518770660439-4636190af475',
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1',
    'https://images.unsplash.com/photo-1535223289827-42f1e9919769'
  ];
  v_id UUID;
  v_idx INTEGER := 0;
  v_total INTEGER := 512;
  v_model_idx INTEGER;
  v_style_idx INTEGER;
  v_usage_idx INTEGER;
  v_color_idx INTEGER;
  v_title TEXT;
  v_prompt TEXT;
  v_note TEXT;
  v_neg TEXT;
  v_img TEXT;
  v_thumb TEXT;
  v_like INTEGER;
  v_collect INTEGER;
  v_copy INTEGER;
  v_view INTEGER;
  v_featured BOOLEAN;
  v_status prompt_status;
  v_uuid_prefix TEXT := 'a5e50000-0000-4000-8000-';
BEGIN
  SELECT id INTO v_author FROM users ORDER BY created_at ASC LIMIT 1;
  IF v_author IS NULL THEN
    RAISE EXCEPTION 'No user exists; register at least one account before seeding bulk prompts.';
  END IF;

  WHILE v_idx < v_total LOOP
    v_idx := v_idx + 1;
    v_model_idx := (v_idx % array_length(v_models, 1)) + 1;
    v_style_idx := ((v_idx / 3) % array_length(v_styles, 1)) + 1;
    v_usage_idx := ((v_idx / 5) % array_length(v_usages, 1)) + 1;
    v_color_idx := ((v_idx / 2) % array_length(v_colors, 1)) + 1;
    v_title := v_titles[((v_idx - 1) % array_length(v_titles, 1)) + 1] || ' / SEED ' || LPAD(v_idx::TEXT, 4, '0');
    v_prompt := v_prompt_seeds[((v_idx - 1) % array_length(v_prompt_seeds, 1)) + 1];
    v_prompt := v_prompt || ', batch index ' || v_idx::TEXT;
    v_note := v_notes[((v_idx - 1) % array_length(v_notes, 1)) + 1];
    v_neg := v_negative[((v_idx - 1) % array_length(v_negative, 1)) + 1];
    v_img := v_images[((v_idx - 1) % array_length(v_images, 1)) + 1];
    v_img := v_img || '?auto=format&fit=crop&w=1200&q=80&seed=' || v_idx::TEXT;
    v_thumb := replace(v_img, 'w=1200', 'w=400');
    v_thumb := replace(v_thumb, 'q=80', 'q=70');
    v_like := 40 + (v_idx % 900);
    v_collect := 12 + (v_idx % 480);
    v_copy := 70 + (v_idx % 1300);
    v_view := 200 + (v_idx % 6000);
    v_featured := (v_idx % 17 = 0);
    v_status := 'approved'::prompt_status;
    v_id := (v_uuid_prefix || LPAD(to_hex(v_idx), 12, '0'))::UUID;

    INSERT INTO prompts (
      id, title, prompt_text, negative_prompt, model_ids, style_tags, usage_tags, color_tags,
      params_json, usage_note, author_id, status, is_featured,
      like_count, collect_count, copy_count, view_count, created_at
    )
    VALUES (
      v_id,
      v_title,
      v_prompt,
      v_neg,
      v_models[v_model_idx],
      v_styles[v_style_idx]::VARCHAR[],
      v_usages[v_usage_idx]::VARCHAR[],
      v_colors[v_color_idx]::VARCHAR[],
      jsonb_build_object(
        'ar', CASE (v_idx % 4) WHEN 0 THEN '1:1' WHEN 1 THEN '16:9' WHEN 2 THEN '4:5' ELSE '3:2' END,
        'quality', CASE (v_idx % 3) WHEN 0 THEN 'HIGH' WHEN 1 THEN 'MED' ELSE 'STANDARD' END,
        'seed', v_idx
      ),
      v_note,
      v_author,
      v_status,
      v_featured,
      v_like,
      v_collect,
      v_copy,
      v_view,
      NOW() - (v_idx || ' hour')::INTERVAL
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO prompt_images (prompt_id, url, thumb_url, width, height, file_size, sort_order)
    VALUES (
      v_id,
      v_img,
      v_thumb,
      1200,
      CASE (v_idx % 4) WHEN 0 THEN 1200 WHEN 1 THEN 675 WHEN 2 THEN 1500 ELSE 800 END,
      0,
      0
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Bulk seed completed: % prompts ensured', v_total;
END $$;
