**Deeprompt**

AI 生图提示词社区平台

技术实现文档（TDD） v1.0

|     |     |
| --- | --- |
| **文档版本** | v1.0 |
| **创建日期** | 2025 年 |
| **参考文档** | Deeprompt PRD v1.0 |
| **目标上线** | MVP 3 个月内 |

# **1\. 技术文档概述**

本文档基于 Deeprompt PRD v1.0，为研发团队提供完整的技术实现参考，涵盖系统架构设计、数据库模型、API 规范、前端实现、基础设施部署及安全规范。

| **维度** | **内容** |
| --- | --- |
| 技术栈 | Next.js 14 + Node.js/NestJS + PostgreSQL + Redis + Meilisearch |
| 部署平台 | Vercel（前端）+ Railway（后端）+ Cloudflare R2（存储） |
| 开发模式 | Monorepo（Turborepo），前后端 TypeScript 全栈 |
| 代码规范 | ESLint + Prettier + Husky + Conventional Commits |
| CI/CD | GitHub Actions → Vercel/Railway 自动部署 |

# **2\. 系统整体架构**

## **2.1 架构分层**

系统采用经典的分层架构，分为接入层、应用层、服务层和存储层，各层职责清晰，支持横向扩展。

| **层级** | **组件** | **技术选型** | **说明** |
| --- | --- | --- | --- |
| 接入层 | CDN / 边缘网络 | Cloudflare | 静态资源缓存、DDoS 防护、全球加速 |
| 接入层 | API 网关 | Vercel Edge / Nginx | 路由转发、限流、SSL 终止 |
| 应用层 | Web 前端 | Next.js 14 App Router | SSR/SSG、SEO 优化、PWA |
| 服务层 | API 服务 | NestJS + Fastify | RESTful API、WebSocket、任务队列 |
| 服务层 | 内容审核服务 | Python FastAPI | NSFW 检测、Prompt 安全过滤 |
| 服务层 | 搜索服务 | Meilisearch | 全文检索、多维筛选、实时索引 |
| 服务层 | 标签推荐服务 | Claude API / GPT-4o-mini | AI 自动标签分析 |
| 存储层 | 主数据库 | PostgreSQL 16 | 用户、Prompt、互动等核心数据 |
| 存储层 | 缓存层 | Redis 7 | 热点数据缓存、会话存储、限流计数 |
| 存储层 | 对象存储 | Cloudflare R2 | 图片文件存储，兼容 S3 协议 |
| 存储层 | 消息队列 | BullMQ（Redis） | 审核队列、邮件通知、异步任务 |

## **2.2 请求处理流程**

1.  用户请求到达 Cloudflare CDN 边缘节点
2.  静态资源直接返回；动态请求转发至 Vercel 前端或 API 服务
3.  Next.js Server Component 发起后端 API 请求（内网通信）
4.  NestJS 路由层处理请求，验证 JWT Token
5.  Service 层查询 Redis 缓存；命中返回，未命中查询 PostgreSQL
6.  涉及搜索请求转发 Meilisearch，返回结果后写入 Redis 缓存
7.  涉及文件上传，直接上传至 Cloudflare R2，返回 CDN 地址
8.  响应结果经序列化后返回前端渲染

## **2.3 技术选型详解**

| **技术** | **版本** | **选型理由** | **替代方案** |
| --- | --- | --- | --- |
| Next.js | 14.x | App Router + Server Components，SSR/SSG 灵活切换，内置图片优化 | Nuxt.js / Remix |
| NestJS | 10.x | 模块化架构，TypeScript 原生，装饰器 DI，生态丰富 | Fastify / Hono |
| PostgreSQL | 16.x | 支持 JSONB（param_schema）、数组类型（model_tags\[\]），全文搜索补充 | MySQL 8 |
| Redis | 7.x | Sorted Set 实现排行榜，Hash 存储会话，List 做简单队列 | Memcached |
| Meilisearch | 1.x | 开箱即用的中文分词，毫秒级搜索，易于自托管 | Elasticsearch |
| Cloudflare R2 | \-  | 零出口流量费，兼容 S3，全球 CDN，成本极低 | AWS S3 |
| BullMQ | 5.x | 基于 Redis，支持延迟任务、重试、并发控制，适合审核队列 | Celery |

# **3\. 数据库设计**

## **3.1 数据模型总览**

数据库采用 PostgreSQL 16，共 9 张核心表，支持 JSONB、数组、枚举等高级类型，索引策略经过优化以满足高并发读取需求。

## **3.2 核心表结构**

### **3.2.1 model_registry — 模型注册表**

CREATE TYPE prompt_format AS ENUM ('text', 'tag', 'hybrid');

CREATE TABLE model_registry (

id VARCHAR(64) PRIMARY KEY, -- e.g. "midjourney-v6"

display_name VARCHAR(128) NOT NULL,

vendor VARCHAR(128) NOT NULL,

logo_url TEXT,

official_url TEXT,

prompt_format prompt_format NOT NULL DEFAULT 'text',

supports_neg BOOLEAN NOT NULL DEFAULT FALSE,

param_schema JSONB NOT NULL DEFAULT '\[\]', -- 驱动动态表单

is_active BOOLEAN NOT NULL DEFAULT TRUE,

sort_order SMALLINT NOT NULL DEFAULT 99,

feature_tags TEXT\[\] NOT NULL DEFAULT '{}',

created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);

CREATE INDEX idx_model_active_sort ON model_registry (is_active, sort_order);

### **3.2.2 users — 用户表**

CREATE TYPE user_role AS ENUM ('user', 'creator', 'moderator', 'admin');

CREATE TABLE users (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

email VARCHAR(320) UNIQUE,

phone VARCHAR(20) UNIQUE,

nickname VARCHAR(64) NOT NULL,

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

CREATE INDEX idx_users_email ON users (email) WHERE email IS NOT NULL;

CREATE INDEX idx_users_points ON users (points DESC);

### **3.2.3 prompts — Prompt 主表**

CREATE TYPE prompt_status AS ENUM ('draft', 'pending', 'approved', 'rejected', 'archived');

CREATE TABLE prompts (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

title VARCHAR(200) NOT NULL,

prompt_text TEXT NOT NULL,

negative_prompt TEXT,

model_ids TEXT\[\] NOT NULL, -- 关联 model_registry.id

style_tags VARCHAR(64)\[\] NOT NULL DEFAULT '{}',

usage_tags VARCHAR(64)\[\] NOT NULL DEFAULT '{}',

color_tags VARCHAR(32)\[\] NOT NULL DEFAULT '{}',

params_json JSONB NOT NULL DEFAULT '{}',

usage_note TEXT,

author_id UUID NOT NULL REFERENCES users(id),

status prompt_status NOT NULL DEFAULT 'pending',

is_featured BOOLEAN NOT NULL DEFAULT FALSE,

like_count INTEGER NOT NULL DEFAULT 0,

collect_count INTEGER NOT NULL DEFAULT 0,

copy_count INTEGER NOT NULL DEFAULT 0,

view_count INTEGER NOT NULL DEFAULT 0,

search_vector TSVECTOR, -- 全文检索向量（冗余字段）

created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);

\-- 复合索引：状态 + 创建时间（列表接口核心索引）

CREATE INDEX idx_prompts_status_created ON prompts (status, created_at DESC)

WHERE status = 'approved';

CREATE INDEX idx_prompts_author ON prompts (author_id, status);

CREATE INDEX idx_prompts_model_ids ON prompts USING GIN (model_ids);

CREATE INDEX idx_prompts_style_tags ON prompts USING GIN (style_tags);

CREATE INDEX idx_prompts_featured ON prompts (is_featured, like_count DESC)

WHERE status = 'approved' AND is_featured = TRUE;

CREATE INDEX idx_prompts_search ON prompts USING GIN (search_vector);

\-- 自动更新 search_vector

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

CREATE TRIGGER trg_prompt_search BEFORE INSERT OR UPDATE ON prompts

FOR EACH ROW EXECUTE FUNCTION update_prompt_search_vector();

### **3.2.4 prompt_images — Prompt 图片表**

CREATE TABLE prompt_images (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,

url TEXT NOT NULL, -- Cloudflare R2 CDN 地址

thumb_url TEXT, -- 缩略图地址（200px）

width SMALLINT NOT NULL,

height SMALLINT NOT NULL,

file_size INTEGER NOT NULL, -- bytes

sort_order SMALLINT NOT NULL DEFAULT 0,

created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);

CREATE INDEX idx_prompt_images_prompt ON prompt_images (prompt_id, sort_order);

### **3.2.5 interactions — 互动行为表**

CREATE TYPE interaction_type AS ENUM ('like', 'collect', 'copy', 'view');

CREATE TABLE interactions (

id BIGSERIAL PRIMARY KEY,

user_id UUID NOT NULL REFERENCES users(id),

prompt_id UUID NOT NULL REFERENCES prompts(id),

type interaction_type NOT NULL,

created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);

\-- 唯一约束：like/collect 每用户每 Prompt 只能操作一次

CREATE UNIQUE INDEX uq_interactions_like

ON interactions (user_id, prompt_id, type)

WHERE type IN ('like', 'collect');

CREATE INDEX idx_interactions_prompt ON interactions (prompt_id, type);

CREATE INDEX idx_interactions_user ON interactions (user_id, type, created_at DESC);

### **3.2.6 comments — 评论表**

CREATE TABLE comments (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,

user_id UUID NOT NULL REFERENCES users(id),

parent_id UUID REFERENCES comments(id) ON DELETE SET NULL,

content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 1000),

is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);

CREATE INDEX idx_comments_prompt ON comments (prompt_id, created_at DESC)

WHERE is_deleted = FALSE;

CREATE INDEX idx_comments_parent ON comments (parent_id) WHERE parent_id IS NOT NULL;

### **3.2.7 collections — 收藏夹表**

CREATE TABLE collections (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

user_id UUID NOT NULL REFERENCES users(id),

name VARCHAR(64) NOT NULL,

description TEXT,

is_public BOOLEAN NOT NULL DEFAULT FALSE,

created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);

CREATE TABLE collection_prompts (

collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,

prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,

added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

PRIMARY KEY (collection_id, prompt_id)

);

### **3.2.8 point_logs — 积分流水表**

CREATE TYPE point_action AS ENUM (

'publish_prompt', 'prompt_copied', 'prompt_collected', 'prompt_liked',

'daily_login', 'post_comment', 'invite_user', 'admin_adjust'

);

CREATE TABLE point_logs (

id BIGSERIAL PRIMARY KEY,

user_id UUID NOT NULL REFERENCES users(id),

action point_action NOT NULL,

delta SMALLINT NOT NULL, -- 正值加分，负值扣分

ref_id UUID, -- 关联资源 ID（prompt/user 等）

memo TEXT,

created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);

CREATE INDEX idx_point_logs_user ON point_logs (user_id, created_at DESC);

## **3.3 Redis 数据结构设计**

| **Key 模式** | **数据结构** | **用途** | **TTL** |
| --- | --- | --- | --- |
| prompt:detail:{id} | String (JSON) | Prompt 详情缓存 | 5 min |
| prompt:list:{hash} | String (JSON) | Prompt 列表分页缓存（按筛选条件 hash） | 1 min |
| trending:weekly | Sorted Set | 本周热门排行（score=like_count） | 每小时刷新 |
| trending:monthly | Sorted Set | 本月热门排行 | 每日刷新 |
| user:session:{token} | Hash | 用户会话信息 | 7 days |
| rate:api:{ip}:{route} | String (counter) | API 请求限流计数器 | 1 min 滑动窗口 |
| model:registry | String (JSON) | 模型注册表全量缓存 | 10 min |
| search:hot_keywords | Sorted Set | 热门搜索词（score=频次） | 每日更新 |

# **4\. API 设计规范**

## **4.1 接口总体规范**

| **规范项** | **内容** |
| --- | --- |
| Base URL | https://api.deepprompt.ai/v1 |
| 协议  | HTTPS only，HTTP 301 重定向 |
| 认证方式 | Bearer JWT（Authorization: Bearer &lt;token&gt;） |
| 响应格式 | JSON，Content-Type: application/json; charset=utf-8 |
| 成功响应 | { "data": {...}, "meta": {...} } |
| 错误响应 | { "error": { "code": "ERR_CODE", "message": "..." } } |
| 分页方式 | cursor-based 分页（cursor + limit），列表接口默认 limit=20 |
| 限流策略 | 匿名：60 req/min；登录用户：300 req/min；上传：10 req/min |
| 版本控制 | URL 路径版本（/v1/...），重大变更升级版本号 |

## **4.2 Prompt 相关接口**

| **Method** | **Path** | **说明** | **认证** | **缓存** |
| --- | --- | --- | --- | --- |
| GET | /prompts | 获取 Prompt 列表（分页 + 筛选） | 可选  | Redis 1min |
| GET | /prompts/{id} | 获取 Prompt 详情 | 可选  | Redis 5min |
| POST | /prompts | 创建 Prompt（提交审核） | 必须  | 无   |
| PATCH | /prompts/{id} | 更新草稿 Prompt | 必须（作者） | 清除缓存 |
| DELETE | /prompts/{id} | 删除 Prompt（草稿/已发布） | 必须（作者） | 清除缓存 |
| GET | /prompts/featured | 获取精选 Prompt（首页今日精选） | 可选  | Redis 5min |
| GET | /prompts/trending | 热门趋势（weekly/monthly） | 可选  | Redis 1h |
| GET | /prompts/{id}/related | 相关推荐（同风格/同模型） | 可选  | Redis 10min |

### **GET /prompts — 查询参数**

GET /v1/prompts?model_ids=midjourney-v6,gpt-image-2

&style_tags=写实,二次元

&color_tags=冷色

&usage_tags=人像

&sort=trending_weekly // latest | trending_weekly | trending_monthly | most_copied

&cursor=eyJpZCI6IjEyMyJ9 // base64 encoded cursor

&limit=20

&q=cyberpunk // 全文搜索关键词（走 Meilisearch）

### **POST /prompts — 请求体**

{

"title": "赛博朋克城市夜景",

"prompt_text": "a futuristic city at night, neon lights...",

"negative_prompt": "blurry, low quality, watermark",

"model_ids": \["midjourney-v6", "gpt-image-2"\],

"style_tags": \["赛博朋克", "写实", "夜景"\],

"usage_tags": \["概念艺术"\],

"color_tags": \["冷色"\],

"params_json": { "ar": "16:9", "q": 2, "style": "raw" },

"usage_note": "建议搭配 --chaos 20 获得更多变化",

"image_ids": \["uuid1", "uuid2"\] // 预上传图片 ID

}

## **4.3 互动接口**

| **Method** | **Path** | **说明** | **认证** |
| --- | --- | --- | --- |
| POST | /prompts/{id}/like | 点赞（幂等） | 必须  |
| DELETE | /prompts/{id}/like | 取消点赞 | 必须  |
| POST | /prompts/{id}/collect | 收藏到默认收藏夹 | 必须  |
| DELETE | /prompts/{id}/collect | 取消收藏 | 必须  |
| POST | /prompts/{id}/copy | 记录复制行为（计数） | 可选  |
| GET | /prompts/{id}/comments | 获取评论列表 | 可选  |
| POST | /prompts/{id}/comments | 发布评论 | 必须  |
| DELETE | /comments/{id} | 删除评论（本人/管理员） | 必须  |
| POST | /prompts/{id}/report | 举报内容 | 必须  |

## **4.4 文件上传接口**

| **Method** | **Path** | **说明** |
| --- | --- | --- |
| POST | /uploads/presign | 获取 R2 预签名上传 URL（前端直传） |
| POST | /uploads/confirm/{key} | 确认上传完成，触发 WebP 转换 + NSFW 检测 |
| GET | /uploads/{id} | 获取图片元信息（宽高、状态） |

图片上传采用「预签名直传」模式，前端直接上传至 Cloudflare R2，无需经过 API 服务器，降低带宽成本。上传完成后调用 confirm 接口触发后台处理。

## **4.5 搜索接口**

GET /v1/search?q=cyberpunk&model_ids=midjourney-v6&limit=20&cursor=...

// 响应结构

{

"data": {

"hits": \[ { ...prompt }, ... \],

"estimatedTotalHits": 1234,

"facetDistribution": {

"model_ids": { "midjourney-v6": 456, "gpt-image-2": 321 },

"style_tags": { "写实": 200, "二次元": 180 }

}

},

"meta": { "cursor": "...", "hasMore": true, "took": 12 }

}

## **4.6 模型注册表接口**

| **Method** | **Path** | **说明** | **认证** |
| --- | --- | --- | --- |
| GET | /models | 获取所有激活模型列表 | 无   |
| GET | /models/{id} | 获取模型详情（含 param_schema） | 无   |
| POST | /models | 新增模型（Admin） | 管理员 |
| PATCH | /models/{id} | 更新模型配置（Admin） | 管理员 |
| PATCH | /models/{id}/activate | 激活/停用模型（Admin） | 管理员 |

## **4.7 用户认证接口**

| **Method** | **Path** | **说明** |
| --- | --- | --- |
| POST | /auth/register | 邮箱/手机号注册 |
| POST | /auth/login | 密码登录，返回 access_token + refresh_token |
| POST | /auth/refresh | 刷新 access_token |
| POST | /auth/logout | 登出（销毁服务端会话） |
| GET | /auth/oauth/{provider} | 发起 OAuth 跳转（google/github/wechat） |
| GET | /auth/oauth/{provider}/callback | OAuth 回调处理 |

# **5\. 前端架构设计**

## **5.1 项目结构（Next.js 14 App Router）**

apps/web/

├── app/

│ ├── (auth)/ # 认证相关页面（登录/注册）

│ │ ├── login/page.tsx

│ │ └── register/page.tsx

│ ├── (main)/ # 主站布局组

│ │ ├── layout.tsx # 主导航 + 侧边栏

│ │ ├── page.tsx # 首页

│ │ ├── search/page.tsx

│ │ ├── prompts/\[id\]/page.tsx

│ │ ├── models/\[modelId\]/page.tsx

│ │ └── users/\[userId\]/page.tsx

│ ├── publish/ # 发布 Prompt（需登录）

│ │ └── page.tsx

│ ├── me/ # 个人中心

│ │ ├── layout.tsx

│ │ ├── prompts/page.tsx

│ │ ├── collections/page.tsx

│ │ └── settings/page.tsx

│ ├── api/ # Route Handlers（BFF 层）

│ └── layout.tsx # Root Layout

├── components/

│ ├── ui/ # shadcn/ui 基础组件

│ ├── prompt/ # Prompt 相关业务组件

│ ├── model/ # 模型相关组件

│ └── shared/ # 通用业务组件

├── hooks/ # 自定义 React Hooks

├── lib/ # 工具函数、API 客户端

├── stores/ # Zustand 全局状态

└── types/ # TypeScript 类型定义

## **5.2 核心页面技术方案**

| **页面** | **渲染策略** | **关键技术点** | **缓存策略** |
| --- | --- | --- | --- |
| 首页  | SSR (dynamic) | 精选/趋势数据每次 SSR；瀑布流客户端无限滚动 | ISR 30s revalidate |
| 搜索页 | Client-side | URL 参数驱动筛选状态；useInfiniteQuery 分页 | 无服务端缓存 |
| Prompt 详情页 | SSR + Static | 静态生成热门 Prompt；generateStaticParams 预渲染 | ISR 60s revalidate |
| 模型专区页 | SSG | 构建时生成所有激活模型页面 | 每次模型更新重新构建 |
| 个人中心 | Client-side | 私有数据，客户端 fetch；Tab 切换懒加载 | 无   |
| 发布页 | Client-side | 多步骤表单（react-hook-form）；图片预上传 | 无   |

## **5.3 瀑布流 Masonry 布局实现**

// 使用 CSS columns 实现瀑布流（无需 JS 计算高度）

.masonry-grid {

columns: 2; /\* mobile: 2列 \*/

column-gap: 12px;

}

@media (min-width: 768px) { .masonry-grid { columns: 3; } }

@media (min-width: 1280px) { .masonry-grid { columns: 4; } }

@media (min-width: 1536px) { .masonry-grid { columns: 5; } }

.masonry-item {

break-inside: avoid; /\* 防止卡片被列截断 \*/

margin-bottom: 12px;

}

// 图片使用 next/image，sizes 属性适配多列布局

<Image

src={imageUrl}

width={width} height={height}

sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"

placeholder="blur"

blurDataURL={thumbBase64}

/>

## **5.4 状态管理方案**

| **状态类型** | **方案** | **说明** |
| --- | --- | --- |
| 服务端状态 | TanStack Query v5 | API 数据 fetch/缓存/同步，支持 optimistic update |
| 全局 UI 状态 | Zustand | 登录用户信息、暗色模式、全局弹窗状态 |
| 表单状态 | react-hook-form + zod | 发布表单、搜索筛选器，schema 驱动验证 |
| URL 状态 | nuqs | 搜索参数、筛选条件同步至 URL（SEO 友好） |

## **5.5 SEO 实现方案**

// app/prompts/\[id\]/page.tsx — 动态生成 meta 标签

export async function generateMetadata({ params }) {

const prompt = await getPrompt(params.id);

return {

title: \`${prompt.title} | Deeprompt\`,

description: prompt.prompt_text.slice(0, 160),

openGraph: {

images: \[{ url: prompt.images\[0\].url, width: 1200, height: 630 }\],

},

// 结构化数据

other: {

'application-ld+json': JSON.stringify({

"@context": "https://schema.org",

"@type": "CreativeWork",

"name": prompt.title,

"author": { "@type": "Person", "name": prompt.author.nickname },

"datePublished": prompt.created_at,

})

}

};

}

# **6\. 后端服务设计**

## **6.1 NestJS 模块结构**

apps/api/src/

├── modules/

│ ├── auth/ # 认证：JWT、OAuth、RefreshToken

│ ├── users/ # 用户 CRUD、积分操作

│ ├── prompts/ # Prompt CRUD、审核状态机

│ ├── interactions/ # 点赞/收藏/复制（幂等处理）

│ ├── comments/ # 评论树形结构

│ ├── collections/ # 收藏夹管理

│ ├── models/ # Model Registry CRUD

│ ├── search/ # Meilisearch 同步与查询

│ ├── uploads/ # 预签名 URL、图片处理

│ └── moderation/ # 内容审核队列处理

├── common/

│ ├── decorators/ # @CurrentUser、@Roles

│ ├── guards/ # JwtAuthGuard、RolesGuard

│ ├── interceptors/ # 响应格式化、日志

│ ├── filters/ # 全局异常过滤器

│ └── pipes/ # ZodValidationPipe

├── database/ # Drizzle ORM schema & migrations

├── cache/ # Redis 封装

└── queue/ # BullMQ 任务定义

## **6.2 Prompt 审核状态机**

| **状态** | **触发条件** | **后续动作** |
| --- | --- | --- |
| draft | 用户保存草稿 | 仅作者可见 |
| pending | 用户提交审核 | 进入 BullMQ 审核队列 |
| approved | AI 审核通过 + 人工确认 | 公开发布，积分 +50，同步 Meilisearch |
| rejected | AI/人工判定违规 | 通知作者，说明拒绝原因 |
| archived | 作者主动下架或违规下线 | 从搜索索引删除 |

## **6.3 互动操作幂等设计**

// 点赞接口幂等处理（INSERT ... ON CONFLICT DO NOTHING）

async likePrompt(userId: string, promptId: string) {

const result = await db.execute(sql\`

WITH ins AS (

INSERT INTO interactions (user_id, prompt_id, type)

VALUES (${userId}, ${promptId}, 'like')

ON CONFLICT (user_id, prompt_id, type)

WHERE type IN ('like', 'collect')

DO NOTHING

RETURNING 1

)

UPDATE prompts

SET like_count = like_count + (SELECT COUNT(\*) FROM ins)

WHERE id = ${promptId}

RETURNING like_count

\`);

// 同步更新 Redis Sorted Set 热门排行

await redis.zincrby('trending:weekly', 1, promptId);

return result.rows\[0\];

}

## **6.4 BullMQ 异步任务队列**

| **队列名** | **任务类型** | **处理逻辑** | **重试策略** |
| --- | --- | --- | --- |
| moderation | nsfw_check | 调用 NSFW 检测服务分析图片 | 最多重试 3 次，指数退避 |
| moderation | prompt_safety | 调用 Claude API 检测 Prompt 文本合规性 | 最多重试 2 次 |
| moderation | human_review | 推送至管理后台，等待人工审核 | 无超时，人工处理 |
| indexing | upsert_prompt | 将审核通过的 Prompt 同步至 Meilisearch | 最多重试 5 次 |
| indexing | delete_prompt | 从 Meilisearch 删除下架 Prompt | 最多重试 3 次 |
| notification | email_approved | 发送审核通过邮件通知 | 最多重试 3 次 |
| points | award_points | 发放积分并记录积分流水 | 最多重试 5 次 |

## **6.5 Model Registry 动态表单驱动**

// param_schema JSON 示例（Midjourney v6）

\[

{

"key": "ar",

"label": "宽高比",

"widget": "ratio",

"options": \["1:1", "16:9", "9:16", "4:3", "3:2", "2:3"\],

"default": "1:1"

},

{

"key": "q",

"label": "质量",

"widget": "slider",

"min": 0.25, "max": 2, "step": 0.25, "default": 1

},

{

"key": "style",

"label": "风格",

"widget": "select",

"options": \[

{ "value": "raw", "label": "原始" },

{ "value": "cute", "label": "可爱" }

\],

"default": "raw"

},

{

"key": "seed",

"label": "随机种子",

"widget": "number_input",

"min": 0, "max": 4294967295,

"optional": true

}

\]

# **7\. 搜索系统设计**

## **7.1 Meilisearch 索引配置**

// 索引配置（初始化时执行）

await meili.index('prompts').updateSettings({

// 可搜索字段（权重从高到低）

searchableAttributes: \[

'title',

'prompt_text',

'style_tags',

'usage_tags',

'usage_note'

\],

// 可筛选字段（facet 筛选）

filterableAttributes: \[

'model_ids', 'style_tags', 'usage_tags', 'color_tags',

'status', 'is_featured', 'author_id'

\],

// 排序字段

sortableAttributes: \[

'like_count', 'collect_count', 'copy_count', 'created_at'

\],

// 停用词（中英文常见词）

stopWords: \['a', 'the', 'of', '的', '了', '是'\],

// 分页限制

pagination: { maxTotalHits: 10000 }

});

## **7.2 数据同步策略**

| **场景** | **触发时机** | **同步方式** |
| --- | --- | --- |
| Prompt 发布 | status 变为 approved | BullMQ 任务 → Meilisearch upsert |
| Prompt 编辑 | approved 状态下内容更新 | BullMQ 任务 → Meilisearch upsert |
| Prompt 下架 | status 变为 archived | BullMQ 任务 → Meilisearch delete |
| 计数更新 | like/collect/copy 计数变更 | 批量更新（每 5min Cron Job） |
| 全量重建 | 索引配置变更或数据修复 | 后台 Admin 触发全量同步任务 |

# **8\. 基础设施与部署**

## **8.1 部署架构**

| **服务** | **部署平台** | **规格（MVP）** | **扩展方案** |
| --- | --- | --- | --- |
| 前端 (Next.js) | Vercel | Hobby → Pro（按需） | Vercel 自动横向扩展 |
| API 服务 (NestJS) | Railway | 512MB RAM, 1 vCPU | 垂直升级 → 多实例 + Load Balancer |
| PostgreSQL | Railway Managed | 1GB RAM, 5GB 存储 | 升级至 Railway Pro 或迁移至 Supabase |
| Redis | Railway Managed | 256MB | 升级内存或切换至 Upstash Redis |
| Meilisearch | Railway / Fly.io | 512MB RAM | 升级规格，启用持久卷 |
| 图片存储 | Cloudflare R2 | 按使用量计费 | 无上限，自动扩展 |
| 内容审核 (Python) | Railway / Fly.io | 1GB RAM（含 NSFW 模型） | 多实例并行审核 |

## **8.2 CI/CD 流程**

\# .github/workflows/deploy.yml

name: CI/CD Pipeline

on:

push:

branches: \[main, develop\]

pull_request:

branches: \[main\]

jobs:

test:

runs-on: ubuntu-latest

steps:

\- uses: actions/checkout@v4

\- uses: actions/setup-node@v4

with: { node-version: '20' }

\- run: npm ci

\- run: npm run lint

\- run: npm run typecheck

\- run: npm run test

deploy-staging:

needs: test

if: github.ref == 'refs/heads/develop'

steps:

\- run: railway deploy --service api --environment staging

\- run: vercel deploy --env preview

deploy-production:

needs: test

if: github.ref == 'refs/heads/main'

steps:

\- run: railway deploy --service api --environment production

\- run: vercel deploy --prod

## **8.3 图片处理流程**

1.  前端调用 POST /uploads/presign 获取预签名 URL（有效期 10 分钟）
2.  前端直接使用预签名 URL 上传原始图片至 Cloudflare R2（/raw/ 路径）
3.  前端调用 POST /uploads/confirm/{key} 通知服务端处理完成
4.  BullMQ 触发图片处理任务：NSFW 检测 → WebP 转换 → 生成缩略图（200px）
5.  处理完成后更新 prompt_images 表，将 CDN 地址返回前端
6.  Cloudflare R2 + Workers 实现按需图片缩放（通过 URL 参数 ?w=400）

# **9\. 安全规范**

## **9.1 认证与授权**

| **安全项** | **实现方案** |
| --- | --- |
| JWT | access_token 有效期 15min；refresh_token 有效期 7d，存储于 HttpOnly Cookie |
| 密码存储 | bcrypt，cost factor 12 |
| OAuth | NextAuth.js 处理 Google/GitHub；微信使用官方 OAuth 2.0 |
| 角色权限 | RBAC：user / creator / moderator / admin；NestJS @Roles 装饰器 |
| API 限流 | Redis 滑动窗口计数；超限返回 429 + Retry-After 响应头 |
| CORS | 仅允许 deepprompt.ai 及 localhost（开发环境） |

## **9.2 内容安全**

| **审核层** | **工具** | **触发时机** | **违规处理** |
| --- | --- | --- | --- |
| 图片 NSFW 检测 | NSFW.js / Clarifai API | 图片上传 confirm 后 | 自动拒绝，通知作者 |
| Prompt 文本过滤 | Claude API（自定义 prompt） | 审核队列处理 | 自动拒绝或人工复核 |
| 关键词黑名单 | 本地词库匹配 | 实时（提交时同步检测） | 阻断提交，提示用户 |
| 人工审核 | 管理后台 | AI 审核通过后 | 最终确认发布或拒绝 |
| 用户举报 | 举报队列 | 用户点击举报 | 24h 内人工处理 |

## **9.3 数据安全**

- 所有数据传输强制 HTTPS（HSTS 最大年龄 1 年）
- 用户敏感信息（邮箱、手机号）数据库层加密存储
- GDPR 合规：提供数据导出和账户注销接口，30 天内完成数据清除
- 数据库定期自动备份（每日全量 + 每小时增量），保留 30 天
- API Key 等配置信息使用环境变量，禁止硬编码至代码仓库
- 图片原始文件与公开 CDN 地址分离，原始文件不对外暴露

# **10\. 性能优化策略**

## **10.1 性能指标与实现**

| **指标** | **PRD 目标** | **实现方案** |
| --- | --- | --- |
| LCP（首屏） | ≤ 2s | ISR 预渲染 + CDN 分发；图片 WebP + 懒加载；字体 font-display: swap |
| API 响应（P95） | ≤ 300ms | Redis 缓存热点数据；DB 索引优化；连接池（PgBouncer） |
| 图片加载 | ≤ 1s | Cloudflare R2 + CDN；WebP 压缩；next/image 自动 srcset |
| 并发读取 | 1000 QPS | Redis 缓存命中率 > 80%；读写分离；水平扩展 API 实例 |
| 可用性 | ≥ 99.9% | Railway 健康检查 + 自动重启；多区域 Vercel Edge |

## **10.2 数据库查询优化**

\-- 首页「最新上传」接口（高频查询，使用 keyset pagination）

SELECT p.\*, u.nickname, u.avatar_url,

ARRAY_AGG(pi.thumb_url ORDER BY pi.sort_order) AS thumb_urls

FROM prompts p

JOIN users u ON u.id = p.author_id

JOIN prompt_images pi ON pi.prompt_id = p.id

WHERE p.status = 'approved'

AND (p.created_at, p.id) < (${cursor_ts}, ${cursor_id}) -- keyset 分页

GROUP BY p.id, u.id

ORDER BY p.created_at DESC, p.id DESC

LIMIT 20;

\-- 命中索引：idx_prompts_status_created

## **10.3 缓存策略分层**

| **缓存层** | **缓存内容** | **TTL** | **失效策略** |
| --- | --- | --- | --- |
| Cloudflare CDN | 静态资源、图片文件 | 30 天 | 文件内容哈希命名，自动版本化 |
| Vercel Edge Cache | 首页、模型页 HTML | ISR 30~60s | on-demand revalidation |
| Redis L1 | Prompt 详情、列表 | 1~5 min | 写入时主动删除相关 key |
| Redis L2 | 排行榜、热门词 | 1h ~ 1d | 定时 Cron Job 刷新 |
| Browser Cache | API 响应（s-maxage） | 30s | Cache-Control: public, s-maxage=30 |

# **11\. 开发计划与里程碑**

## **11.1 MVP 开发任务分解**

| **阶段** | **时间** | **任务** | **负责方向** |
| --- | --- | --- | --- |
| Week 1-2 | 需求确认 | PRD 评审、Model Registry 数据结构设计、UI 原型确认、技术方案评审 | 全员  |
| Week 3-4 | MVP 基础 | 数据库初始化、用户认证（邮箱/OAuth）、Prompt CRUD API、基础前端框架 | 前后端 |
| Week 5-6 | MVP 核心 | 搜索筛选系统（Meilisearch）、图片上传与处理、审核队列、首页/详情页 | 前后端 |
| Week 7-8 | MVP 完善 | 互动功能（点赞/收藏/复制）、个人中心、内容安全、性能优化 | 前后端 |
| Week 9-10 | 内测优化 | 种子用户测试、Bug 修复、性能调优、补充 500+ 初始 Prompt | 全员  |
| Week 11-12 | 公测上线 | 正式发布、SEO 优化、监控告警配置、冷启动运营活动 | 全员  |

## **11.2 V1.1 迭代（Month 4-5）**

- 评论系统（树形评论 + 通知）
- 关注/粉丝系统（Feed 流）
- 积分与成就系统（积分流水、勋章、排行榜）
- 新增模型：Stable Diffusion 3.5、DALL·E 3
- Prompt 合集 / 主题策展功能
- AI 智能标签推荐上线（Claude API 接入）

## **11.3 Monorepo 工程结构**

deepprompt/ # Turborepo 根目录

├── apps/

│ ├── web/ # Next.js 前端

│ └── api/ # NestJS 后端

├── packages/

│ ├── database/ # Drizzle schema + migrations（共享）

│ ├── types/ # 共享 TypeScript 类型

│ ├── ui/ # 共享 UI 组件库

│ └── config/ # ESLint、tsconfig 等共享配置

├── turbo.json

└── package.json

# **12\. 监控与告警**

| **监控维度** | **工具** | **关键指标** | **告警阈值** |
| --- | --- | --- | --- |
| 前端性能 | Vercel Analytics + Sentry | LCP、FCP、CLS、JS 错误率 | LCP > 3s 告警 |
| API 监控 | Railway Metrics + Grafana | QPS、P95 延迟、错误率、连接池 | 错误率 > 1% 告警 |
| 数据库 | Railway PG Metrics | 慢查询（> 100ms）、连接数、磁盘 | 连接数 > 80% 告警 |
| 队列监控 | BullMQ Board（Bull Dashboard） | 队列堆积量、失败任务数 | 堆积 > 100 告警 |
| 日志  | Better Stack（Logtail） | 应用日志、错误堆栈聚合 | 新 Error 类型告警 |
| 可用性 | Better Stack Uptime | 各服务端点可用性 | 不可用 > 1min 告警 |

# **附录：环境变量配置清单**

\# ── 数据库 ──────────────────────────────────────────

DATABASE_URL=postgresql://user:pass@host:5432/deepprompt

REDIS_URL=redis://user:pass@host:6379

\# ── 认证 ────────────────────────────────────────────

JWT_SECRET=&lt;32+ 位随机字符串&gt;

JWT_REFRESH_SECRET=&lt;32+ 位随机字符串&gt;

NEXTAUTH_SECRET=&lt;32+ 位随机字符串&gt;

NEXTAUTH_URL=https://deepprompt.ai

\# ── OAuth ───────────────────────────────────────────

GOOGLE_CLIENT_ID=

GOOGLE_CLIENT_SECRET=

GITHUB_CLIENT_ID=

GITHUB_CLIENT_SECRET=

WECHAT_APP_ID=

WECHAT_APP_SECRET=

\# ── 存储 ────────────────────────────────────────────

R2_ACCOUNT_ID=

R2_ACCESS_KEY_ID=

R2_SECRET_ACCESS_KEY=

R2_BUCKET_NAME=deepprompt-assets

R2_PUBLIC_URL=https://assets.deepprompt.ai

\# ── 搜索 ────────────────────────────────────────────

MEILISEARCH_URL=http://meilisearch:7700

MEILISEARCH_MASTER_KEY=

\# ── AI 服务 ─────────────────────────────────────────

ANTHROPIC_API_KEY=

OPENAI_API_KEY=

\# ── 邮件 ────────────────────────────────────────────

SMTP_HOST=

SMTP_USER=

SMTP_PASS=

EMAIL_FROM=noreply@deepprompt.ai

— 文档结束 —