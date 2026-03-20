# Week 2 执行计划：球员页 + 站内结构 + SEO 基建

## 项目现状

| 维度 | 当前状态 | Week 2 目标 |
|------|---------|-------------|
| 球员数据 | 211 名 | 1000+ 名 |
| 赛季数据 | ~2800 条 | 覆盖热门球员关键赛季 |
| 路由 | /, /compare, /card, /about | 新增 /player/[id], /player/[id]/season/[season] |
| SEO | 几乎没有（仅 /card 有 generateMetadata） | 每页独立 title/description、JSON-LD、sitemap、robots |
| 站内链接 | 极少 | 球员 <-> 对比 <-> 卡片 密集互链 |

## 执行任务拆解（7 个任务）

### Task 1: 数据扩充 — 球员库扩展到 1000+

**范围**：编写 Python 脚本从公开 API（balldontlie/nba_api）批量拉取球员数据

- 扩充 `data/players.json` 到 1000+ 球员
- 保留现有 211 名球员的数据不变
- 新增球员只需 career 关键字段（id, nameZh, nameEn, position, active, career stats）
- 中文名可通过映射表 + 缺失时用英文名代替
- 扩充 `data/seasons.json` 覆盖热门球员关键赛季
  - 热门球员（MVP 获得者、全明星常客、现役明星）：全量赛季
  - 其他球员：至少有最近 3 个赛季
- 数据类型定义 `types.ts` 可能需要新增字段（如 draftYear, height, weight, birthDate, team 等球员资料页需要的字段）

### Task 2: 球员资料页 — /player/[id]

**范围**：创建球员详情页面，展示生涯汇总 + 赛季列表

- 新建 `src/app/player/[id]/page.tsx`
- 服务端渲染（SSG with `generateStaticParams`）
- 球员基本信息卡片：头像、中英文名、位置、现役/退役、生涯统计摘要
- 生涯汇总数据表：gp, mp, pts, reb, ast, fgPct, tpPct, tsPct, mvp, fmvp
- 赛季列表表格：所有赛季的数据（点击可跳转到单赛季页）
- 缺字段显示 "—"（graceful degradation）
- "对比该球员" 按钮：跳转到 `/compare?a={id}`
- 站内链接：链接到对比页、相关球员（同位置/同时代）
- `generateMetadata`：唯一 title/description（中文为主，带英文别名）
  - 示例：`迈克尔·乔丹 (Michael Jordan) 生涯数据 | GOAT`
- JSON-LD：WebPage + BreadcrumbList

### Task 3: 单赛季页 — /player/[id]/season/[season]

**范围**：创建球员单赛季详情页面

- 新建 `src/app/player/[id]/season/[season]/page.tsx`
- 服务端渲染
- 该赛季详细数据展示
- 与生涯平均数据对比（高于/低于生涯平均用颜色标识）
- 导航链接：返回球员页、前往对比页（带上该球员+该赛季）
- 同赛季其他球员数据排名（如果数据足够）
- `generateMetadata`：唯一 title/description
  - 示例：`迈克尔·乔丹 1995-96 赛季数据 | GOAT`
- JSON-LD：WebPage + BreadcrumbList

### Task 4: 全局导航 + 站内链接结构

**范围**：统一导航系统，增加爬虫可抓取的内部链接密度

- 改造 `layout.tsx`：添加全局导航栏（首页/球员/对比/关于）
- 改造 `/compare` 页面：
  - 球员卡片上添加"查看球员主页"链接
  - 选中球员后显示指向 `/player/[id]` 的链接
- 改造 `/card` 页面：添加球员页链接
- 新增球员列表入口页 `/players`（可选，但对 SEO 有益）：
  - 所有球员的索引页，按字母/位置分组
  - 每个球员链接到 `/player/[id]`
- 改造 `/about` 页面：修正技术栈版本（Next.js 14 → 16）
- 确保所有页面之间有合理的互链结构

### Task 5: SEO 基建 — sitemap + robots + metadata

**范围**：添加搜索引擎可抓取的基础设施

- **sitemap.xml**（动态生成）：
  - 使用 Next.js 的 `app/sitemap.ts` 自动生成
  - 包含所有球员页、赛季页、对比页、关于页
  - 1000+ 球员 = 1000+ URL（加上赛季页可能有数千）
- **robots.txt**：
  - 使用 `app/robots.ts` 生成
  - 允许所有爬虫抓取
  - 指向 sitemap.xml
- 各页面 `generateMetadata` 完善：
  - `/compare`：根据 URL 参数动态生成 title/description
  - `/about`：静态 metadata
  - `/`（首页）：如果不再重定向，需要独立 metadata
  - 所有 metadata 使用中文为主，带英文别名

### Task 6: JSON-LD 结构化数据

**范围**：为搜索引擎提供结构化数据

- 创建 JSON-LD 工具函数 `src/lib/jsonld.ts`
- 每个球员页：WebPage + BreadcrumbList
  - Breadcrumb: 首页 > 球员 > 迈克尔·乔丹
- 每个赛季页：WebPage + BreadcrumbList
  - Breadcrumb: 首页 > 球员 > 迈克尔·乔丹 > 1995-96 赛季
- 对比页：WebPage
- 首页/关于页：WebSite + WebPage
- 在 layout.tsx 或各页面中注入 `<script type="application/ld+json">`

### Task 7: 构建验证 + 部署

**范围**：确保所有页面可以正常构建和渲染

- `npm run build` 通过
- 验证所有动态路由正确生成静态页面
- 验证 sitemap.xml 和 robots.txt 可访问
- 验证任何球员页都能稳定渲染（包括数据缺失的情况）
- 部署到 Vercel 并验证线上效果
- 用 Google/Bing URL 检查工具验证抓取可行性

## 任务依赖关系

```
Task 1 (数据扩充)
  ↓
Task 2 (球员页) + Task 3 (赛季页) [可并行]
  ↓
Task 4 (导航+链接结构)
  ↓
Task 5 (sitemap/robots/metadata) + Task 6 (JSON-LD) [可并行]
  ↓
Task 7 (构建验证+部署)
```

## 关键技术决策

- **球员页采用 SSG**：用 `generateStaticParams` 预生成所有球员页，确保爬虫可抓取
- **数据层保持 JSON 文件**：1000+ 球员的 JSON 文件大小约 300-400KB，仍在可接受范围
- **中文名映射**：热门球员手动映射，长尾球员用英文名兜底
- **sitemap 分页**：如果 URL 超过 50000 条，需要分多个 sitemap 文件

## 验收标准

- [ ] 球员数据 >= 1000 名
- [ ] `/player/[id]` 页面稳定渲染所有球员
- [ ] `/player/[id]/season/[season]` 页面正常工作
- [ ] 站内链接密度显著提升（球员 <-> 对比 <-> 卡片）
- [ ] 每页有唯一的 title/description
- [ ] JSON-LD 至少实现 WebPage + BreadcrumbList
- [ ] sitemap.xml 和 robots.txt 技术上可用
- [ ] Google/Bing 能抓取 sitemap
- [ ] 缺字段显示 "—"，不 crash
