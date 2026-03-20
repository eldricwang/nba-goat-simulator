#!/usr/bin/env python3
"""
快速补充球员数据 - 使用 LeagueDashPlayerStats 端点
这个端点可以一次性返回整个赛季的所有球员统计，比逐个查询快得多
"""

import json
import time
import re
import math
from pathlib import Path
from nba_api.stats.endpoints import leaguedashplayerstats

SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent / "data"
PLAYERS_FILE = DATA_DIR / "players.json"
SEASONS_FILE = DATA_DIR / "seasons.json"
# 输出到临时文件，避免和其他脚本冲突
OUTPUT_PLAYERS = DATA_DIR / "players_expanded.json"
OUTPUT_SEASONS = DATA_DIR / "seasons_expanded.json"

SEASONS_TO_FETCH = [
    "2024-25", "2023-24", "2022-23", "2021-22", "2020-21",
    "2019-20", "2018-19", "2017-18", "2016-17", "2015-16",
    "2014-15", "2013-14", "2012-13", "2011-12", "2010-11",
    "2009-10", "2008-09", "2007-08", "2006-07", "2005-06",
    "2004-05", "2003-04", "2002-03", "2001-02", "2000-01",
    "1999-00", "1998-99", "1997-98", "1996-97",
    "1995-96", "1994-95", "1993-94", "1992-93", "1991-92",
    "1990-91", "1989-90", "1988-89", "1987-88", "1986-87",
]


def sf(val, default=0):
    """Safe float: convert to float, handle None/NaN/Inf"""
    if val is None:
        return default
    try:
        f = float(val)
        return default if (math.isnan(f) or math.isinf(f)) else f
    except (ValueError, TypeError):
        return default


def sr(val, d=1):
    """Safe round"""
    return round(sf(val), d)


def name_to_id(name: str) -> str:
    name = name.strip()
    name = re.sub(r'\s+(Jr\.?|Sr\.?|III|II|IV|V)$', '', name)
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    return slug


def build_season_obj(pid, season_str, team, row):
    """从 DataFrame row 构建一条赛季记录"""
    gp = int(sf(row.get("GP", 0)))
    pts = sr(row.get("PTS", 0))
    fga = sf(row.get("FGA", 0))
    fta = sf(row.get("FTA", 0))
    tsa = fga + 0.44 * fta
    ts_pct = round((pts / (2 * tsa)) * 100, 1) if tsa > 0 else 0

    return {
        "playerId": pid,
        "season": season_str,
        "team": team if team else None,
        "gp": gp,
        "mp": sr(row.get("MIN", 0)),
        "pts": pts,
        "reb": sr(row.get("REB", 0)),
        "ast": sr(row.get("AST", 0)),
        "fgPct": sr(sf(row.get("FG_PCT", 0)) * 100),
        "tpPct": sr(sf(row.get("FG3_PCT", 0)) * 100),
        "tsPct": ts_pct,
        "stl": sr(row.get("STL", 0)),
        "blk": sr(row.get("BLK", 0)),
        "tov": sr(row.get("TOV", 0)),
        "ftPct": sr(sf(row.get("FT_PCT", 0)) * 100),
    }


def main():
    print("=" * 60)
    print("快速批量获取球员数据（LeagueDashPlayerStats）")
    print("=" * 60)

    with open(PLAYERS_FILE, "r", encoding="utf-8") as f:
        players = json.load(f)
    with open(SEASONS_FILE, "r", encoding="utf-8") as f:
        seasons = json.load(f)

    existing_nba_ids = {p.get("nbaId") for p in players if p.get("nbaId")}
    existing_ids = {p["id"] for p in players}
    existing_season_keys = {f"{s['playerId']}|{s['season']}" for s in seasons}

    # nba_id -> player slug 映射
    nba_id_to_slug = {}
    for p in players:
        if p.get("nbaId"):
            nba_id_to_slug[p["nbaId"]] = p["id"]

    existing_zh_names = {}
    for p in players:
        if p.get("nbaId"):
            existing_zh_names[p["nbaId"]] = p["nameZh"]

    print(f"  现有球员: {len(players)}")
    print(f"  现有赛季: {len(seasons)}")

    new_players_map = {}  # nba_id -> player_obj (with _seasons_gp temp field)
    new_seasons = []

    for season_str in SEASONS_TO_FETCH:
        print(f"\n📊 获取 {season_str} 赛季数据...", end=" ", flush=True)

        df = None
        for attempt in range(3):
            try:
                stats = leaguedashplayerstats.LeagueDashPlayerStats(
                    season=season_str,
                    per_mode_detailed="PerGame",
                    season_type_all_star="Regular Season",
                )
                time.sleep(1.5)
                df = stats.get_data_frames()[0]
                print(f"✅ {len(df)} 名球员")
                break
            except Exception as e:
                print(f"⚠️ 重试 ({attempt+1}/3): {e}")
                time.sleep(8)
                if attempt == 2:
                    print(f"❌ 跳过 {season_str}")

        if df is None:
            continue

        for _, row in df.iterrows():
            nba_id = int(row["PLAYER_ID"])
            name = str(row["PLAYER_NAME"])
            team = str(row.get("TEAM_ABBREVIATION", ""))
            gp = int(sf(row.get("GP", 0)))

            if gp < 1:
                continue

            # 现有球员：只补充缺少的赛季数据
            if nba_id in existing_nba_ids:
                pid = nba_id_to_slug.get(nba_id)
                if pid:
                    key = f"{pid}|{season_str}"
                    if key not in existing_season_keys:
                        new_seasons.append(build_season_obj(pid, season_str, team, row))
                        existing_season_keys.add(key)
                continue

            # 新球员
            if nba_id not in new_players_map:
                slug = name_to_id(name)
                final_slug = slug
                if final_slug in existing_ids:
                    final_slug = f"{slug}-{nba_id}"
                existing_ids.add(final_slug)

                name_zh = existing_zh_names.get(nba_id, name)

                new_players_map[nba_id] = {
                    "id": final_slug,
                    "nameZh": name_zh,
                    "nameEn": name,
                    "position": None,
                    "active": False,
                    "career": {
                        "gp": 0, "mp": 0, "pts": 0, "reb": 0, "ast": 0,
                        "fgPct": 0, "tpPct": None, "tsPct": None,
                        "mvp": 0, "fmvp": 0, "stl": 0, "blk": 0, "tov": 0,
                    },
                    "nbaId": nba_id,
                    "_seasons_gp": [],
                }
                existing_nba_ids.add(nba_id)
                nba_id_to_slug[nba_id] = final_slug

            p = new_players_map[nba_id]
            pid = p["id"]

            if season_str == "2024-25":
                p["active"] = True

            # 累积用于算 career averages
            p["_seasons_gp"].append({
                "gp": gp,
                "mp": sf(row.get("MIN", 0)),
                "pts": sf(row.get("PTS", 0)),
                "reb": sf(row.get("REB", 0)),
                "ast": sf(row.get("AST", 0)),
                "fgPct": sf(row.get("FG_PCT", 0)),
                "tpPct": sf(row.get("FG3_PCT", 0)),
                "fga": sf(row.get("FGA", 0)),
                "fta": sf(row.get("FTA", 0)),
                "stl": sf(row.get("STL", 0)),
                "blk": sf(row.get("BLK", 0)),
                "tov": sf(row.get("TOV", 0)),
            })

            # 添加赛季数据
            key = f"{pid}|{season_str}"
            if key not in existing_season_keys:
                new_seasons.append(build_season_obj(pid, season_str, team, row))
                existing_season_keys.add(key)

    # 计算新球员的 career averages（加权平均）
    print("\n\n📐 计算 career averages...")
    new_players = []
    for nba_id, p in new_players_map.items():
        sd = p.pop("_seasons_gp", [])
        if not sd:
            continue

        total_gp = sum(s["gp"] for s in sd)
        if total_gp < 50:
            continue

        def wa(field):
            return sum(sf(s[field]) * s["gp"] for s in sd) / total_gp

        p["career"]["gp"] = total_gp
        p["career"]["mp"] = sr(wa("mp"))
        p["career"]["pts"] = sr(wa("pts"))
        p["career"]["reb"] = sr(wa("reb"))
        p["career"]["ast"] = sr(wa("ast"))
        p["career"]["fgPct"] = sr(wa("fgPct") * 100)
        p["career"]["tpPct"] = sr(wa("tpPct") * 100)
        p["career"]["stl"] = sr(wa("stl"))
        p["career"]["blk"] = sr(wa("blk"))
        p["career"]["tov"] = sr(wa("tov"))

        total_fga = sum(sf(s["fga"]) * s["gp"] for s in sd)
        total_fta = sum(sf(s["fta"]) * s["gp"] for s in sd)
        total_pts = sum(sf(s["pts"]) * s["gp"] for s in sd)
        tsa = total_fga + 0.44 * total_fta
        p["career"]["tsPct"] = sr((total_pts / (2 * tsa)) * 100) if tsa > 0 else None

        new_players.append(p)

    # 合并并保存
    print(f"\n📊 结果统计:")
    print(f"  新球员: {len(new_players)}")
    print(f"  新赛季数据: {len(new_seasons)}")

    all_players = players + new_players
    all_seasons = seasons + new_seasons

    all_players_sorted = sorted(all_players, key=lambda x: x["id"])
    all_seasons_sorted = sorted(all_seasons, key=lambda x: (x["playerId"], x["season"]))

    with open(OUTPUT_PLAYERS, "w", encoding="utf-8") as f:
        json.dump(all_players_sorted, f, ensure_ascii=False, indent=2)

    with open(OUTPUT_SEASONS, "w", encoding="utf-8") as f:
        json.dump(all_seasons_sorted, f, ensure_ascii=False, indent=2)

    print(f"\n✅ 最终结果:")
    print(f"  总球员数: {len(all_players_sorted)}")
    print(f"  总赛季数据: {len(all_seasons_sorted)}")


if __name__ == "__main__":
    main()
