# DeepPrompt

DeepPrompt 是一个面向 AI 生图 Prompt 的发现、发布、审核与复用平台。项目当前采用 npm workspaces + Turbo 的 Monorepo 结构，包含 Next.js 前端、Express API 服务、PostgreSQL 数据模型、Redis 缓存/限流辅助，以及共享类型包。

这份 README 按当前仓库真实实现编写。早期规划文档里提到的 NestJS、完整 Meilisearch 同步、图片异步处理流水线等，属于后续演进方向，不是当前已完整落地的实现。别拿规划当现状吹，面试官一追问就露馅，阿叔都救不了你。

## 项目亮点

- Prompt 发现链路：支持首页推荐、搜索筛选、模型筛选、标签筛选、详情页、相关推荐。
- Prompt 发布链路：登录用户可发布 Prompt，支持草稿、待审核、管理员/审核员直发。
- 模型注册表：模型参数 schema 存在数据库，前端发布表单可根据模型动态渲染参数。
- 认证体系：邮箱/手机号注册登录、bcrypt 密码哈希、JWT access token + refresh token、HttpOnly Cookie。
- 会话安全：refresh token rotation、30 秒合法重放宽限、异常重放撤销会话、Redis 登录失败锁定。
- 内容审核：Prompt 状态机、管理员/审核员审核队列、审核动作审计日志。
- 用户互动：复制、点赞、收藏，点赞/收藏使用唯一索引保证幂等。
- 搜索与聚合：当前使用 PostgreSQL `tsvector` + 条件过滤 + facets 聚合，列表接口支持 Redis 短缓存。
- 观测能力：健康检查、ready 检查、结构化错误日志、前端 telemetry 事件入库。
- 部署准备：Docker Compose 本地基础设施、GitHub Actions CI、Dependabot、Railpack API 部署配置。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| Monorepo | npm workspaces, Turbo |
| Web | Next.js 16 App Router, React 18, TypeScript |
| API | Node.js, Express 4, TypeScript, Zod |
| 数据库 | PostgreSQL 16, `pgcrypto`, GIN index, `tsvector` |
| 缓存/限流辅助 | Redis 7 |
| 文件存储 | 本地上传目录 + Cloudflare R2/S3 预签名接口 |
| 安全 | Helmet, CORS, cookie-parser, bcryptjs, jsonwebtoken, Cloudflare Turnstile |
| CI/CD | GitHub Actions, Dependabot, Husky, Railpack |

## 目录结构

```text
DeepPrompt/
├─ apps/
│  ├─ web/                 # Next.js 前端与 BFF Route Handlers
│  └─ api/                 # Express API 服务
├─ packages/
│  ├─ database/            # PostgreSQL schema、migration、seed、retention 脚本
│  ├─ types/               # 前后端共享 TypeScript 类型
│  ├─ config/              # 环境变量读取工具
│  └─ ui/                  # 预留 UI 包
├─ .github/                # CI 与 Dependabot
├─ docker-compose.yml      # PostgreSQL / Redis / Meilisearch 本地基础设施
├─ turbo.json              # Turbo 任务编排
├─ package.json            # 根工作区脚本
└─ .env.example            # 环境变量模板
```

## 应用与包说明

### `apps/web`

Next.js App Router 前端，负责用户可见页面和一层轻量 BFF。

主要页面：

- `/`：首页，展示模型数量、最新 Prompt 和热门词。
- `/search`：搜索页，支持关键词、模型、风格、颜色、用途和排序筛选。
- `/prompts/[id]`：Prompt 详情页，含图片、参数、标签、复制、点赞、收藏、SEO 结构化数据。
- `/publish`：Prompt 发布页，动态模型参数表单、图片上传、本地 BFF 提交。
- `/models`、`/models/[id]`：模型列表和模型详情。
- `/me/prompts`、`/me/collections`：我的发布、我的收藏。
- `/admin/moderation`、`/admin/audit-logs`：审核队列和审计日志。
- `/login`、`/register`：登录注册。

关键设计：

- `apps/web/lib/data.ts` 封装后端 API 调用，并提供静态 fallback 数据，API 不可用时页面不白屏。
- Next Route Handler 代理登录、注册、登出、发布、互动、复制等操作，集中处理 Cookie 与缓存失效。
- `middleware.ts` 在缺少 access token 但存在 refresh token 时尝试静默刷新。
- `revalidateTag` / `revalidatePath` 用于发布、审核、互动后的 RSC 缓存刷新。
- `BroadcastChannel` 用于多标签页间的互动/审核后刷新同步。

### `apps/api`

Express API 服务，当前主要逻辑集中在 `apps/api/src/index.ts`。这个实现可读性还行，但文件已经偏大，后续建议拆成 auth、prompts、models、admin、uploads、telemetry 等模块。

核心能力：

- 安全中间件：`helmet`、`compression`、CORS 白名单、JSON body 限制、Origin 基础 CSRF 校验。
- 认证：注册、登录、刷新、登出、当前用户。
- 会话：access token 15 分钟，refresh token 7 天；refresh token 存 hash；支持 token pepper。
- 登录保护：IP 级限流、账号级失败次数锁定、Turnstile 校验。
- Prompt：列表、搜索、详情、发布、我的 Prompt、管理员 Prompt 列表、相关推荐。
- 互动：复制、点赞、收藏。
- 审核：审核动作、审核队列、审计日志。
- 模型：模型列表、模型详情、管理员新增模型。
- 上传：R2/S3 预签名上传和确认接口。
- telemetry：前端事件/错误写入，管理员可查 7 天汇总。

### `packages/database`

数据库包负责 schema、迁移、种子数据和保留策略。

主要对象：

- `model_registry`：模型注册表，驱动前端动态参数表单。
- `users`：用户账号、角色、积分。
- `prompts`：Prompt 主表，包含标题、正文、模型、标签、状态、计数、搜索向量、封面。
- `prompt_images`：Prompt 图片。
- `interactions`：点赞、收藏、复制、浏览等互动记录。
- `comments`：评论，当前数据结构已建，页面功能尚未重点展开。
- `collections` / `collection_prompts`：收藏夹结构。
- `point_logs`：积分流水结构。
- `auth_sessions`：refresh token 会话。
- `audit_logs`：管理员操作审计。
- `telemetry_events`：前端事件和错误。
- `invite_codes` / `invite_redemptions`：邀请码。

`migrate.ts` 执行顺序：

1. `schema.sql`
2. `schema-gate5.sql`
3. `migrations/*.sql`
4. `seed.sql`
5. `*.concurrent.sql` 并发索引迁移，事务外执行

### `packages/types`

共享 API 响应、用户、模型、Prompt、互动、审核等 TypeScript 类型。前后端共用它能减少接口字段名漂移。

### `packages/config`

提供简单的环境变量读取工具，目前导出 `readEnv`。

## 快速开始

### 1. 环境要求

- Windows
- Node.js >= 20.9
- npm >= 10
- Docker Desktop

根脚本里的 `predev:web` 和 `prebuild` 会检查 Node 版本，低于 20.9 会直接退出。

### 2. 安装依赖

```powershell
npm install
```

### 3. 配置环境变量

```powershell
Copy-Item .env.example .env
```

至少确认以下变量：

```env
NODE_ENV=development
NEXT_PUBLIC_API_BASE_URL=http://localhost:3010
NEXT_PUBLIC_SITE_URL=http://localhost:3000
API_PORT=3010
WEB_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/deepprompt
REDIS_URL=redis://localhost:6379
JWT_SECRET=please_replace_with_a_32_chars_secret
JWT_REFRESH_SECRET=please_replace_with_another_32_chars_secret
TURNSTILE_DISABLED=true
```

开发环境可以把 `TURNSTILE_DISABLED=true` 打开。生产环境不要偷懒，`JWT_SECRET` 和 `JWT_REFRESH_SECRET` 必须换成强随机字符串，长度至少 32。

生成随机密钥示例：

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. 启动基础设施

```powershell
docker compose up -d
```

会启动：

- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- Meilisearch: `localhost:7700`

注意：当前 API 搜索主链路使用 PostgreSQL，不是 Meilisearch。Meilisearch 已在基础设施里预留，但同步链路尚未完整接入。

### 5. 初始化数据库

```powershell
npm run db:init
```

可选：导入冷启动 Prompt 数据。

```powershell
npm run seed:bulk --workspace @deepprompt/database
```

### 6. 启动开发服务

终端 1：

```powershell
npm run dev:api
```

终端 2：

```powershell
npm run dev:web
```

默认地址：

- Web: http://localhost:3000
- API health: http://localhost:3010/health
- API ready: http://localhost:3010/ready

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | Turbo 并行启动所有 dev 任务 |
| `npm run dev:web` | 启动 Next.js，端口 3000 |
| `npm run dev:api` | 启动 Express API，默认端口 3010 |
| `npm run db:init` | 执行数据库 schema、migration 和基础 seed |
| `npm run build` | 构建所有 workspace |
| `npm run lint` | 运行所有 workspace lint |
| `npm run typecheck` | 运行所有 workspace TypeScript 检查 |
| `npm run test` | 运行所有 workspace test，目前多数是占位脚本 |
| `npm run retention --workspace @deepprompt/database` | 执行 telemetry 和 session 数据保留清理 |

## API 摘要

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/health` | 健康检查，包含数据库检查 |
| `GET` | `/ready` | 就绪检查 |
| `POST` | `/v1/auth/register` | 注册 |
| `POST` | `/v1/auth/login` | 登录 |
| `POST` | `/v1/auth/refresh` | 刷新 access token 并轮换 refresh token |
| `POST` | `/v1/auth/logout` | 登出并撤销 session |
| `GET` | `/v1/auth/me` | 当前用户 |
| `GET` | `/v1/models` | 模型列表 |
| `GET` | `/v1/models/:id` | 模型详情 |
| `POST` | `/v1/models` | 新增模型，需登录 |
| `GET` | `/v1/prompts` | Prompt 列表、搜索、筛选、facets |
| `GET` | `/v1/prompts/me` | 我的 Prompt |
| `GET` | `/v1/admin/prompts` | 管理员 Prompt 列表 |
| `GET` | `/v1/prompts/:id` | Prompt 详情 |
| `GET` | `/v1/prompts/:id/related` | 相关推荐 |
| `POST` | `/v1/prompts` | 创建 Prompt |
| `POST` | `/v1/prompts/:id/copy` | 复制计数 |
| `POST` / `DELETE` | `/v1/prompts/:id/like` | 点赞/取消点赞 |
| `POST` / `DELETE` | `/v1/prompts/:id/collect` | 收藏/取消收藏 |
| `POST` | `/v1/prompts/:id/moderate` | 审核动作 |
| `GET` | `/v1/admin/moderation` | 审核队列 |
| `GET` | `/v1/me/collections` | 我的收藏 |
| `POST` | `/v1/telemetry` | telemetry 写入 |
| `GET` | `/v1/admin/telemetry/summary` | telemetry 汇总 |
| `GET` | `/v1/admin/audit-logs` | 审计日志 |
| `POST` / `GET` | `/v1/invites` | 邀请码创建/列表 |
| `GET` | `/v1/invites/:code/check` | 邀请码校验 |
| `POST` | `/v1/uploads/presign` | R2/S3 预签名上传 |
| `POST` | `/v1/uploads/confirm/:key` | 上传确认 |

## 核心业务流程

### 注册登录

1. 前端表单提交到 Next Route Handler。
2. Route Handler 转发到 Express API。
3. API 用 Zod 校验请求体。
4. 登录时校验 Turnstile、账号锁定、bcrypt 密码。
5. 成功后签发 access token 和 refresh token。
6. 前端把 token 写入 HttpOnly Cookie。
7. Middleware 在 access token 过期但 refresh token 存在时尝试静默刷新。

### Prompt 发布

1. 用户在 `/publish` 填写标题、正文、模型、标签、参数、图片。
2. 前端动态表单根据 `model_registry.param_schema` 渲染。
3. Next Route Handler 处理 multipart 表单。
4. 当前发布表单上传文件先落到 `apps/web/public/uploads`。
5. Route Handler 组装 `CreatePromptInput` 并调用 API `/v1/prompts`。
6. 普通用户提交后进入 `pending`；管理员/审核员可直接 `approved`。
7. 发布后前端主动失效列表、搜索、详情、我的页面缓存。

### 搜索筛选

1. `/search` 从 URL query 解析关键词、模型、标签、排序。
2. API `/v1/prompts` 组装 SQL 条件。
3. 关键词走 `search_vector @@ plainto_tsquery('simple', q)`，标题同时做 `LIKE` 兜底。
4. 模型、风格、颜色、用途标签使用数组条件过滤。
5. 返回列表和 facets，用于前端筛选器计数。
6. Redis 可缓存列表响应，写操作后清理 `prompts:list:*`。

### 审核与审计

1. 管理员/审核员访问 `/admin/moderation`。
2. 前端携带 access token 请求审核队列。
3. 审核动作通过 `/v1/prompts/:id/moderate` 修改状态。
4. API 写入 `audit_logs`。
5. Redis 发布审核事件，并清理 Prompt 列表缓存。
6. 前端失效相关 RSC cache。

### 点赞收藏复制

- 点赞/收藏要求登录，先前端乐观更新，再调用 BFF，再由 API 写入数据库。
- `interactions` 表对 `like` / `collect` 使用唯一索引，重复操作不会重复计数。
- 复制不要求登录，API 增加 `copy_count` 并记录 copy interaction。

## 安全设计

- JWT secret 启动时强校验，缺失或太短直接 fail-fast。
- Access token 短有效期，refresh token 长有效期并持久化 session。
- Refresh token 只存 hash，生产可配置 `REFRESH_TOKEN_PEPPER`。
- Refresh rotation 发现超出宽限期的旧 refresh token 重放时，会撤销该用户所有未撤销 session。
- 登录有 IP 级限流和账号级失败锁定。
- 注册/登录可接入 Cloudflare Turnstile。
- 生产环境要求 `WEB_ORIGIN` 使用 HTTPS。
- Cookie 使用 HttpOnly、SameSite=Lax，生产环境 Secure。
- 状态变更请求会做 Origin 白名单检查。
- 文件上传预签名接口限制 jpg、jpeg、png、webp。
- 管理员操作写审计日志。

## 性能与缓存

- Next 页面使用 `revalidate` 和 cache tags。
- 发布、审核、复制、互动后主动 `revalidateTag` / `revalidatePath`。
- API 对公开列表和模型数据设置公共缓存响应头。
- Redis 缓存 Prompt 列表查询结果。
- PostgreSQL 使用 GIN index 优化数组标签和全文搜索。
- 热门排序字段有条件索引，例如 `copy_count`、`like_count`、`collect_count`。
- API 启用 gzip compression。
- 前端图片使用 Next Image 远程白名单和 AVIF/WebP 格式。

## CI 与部署

GitHub Actions 在 push / PR 时执行：

```powershell
npm ci
npm run lint --if-present
npm run typecheck --if-present
npm run test --if-present
```

`develop` 分支可部署 staging，`main` 分支可部署 production。API 部署配置见 `railpack.json`，Web 部署步骤预留 Vercel。

## 当前限制与后续建议

- API 逻辑集中在单个 `index.ts`，建议拆模块，不然越写越像一锅老火靓汤，香是香，捞料费劲。
- 自动化测试不足，多个 workspace 的 test 脚本仍是占位输出。
- Meilisearch 已在 Docker Compose 和环境变量中出现，但当前搜索主链路仍是 PostgreSQL。
- 图片处理链路目前有 R2 预签名接口，但发布表单仍走本地文件落盘，缩略图/WebP 异步处理是预留说明。
- OAuth 接口目前是 reserved，没有真实接入 Google/GitHub。
- 评论、收藏夹细分、积分成就已有部分表结构，但前端业务闭环还不完整。
- `packages/ui` 当前只是预留包，尚无组件体系。

## License

[MIT](LICENSE)
