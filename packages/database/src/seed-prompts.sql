DO $$
DECLARE
  v_author UUID;
BEGIN
  SELECT id INTO v_author FROM users ORDER BY created_at ASC LIMIT 1;
  IF v_author IS NULL THEN
    RAISE EXCEPTION 'No user exists; register at least one account first.';
  END IF;

  INSERT INTO prompts (
    id, title, prompt_text, negative_prompt, model_ids, style_tags, usage_tags, color_tags,
    params_json, usage_note, author_id, status, is_featured, like_count, collect_count, copy_count, view_count
  )
  VALUES
    (
      '11111111-1111-4111-8111-111111111111',
      'TACTICAL PORTRAIT / NEON RAIN',
      'ultra realistic tactical portrait, rain soaked face, reflective polymer hood, command terminal reflections, cold city bokeh, severe contrast, 85mm lens, film grain, red beacon accents',
      'low detail, blurry eyes, extra fingers, flat lighting, oversaturated skin, cartoon rendering',
      ARRAY['gpt-image-2'],
      ARRAY['REALISM','CYBERPUNK','FILM GRAIN']::VARCHAR[],
      ARRAY['PORTRAIT','KEY VISUAL']::VARCHAR[],
      ARRAY['COLD','RED SHIFT']::VARCHAR[],
      '{"ar":"4:5","quality":"HIGH","detail":85,"seed":"2204"}'::JSONB,
      '适合做首页 Banner 和人物专题封面，建议搭配冷色城市背景。',
      v_author,
      'approved',
      TRUE,
      842, 316, 1284, 5000
    ),
    (
      '22222222-2222-4222-8222-222222222222',
      'MECHANICAL PRODUCT STAGE / RED INDEX',
      'industrial product stage, matte black alloy surface, hazard red registration lines, brutalist pedestal, direct hard light, studio precision, clean reflections',
      'rounded shapes, toy aesthetics, soft bloom, pastel colors, cluttered background',
      ARRAY['banana-flux'],
      ARRAY['PRODUCT','BRUTALIST','STUDIO']::VARCHAR[],
      ARRAY['PRODUCT','AD']::VARCHAR[],
      ARRAY['MONO','RED']::VARCHAR[],
      '{"ar":"3:2","cfg":7,"steps":32,"upscale":"OFF"}'::JSONB,
      '适合产品图和专题策展头图，建议和机械字体系统配合。',
      v_author,
      'approved',
      FALSE,
      631, 274, 978, 3500
    ),
    (
      '33333333-3333-4333-8333-333333333333',
      'BLUEPRINT LANDSCAPE / DATA FOG',
      'vast editorial landscape, declassified blueprint feeling, long horizon, tactical fog, black white palette, structural grid lines, restrained geometry',
      NULL,
      ARRAY['midjourney-v6'],
      ARRAY['LANDSCAPE','EDITORIAL','MIST']::VARCHAR[],
      ARRAY['LANDSCAPE','COVER']::VARCHAR[],
      ARRAY['BLACK','WHITE']::VARCHAR[],
      '{"ar":"16:9","stylize":120,"chaos":8,"style":"raw"}'::JSONB,
      '适合做搜索结果页和专题落地页背景，留白空间充足。',
      v_author,
      'approved',
      FALSE,
      554, 229, 742, 2400
    ),
    (
      '44444444-4444-4444-8444-444444444444',
      'CONTROL ROOM / DENSE TELEMETRY',
      'retro-futurist control room, dense telemetry screens, tactical terminal glow, aviation red warning bands, modular consoles, heavy metal textures',
      'cute icons, consumer UI, glassmorphism, rounded buttons, pastel palette',
      ARRAY['gpt-image-2','banana-flux'],
      ARRAY['INTERIOR','TERMINAL','DENSE UI']::VARCHAR[],
      ARRAY['UI','CONCEPT ART']::VARCHAR[],
      ARRAY['GREEN','RED']::VARCHAR[],
      '{"ar":"21:9","detail":90,"upscale":"ON"}'::JSONB,
      '原始机械界面方向，本身就能拿来做视觉参考。',
      v_author,
      'approved',
      TRUE,
      728, 349, 1112, 4200
    )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    prompt_text = EXCLUDED.prompt_text,
    negative_prompt = EXCLUDED.negative_prompt,
    model_ids = EXCLUDED.model_ids,
    style_tags = EXCLUDED.style_tags,
    usage_tags = EXCLUDED.usage_tags,
    color_tags = EXCLUDED.color_tags,
    params_json = EXCLUDED.params_json,
    usage_note = EXCLUDED.usage_note,
    status = EXCLUDED.status,
    is_featured = EXCLUDED.is_featured,
    like_count = EXCLUDED.like_count,
    collect_count = EXCLUDED.collect_count,
    copy_count = EXCLUDED.copy_count,
    view_count = EXCLUDED.view_count;

  INSERT INTO prompt_images (prompt_id, url, thumb_url, width, height, file_size, sort_order)
  VALUES
    ('11111111-1111-4111-8111-111111111111', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=70', 1200, 1500, 0, 0),
    ('22222222-2222-4222-8222-222222222222', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=70', 1200, 800, 0, 0),
    ('33333333-3333-4333-8333-333333333333', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=70', 1200, 675, 0, 0),
    ('44444444-4444-4444-8444-444444444444', 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=400&q=70', 1200, 514, 0, 0)
  ON CONFLICT DO NOTHING;
END $$;
