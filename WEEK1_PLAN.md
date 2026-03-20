# NBA GOAT 对比器 — 第一周初版开发计划书

## 项目目标（7 天交付）

上线一个可对外分享的 Demo，核心功能：

1. **生涯对比 + 单赛季对比**（同一 UI 内切换）
2. **指标覆盖**：PTS、REB、AST、TS%、GP、MP、FG%、3P%、MVP、FMVP
3. **1080x1350 分享卡片**（PNG 下载）
4. **分享链接可复现同样内容**
5. **OG 预览图**（社交平台抓取时有缩略图）

---

## 现有项目现状分析

| 模块 | 现状 | 本周改造方向 |
|------|------|-------------|
| **技术栈** | React 19 + Vite 7 + Tailwind 4 + C++ 后端 | 迁移为 Next.js (App Router) + TypeScript + Tailwind；废弃 C++ 后端，改用静态 JSON |
| **数据** | `backend/data/players.json` 含 66 名球星，字段：ppg/rpg/apg/fgPct/mvp/fmvp 等；无单赛季数据；无 TS%/3P%/MP | 新增 `tpPct`、`tsPct`、`mp` 字段到 career；新增 `data/seasons.json` |
| **对比功能** | `PlayerCompare.tsx` 已有 13 维度 VS 对比（综合评分、冠军、MVP 等），依赖后端排名系统 | 改为纯前端静态 JSON 读取，增加 TS%/3P%/MP，支持 career/season 切换 |
| **分享卡片** | 无 | 全新开发 1080x1350 ShareCard 组件 + html-to-image 导出 |
| **路由** | 无路由（单页状态机切换 home/profile/database） | 引入 Next.js App Router，/compare、/card、/api/og |
| **部署** | Docker + Nginx + C++ 后端 + supervisor | Vercel 部署（或保留 Docker，但前端改为 Next.js SSR） |

---

## 范围与口径（本周锁定）

### 数据口径

**生涯模式：**
- PTS / REB / AST：生涯场均
- TS% / FG% / 3P%：生涯百分比（0-100 格式统一，例如 55.2 表示 55.2%）
- GP：生涯出场总数
- MP：生涯场均分钟
- MVP / FMVP：荣誉计数

**单赛季模式：**
- 常规赛该赛季场均 + 该赛季荣誉（如有）
- MVP / FMVP 为该赛季是否获得（0 或 1）

**荣誉维度处理：**
- MVP / FMVP 在表格中独立成"荣誉条"分组
- 卡片上放在底部"荣誉条"区域

### 技术栈（固定）

- **Next.js**（App Router）+ TypeScript + Tailwind
- **数据**：`/data/players.json` + `/data/seasons.json`（静态 JSON，本周不上 Postgres）
- **卡片导出**：
  - Day 3：前端 `html-to-image` 导出 PNG
  - Day 5：`@vercel/og` 生成 OG 图

---

## 数据结构（MVP 版）

### players.json

```typescript
type Player = {
  id: string;              // "lebron-james"
  nameZh: string;          // "勒布朗·詹姆斯"
  nameEn: string;          // "LeBron James"
  headshotUrl?: string;    // 可先用占位图
  position?: string;       // "SF"
  active?: boolean;        // true
  career: {
    gp: number;            // 出场总数
    mp: number;            // 场均分钟
    pts: number;           // 场均得分
    reb: number;           // 场均篮板
    ast: number;           // 场均助攻
    fgPct: number;         // 投篮命中率 (0-100)
    tpPct: number;         // 三分命中率 (0-100)
    tsPct: number;         // 真实命中率 (0-100)
    mvp: number;           // MVP 次数
    fmvp: number;          // FMVP 次数
  };
};
```

### seasons.json

```typescript
type PlayerSeason = {
  playerId: string;        // "lebron-james"
  season: string;          // "2012-13"
  gp: number;
  mp: number;              // 场均分钟
  pts: number;
  reb: number;
  ast: number;
  fgPct: number;
  tpPct: number;
  tsPct: number;
  mvp?: number;            // 0 或 1
  fmvp?: number;           // 0 或 1
};
```

---

## 路由与页面

| 路由 | 用途 | 参数示例 |
|------|------|----------|
| `/compare` | 主对比页面（选择 A/B + 维度切换 + 赛季下拉） | `?a=lebron-james&b=michael-jordan&mode=career` |
| `/compare` | 单赛季模式 | `?a=lebron-james&b=michael-jordan&mode=season&season=2012-13` |
| `/card` | 卡片预览页（分享用，渲染同款卡片） | 同上参数 |
| `/api/og` | OG Image 服务端生成 | 同上 query 参数 |

---

## 任务拆解与编号

### 【Task-1】项目搭建 + 数据准备（Day 1）

**目标**：项目跑起来，能加载球员数据并选择。

- [ ] 1.1 初始化 Next.js (App Router) + TypeScript + Tailwind + ESLint 项目
- [ ] 1.2 从现有 `backend/data/players.json` 迁移数据，转为新格式 `data/players.json`
  - 现有字段映射：`ppg→pts`, `rpg→reb`, `apg→ast`, `fgPct→fgPct`
  - 新增字段：`tpPct`（现有数据无此字段，需补充）、`tsPct`（需计算或补充）、`mp`（场均分钟，需补充）
  - ID 格式转换：数字 ID → slug（如 `"lebron-james"`）
- [ ] 1.3 创建种子数据脚本，生成至少 50 名球员的 `data/players.json`
- [ ] 1.4 创建 `data/seasons.json` 种子数据（至少覆盖热门球员近 10 个赛季）
- [ ] 1.5 开发基础组件：`PlayerSelect`（支持搜索下拉）、`ModeToggle`（career / season 切换）
- [ ] 1.6 统一字段格式规范：百分比用 0-100（如 55.2 表示 55.2%），全项目贯穿

**验收标准**：`/compare` 页面能选两名球员并显示基本信息卡（姓名 + 位置 + 可选头像）。

---

### 【Task-2】对比表 + 高亮 + 差值 + 结论文案 v1（Day 2）

**目标**：对比体验可用，逻辑正确。

- [ ] 2.1 开发 `CompareTable` 组件，指标行固定为 10 项：PTS、REB、AST、TS%、FG%、3P%、GP、MP、MVP、FMVP
- [ ] 2.2 实现自动高亮更优一方（百分比 / 计数 / 正向指标）
- [ ] 2.3 显示差值（例如 `+3.2`）
- [ ] 2.4 支持 career / season 模式切换，season 模式下显示赛季选择器
- [ ] 2.5 开发结论文案 v1（规则化）：
  - "得分更强：PTS 更高"
  - "组织更强：AST 更高"
  - "效率更高：TS% 更高"
  - "荣誉更多：MVP / FMVP 更多"
  - 取差异最大的 2-3 条展示
- [ ] 2.6 MVP / FMVP 独立成"荣誉条"分组

**验收标准**：任意两球员对比能稳定输出表格 + 2-3 条结论。

---

### 【Task-3】1080x1350 卡片组件 + 前端导出 PNG（Day 3）

**目标**：一键生成并下载分享图，闭环打通。

- [ ] 3.1 设计 `ShareCard1080x1350` 组件（固定 1080x1350 像素）
  - 顶部：标题（A vs B / 生涯或赛季标签）
  - 中部：双头像 + 名字 + 位置/年代小标签
  - 主体：两列指标（PTS/REB/AST/TS%/FG%/3P%/GP/MP），高亮更优方
  - 底部：荣誉条（MVP、FMVP）+ 结论 bullet（2-3 条）+ 水印/来源
- [ ] 3.2 安装并集成 `html-to-image`，实现 PNG 导出
- [ ] 3.3 开发"生成卡片"按钮 + "下载 PNG"按钮
- [ ] 3.4 确保导出图片清晰（2x 像素密度）、字体不糊、无截断

**验收标准**：点击"生成卡片"能下载清晰 PNG（1080x1350），字体不糊、无截断。

---

### 【Task-4】分享链接可复现 + 卡片预览页（Day 4）

**目标**：复制链接给别人能看到同一张卡片。

- [ ] 4.1 实现 URL 参数与状态双向同步（`a` / `b` / `mode` / `season`）
- [ ] 4.2 开发 `/card` 页面：根据 URL 参数直接渲染 `ShareCard1080x1350` 组件
- [ ] 4.3 添加"复制分享链接"按钮（复制 `/card?...` 链接到剪贴板）
- [ ] 4.4 从 `/compare` 页面可一键跳转到 `/card` 预览

**验收标准**：把 `/card` 链接发给朋友，打开看到一致的对比结果。

---

### 【Task-5】OG Image 服务端生成 + 元信息（Day 5）

**目标**：分享链接有预览图，利于社交传播。

- [ ] 5.1 开发 `/api/og` 路由：读取 query 参数，生成 OG 图
  - 建议先做 1200x630（更兼容 Telegram/Slack/Twitter）
  - 卡片导出仍保持 1080x1350
- [ ] 5.2 `/card` 页面设置 metadata：`openGraph.images` 指向 `/api/og?...`
- [ ] 5.3 内嵌中文字体文件（避免中文乱码），推荐 Noto Sans SC
- [ ] 5.4 使用 `@vercel/og`（ImageResponse）实现服务端图片生成

**验收标准**：用 Telegram/Slack 等能抓取 OG 的工具测试预览正常（微信不一定立刻生效属正常）。

---

### 【Task-6】数据扩充 + 容错 + 视觉打磨（Day 6）

**目标**：Demo 更像产品，不容易崩。

- [ ] 6.1 球员数据扩充到 150-300 名（覆盖历史热门）
- [ ] 6.2 单赛季数据至少覆盖近 20 年常见球员的主要赛季
- [ ] 6.3 缺字段处理：
  - 早期球员无 3P% / TS%：显示 "—" 且不参与结论比较
  - 无单赛季数据的球员：season 模式下显示"暂无该赛季数据"
- [ ] 6.4 移动端适配（`/compare` 页面响应式布局）
- [ ] 6.5 视觉打磨：配色、间距、动画过渡优化

**验收标准**：随便选人选赛季不会报错；缺数据展示合理；移动端可用。

---

### 【Task-7】上线部署 + 埋点 + 发布物料（Day 7）

**目标**：可对外发布并观察传播。

- [ ] 7.1 Vercel 部署 + 绑定域名（可选）
- [ ] 7.2 接入埋点（Plausible 或 GA4）：
  - `compare_view`：进入对比页
  - `card_generate_click`：点击生成卡片
  - `card_download`：下载 PNG
  - `share_link_copy`：复制分享链接
- [ ] 7.3 制作 5 组"预设对比"入口（提高转化）：
  - Jordan vs LeBron（经典 GOAT 之争）
  - Kobe vs Duncan（同时代双巨头）
  - Curry vs Magic（跨时代控卫）
  - Shaq vs Wilt（远古 vs 近代中锋）
  - Giannis vs Durant（现役对决）
- [ ] 7.4 写免责声明 / 数据来源页（`/about`）
- [ ] 7.5 最终全流程测试 + 修复

**验收标准**：线上可用；能看到关键事件数据；5 组预设对比正常运作。

---

## 从现有项目迁移的关键决策

### 保留什么

| 资产 | 处理 |
|------|------|
| `backend/data/players.json`（66 名球星数据） | 迁移转换为新格式 `data/players.json`，补充缺失字段 |
| `scripts/generate_players_data.py` | 改造为新格式的数据生成脚本 |
| 视觉风格（深色主题、橙色 accent） | 沿用配色方案 |
| `PlayerCompare.tsx` 的对比逻辑 | 参考其高亮/差值逻辑，重写为新组件 |

### 废弃什么

| 模块 | 原因 |
|------|------|
| C++ 后端（全部） | 本周用静态 JSON，无需后端；下周上 Postgres 时用 Next.js API Routes |
| Docker / Nginx / Supervisord 部署方案 | 改用 Vercel 部署 |
| 排名系统（权重滑块 + 预设方案） | 本周聚焦对比功能，排名系统下周回归 |
| 评论系统 | 本周不做 |
| 用户认证系统 | 本周不做 |
| 球员数据库搜索页 | 本周不做 |

---

## 每日里程碑总览

| Day | 里程碑 | Task |
|-----|--------|------|
| Day 1 | 项目跑起来，能选球员 | Task-1 |
| Day 2 | 对比表可用、逻辑正确 | Task-2 |
| Day 3 | 一键下载 1080x1350 PNG | Task-3 |
| Day 4 | 分享链接可复现 | Task-4 |
| Day 5 | OG 预览图可用 | Task-5 |
| Day 6 | 数据充足、不崩溃、移动端可用 | Task-6 |
| Day 7 | 线上可用、可观测 | Task-7 |

---

## 风险与应对

| 风险 | 概率 | 应对 |
|------|------|------|
| TS% / 3P% / MP 数据补充工作量大 | 中 | 优先覆盖 Top 50 球员，其余用 "—" 占位 |
| html-to-image 导出中文字体问题 | 中 | 内嵌 web font，fallback 到 system font |
| @vercel/og 中文字体包体积过大 | 中 | 使用子集化字体文件（仅包含球员名用到的汉字） |
| 单赛季数据量巨大（几千条） | 低 | 按需生成，只覆盖热门球员 x 重要赛季 |
| Next.js 迁移引入大量 breaking change | 中 | 采用全新项目结构，不在现有 Vite 项目上改 |

---

*计划日期：2026 年 3 月 19 日*
*项目：NBA GOAT 对比器 v2*
*当前版本：v1（Vite + React + C++ 后端），计划迁移至 Next.js*
