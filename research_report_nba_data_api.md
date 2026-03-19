# NBA 球员真实数据 API 调研报告

## 摘要

本报告调研了 2025-2026 年仍然可用的 NBA 球员数据 API，目标是为当前项目中的硬编码球员数据（15位球员的荣誉、统计、季后赛数据等）找到真实数据替代方案。核心发现是：**没有单一的免费 API 能同时完美覆盖统计数据和荣誉数据**，但通过 `nba_api`（Python库）+ `stats.nba.com`（官方API）的组合可以免费获取项目所需的全部数据。

---

## 项目数据需求分析

当前项目 `PlayerData` 包含以下数据类型，每种 API 对它们的支持程度不同：

| 数据类别 | 具体字段 | 获取难度 |
|---------|---------|---------|
| 基本信息 | 姓名、位置、球队、生涯年份 | 容易 |
| 荣誉数据 | 总冠军、MVP、FMVP、全明星、最佳阵容、DPOY、得分王等 | **较难** |
| 常规赛数据 | PPG、RPG、APG、SPG、BPG、命中率、总得分 | 容易 |
| 季后赛数据 | 季后赛PPG/RPG/APG、季后赛胜负场 | 中等 |
| 巅峰赛季 | 巅峰赛季得分、巅峰赛季年份 | 中等 |

---

## 可用 API 总览

### 第一梯队：强烈推荐

#### 1. nba_api（Python 库）

这是获取项目所需数据的最佳免费方案。

| 属性 | 详情 |
|-----|------|
| 官网 | https://github.com/swar/nba_api |
| 费用 | **完全免费**，MIT 开源协议 |
| 最新版本 | v1.11.4（2026年2月20日发布） |
| 认证 | 不需要 API Key |
| 社区 | 3.5k Stars，695 Forks，活跃维护 |
| 退役球员 | **完全支持**（乔丹、科比、张伯伦等全部可查） |

关键端点与项目数据的对应关系：

- `PlayerCareerStats` — 获取生涯统计（PPG、RPG、APG 等），对应项目的常规赛和季后赛数据
- `PlayerAwards` — **获取所有荣誉数据**（MVP、All-Star、All-NBA、DPOY 等），对应项目的荣誉字段
- `CommonPlayerInfo` — 获取基本信息（位置、身高、体重、球队等）
- `PlayerGameLog` — 获取逐赛季数据，可以计算巅峰赛季

安装方式：`pip install nba_api`

代码示例：
```python
from nba_api.stats.endpoints import playercareerstats, playerawards

# 获取乔丹的荣誉
awards = playerawards.PlayerAwards(player_id=893)
# 获取乔丹的职业生涯统计
career = playercareerstats.PlayerCareerStats(player_id=893)
```

注意事项：nba_api 本质是 NBA.com 官方 API 的 Python 包装器，数据来源权威。但需要注意添加请求延迟，避免被 NBA.com 限流。需要 Python 3.10+ 环境。

---

#### 2. 官方 NBA Stats API（stats.nba.com）

如果你更倾向于直接发 HTTP 请求（例如在 C++ 后端中），可以直接调用 NBA 官方的统计 API。

| 属性 | 详情 |
|-----|------|
| 文档 | https://sgsdm.github.io/nba-stats-openapi/ |
| 费用 | **完全免费** |
| 认证 | 不需要 API Key，但可能需要设置 User-Agent 等 HTTP 头 |
| 端点数 | 100+ 个端点 |
| 退役球员 | **完全支持** |

关键端点：

- `https://stats.nba.com/stats/playercareerstats?PlayerID=893` — 职业生涯数据
- `https://stats.nba.com/stats/playerawards?PlayerID=893` — 荣誉数据
- `https://stats.nba.com/stats/commonallplayers?LeagueID=00` — 所有球员列表
- `https://stats.nba.com/stats/commonplayerinfo?PlayerID=893` — 球员基本信息

风险提示：这是非官方公开的 API（社区逆向工程），NBA 可能随时变更接口。实际请求时通常需要设置特定的 HTTP 头（如 Referer: https://www.nba.com），否则可能返回 403。

---

#### 3. balldontlie API

商业级体育数据 API，覆盖 20+ 联赛，是目前最活跃的体育数据平台之一。

| 属性 | 详情 |
|-----|------|
| 官网 | https://www.balldontlie.io |
| 文档 | https://www.balldontlie.io/docs |
| 费用 | 免费版 5 请求/分钟；$9.99/月升级到 60 请求/分钟 |
| 认证 | 需要注册获取 API Key |
| 最新更新 | 2026年3月（4天前） |

免费版局限：5 请求/分钟的限制对于初始数据加载可能不太够用（15个球员的数据需要多次请求）。荣誉数据（MVP、冠军数等）在文档中未明确确认是否包含，需要实际测试或联系他们确认。

---

### 第二梯队：特定场景可用

#### 4. Basketball Reference 爬虫

| 属性 | 详情 |
|-----|------|
| 库名 | basketball-reference-scraper |
| 官网 | https://github.com/jaebradley/basketball_reference_web_scraper |
| 费用 | 免费开源 |
| 退役球员 | 支持 |
| 荣誉数据 | **不支持**（仅有统计数据） |

适合补充详细的比赛级别数据，但不能获取荣誉数据，不适合作为项目主要数据源。

#### 5. SportsDataIO Discovery Lab

| 属性 | 详情 |
|-----|------|
| 官网 | https://discoverylab.sportsdata.io/personal-use-apis/nba |
| 费用 | 免费（仅上赛季数据），当前赛季需付费（$99+/月） |
| 历史数据 | 有限 |

免费版只提供上赛季数据，不包含完整历史数据，不适合获取退役球员信息。

#### 6. ESPN 非官方 API

| 属性 | 详情 |
|-----|------|
| 文档 | https://sportsapis.dev/espn-api |
| 费用 | 免费，无需 API Key |
| 稳定性 | **不稳定**，随时可能失效 |

ESPN 的隐藏端点可以获取实时比分和基础球员统计，但生涯数据和荣誉数据覆盖有限，且完全非官方，不推荐作为主要数据源。

#### 7. API-Sports Basketball

| 属性 | 详情 |
|-----|------|
| 官网 | https://api-sports.io/documentation/basketball/v1 |
| 费用 | 免费 100 请求/天 |
| 荣誉数据 | 不支持 |

覆盖多种体育赛事，但免费额度低，且不提供荣誉数据。

---

## 针对项目的推荐方案

### 方案一：Python 脚本预处理（推荐）

写一个 Python 脚本，使用 `nba_api` 一次性拉取所有球员数据，生成 JSON 文件，然后让 C++ 后端读取这个 JSON。这是最实用的方案。

优点：完全免费、数据最全、可以获取荣誉数据、支持所有历史球员。
缺点：需要 Python 环境、数据需要定期更新（对于历史球员不是问题）。

工作流程：
1. Python 脚本通过 `nba_api` 获取每个球员的 `PlayerCareerStats` + `PlayerAwards`
2. 整合数据为项目所需的 `PlayerData` JSON 格式
3. C++ 后端启动时读取 JSON 文件
4. 可以设置定时任务（如每月一次）更新现役球员数据

### 方案二：C++ 后端直接调用 stats.nba.com

C++ 后端直接通过 HTTP 请求调用 `stats.nba.com` 的 API 获取数据。

优点：不需要 Python、数据实时。
缺点：需要处理 HTTP 请求和 JSON 解析、需要设置正确的请求头、可能被限流、接口可能变更。

### 方案三：balldontlie API

如果免费额度够用（或愿意付费），balldontlie 提供最简单的 RESTful 接口。

优点：文档好、接口稳定、有商业支持。
缺点：免费版限制严格（5 req/min）、荣誉数据支持情况不明确。

---

## 数据字段覆盖对比

| 项目字段 | nba_api | stats.nba.com | balldontlie | BB-Ref 爬虫 |
|---------|---------|-------------|-------------|------------|
| name / nameEn | PlayerCareerStats | commonplayerinfo | /players | players_season_totals |
| position | CommonPlayerInfo | commonplayerinfo | /players | players_season_totals |
| teams | PlayerCareerStats | playercareerstats | /players | players_season_totals |
| championships | PlayerAwards | playerawards | 不确定 | 不支持 |
| mvp | PlayerAwards | playerawards | 不确定 | 不支持 |
| fmvp | PlayerAwards | playerawards | 不确定 | 不支持 |
| allStar | PlayerAwards | playerawards | 不确定 | 不支持 |
| allNBA1st/2nd/3rd | PlayerAwards | playerawards | 不确定 | 不支持 |
| allDefense | PlayerAwards | playerawards | 不确定 | 不支持 |
| dpoy | PlayerAwards | playerawards | 不确定 | 不支持 |
| scoringTitle | PlayerAwards | playerawards | 不确定 | 不支持 |
| ppg / rpg / apg | PlayerCareerStats | playercareerstats | /stats | players_season_totals |
| spg / bpg / fgPct | PlayerCareerStats | playercareerstats | /stats | players_season_totals |
| totalPoints | PlayerCareerStats | playercareerstats | /stats | players_season_totals |
| playoffPPG 等 | PlayerCareerStats (Playoffs) | playercareerstats | /stats | playoff_player_box_scores |
| peakPPG / peakSeason | PlayerGameLog (计算) | playergamelog | /stats (计算) | regular_season_player_box_scores |

---

## 结论

对于当前项目，**方案一（Python 脚本 + nba_api）** 是最佳选择。原因如下：

1. **完全免费**，不需要任何 API Key
2. **荣誉数据完整**：通过 `PlayerAwards` 端点可以获取 MVP、冠军、全明星、最佳阵容等所有荣誉
3. **所有历史球员可查**：从张伯伦到字母哥，NBA 官方数据库包含所有球员
4. **数据权威**：数据直接来自 NBA.com 官方
5. **实现简单**：写一个 Python 数据采集脚本，输出 JSON 文件给后端读取即可
6. **维护成本低**：历史球员数据不会变化，只需偶尔更新现役球员数据

如果未来需要实时数据或 webhook 推送，可以考虑升级到 balldontlie 付费方案。

---

## 参考链接

1. [nba_api - GitHub Repository](https://github.com/swar/nba_api)
2. [nba_api - PyPI Package](https://pypi.org/project/nba_api/)
3. [Official NBA Stats API - OpenAPI Documentation](https://sgsdm.github.io/nba-stats-openapi/)
4. [BALLDONTLIE - The #1 Sports API](https://www.balldontlie.io)
5. [BALLDONTLIE API Documentation](https://www.balldontlie.io/docs)
6. [Basketball Reference Web Scraper](https://github.com/jaebradley/basketball_reference_web_scraper)
7. [SportsDataIO - Free NBA API](https://discoverylab.sportsdata.io/personal-use-apis/nba)
8. [ESPN API 2026 - Free Unofficial Endpoints](https://sportsapis.dev/espn-api)
9. [API-Sports Basketball Documentation](https://api-sports.io/documentation/basketball/v1)
10. [Top 6 Free Sports Data API Providers - 2026 Guide](https://www.isportsapi.com/en/blog/others-2155-top-6-free-sports-data-api-providers:-a-curated-developer-guide-for-2026.html)
11. [RapidAPI - NBA API Collection](https://rapidapi.com/collection/nba-api)
12. [Free Sports APIs 汇总](https://www.rinuo.com/free/sport)
