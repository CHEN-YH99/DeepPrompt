INSERT INTO model_registry (
  id,
  display_name,
  vendor,
  logo_url,
  official_url,
  prompt_format,
  supports_neg,
  param_schema,
  is_active,
  sort_order,
  feature_tags
)
VALUES
  (
    'gpt-image-2',
    'GPT-IMAGE-2',
    'OPENAI',
    NULL,
    'https://openai.com/index/dall-e/',
    'text',
    FALSE,
    '[
      {"key":"ar","label":"宽高比","input_type":"select","required":true,"default_value":"4:5","options":[{"label":"1:1","value":"1:1"},{"label":"4:5","value":"4:5"},{"label":"16:9","value":"16:9"},{"label":"9:16","value":"9:16"}],"help_text":"画面宽高比，决定输出画幅。"},
      {"key":"quality","label":"质量","input_type":"select","required":false,"default_value":"HIGH","options":[{"label":"标准","value":"STANDARD"},{"label":"高","value":"HIGH"},{"label":"超高","value":"ULTRA"}]},
      {"key":"detail","label":"细节强度","input_type":"number","required":false,"default_value":85,"placeholder":"0-100"},
      {"key":"seed","label":"随机种子","input_type":"text","required":false,"placeholder":"留空=自动"}
    ]'::JSONB,
    TRUE,
    1,
    ARRAY['REALISM','EDIT','SEMANTIC']
  ),
  (
    'midjourney-v6',
    'MIDJOURNEY V6',
    'MIDJOURNEY INC.',
    NULL,
    'https://www.midjourney.com',
    'hybrid',
    FALSE,
    '[
      {"key":"ar","label":"宽高比 --ar","input_type":"select","required":true,"default_value":"16:9","options":[{"label":"1:1","value":"1:1"},{"label":"3:2","value":"3:2"},{"label":"16:9","value":"16:9"},{"label":"9:16","value":"9:16"},{"label":"21:9","value":"21:9"}]},
      {"key":"stylize","label":"风格化 --stylize","input_type":"number","required":false,"default_value":120,"placeholder":"0-1000","help_text":"数值越大风格越强烈。"},
      {"key":"chaos","label":"--chaos","input_type":"number","required":false,"default_value":8,"placeholder":"0-100"},
      {"key":"style","label":"风格预设","input_type":"select","required":false,"default_value":"raw","options":[{"label":"raw","value":"raw"},{"label":"cute","value":"cute"},{"label":"expressive","value":"expressive"}]}
    ]'::JSONB,
    TRUE,
    2,
    ARRAY['ART','STYLE','ATMOS']
  ),
  (
    'banana-flux',
    'BANANA / BFL FLUX',
    'BLACK FOREST LABS',
    NULL,
    'https://blackforestlabs.ai',
    'hybrid',
    TRUE,
    '[
      {"key":"ar","label":"宽高比","input_type":"select","required":true,"default_value":"3:2","options":[{"label":"1:1","value":"1:1"},{"label":"3:2","value":"3:2"},{"label":"16:9","value":"16:9"},{"label":"4:3","value":"4:3"}]},
      {"key":"cfg","label":"CFG Scale","input_type":"number","required":false,"default_value":7,"placeholder":"1-20"},
      {"key":"steps","label":"采样步数","input_type":"number","required":false,"default_value":32,"placeholder":"10-80"},
      {"key":"upscale","label":"放大","input_type":"select","required":false,"default_value":"OFF","options":[{"label":"开启","value":"ON"},{"label":"关闭","value":"OFF"}]}
    ]'::JSONB,
    TRUE,
    3,
    ARRAY['OPEN','FAST','LOCAL']
  )
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  vendor = EXCLUDED.vendor,
  logo_url = EXCLUDED.logo_url,
  official_url = EXCLUDED.official_url,
  prompt_format = EXCLUDED.prompt_format,
  supports_neg = EXCLUDED.supports_neg,
  param_schema = EXCLUDED.param_schema,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  feature_tags = EXCLUDED.feature_tags;
