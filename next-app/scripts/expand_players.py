#!/usr/bin/env python3
"""
扩充球员数据库：从 211 名球员扩展到 1000+
使用 nba_api 获取所有历史球员的生涯统计数据
"""

import json
import time
import os
import sys
import re
from pathlib import Path

from nba_api.stats.static import players as static_players
from nba_api.stats.endpoints import (
    leagueleaders,
    playercareerstats,
    commonallplayers,
)

# ── 配置 ──────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent / "data"
EXISTING_PLAYERS_FILE = DATA_DIR / "players.json"
EXISTING_SEASONS_FILE = DATA_DIR / "seasons.json"
OUTPUT_PLAYERS_FILE = DATA_DIR / "players.json"
OUTPUT_SEASONS_FILE = DATA_DIR / "seasons.json"

# 中文名映射（尽可能覆盖知名球员）
# 这里预置常见球员的中文名，其余用英文名代替
CHINESE_NAMES = {}

# 先加载现有数据中的中文名映射
def load_existing_chinese_names():
    """从现有 players.json 中提取中文名映射"""
    if EXISTING_PLAYERS_FILE.exists():
        with open(EXISTING_PLAYERS_FILE, "r", encoding="utf-8") as f:
            existing = json.load(f)
        for p in existing:
            if p.get("nbaId"):
                CHINESE_NAMES[p["nbaId"]] = p["nameZh"]
            # 也用英文名做 key
            CHINESE_NAMES[p["nameEn"].lower()] = p["nameZh"]
    print(f"  已加载 {len(CHINESE_NAMES)} 个中文名映射")


def name_to_id(name: str) -> str:
    """将英文名转为 slug ID，如 'LeBron James' -> 'lebron-james'"""
    name = name.strip()
    # 移除后缀如 Jr., Sr., III, II, IV
    name = re.sub(r'\s+(Jr\.?|Sr\.?|III|II|IV|V)$', '', name)
    # 转小写，替换非字母为 -
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    return slug


def get_all_nba_players():
    """获取 NBA 所有历史球员（使用 static players 列表）"""
    print("📦 获取 NBA 全量球员列表...")
    all_players = static_players.get_players()
    print(f"  共 {len(all_players)} 名球员")
    return all_players


def get_career_stats_batch():
    """
    使用 LeagueLeaders 端点批量获取生涯数据
    这比逐个球员查询快得多
    """
    print("\n📊 批量获取历届赛季领袖数据...")
    
    # 获取所有赛季的数据来收集球员统计
    # 使用 all-time leaders
    all_player_stats = {}
    
    # 先获取历史得分榜（可以拿到大量球员）
    try:
        print("  获取历史得分领袖...")
        leaders = leagueleaders.LeagueLeaders(
            season="2024-25",
            season_type_all_star="Regular Season",
            stat_category_abbreviation="PTS",
            per_mode48="PerGame",
            scope="S",
        )
        time.sleep(0.6)
        df = leaders.get_data_frames()[0]
        print(f"  当赛季 Leaders 获取 {len(df)} 条记录")
        
        for _, row in df.iterrows():
            pid = row["PLAYER_ID"]
            all_player_stats[pid] = {
                "name": row["PLAYER"],
                "gp": int(row["GP"]),
                "mp": round(float(row["MIN"]), 1),
                "pts": round(float(row["PTS"]), 1),
                "reb": round(float(row["REB"]), 1),
                "ast": round(float(row["AST"]), 1),
                "fgPct": round(float(row["FG_PCT"]) * 100, 1),
                "tpPct": round(float(row["FG3_PCT"]) * 100, 1) if row["FG3_PCT"] else None,
                "tsPct": None,  # 需要单独计算
            }
    except Exception as e:
        print(f"  ⚠️ LeagueLeaders 获取失败: {e}")
    
    return all_player_stats


def fetch_player_career(player_id: int, player_name: str, retry=2):
    """获取单个球员的完整生涯数据"""
    for attempt in range(retry + 1):
        try:
            career = playercareerstats.PlayerCareerStats(
                player_id=player_id,
                per_mode36="PerGame"
            )
            time.sleep(0.6)  # Rate limiting
            
            dfs = career.get_data_frames()
            if len(dfs) == 0:
                return None, []
            
            # 赛季数据
            season_df = dfs[0]  # SeasonTotalsRegularSeason
            
            # 生涯汇总（最后一个 DataFrame 通常是 CareerTotalsRegularSeason）
            career_df = dfs[1] if len(dfs) > 1 else None
            
            seasons = []
            for _, row in season_df.iterrows():
                season_str = row.get("SEASON_ID", "")
                if not season_str:
                    continue
                
                gp = int(row.get("GP", 0))
                if gp < 1:
                    continue
                
                fga = float(row.get("FGA", 0))
                fta = float(row.get("FTA", 0))
                pts = float(row.get("PTS", 0))
                fg_pct = float(row.get("FG_PCT", 0))
                fg3_pct = float(row.get("FG3_PCT", 0)) if row.get("FG3_PCT") is not None else 0
                
                # 计算 TS%
                ts_pct = None
                if fga > 0 or fta > 0:
                    tsa = fga + 0.44 * fta
                    if tsa > 0:
                        ts_pct = round((pts / (2 * tsa)) * 100, 1)
                
                seasons.append({
                    "playerId": "",  # 后面填
                    "season": season_str,
                    "gp": gp,
                    "mp": round(float(row.get("MIN", 0)), 1),
                    "pts": round(pts, 1),
                    "reb": round(float(row.get("REB", 0)), 1),
                    "ast": round(float(row.get("AST", 0)), 1),
                    "fgPct": round(fg_pct * 100, 1),
                    "tpPct": round(fg3_pct * 100, 1),
                    "tsPct": ts_pct if ts_pct else 0,
                })
            
            # 生涯汇总
            career_data = None
            if career_df is not None and len(career_df) > 0:
                row = career_df.iloc[0]
                gp = int(row.get("GP", 0))
                fga = float(row.get("FGA", 0))
                fta = float(row.get("FTA", 0))
                pts = float(row.get("PTS", 0))
                fg_pct = float(row.get("FG_PCT", 0))
                fg3_pct = row.get("FG3_PCT")
                
                ts_pct = None
                if fga > 0 or fta > 0:
                    tsa = fga + 0.44 * fta
                    if tsa > 0:
                        ts_pct = round((pts / (2 * tsa)) * 100, 1)
                
                career_data = {
                    "gp": gp,
                    "mp": round(float(row.get("MIN", 0)), 1),
                    "pts": round(pts, 1),
                    "reb": round(float(row.get("REB", 0)), 1),
                    "ast": round(float(row.get("AST", 0)), 1),
                    "fgPct": round(fg_pct * 100, 1),
                    "tpPct": round(float(fg3_pct) * 100, 1) if fg3_pct is not None else None,
                    "tsPct": ts_pct,
                    "mvp": 0,
                    "fmvp": 0,
                }
            
            return career_data, seasons
            
        except Exception as e:
            if attempt < retry:
                print(f"    ⚠️ {player_name} 重试 ({attempt+1}/{retry}): {e}")
                time.sleep(2)
            else:
                print(f"    ❌ {player_name} 获取失败: {e}")
                return None, []


def main():
    print("=" * 60)
    print("NBA 球员数据扩充脚本")
    print("=" * 60)
    
    # 1. 加载现有数据
    print("\n📂 加载现有数据...")
    existing_players = []
    existing_seasons = []
    existing_nba_ids = set()
    existing_ids = set()
    
    if EXISTING_PLAYERS_FILE.exists():
        with open(EXISTING_PLAYERS_FILE, "r", encoding="utf-8") as f:
            existing_players = json.load(f)
        existing_nba_ids = {p.get("nbaId") for p in existing_players if p.get("nbaId")}
        existing_ids = {p["id"] for p in existing_players}
        print(f"  现有球员: {len(existing_players)}")
    
    if EXISTING_SEASONS_FILE.exists():
        with open(EXISTING_SEASONS_FILE, "r", encoding="utf-8") as f:
            existing_seasons = json.load(f)
        print(f"  现有赛季数据: {len(existing_seasons)}")
    
    load_existing_chinese_names()
    
    # 2. 获取 NBA 全量球员列表
    all_nba_players = get_all_nba_players()
    
    # 3. 筛选候选球员（排除已有的）
    candidates = []
    for p in all_nba_players:
        nba_id = p["id"]
        if nba_id in existing_nba_ids:
            continue
        candidates.append(p)
    
    print(f"\n🔍 候选新球员: {len(candidates)}")
    
    # 4. 目标：扩充到 1000+ 
    # 需要新增 ~800 名球员
    # 策略：按球员重要性排序 —— 优先活跃球员，然后历史名宿
    target_new = 900  # 目标新增数量
    
    # 先获取活跃球员
    active_candidates = [p for p in candidates if p.get("is_active", False)]
    retired_candidates = [p for p in candidates if not p.get("is_active", False)]
    
    print(f"  活跃候选: {len(active_candidates)}")
    print(f"  退役候选: {len(retired_candidates)}")
    
    # 排序策略：活跃球员优先，然后按名字排序
    selected = active_candidates[:500]  # 先取全部活跃球员
    remaining_needed = target_new - len(selected)
    if remaining_needed > 0:
        # 退役球员随机取（按字母排序取前 N 个，保证确定性）
        retired_sorted = sorted(retired_candidates, key=lambda x: x["full_name"])
        selected.extend(retired_sorted[:remaining_needed])
    
    print(f"\n📋 选定新增球员: {len(selected)}")
    
    # 5. 逐个获取球员数据
    new_players = []
    new_seasons = []
    failed = []
    
    total = len(selected)
    for i, player_info in enumerate(selected):
        nba_id = player_info["id"]
        name = player_info["full_name"]
        is_active = player_info.get("is_active", False)
        slug = name_to_id(name)
        
        # 避免 ID 冲突
        if slug in existing_ids:
            slug = f"{slug}-{nba_id}"
        
        progress = f"[{i+1}/{total}]"
        print(f"  {progress} {name} (ID: {nba_id})...", end=" ", flush=True)
        
        career_data, season_data = fetch_player_career(nba_id, name)
        
        if career_data is None:
            print("⏭️ 跳过（无数据）")
            failed.append(name)
            continue
        
        # 至少打过 50 场才收录（过滤掉只打了几场的边缘球员）
        if career_data["gp"] < 50:
            print(f"⏭️ 跳过（仅 {career_data['gp']} 场）")
            continue
        
        # 查找中文名
        name_zh = CHINESE_NAMES.get(nba_id, CHINESE_NAMES.get(name.lower(), name))
        
        # 确定位置
        position = None  # static players 没有位置信息，先留空
        
        player_obj = {
            "id": slug,
            "nameZh": name_zh,
            "nameEn": name,
            "position": position,
            "active": is_active,
            "career": career_data,
            "nbaId": nba_id,
        }
        
        new_players.append(player_obj)
        existing_ids.add(slug)
        
        # 处理赛季数据
        for s in season_data:
            s["playerId"] = slug
        new_seasons.extend(season_data)
        
        print(f"✅ {career_data['gp']}G {career_data['pts']}P {career_data['reb']}R {career_data['ast']}A | {len(season_data)} seasons")
        
        # 每 50 个球员保存一次中间结果
        if (i + 1) % 50 == 0:
            print(f"\n  💾 中间保存... ({len(new_players)} 新球员)")
            _save_data(existing_players + new_players, existing_seasons + new_seasons)
            print(f"  继续获取...\n")
    
    # 6. 最终保存
    print(f"\n{'=' * 60}")
    print(f"📊 最终统计:")
    print(f"  新增球员: {len(new_players)}")
    print(f"  新增赛季数据: {len(new_seasons)}")
    print(f"  失败: {len(failed)}")
    print(f"  总球员数: {len(existing_players) + len(new_players)}")
    print(f"  总赛季数据: {len(existing_seasons) + len(new_seasons)}")
    
    all_players = existing_players + new_players
    all_seasons = existing_seasons + new_seasons
    
    _save_data(all_players, all_seasons)
    print("\n✅ 数据扩充完成！")


def _save_data(players, seasons):
    """保存数据到 JSON 文件"""
    # 按 ID 排序
    players_sorted = sorted(players, key=lambda x: x["id"])
    seasons_sorted = sorted(seasons, key=lambda x: (x["playerId"], x["season"]))
    
    with open(OUTPUT_PLAYERS_FILE, "w", encoding="utf-8") as f:
        json.dump(players_sorted, f, ensure_ascii=False, indent=2)
    
    with open(OUTPUT_SEASONS_FILE, "w", encoding="utf-8") as f:
        json.dump(seasons_sorted, f, ensure_ascii=False, indent=2)
    
    print(f"  💾 已保存: {len(players_sorted)} 球员, {len(seasons_sorted)} 赛季记录")


if __name__ == "__main__":
    main()
