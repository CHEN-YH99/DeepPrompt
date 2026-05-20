type CommonDict = {
  brand: string;
  brandKicker: string;
  brandSub: string;
  footerLine: string;
  actions: {
    copyPrompt: string;
    copying: string;
    copied: string;
    copyFailed: string;
    openDossier: string;
    executeQuery: string;
    resetFilters: string;
    loginRequired: string;
    loginFirst: string;
    backToLogin: string;
    createAccount: string;
    publishLive: string;
    saveDraft: string;
    enterSystem: string;
    closeLightbox: string;
  };
  metrics: {
    like: string;
    collect: string;
    copy: string;
    view: string;
  };
  status: {
    approved: string;
    pending: string;
    draft: string;
    rejected: string;
    archived: string;
    all: string;
  };
};

export type Dictionary = {
  common: CommonDict;
  nav: Record<"home" | "search" | "models" | "publish" | "myPrompts" | "login" | "logout" | "confirmLogout", string>;
  home: {
    heroKicker: string;
    heroTitleLine1: string;
    heroTitleLine2: string;
    heroTitleLine3: string;
    heroLede: string;
    heroPrimary: string;
    heroSecondary: string;
    statsSupportedModels: string;
    statsPromptUnits: string;
    visualFeatureId: string;
    visualPrimaryModel: string;
    visualAuthorUnit: string;
    registryEyebrow: string;
    registryTitle: string;
    registryCopy: string;
    registryFormat: string;
    registryNegative: string;
    negativeOn: string;
    negativeOff: string;
    hotEyebrow: string;
    hotTitle: string;
    hotCopy: string;
    hotRank: string;
    feedEyebrow: string;
    feedTitle: string;
    feedCopy: string;
    welcomeBack: string;
  };
  search: {
    heroKicker: string;
    heroTitleLine1: string;
    heroTitleLine2: string;
    heroTitleLine3: string;
    heroLede: string;
    hotEyebrow: string;
    hotTitle: string;
    hotCopy: string;
    hotRank: string;
    filterEyebrow: string;
    filterTitle: string;
    filterCopy: string;
    keywordLabel: string;
    modelRegistry: string;
    styleTags: string;
    colorTags: string;
    usageScene: string;
    sortLabel: string;
    sortLatest: string;
    sortTrendingWeekly: string;
    sortTrendingMonthly: string;
    sortMostCopied: string;
    sortMostCollected: string;
    resultEyebrow: string;
    resultTitle: string;
    resultStat: string;
    emptyHint: string;
    expandMore: string;
    collapseLess: string;
  };
  models: {
    indexKicker: string;
    indexTitleLine1: string;
    indexTitleLine2: string;
    indexTitleLine3: string;
    indexLede: string;
    metricsEyebrow: string;
    metricsTitle: string;
    metricsCopy: string;
    activeModels: string;
    approvedPrompts: string;
    negativeSupport: string;
    listEyebrow: string;
    listTitle: string;
    listCopy: string;
    cardFormat: string;
    cardNegative: string;
    cardParams: string;
    cardPrompts: string;
    detailKicker: string;
    detailVendor: string;
    detailFormat: string;
    detailNegative: string;
    detailSearchInModel: string;
    detailBackToRegistry: string;
    detailOfficialSite: string;
    paramEyebrow: string;
    paramTitle: string;
    paramCopy: string;
    paramNoSchema: string;
    paramKey: string;
    paramType: string;
    paramDefault: string;
    feedEyebrow: string;
    feedTitle: string;
    feedCopy: string;
    feedEmpty: string;
  };
  publish: {
    heroKicker: string;
    heroTitleLine1: string;
    heroTitleLine2: string;
    heroTitleLine3: string;
    heroLede: string;
    step1: string;
    step2: string;
    step3: string;
    policyEyebrow: string;
    policyTitle: string;
    policyCopy: string;
    policyItem1: string;
    policyItem2: string;
    policyItem3: string;
    policyItem4: string;
    formEyebrow: string;
    formTitle: string;
    formCopy: string;
    chipPromptRequired: string;
    chipPromptText: string;
    chipModelRequired: string;
    chipModelTag: string;
    chipNegativeOptional: string;
    chipNegative: string;
    title: string;
    promptText: string;
    negativePrompt: string;
    usageNote: string;
    modelRegistry: string;
    modelVendor: string;
    modelFormat: string;
    modelNegative: string;
    paramHeader: string;
    paramEmpty: string;
    styleTags: string;
    usageTags: string;
    colorTags: string;
    imageFiles: string;
    imageHint: string;
    imageUrl: string;
    imageUrlHint: string;
    errorLoginRequired: string;
    errorInvalidPayload: string;
    errorApiUnreachable: string;
    errorUploadFailed: string;
    errorPublishFailed: string;
    tagMaxHint: string;
  };
  detail: {
    promptKicker: string;
    actionOpenModelZone: string;
    actionOpenModelLink: string;
    actionReport: string;
    metricLike: string;
    metricCollect: string;
    metricCopy: string;
    metricStatus: string;
    primaryModel: string;
    promptText: string;
    negativePrompt: string;
    parameters: string;
    paramNoData: string;
    paramKey: string;
    paramValue: string;
    paramSchemaLabel: string;
    paramType: string;
    styleTags: string;
    colorTags: string;
    usageNote: string;
    authorTime: string;
    relatedEyebrow: string;
    relatedEmpty: string;
    openRelated: string;
    createdNotice: string;
  };
  myPrompts: {
    heroKicker: string;
    heroTitleLine1: string;
    heroTitleLine2: string;
    heroTitleLine3: string;
    heroLede: string;
    createdNotice: string;
    submittedForReviewNotice: string;
    totalPrompts: string;
    totalCopies: string;
    totalCollects: string;
    points: string;
    tabsEyebrow: string;
    tabsTitle: string;
    tabsCopy: string;
    tabAll: string;
    tabApproved: string;
    tabPending: string;
    tabDraft: string;
    tabRejected: string;
    tabArchived: string;
    listEyebrow: string;
    listTitle: string;
    listCopy: string;
    collectionsLink: string;
    colName: string;
    colAuthor: string;
    colState: string;
    colModel: string;
    colMetrics: string;
    rowMetricsCopiesLikes: string;
    emptyName: string;
    emptyStateLogged: string;
    emptyStateLocked: string;
    emptyTip: string;
  };
  interactions: {
    likeAction: string;
    likedAction: string;
    likePending: string;
    collectAction: string;
    collectedAction: string;
    collectPending: string;
    copyAction: string;
    copyPending: string;
    copyDone: string;
    copyFailed: string;
    reportAction: string;
    loginToInteract: string;
    interactionEyebrow: string;
    interactionStatus: string;
    likeShort: string;
    collectShort: string;
    copyShort: string;
  };
  collections: {
    heroKicker: string;
    heroTitleLine1: string;
    heroTitleLine2: string;
    heroTitleLine3: string;
    heroLede: string;
    metricsEyebrow: string;
    metricsTitle: string;
    metricsCopy: string;
    totalCollects: string;
    distinctAuthors: string;
    distinctModels: string;
    listEyebrow: string;
    listTitle: string;
    listCopy: string;
    backToMine: string;
    emptyTitle: string;
    emptyHint: string;
    needLoginTitle: string;
    needLoginHint: string;
    collectedAtLabel: string;
  };
  moderation: {
    heroKicker: string;
    heroTitleLine1: string;
    heroTitleLine2: string;
    heroTitleLine3: string;
    heroLede: string;
    forbiddenTitle: string;
    forbiddenLede: string;
    metricsEyebrow: string;
    metricsTitle: string;
    metricsCopy: string;
    queuePending: string;
    queueApproved: string;
    queueRejected: string;
    queueArchived: string;
    listEyebrow: string;
    listTitle: string;
    listCopy: string;
    approve: string;
    reject: string;
    archive: string;
    openDetail: string;
    emptyTitle: string;
    emptyHint: string;
    autoFlagsLabel: string;
    autoFlagsClean: string;
    rowAuthor: string;
    rowModel: string;
    rowSubmittedAt: string;
  };
  login: {
    heroKicker: string;
    heroTitleLine1: string;
    heroTitleLine2: string;
    heroTitleLine3: string;
    heroLede: string;
    asciiRule: string;
    formEyebrow: string;
    formTitle: string;
    formCopy: string;
    account: string;
    password: string;
    google: string;
    github: string;
    wechat: string;
    msgRegistered: string;
    msgInvalid: string;
    msgApiUnreachable: string;
    msgAccountLocked: string;
    captchaLabel: string;
    captchaSuccess: string;
    captchaHint: string;
  };
  register: {
    heroKicker: string;
    heroTitleLine1: string;
    heroTitleLine2: string;
    heroTitleLine3: string;
    heroLede: string;
    formEyebrow: string;
    formTitle: string;
    formCopy: string;
    email: string;
    password: string;
    emailInvalid: string;
    passwordInvalid: string;
    strengthWeak: string;
    strengthMedium: string;
    strengthStrong: string;
    msgExists: string;
    msgInvalid: string;
    msgApiUnreachable: string;
    msgFailed: string;
  };
  tags: {
    style: Record<string, string>;
    color: Record<string, string>;
    usage: Record<string, string>;
  };
  hotTerms: { value: string; label: string }[];
};

const zhCN: Dictionary = {
  common: {
    brand: "Deeprompt",
    brandKicker: "[ 档案 · Deeprompt ]",
    brandSub: "结构化网格 · 战术遥测 · 提示词智能档案",
    footerLine: "Deeprompt · AI 图像提示词档案库 · 模型无关的社区平台",
    actions: {
      copyPrompt: "复制提示词",
      copying: "复制中…",
      copied: "已复制",
      copyFailed: "复制失败",
      openDossier: "查看档案",
      executeQuery: "执行搜索",
      resetFilters: "重置筛选",
      loginRequired: "请先登录",
      loginFirst: "先去登录",
      backToLogin: "返回登录",
      createAccount: "创建账号",
      publishLive: "立即发布",
      saveDraft: "保存为草稿",
      enterSystem: "登录系统",
      closeLightbox: "关闭预览"
    },
    metrics: {
      like: "点赞",
      collect: "收藏",
      copy: "复制",
      view: "浏览"
    },
    status: {
      approved: "已发布",
      pending: "待审核",
      draft: "草稿",
      rejected: "已驳回",
      archived: "已下架",
      all: "全部"
    }
  },
  nav: {
    home: "首页",
    search: "搜索",
    models: "模型",
    publish: "发布",
    myPrompts: "我的",
    login: "登录",
    logout: "退出登录",
    confirmLogout: "确认退出登录？"
  },
  home: {
    heroKicker: "[ 今日精选提示词 ]",
    heroTitleLine1: "战术",
    heroTitleLine2: "提示词",
    heroTitleLine3: "档案库",
    heroLede:
      "Deeprompt 是面向 AI 生图创作者的提示词档案与社区平台，当前按 PRD / TDD 的 MVP 链路落地，优先覆盖浏览、搜索、发布、详情、个人管理五条核心路径。",
    heroPrimary: "进入发布流程",
    heroSecondary: "查看热门提示词",
    statsSupportedModels: "已接入模型",
    statsPromptUnits: "提示词数量",
    visualFeatureId: "精选编号",
    visualPrimaryModel: "主要模型",
    visualAuthorUnit: "作者单元",
    registryEyebrow: "[ 模型注册表 · 已激活 ]",
    registryTitle: "已接入引擎",
    registryCopy:
      "MVP 阶段聚焦 3 大模型，筛选器、发布表单、详情标签都从 model_registry 配置驱动。",
    registryFormat: "格式",
    registryNegative: "反向提示",
    negativeOn: "支持",
    negativeOff: "不支持",
    hotEyebrow: "[ 热搜词 · 终端流 ]",
    hotTitle: "趋势扫描",
    hotCopy: "搜索页支持全文关键词、模型筛选、风格、色调、用途和排序方式。",
    hotRank: "排名",
    feedEyebrow: "[ 提示词库 · 最新与热门 ]",
    feedTitle: "提示词档案墙",
    feedCopy:
      "首页数据优先取自后端 API，API 不可用时回退到静态内容，保证开发体验不断档。",
    welcomeBack: "{nickname}，欢迎回来"
  },
  search: {
    heroKicker: "[ 提示词搜索 · 筛选矩阵 ]",
    heroTitleLine1: "搜索",
    heroTitleLine2: "条件",
    heroTitleLine3: "矩阵",
    heroLede:
      "对齐 PRD 的搜索与筛选能力：关键词走 PostgreSQL 全文检索，模型、风格、色调、用途、排序全部联动并写回 URL。",
    hotEyebrow: "[ 热门关键词 ]",
    hotTitle: "实时趋势缓冲",
    hotCopy: "MVP 阶段热搜词先走静态配置，后续切到 Redis 排行榜。",
    hotRank: "词条",
    filterEyebrow: "[ 筛选配置 ]",
    filterTitle: "查询面板",
    filterCopy:
      "模型来自 model_registry，标签维度由后端 facet 聚合返回，支持多选 + 排序联动。",
    keywordLabel: "关键词 / 标题 + 提示词 + 标签",
    modelRegistry: "模型注册表",
    styleTags: "风格标签",
    colorTags: "色调",
    usageScene: "使用场景",
    sortLabel: "排序",
    sortLatest: "最新",
    sortTrendingWeekly: "本周热门",
    sortTrendingMonthly: "本月热门",
    sortMostCopied: "复制最多",
    sortMostCollected: "收藏最多",
    resultEyebrow: "[ 结果列表 ]",
    resultTitle: "匹配档案",
    resultStat: "排序 / {sort} · 共 {total} 条 · 耗时 {took} 毫秒",
    emptyHint: "没有匹配的提示词，先放宽筛选条件再继续探索。",
    expandMore: "展开更多",
    collapseLess: "收起"
  },
  models: {
    indexKicker: "[ 模型注册表 · 已激活舰队 ]",
    indexTitleLine1: "模型",
    indexTitleLine2: "注册表",
    indexTitleLine3: "矩阵",
    indexLede:
      "所有筛选器、发布表单、详情页都从 model_registry 取值，新增模型走 SQL 或 admin API 即可，无需改前端代码。",
    metricsEyebrow: "[ 舰队指标 ]",
    metricsTitle: "注册表快照",
    metricsCopy:
      "模型数量、提示词总量和支持的 prompt_format 一目了然，便于运营盘点。",
    activeModels: "激活模型数",
    approvedPrompts: "已发布提示词",
    negativeSupport: "支持反向提示",
    listEyebrow: "[ 模型卡片 ]",
    listTitle: "激活舰队",
    listCopy: "点击进入模型专区，可查看该模型下所有提示词与参数定义。",
    cardFormat: "格式",
    cardNegative: "反向提示",
    cardParams: "参数项",
    cardPrompts: "提示词数",
    detailKicker: "[ 模型档案 · {id} ]",
    detailVendor: "厂商",
    detailFormat: "格式",
    detailNegative: "反向提示",
    detailSearchInModel: "在该模型下搜索",
    detailBackToRegistry: "返回注册表",
    detailOfficialSite: "官方网站",
    paramEyebrow: "[ 参数 Schema ]",
    paramTitle: "动态输入映射",
    paramCopy:
      "发布表单按这份 schema 自动渲染参数控件，所有新接入模型只需在 model_registry 落库即可。",
    paramNoSchema: "该模型未配置参数项，可在 model_registry.param_schema 中补全 JSON。",
    paramKey: "字段",
    paramType: "类型",
    paramDefault: "默认值",
    feedEyebrow: "[ 模型动态 ]",
    feedTitle: "该模型最新提示词",
    feedCopy: "接入该模型的提示词共 {count} 条。",
    feedEmpty: "该模型还没有公开发布的提示词，欢迎贡献第一条。"
  },
  publish: {
    heroKicker: "[ 提交提示词 · 分步表单 ]",
    heroTitleLine1: "发布",
    heroTitleLine2: "控制",
    heroTitleLine3: "面板",
    heroLede:
      "页面结构对应 PRD 的四步发布路径：基础信息、图片上传、标签完善、预览确认。当前已支持 1~6 张本地图片上传，保留单张图片 URL 兜底输入，先把主链路跑顺再说。",
    step1: "第 1 步 · 基础信息",
    step2: "第 2 步 · 上传 1~6 张图片",
    step3: "第 3 步 · 发布或保存草稿",
    policyEyebrow: "[ 审核政策 ]",
    policyTitle: "可见性路径",
    policyCopy: "草稿仅作者可见；正式发布会立即进入公开列表和详情页。",
    policyItem1: "1 · 登录账号",
    policyItem2: "2 · 填写提示词核心字段",
    policyItem3: "3 · 上传 1~6 张图片或填写 URL",
    policyItem4: "4 · 立即发布或保存为草稿",
    formEyebrow: "[ 创作表单 ]",
    formTitle: "提示词输入区",
    formCopy:
      "字段与需求文档对齐：提示词文本、适用模型、风格标签、反向提示词、参数配置、使用说明和示例图。",
    chipPromptRequired: "必填",
    chipPromptText: "提示词文本",
    chipModelRequired: "必填",
    chipModelTag: "模型标签",
    chipNegativeOptional: "选填",
    chipNegative: "反向提示词",
    title: "标题",
    promptText: "提示词文本",
    negativePrompt: "反向提示词",
    usageNote: "使用说明",
    modelRegistry: "模型注册表",
    modelVendor: "厂商",
    modelFormat: "格式",
    modelNegative: "反向提示",
    paramHeader: "动态参数 Schema",
    paramEmpty: "该模型未配置参数项，可以留空提交。",
    styleTags: "风格标签",
    usageTags: "使用场景标签",
    colorTags: "色调标签",
    imageFiles: "图片文件 / 1~6 张",
    imageHint: "优先上传本地图片，最多 6 张，每张不超过 10MB。",
    imageUrl: "图片 URL / 备用",
    imageUrlHint: "没有本地文件时，可退回单张图片 URL。两者至少提供一种。",
    errorLoginRequired: "请先登录再发布提示词。",
    errorInvalidPayload: "标题至少 4 字、提示词至少 12 字，模型和图片（文件或链接）不能为空。",
    errorApiUnreachable: "后端服务不可达，请确认 API 服务已启动。",
    errorUploadFailed: "图片上传失败，请检查文件格式、数量或大小后重试。",
    errorPublishFailed: "发布失败，请检查字段后重试。",
    tagMaxHint: "每类最多选择 5 个标签"
  },
  detail: {
    promptKicker: "[ 提示词档案 · {id} ]",
    actionOpenModelZone: "进入模型专区",
    actionOpenModelLink: "打开模型链接",
    actionReport: "举报内容",
    metricLike: "点赞数",
    metricCollect: "收藏数",
    metricCopy: "复制数",
    metricStatus: "状态",
    primaryModel: "主要模型",
    promptText: "提示词文本",
    negativePrompt: "反向提示词",
    parameters: "参数",
    paramNoData: "未填写参数。",
    paramKey: "字段",
    paramValue: "取值",
    paramSchemaLabel: "Schema 名称",
    paramType: "类型",
    styleTags: "风格标签",
    colorTags: "色调标签",
    usageNote: "使用说明",
    authorTime: "作者 / 时间",
    relatedEyebrow: "[ 相关档案 ]",
    relatedEmpty: "暂无相关提示词，等同主题作品入库后这里会出现。",
    openRelated: "查看相关档案",
    createdNotice: "提示词已发布成功，前台现在已经能直接看到。"
  },
  myPrompts: {
    heroKicker: "[ 创作者控制台 · 个人空间 ]",
    heroTitleLine1: "我的",
    heroTitleLine2: "提示词",
    heroTitleLine3: "工作台",
    heroLede:
      "个人中心 MVP 已接入当前登录用户数据，覆盖我发布的提示词、草稿 / 待审核 / 已发布状态和基础数据看板。",
    createdNotice: "提示词已提交审核，你可以在这里看到它。",
    submittedForReviewNotice: "提示词已进入待审核队列，审核通过后会自动出现在公开列表。",
    totalPrompts: "提示词总数",
    totalCopies: "累计复制",
    totalCollects: "累计收藏",
    points: "我的积分",
    tabsEyebrow: "[ 状态筛选 ]",
    tabsTitle: "内容状态",
    tabsCopy: "点击切换状态视图，URL 同步保留过滤条件，刷新依旧有效。",
    tabAll: "全部",
    tabApproved: "已发布",
    tabPending: "待审核",
    tabDraft: "草稿",
    tabRejected: "已驳回",
    tabArchived: "已下架",
    listEyebrow: "[ 已发布 + 草稿 ]",
    listTitle: "提示词列表",
    listCopy: "已接入后端状态机，发布后 pending / draft / approved 实时同步。",
    collectionsLink: "查看我的收藏",
    colName: "标题",
    colAuthor: "发布者",
    colState: "状态",
    colModel: "模型",
    colMetrics: "指标",
    rowMetricsCopiesLikes: "{copies} 次复制 · {likes} 次点赞",
    emptyName: "暂无提示词",
    emptyStateLogged: "空",
    emptyStateLocked: "未登录",
    emptyTip: "先去发布第一条"
  },
  interactions: {
    likeAction: "点赞",
    likedAction: "已点赞",
    likePending: "处理中…",
    collectAction: "收藏",
    collectedAction: "已收藏",
    collectPending: "处理中…",
    copyAction: "复制提示词",
    copyPending: "复制中…",
    copyDone: "已复制",
    copyFailed: "复制失败",
    reportAction: "举报内容",
    loginToInteract: "登录后即可点赞、收藏",
    interactionEyebrow: "[ 互动 · 计数闭环 ]",
    interactionStatus: "状态会幂等更新，重复点击不会刷数。",
    likeShort: "赞",
    collectShort: "藏",
    copyShort: "复制"
  },
  collections: {
    heroKicker: "[ 个人收藏 · 我的口袋 ]",
    heroTitleLine1: "我的",
    heroTitleLine2: "收藏",
    heroTitleLine3: "档案",
    heroLede:
      "收藏列表 MVP 版本：所有标记为收藏的提示词都会汇集在这里，按收藏时间倒序展示，幂等接口确保不会重复刷数。",
    metricsEyebrow: "[ 收藏指标 ]",
    metricsTitle: "口袋看板",
    metricsCopy: "总收藏数、覆盖的作者数、覆盖的模型数。",
    totalCollects: "总收藏",
    distinctAuthors: "覆盖作者",
    distinctModels: "覆盖模型",
    listEyebrow: "[ 收藏档案墙 ]",
    listTitle: "已收藏的提示词",
    listCopy: "点击查看档案进入详情页，可一键取消收藏。",
    backToMine: "返回我的提示词",
    emptyTitle: "暂无收藏",
    emptyHint: "去搜索页发现喜欢的提示词，点击收藏即可加入这里。",
    needLoginTitle: "未登录",
    needLoginHint: "登录后才能查看个人收藏。",
    collectedAtLabel: "收藏于"
  },
  moderation: {
    heroKicker: "[ 审核台 · 管理员入口 ]",
    heroTitleLine1: "审核",
    heroTitleLine2: "队列",
    heroTitleLine3: "控制",
    heroLede:
      "审核台聚合所有待处理的提示词，支持通过 / 驳回 / 下架三种操作。审核动作会触发 Meilisearch 同步占位，后续接入 BullMQ 异步消费。",
    forbiddenTitle: "无访问权限",
    forbiddenLede: "审核台仅对 admin 或 moderator 角色开放。",
    metricsEyebrow: "[ 队列指标 ]",
    metricsTitle: "审核台快照",
    metricsCopy: "按状态聚合后端 prompt_status，重点观察 pending 堆积量。",
    queuePending: "待审核",
    queueApproved: "已通过",
    queueRejected: "已驳回",
    queueArchived: "已下架",
    listEyebrow: "[ 待处理提示词 ]",
    listTitle: "审核队列",
    listCopy: "默认展示待审核条目，点击即可执行决策。",
    approve: "通过审核",
    reject: "驳回",
    archive: "下架",
    openDetail: "查看档案",
    emptyTitle: "队列已清空",
    emptyHint: "暂无待审核提示词，社区秩序良好。",
    autoFlagsLabel: "自动检测",
    autoFlagsClean: "无异常标记",
    rowAuthor: "作者",
    rowModel: "模型",
    rowSubmittedAt: "提交时间"
  },
  login: {
    heroKicker: "[ 创作者档案 · 登录通道 ]",
    heroTitleLine1: "用户",
    heroTitleLine2: "登录",
    heroTitleLine3: "入口",
    heroLede:
      "登录你的 Deeprompt 创作者档案，跨模型同步收藏与发布记录，让每一个提示词都可追溯、可复用。",
    asciiRule: "[ 邮箱 ] [ 手机号 ] [ Google ] [ GitHub ] [ 微信 ]",
    formEyebrow: "[ 登录表单 ]",
    formTitle: "档案接入面板",
    formCopy: "以邮箱或手机号接入你的档案，开启对 Midjourney / Flux / Stable Diffusion 等模型的提示词协作。",
    account: "邮箱 / 手机号",
    password: "密码",
    google: "Google 登录",
    github: "GitHub 登录",
    wechat: "微信登录",
    msgRegistered: "注册成功，请使用新账号登录。",
    msgInvalid: "账号或密码错误，请重试。",
    msgApiUnreachable: "后端服务不可达，请确认 API 服务已启动。",
    msgAccountLocked: "账户连续登录失败已被临时锁定，请稍后重试。",
    captchaLabel: "拖动滑块验证",
    captchaSuccess: "验证成功",
    captchaHint: "请先完成验证"
  },
  register: {
    heroKicker: "[ 建立档案 · 新创作者 ]",
    heroTitleLine1: "创建",
    heroTitleLine2: "新",
    heroTitleLine3: "账号",
    heroLede:
      "建立你的 Deeprompt 创作者档案，发布、收藏、追踪你在不同 AI 模型上的提示词演化，让每一次创作都被记录。",
    formEyebrow: "[ 注册表单 ]",
    formTitle: "新档案面板",
    formCopy: "留下邮箱与密码，开启模型无关的提示词档案库，把你的灵感沉淀成可检索的素材。",
    email: "邮箱",
    password: "密码",
    emailInvalid: "邮箱格式不正确",
    passwordInvalid: "密码至少8位，需含字母和数字",
    strengthWeak: "弱",
    strengthMedium: "中",
    strengthStrong: "强",
    msgExists: "该邮箱或手机号已注册，请直接登录。",
    msgInvalid: "注册信息不完整或格式不正确，请检查后重试。",
    msgApiUnreachable: "后端服务不可达，请确认 API 服务已启动。",
    msgFailed: "注册失败，请稍后重试。"
  },
  tags: {
    style: {
      REALISM: "写实",
      CYBERPUNK: "赛博朋克",
      ANIME: "动漫",
      MINIMAL: "极简",
      EDITORIAL: "社论",
      INTERIOR: "室内",
      PRODUCT: "产品",
      BRUTALIST: "粗野主义",
      STUDIO: "工作室",
      "FILM GRAIN": "胶片颗粒",
      "DENSE UI": "密集界面",
      TERMINAL: "终端"
    },
    color: {
      COLD: "冷色",
      WARM: "暖色",
      MONO: "单色",
      BLACK: "黑色",
      WHITE: "白色",
      RED: "红色",
      GREEN: "绿色",
      "RED SHIFT": "红移"
    },
    usage: {
      PORTRAIT: "人像",
      LANDSCAPE: "风景",
      PRODUCT: "产品",
      UI: "界面",
      "CONCEPT ART": "概念艺术",
      AD: "广告",
      COVER: "封面",
      "KEY VISUAL": "主视觉"
    }
  },
  hotTerms: [
    { value: "TACTICAL PORTRAIT", label: "战术人像" },
    { value: "FLUX PRODUCT", label: "FLUX 产品" },
    { value: "CYBERPUNK RAIN", label: "赛博朋克雨夜" },
    { value: "BLUEPRINT LANDSCAPE", label: "蓝图风景" },
    { value: "UI MATERIAL", label: "UI 素材" }
  ]
};

const enUS: Dictionary = {
  common: {
    brand: "Deeprompt",
    brandKicker: "[ ARCHIVE / DEEPPROMPT ]",
    brandSub: "SWISS GRID / TACTICAL TELEMETRY / PROMPT INTELLIGENCE NETWORK",
    footerLine: "DEEPPROMPT / AI IMAGE PROMPT ARCHIVE / MODEL-AGNOSTIC COMMUNITY PLATFORM",
    actions: {
      copyPrompt: "COPY PROMPT",
      copying: "COPYING...",
      copied: "COPIED",
      copyFailed: "COPY FAILED",
      openDossier: "OPEN DOSSIER",
      executeQuery: "EXECUTE QUERY",
      resetFilters: "RESET FILTERS",
      loginRequired: "LOGIN REQUIRED",
      loginFirst: "LOGIN FIRST",
      backToLogin: "BACK TO LOGIN",
      createAccount: "CREATE ACCOUNT",
      publishLive: "PUBLISH LIVE",
      saveDraft: "SAVE DRAFT",
      enterSystem: "ENTER SYSTEM",
      closeLightbox: "CLOSE PREVIEW"
    },
    metrics: {
      like: "LIKE",
      collect: "COLLECT",
      copy: "COPY",
      view: "VIEW"
    },
    status: {
      approved: "APPROVED",
      pending: "PENDING",
      draft: "DRAFT",
      rejected: "REJECTED",
      archived: "ARCHIVED",
      all: "ALL"
    }
  },
  nav: {
    home: "HOME",
    search: "SEARCH",
    models: "MODELS",
    publish: "PUBLISH",
    myPrompts: "MY PROMPTS",
    login: "LOGIN",
    logout: "LOG OUT",
    confirmLogout: "CONFIRM LOG OUT?"
  },
  home: {
    heroKicker: "[ TODAY'S FEATURED PROMPT ]",
    heroTitleLine1: "TACTICAL",
    heroTitleLine2: "PROMPT",
    heroTitleLine3: "ARCHIVE",
    heroLede:
      "Deeprompt is a curated prompt archive and community for AI image creators, currently shipping the MVP loop defined by the PRD/TDD: browse, search, publish, detail, and personal management.",
    heroPrimary: "OPEN PUBLISH FLOW",
    heroSecondary: "SCAN HOT LIBRARY",
    statsSupportedModels: "SUPPORTED MODELS",
    statsPromptUnits: "PROMPT UNITS",
    visualFeatureId: "FEATURE ID",
    visualPrimaryModel: "PRIMARY MODEL",
    visualAuthorUnit: "AUTHOR UNIT",
    registryEyebrow: "[ MODEL REGISTRY / ACTIVE ]",
    registryTitle: "SUPPORTED ENGINES",
    registryCopy:
      "MVP focuses on three models. Filters, publish form and detail tags are driven by the model_registry config.",
    registryFormat: "FORMAT",
    registryNegative: "NEGATIVE",
    negativeOn: "ON",
    negativeOff: "OFF",
    hotEyebrow: "[ HOT SEARCH / TERMINAL FEED ]",
    hotTitle: "TREND SCAN",
    hotCopy:
      "The search page supports full-text keyword, model filter, style, tone, usage and sort options.",
    hotRank: "RANK",
    feedEyebrow: "[ PROMPT LIBRARY / LATEST + TRENDING ]",
    feedTitle: "PROMPT DOSSIER WALL",
    feedCopy:
      "The home page prefers API data and falls back to static content when the API is offline, keeping the dev experience smooth.",
    welcomeBack: "WELCOME BACK, {nickname}"
  },
  search: {
    heroKicker: "[ PROMPT SEARCH / FILTER ARRAY ]",
    heroTitleLine1: "SEARCH",
    heroTitleLine2: "FIELD",
    heroTitleLine3: "MATRIX",
    heroLede:
      "Aligned with the PRD: keyword goes through PostgreSQL full-text search; model, style, tone, usage and sort all stay in sync with the URL.",
    hotEyebrow: "[ HOT KEYWORDS ]",
    hotTitle: "LIVE TREND BUFFER",
    hotCopy: "Static hot keywords for the MVP; will switch to a Redis leaderboard later.",
    hotRank: "TERM",
    filterEyebrow: "[ FILTER CONFIG ]",
    filterTitle: "QUERY PANEL",
    filterCopy:
      "Models come from model_registry; tag facets are aggregated by the backend, supporting multi-select and sort.",
    keywordLabel: "KEYWORD / TITLE + PROMPT + TAG",
    modelRegistry: "MODEL REGISTRY",
    styleTags: "STYLE TAGS",
    colorTags: "COLOR TONE",
    usageScene: "USAGE SCENE",
    sortLabel: "SORT",
    sortLatest: "LATEST",
    sortTrendingWeekly: "TRENDING / WEEK",
    sortTrendingMonthly: "TRENDING / MONTH",
    sortMostCopied: "MOST COPIED",
    sortMostCollected: "MOST COLLECTED",
    resultEyebrow: "[ RESULT FEED ]",
    resultTitle: "MATCHED DOSSIERS",
    resultStat: "SORT / {sort} / {total} HITS / {took}MS",
    emptyHint: "No matching prompts. Relax your filters and try again.",
    expandMore: "EXPAND MORE",
    collapseLess: "COLLAPSE"
  },
  models: {
    indexKicker: "[ MODEL REGISTRY / ACTIVE FLEET ]",
    indexTitleLine1: "MODEL",
    indexTitleLine2: "REGISTRY",
    indexTitleLine3: "SECTORS",
    indexLede:
      "Every filter, publish form and detail page reads from model_registry. Adding a model only requires SQL or the admin API; no frontend change needed.",
    metricsEyebrow: "[ FLEET METRICS ]",
    metricsTitle: "REGISTRY SNAPSHOT",
    metricsCopy:
      "Number of models, prompts and supported prompt_format at a glance, useful for ops review.",
    activeModels: "ACTIVE MODELS",
    approvedPrompts: "APPROVED PROMPTS",
    negativeSupport: "NEGATIVE PROMPT",
    listEyebrow: "[ MODEL CARDS ]",
    listTitle: "ACTIVE FLEET",
    listCopy: "Click into a model zone to see all prompts and their parameter definitions.",
    cardFormat: "FORMAT",
    cardNegative: "NEGATIVE",
    cardParams: "PARAMS",
    cardPrompts: "PROMPTS",
    detailKicker: "[ MODEL / {id} ]",
    detailVendor: "VENDOR",
    detailFormat: "FORMAT",
    detailNegative: "NEGATIVE PROMPT",
    detailSearchInModel: "SEARCH IN MODEL",
    detailBackToRegistry: "BACK TO REGISTRY",
    detailOfficialSite: "OFFICIAL SITE",
    paramEyebrow: "[ PARAM SCHEMA ]",
    paramTitle: "DYNAMIC INPUT MAP",
    paramCopy:
      "The publish form renders parameter widgets from this schema. Newly added models only need to land in model_registry.",
    paramNoSchema:
      "No parameter schema configured. Add JSON to model_registry.param_schema.",
    paramKey: "KEY",
    paramType: "TYPE",
    paramDefault: "DEFAULT",
    feedEyebrow: "[ MODEL FEED ]",
    feedTitle: "LATEST PROMPTS IN MODEL",
    feedCopy: "{count} prompt(s) linked to this model.",
    feedEmpty: "No public prompts on this model yet. Be the first to contribute."
  },
  publish: {
    heroKicker: "[ SUBMIT PROMPT / STEP FLOW ]",
    heroTitleLine1: "PUBLISH",
    heroTitleLine2: "CONTROL",
    heroTitleLine3: "PANEL",
    heroLede:
      "Layout maps to the PRD's four-step publish flow: basics, image upload, tags, preview. Local uploads (1-6) are supported; single-image URL is kept as a fallback.",
    step1: "STEP 01 / BASE INFO",
    step2: "STEP 02 / 1-6 IMAGE FILES",
    step3: "STEP 03 / PUBLISH OR SAVE DRAFT",
    policyEyebrow: "[ REVIEW POLICY ]",
    policyTitle: "VISIBILITY PATH",
    policyCopy: "Drafts are author-only; published entries go live in the public list and detail page.",
    policyItem1: "1 / LOGIN REQUIRED",
    policyItem2: "2 / FILL PROMPT CORE FIELDS",
    policyItem3: "3 / UPLOAD 1-6 IMAGES OR USE URL",
    policyItem4: "4 / GO LIVE OR SAVE DRAFT",
    formEyebrow: "[ AUTHORING FORM ]",
    formTitle: "PROMPT INPUT ARRAY",
    formCopy:
      "Fields align with the PRD: prompt text, applicable model, style tags, negative prompt, parameters, usage note and reference images.",
    chipPromptRequired: "REQUIRED FIELD",
    chipPromptText: "PROMPT TEXT",
    chipModelRequired: "REQUIRED FIELD",
    chipModelTag: "MODEL TAG",
    chipNegativeOptional: "OPTIONAL FIELD",
    chipNegative: "NEGATIVE PROMPT",
    title: "TITLE",
    promptText: "PROMPT TEXT",
    negativePrompt: "NEGATIVE PROMPT",
    usageNote: "USAGE NOTE",
    modelRegistry: "MODEL REGISTRY",
    modelVendor: "VENDOR",
    modelFormat: "FORMAT",
    modelNegative: "NEG",
    paramHeader: "PARAM SCHEMA / DYNAMIC",
    paramEmpty: "No parameters configured for this model. Submission can leave it empty.",
    styleTags: "STYLE TAGS",
    usageTags: "USAGE TAGS",
    colorTags: "COLOR TAGS",
    imageFiles: "IMAGE FILES / 1-6",
    imageHint: "Prefer local images; up to 6, max 10MB each.",
    imageUrl: "IMAGE URL / FALLBACK",
    imageUrlHint: "Fall back to a single image URL when no local file is available.",
    errorLoginRequired: "Please log in before publishing a prompt.",
    errorInvalidPayload:
      "Title (4+ chars), prompt text (12+ chars), model, and either an image file or a fallback URL are required.",
    errorApiUnreachable: "API service is unreachable. Make sure the API is running.",
    errorUploadFailed: "Image upload failed. Check format, count and size, then retry.",
    errorPublishFailed: "Publish failed. Verify the fields and retry.",
    tagMaxHint: "MAX 5 TAGS PER CATEGORY"
  },
  detail: {
    promptKicker: "[ PROMPT DOSSIER / {id} ]",
    actionOpenModelZone: "OPEN MODEL ZONE",
    actionOpenModelLink: "OPEN MODEL LINK",
    actionReport: "REPORT ENTRY",
    metricLike: "LIKE COUNT",
    metricCollect: "COLLECT COUNT",
    metricCopy: "COPY COUNT",
    metricStatus: "STATUS",
    primaryModel: "PRIMARY MODEL",
    promptText: "PROMPT TEXT",
    negativePrompt: "NEGATIVE PROMPT",
    parameters: "PARAMETERS",
    paramNoData: "No parameter values provided.",
    paramKey: "KEY",
    paramValue: "VALUE",
    paramSchemaLabel: "SCHEMA LABEL",
    paramType: "TYPE",
    styleTags: "STYLE TAGS",
    colorTags: "COLOR TAGS",
    usageNote: "USAGE NOTE",
    authorTime: "AUTHOR / TIME",
    relatedEyebrow: "[ RELATED DOSSIERS ]",
    relatedEmpty: "No related prompts yet. They will appear here once similar entries land.",
    openRelated: "OPEN RELATED ENTRY",
    createdNotice: "Prompt published. Visible on the public list now."
  },
  myPrompts: {
    heroKicker: "[ CREATOR DESK / PERSONAL CONSOLE ]",
    heroTitleLine1: "MY",
    heroTitleLine2: "PROMPT",
    heroTitleLine3: "DESK",
    heroLede:
      "Personal hub is wired to the logged-in user, covering my prompts, draft / pending / approved states and a basic data board.",
    createdNotice: "Prompt submitted for review. You can find it here.",
    submittedForReviewNotice:
      "Prompt is queued for review. It will appear on the public list automatically once approved.",
    totalPrompts: "TOTAL PROMPTS",
    totalCopies: "TOTAL COPIES",
    totalCollects: "TOTAL COLLECTS",
    points: "POINTS",
    tabsEyebrow: "[ FILTER TABS ]",
    tabsTitle: "CONTENT STATES",
    tabsCopy:
      "Click a tab to filter. The current status is mirrored to the URL so a refresh keeps the view.",
    tabAll: "ALL",
    tabApproved: "APPROVED",
    tabPending: "PENDING",
    tabDraft: "DRAFT",
    tabRejected: "REJECTED",
    tabArchived: "ARCHIVED",
    listEyebrow: "[ PUBLISHED + DRAFTED ENTRIES ]",
    listTitle: "PROMPT LOG TABLE",
    listCopy:
      "Hooked to the backend status machine: pending / draft / approved sync as soon as you publish.",
    collectionsLink: "VIEW MY COLLECTIONS",
    colName: "ENTRY NAME",
    colAuthor: "AUTHOR",
    colState: "STATE",
    colModel: "MODEL",
    colMetrics: "METRICS",
    rowMetricsCopiesLikes: "{copies} COPIES / {likes} LIKES",
    emptyName: "NO PROMPT YET",
    emptyStateLogged: "EMPTY",
    emptyStateLocked: "LOCKED",
    emptyTip: "PUBLISH FIRST PROMPT"
  },
  interactions: {
    likeAction: "LIKE",
    likedAction: "LIKED",
    likePending: "PROCESSING...",
    collectAction: "COLLECT",
    collectedAction: "COLLECTED",
    collectPending: "PROCESSING...",
    copyAction: "COPY PROMPT",
    copyPending: "COPYING...",
    copyDone: "COPIED",
    copyFailed: "COPY FAILED",
    reportAction: "REPORT ENTRY",
    loginToInteract: "LOG IN TO LIKE / COLLECT",
    interactionEyebrow: "[ INTERACTIONS / COUNTER LOOP ]",
    interactionStatus: "Idempotent updates: repeated clicks never inflate the counts.",
    likeShort: "LIKE",
    collectShort: "COLLECT",
    copyShort: "COPY"
  },
  collections: {
    heroKicker: "[ PERSONAL COLLECTIONS / POCKET ]",
    heroTitleLine1: "MY",
    heroTitleLine2: "COLLECTION",
    heroTitleLine3: "DOSSIER",
    heroLede:
      "MVP collection list: every prompt you have collected appears here, newest first. Idempotent backend keeps the counter clean.",
    metricsEyebrow: "[ COLLECTION METRICS ]",
    metricsTitle: "POCKET BOARD",
    metricsCopy: "Total collects, distinct authors, distinct models.",
    totalCollects: "TOTAL COLLECTS",
    distinctAuthors: "AUTHORS",
    distinctModels: "MODELS",
    listEyebrow: "[ COLLECTION WALL ]",
    listTitle: "COLLECTED PROMPTS",
    listCopy: "Click a card to open its dossier; uncollect in one tap.",
    backToMine: "BACK TO MY PROMPTS",
    emptyTitle: "NOTHING COLLECTED",
    emptyHint:
      "Discover prompts on the search page; tap COLLECT to drop them here.",
    needLoginTitle: "LOGIN REQUIRED",
    needLoginHint: "Sign in to view your personal collection.",
    collectedAtLabel: "COLLECTED AT"
  },
  moderation: {
    heroKicker: "[ MODERATION DESK / ADMIN ACCESS ]",
    heroTitleLine1: "REVIEW",
    heroTitleLine2: "QUEUE",
    heroTitleLine3: "CONTROL",
    heroLede:
      "The moderation desk aggregates pending prompts and supports approve / reject / archive. Actions stub the Meilisearch sync hook for future BullMQ consumers.",
    forbiddenTitle: "NO ACCESS",
    forbiddenLede: "The moderation desk is admin / moderator only.",
    metricsEyebrow: "[ QUEUE METRICS ]",
    metricsTitle: "DESK SNAPSHOT",
    metricsCopy: "Aggregated by backend prompt_status. Watch the pending backlog.",
    queuePending: "PENDING",
    queueApproved: "APPROVED",
    queueRejected: "REJECTED",
    queueArchived: "ARCHIVED",
    listEyebrow: "[ PENDING ENTRIES ]",
    listTitle: "REVIEW QUEUE",
    listCopy: "Showing pending entries by default. Tap an action to commit a decision.",
    approve: "APPROVE",
    reject: "REJECT",
    archive: "ARCHIVE",
    openDetail: "OPEN DOSSIER",
    emptyTitle: "QUEUE CLEAR",
    emptyHint: "No pending prompts. Community order holds.",
    autoFlagsLabel: "AUTO CHECK",
    autoFlagsClean: "NO FLAGS",
    rowAuthor: "AUTHOR",
    rowModel: "MODEL",
    rowSubmittedAt: "SUBMITTED"
  },
  login: {
    heroKicker: "[ CREATOR VAULT / ACCESS GATE ]",
    heroTitleLine1: "USER",
    heroTitleLine2: "ACCESS",
    heroTitleLine3: "GATE",
    heroLede:
      "Sign in to your Deeprompt creator vault — sync collections and published prompts across every model, keep every line of craft traceable and reusable.",
    asciiRule: "[ EMAIL ] [ PHONE ] [ GOOGLE ] [ GITHUB ] [ WECHAT ]",
    formEyebrow: "[ LOGIN FORM ]",
    formTitle: "VAULT ACCESS PANEL",
    formCopy: "Authenticate with email or phone to enter the cross-model prompt collaboration network — Midjourney, Flux, Stable Diffusion and beyond.",
    account: "EMAIL / PHONE",
    password: "PASSWORD",
    google: "GOOGLE OAUTH",
    github: "GITHUB OAUTH",
    wechat: "WECHAT OAUTH",
    msgRegistered: "Registration successful. Please sign in with the new account.",
    msgInvalid: "Invalid account or password. Please retry.",
    msgApiUnreachable: "API service is unreachable. Make sure the API is running.",
    msgAccountLocked: "Account temporarily locked after repeated failed sign-ins. Please retry later.",
    captchaLabel: "DRAG TO VERIFY",
    captchaSuccess: "VERIFIED",
    captchaHint: "COMPLETE VERIFICATION FIRST"
  },
  register: {
    heroKicker: "[ VAULT INIT / NEW CREATOR ]",
    heroTitleLine1: "CREATE",
    heroTitleLine2: "OPERATOR",
    heroTitleLine3: "ACCOUNT",
    heroLede:
      "Initialize your Deeprompt creator vault — publish, collect, and trace how your prompts evolve across every AI image model. Every creative move on record.",
    formEyebrow: "[ REGISTER FORM ]",
    formTitle: "VAULT ONBOARD PANEL",
    formCopy:
      "Drop an email and password to unlock the model-agnostic prompt archive — turn fleeting ideas into searchable, shareable craft.",
    email: "EMAIL",
    password: "PASSWORD",
    emailInvalid: "INVALID EMAIL FORMAT",
    passwordInvalid: "MIN 8 CHARS, LETTER + NUMBER REQUIRED",
    strengthWeak: "WEAK",
    strengthMedium: "MEDIUM",
    strengthStrong: "STRONG",
    msgExists: "Email or phone already registered. Please sign in directly.",
    msgInvalid: "Registration data is incomplete or invalid. Please review and retry.",
    msgApiUnreachable: "API service is unreachable. Make sure the API is running.",
    msgFailed: "Registration failed. Please retry later."
  },
  tags: {
    style: {
      REALISM: "Realism",
      CYBERPUNK: "Cyberpunk",
      ANIME: "Anime",
      MINIMAL: "Minimal",
      EDITORIAL: "Editorial",
      INTERIOR: "Interior",
      PRODUCT: "Product",
      BRUTALIST: "Brutalist",
      STUDIO: "Studio",
      "FILM GRAIN": "Film Grain",
      "DENSE UI": "Dense UI",
      TERMINAL: "Terminal"
    },
    color: {
      COLD: "Cold",
      WARM: "Warm",
      MONO: "Mono",
      BLACK: "Black",
      WHITE: "White",
      RED: "Red",
      GREEN: "Green",
      "RED SHIFT": "Red Shift"
    },
    usage: {
      PORTRAIT: "Portrait",
      LANDSCAPE: "Landscape",
      PRODUCT: "Product",
      UI: "UI",
      "CONCEPT ART": "Concept Art",
      AD: "Ad",
      COVER: "Cover",
      "KEY VISUAL": "Key Visual"
    }
  },
  hotTerms: [
    { value: "TACTICAL PORTRAIT", label: "Tactical Portrait" },
    { value: "FLUX PRODUCT", label: "Flux Product" },
    { value: "CYBERPUNK RAIN", label: "Cyberpunk Rain" },
    { value: "BLUEPRINT LANDSCAPE", label: "Blueprint Landscape" },
    { value: "UI MATERIAL", label: "UI Material" }
  ]
};

export const dictionaries = {
  "zh-CN": zhCN,
  "en-US": enUS
} as const;

export type Locale = keyof typeof dictionaries;
