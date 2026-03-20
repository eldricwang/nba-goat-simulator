#!/usr/bin/env python3
"""
Phase 3: 从 nba_api 静态列表中补足球员到 1000+
使用 leagueleaders 端点获取历史得分/助攻/篮板排行来获取更多历史球员
"""

import json
import time
import re
import math
from pathlib import Path
from nba_api.stats.endpoints import alltimeleadersgrids

SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent / "data"
PLAYERS_FILE = DATA_DIR / "players.json"
SEASONS_FILE = DATA_DIR / "seasons.json"


def sf(val, default=0):
    if val is None:
        return default
    try:
        f = float(val)
        return default if (math.isnan(f) or math.isinf(f)) else f
    except (ValueError, TypeError):
        return default


def sr(val, d=1):
    return round(sf(val), d)


def name_to_id(name: str) -> str:
    name = name.strip()
    name = re.sub(r'\s+(Jr\.?|Sr\.?|III|II|IV|V)$', '', name)
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    return slug


def main():
    print("=" * 60)
    print("补足球员到 1000+（AllTimeLeadersGrids）")
    print("=" * 60)

    with open(PLAYERS_FILE, "r", encoding="utf-8") as f:
        players = json.load(f)

    existing_nba_ids = {p.get("nbaId") for p in players if p.get("nbaId")}
    existing_ids = {p["id"] for p in players}

    print(f"  现有球员: {len(players)}")
    target = 1050 - len(players)
    print(f"  目标新增: {target}")

    if target <= 0:
        print("  已达标，无需补充")
        return

    # 使用 AllTimeLeadersGrids 获取历史领袖
    print("\n📊 获取历史总得分排行...")
    try:
        leaders = alltimeleadersgrids.AllTimeLeadersGrids(
            per_mode_simple="Totals",
            season_type="Regular Season",
            topx=500,
        )
        time.sleep(1.5)
        dfs = leaders.get_data_frames()
        print(f"  获取到 {len(dfs)} 个排行榜")
    except Exception as e:
        print(f"  ❌ 获取失败: {e}")
        return

    # dfs[0] = PTS leaders, dfs[1] = AST leaders, dfs[2] = REB leaders, etc.
    new_players = []

    for df_idx, df in enumerate(dfs):
        if len(new_players) >= target:
            break

        category = ["PTS", "AST", "REB", "STL", "BLK", "FGM", "FG3M", "FTM", "OREB", "DREB"][df_idx] if df_idx < 10 else f"CAT{df_idx}"
        print(f"\n  处理 {category} 排行...")

        for _, row in df.iterrows():
            if len(new_players) >= target:
                break

            nba_id = int(row.get("PLAYER_ID", 0))
            if nba_id in existing_nba_ids:
                continue

            name = str(row.get("PLAYER_NAME", ""))
            if not name:
                continue

            slug = name_to_id(name)
            if slug in existing_ids:
                slug = f"{slug}-{nba_id}"

            gp = int(sf(row.get("GP", 0)))
            pts = sr(row.get("PTS", 0))
            ast = sr(row.get("AST", 0))
            reb = sr(row.get("REB", 0))

            if gp < 50:
                continue

            # 这些都是总量，需要转成 per game
            pts_pg = sr(pts / gp) if gp > 0 else 0
            ast_pg = sr(ast / gp) if gp > 0 else 0
            reb_pg = sr(reb / gp) if gp > 0 else 0

            player_obj = {
                "id": slug,
                "nameZh": name,  # 暂时用英文名
                "nameEn": name,
                "position": None,
                "active": False,
                "career": {
                    "gp": gp,
                    "mp": 0,
                    "pts": pts_pg,
                    "reb": reb_pg,
                    "ast": ast_pg,
                    "fgPct": 0,
                    "tpPct": None,
                    "tsPct": None,
                    "mvp": 0,
                    "fmvp": 0,
                },
                "nbaId": nba_id,
            }

            new_players.append(player_obj)
            existing_nba_ids.add(nba_id)
            existing_ids.add(slug)

    print(f"\n📊 新增球员: {len(new_players)}")

    all_players = players + new_players
    all_players_sorted = sorted(all_players, key=lambda x: x["id"])

    with open(PLAYERS_FILE, "w", encoding="utf-8") as f:
        json.dump(all_players_sorted, f, ensure_ascii=False, indent=2)

    print(f"✅ 总球员数: {len(all_players_sorted)}")


if __name__ == "__main__":
    main()
