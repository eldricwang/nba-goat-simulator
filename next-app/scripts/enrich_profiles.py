#!/usr/bin/env python3
"""
Phase 2: 为已有球员补充 profile 信息
- 身高、体重、出生日期、国籍
- 选秀信息（年份、轮次、顺位）
- 球队信息、球衣号码
- 生涯年份区间
- 赛季的球队信息
- 抢断、盖帽、失误等更多统计
"""

import json
import time
import os
from pathlib import Path

from nba_api.stats.endpoints import (
    commonplayerinfo,
    playercareerstats,
)

SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent / "data"
PLAYERS_FILE = DATA_DIR / "players.json"
SEASONS_FILE = DATA_DIR / "seasons.json"

# MVP 和 FMVP 的历史记录（用于保留/更新荣誉数据）
MVP_WINNERS = {
    "michael-jordan": 5, "kareem-abdul-jabbar": 6, "lebron-james": 4,
    "bill-russell": 5, "wilt-chamberlain": 4, "larry-bird": 3,
    "magic-johnson": 3, "moses-malone": 3, "tim-duncan": 2,
    "stephen-curry": 2, "giannis-antetokounmpo": 2, "karl-malone": 2,
    "bob-pettit": 2, "steve-nash": 2, "nikola-jokic": 3,
    "kobe-bryant": 1, "kevin-durant": 1, "james-harden": 1,
    "allen-iverson": 1, "dirk-nowitzki": 1, "kevin-garnett": 1,
    "derrick-rose": 1, "russell-westbrook": 1, "joel-embiid": 1,
    "shaquille-oneal": 1, "hakeem-olajuwon": 1, "charles-barkley": 1,
    "david-robinson": 1, "bob-cousy": 1, "oscar-robertson": 1,
    "willis-reed": 1, "dave-cowens": 1, "julius-erving": 1,
    "shai-gilgeous-alexander": 1,
}

FMVP_WINNERS = {
    "michael-jordan": 6, "lebron-james": 4, "tim-duncan": 3,
    "shaquille-oneal": 3, "magic-johnson": 3, "kobe-bryant": 2,
    "kevin-durant": 2, "kawhi-leonard": 2, "larry-bird": 2,
    "hakeem-olajuwon": 2, "willis-reed": 2, "kareem-abdul-jabbar": 2,
    "giannis-antetokounmpo": 1, "nikola-jokic": 1, "jaylen-brown": 1,
    "stephen-curry": 1, "bill-russell": 1, "jerry-west": 1,
    "wilt-chamberlain": 1, "joe-dumars": 1, "isiah-thomas": 1,
    "james-worthy": 1, "julius-erving": 1, "moses-malone": 1,
    "cedric-maxwell": 1, "dennis-johnson": 1, "rick-barry": 1,
    "andre-iguodala": 1, "dwyane-wade": 1, "paul-pierce": 1,
    "tony-parker": 1, "dirk-nowitzki": 1, "chauncey-billups": 1,
}

RINGS_COUNT = {
    "bill-russell": 11, "sam-jones": 10, "tom-heinsohn": 8,
    "john-havlicek": 8, "k-c-jones": 8, "robert-horry": 7,
    "michael-jordan": 6, "scottie-pippen": 6, "kareem-abdul-jabbar": 6,
    "bob-cousy": 6, "tim-duncan": 5, "kobe-bryant": 5,
    "magic-johnson": 5, "larry-bird": 3, "lebron-james": 4,
    "shaquille-oneal": 4, "stephen-curry": 4, "dwyane-wade": 3,
    "tony-parker": 4, "manu-ginobili": 4, "kevin-durant": 2,
    "kawhi-leonard": 2, "giannis-antetokounmpo": 1, "nikola-jokic": 1,
    "hakeem-olajuwon": 2, "isiah-thomas": 2, "julius-erving": 1,
    "dirk-nowitzki": 1, "kevin-garnett": 1, "paul-pierce": 1,
    "charles-barkley": 0, "karl-malone": 0, "allen-iverson": 0,
    "james-harden": 0, "chris-paul": 0, "patrick-ewing": 0,
}


def inch_to_cm(feet, inches):
    """英尺英寸转厘米"""
    return round((feet * 12 + inches) * 2.54)


def lbs_to_kg(lbs):
    """磅转公斤"""
    return round(lbs * 0.4536)


def enrich_player_profiles():
    """为每个球员补充 profile 信息"""
    print("=" * 60)
    print("补充球员 Profile 信息")
    print("=" * 60)

    with open(PLAYERS_FILE, "r", encoding="utf-8") as f:
        players = json.load(f)

    print(f"  当前球员数: {len(players)}")

    # 找出缺少 profile 信息的球员
    needs_profile = []
    for p in players:
        if p.get("heightCm") is None and p.get("nbaId"):
            needs_profile.append(p)

    print(f"  需要补充 profile 的球员: {len(needs_profile)}")

    updated = 0
    failed = 0

    for i, player in enumerate(needs_profile):
        nba_id = player.get("nbaId")
        if not nba_id:
            continue

        name = player["nameEn"]
        progress = f"[{i+1}/{len(needs_profile)}]"
        print(f"  {progress} {name}...", end=" ", flush=True)

        try:
            info = commonplayerinfo.CommonPlayerInfo(player_id=nba_id)
            time.sleep(0.6)

            df = info.get_data_frames()[0]
            if len(df) == 0:
                print("⏭️ 无数据")
                failed += 1
                continue

            row = df.iloc[0]

            # 身高（格式: "6-6" 或 "6-11"）
            height_str = str(row.get("HEIGHT", ""))
            if "-" in height_str:
                parts = height_str.split("-")
                try:
                    player["heightCm"] = inch_to_cm(int(parts[0]), int(parts[1]))
                except:
                    player["heightCm"] = None
            else:
                player["heightCm"] = None

            # 体重
            weight = row.get("WEIGHT")
            if weight and str(weight).strip():
                try:
                    player["weightKg"] = lbs_to_kg(int(weight))
                except:
                    player["weightKg"] = None
            else:
                player["weightKg"] = None

            # 出生日期
            bday = row.get("BIRTHDATE")
            if bday and str(bday).strip() and str(bday) != "nan":
                # 格式通常是 "1984-12-30T00:00:00"
                player["birthDate"] = str(bday)[:10] if "T" in str(bday) else str(bday)[:10]
            else:
                player["birthDate"] = None

            # 国籍
            country = row.get("COUNTRY")
            player["country"] = str(country) if country and str(country) != "nan" else None

            # 选秀信息
            draft_year = row.get("DRAFT_YEAR")
            draft_round = row.get("DRAFT_ROUND")
            draft_pick = row.get("DRAFT_NUMBER")

            if draft_year and str(draft_year) not in ("Undrafted", "nan", ""):
                try:
                    player["draftYear"] = int(draft_year)
                except:
                    player["draftYear"] = None
            else:
                player["draftYear"] = None

            if draft_round and str(draft_round) not in ("Undrafted", "nan", ""):
                try:
                    player["draftRound"] = int(draft_round)
                except:
                    player["draftRound"] = None
            else:
                player["draftRound"] = None

            if draft_pick and str(draft_pick) not in ("Undrafted", "nan", ""):
                try:
                    player["draftPick"] = int(draft_pick)
                except:
                    player["draftPick"] = None
            else:
                player["draftPick"] = None

            # 球队
            team = row.get("TEAM_NAME")
            team_abbr = row.get("TEAM_ABBREVIATION")
            player["currentTeam"] = str(team_abbr) if team_abbr and str(team_abbr) != "nan" else None

            # 球衣号码
            jersey = row.get("JERSEY")
            player["jerseyNumber"] = str(jersey) if jersey and str(jersey) != "nan" else None

            # 生涯年份
            from_year = row.get("FROM_YEAR")
            to_year = row.get("TO_YEAR")
            try:
                player["fromYear"] = int(from_year) if from_year else None
            except:
                player["fromYear"] = None
            try:
                player["toYear"] = int(to_year) if to_year else None
            except:
                player["toYear"] = None

            # 位置（如果之前为空）
            pos = row.get("POSITION")
            if pos and str(pos) != "nan" and not player.get("position"):
                player["position"] = str(pos)

            updated += 1
            print(f"✅ {player.get('heightCm', '?')}cm {player.get('weightKg', '?')}kg {player.get('country', '?')}")

        except Exception as e:
            print(f"❌ {e}")
            failed += 1

        # 每 100 个保存一次
        if (i + 1) % 100 == 0:
            print(f"\n  💾 中间保存... ({updated} updated)")
            _save_players(players)
            print(f"  继续...\n")

    # 补充荣誉数据
    print("\n🏆 补充 MVP/FMVP/总冠军数据...")
    for p in players:
        pid = p["id"]
        if pid in MVP_WINNERS:
            p["career"]["mvp"] = MVP_WINNERS[pid]
        if pid in FMVP_WINNERS:
            p["career"]["fmvp"] = FMVP_WINNERS[pid]
        if pid in RINGS_COUNT:
            p["career"]["rings"] = RINGS_COUNT[pid]

    # 最终保存
    _save_players(players)

    print(f"\n{'=' * 60}")
    print(f"📊 Profile 补充完成:")
    print(f"  更新: {updated}")
    print(f"  失败: {failed}")
    print(f"  总球员数: {len(players)}")


def enrich_season_stats():
    """为赛季数据补充更多统计字段（stl, blk, tov, team 等）"""
    print("\n" + "=" * 60)
    print("补充赛季详细统计数据")
    print("=" * 60)

    with open(PLAYERS_FILE, "r", encoding="utf-8") as f:
        players = json.load(f)

    with open(SEASONS_FILE, "r", encoding="utf-8") as f:
        seasons = json.load(f)

    print(f"  当前赛季数据: {len(seasons)} 条")

    # 找出缺少 stl 字段的球员（说明这些赛季数据没有详细统计）
    player_ids_need_detail = set()
    for s in seasons:
        if s.get("stl") is None:
            player_ids_need_detail.add(s["playerId"])

    # 获取这些球员的 nbaId
    player_nba_ids = {}
    for p in players:
        if p["id"] in player_ids_need_detail and p.get("nbaId"):
            player_nba_ids[p["id"]] = p["nbaId"]

    print(f"  需要补充详细统计的球员: {len(player_nba_ids)}")

    # 创建赛季数据的查找表
    season_lookup = {}
    for idx, s in enumerate(seasons):
        key = f"{s['playerId']}|{s['season']}"
        season_lookup[key] = idx

    updated_players = 0
    updated_seasons = 0

    for i, (player_id, nba_id) in enumerate(player_nba_ids.items()):
        progress = f"[{i+1}/{len(player_nba_ids)}]"
        print(f"  {progress} {player_id}...", end=" ", flush=True)

        try:
            career = playercareerstats.PlayerCareerStats(
                player_id=nba_id,
                per_mode36="PerGame"
            )
            time.sleep(0.6)

            dfs = career.get_data_frames()
            if len(dfs) == 0:
                print("⏭️")
                continue

            season_df = dfs[0]
            count = 0

            for _, row in season_df.iterrows():
                season_str = row.get("SEASON_ID", "")
                team_abbr = row.get("TEAM_ABBREVIATION", "")

                key = f"{player_id}|{season_str}"
                if key not in season_lookup:
                    continue

                idx = season_lookup[key]
                seasons[idx]["stl"] = round(float(row.get("STL", 0)), 1)
                seasons[idx]["blk"] = round(float(row.get("BLK", 0)), 1)
                seasons[idx]["tov"] = round(float(row.get("TOV", 0)), 1)
                seasons[idx]["oreb"] = round(float(row.get("OREB", 0)), 1)
                seasons[idx]["dreb"] = round(float(row.get("DREB", 0)), 1)
                seasons[idx]["pf"] = round(float(row.get("PF", 0)), 1)
                seasons[idx]["ftPct"] = round(float(row.get("FT_PCT", 0)) * 100, 1)
                seasons[idx]["team"] = str(team_abbr) if team_abbr else None
                count += 1

            # 同时更新 career 中的 stl, blk, tov
            if len(dfs) > 1:
                career_df = dfs[1]
                if len(career_df) > 0:
                    crow = career_df.iloc[0]
                    # 找到对应的 player
                    for p in players:
                        if p["id"] == player_id:
                            p["career"]["stl"] = round(float(crow.get("STL", 0)), 1)
                            p["career"]["blk"] = round(float(crow.get("BLK", 0)), 1)
                            p["career"]["tov"] = round(float(crow.get("TOV", 0)), 1)
                            break

            updated_players += 1
            updated_seasons += count
            print(f"✅ {count} seasons")

        except Exception as e:
            print(f"❌ {e}")

        if (i + 1) % 100 == 0:
            print(f"\n  💾 中间保存...")
            _save_seasons(seasons)
            _save_players(players)
            print(f"  继续...\n")

    _save_seasons(seasons)
    _save_players(players)

    print(f"\n📊 赛季详细统计补充完成:")
    print(f"  更新球员: {updated_players}")
    print(f"  更新赛季条目: {updated_seasons}")


def _save_players(players):
    players_sorted = sorted(players, key=lambda x: x["id"])
    with open(PLAYERS_FILE, "w", encoding="utf-8") as f:
        json.dump(players_sorted, f, ensure_ascii=False, indent=2)
    print(f"  💾 保存 {len(players_sorted)} 名球员")


def _save_seasons(seasons):
    seasons_sorted = sorted(seasons, key=lambda x: (x["playerId"], x["season"]))
    with open(SEASONS_FILE, "w", encoding="utf-8") as f:
        json.dump(seasons_sorted, f, ensure_ascii=False, indent=2)
    print(f"  💾 保存 {len(seasons_sorted)} 条赛季数据")


if __name__ == "__main__":
    import sys
    if "--profiles" in sys.argv or len(sys.argv) == 1:
        enrich_player_profiles()
    if "--seasons" in sys.argv or len(sys.argv) == 1:
        enrich_season_stats()
