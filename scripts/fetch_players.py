#!/usr/bin/env python3
"""
NBA GOAT Simulator - 全量球员数据抓取脚本
使用 nba_api 从 NBA.com 官方 API 获取球员数据

支持两种模式:
  --mode full    : 抓取所有球员的完整数据（慢，首次运行/定时任务用）
  --mode quick   : 只抓取基本信息 + 已退役球星详细数据（快速）
  --mode update  : 增量更新，只更新现役球员和缺失数据的球员
"""

import json
import time
import sys
import os
import argparse
from nba_api.stats.endpoints import (
    playercareerstats,
    playerawards,
    commonplayerinfo,
    commonallplayers,
)
from nba_api.stats.static import players as nba_players


# NBA球队英文名到中文名的映射
TEAM_NAME_MAP = {
    "Chicago Bulls": "公牛",
    "Washington Wizards": "奇才",
    "Cleveland Cavaliers": "骑士",
    "Miami Heat": "热火",
    "Los Angeles Lakers": "湖人",
    "Milwaukee Bucks": "雄鹿",
    "San Antonio Spurs": "马刺",
    "Golden State Warriors": "勇士",
    "Boston Celtics": "凯尔特人",
    "Orlando Magic": "魔术",
    "Phoenix Suns": "太阳",
    "Philadelphia 76ers": "76人",
    "Houston Rockets": "火箭",
    "Toronto Raptors": "猛龙",
    "Oklahoma City Thunder": "雷霆",
    "Seattle SuperSonics": "超音速",
    "Brooklyn Nets": "篮网",
    "New Jersey Nets": "篮网",
    "Indiana Pacers": "步行者",
    "Denver Nuggets": "掘金",
    "Minnesota Timberwolves": "森林狼",
    "Portland Trail Blazers": "开拓者",
    "Sacramento Kings": "国王",
    "Detroit Pistons": "活塞",
    "Atlanta Hawks": "老鹰",
    "Charlotte Hornets": "黄蜂",
    "Charlotte Bobcats": "山猫",
    "Dallas Mavericks": "独行侠",
    "Memphis Grizzlies": "灰熊",
    "New Orleans Pelicans": "鹈鹕",
    "New York Knicks": "尼克斯",
    "Utah Jazz": "爵士",
    "Washington Bullets": "子弹",
    "San Francisco Warriors": "勇士",
    "Philadelphia Warriors": "勇士",
    "LA Clippers": "快船",
    "Los Angeles Clippers": "快船",
    "New Orleans Hornets": "黄蜂",
    "Vancouver Grizzlies": "灰熊",
    "Kansas City Kings": "国王",
    "Cincinnati Royals": "国王",
    "Baltimore Bullets": "子弹",
    "Buffalo Braves": "快船",
    "St. Louis Hawks": "老鹰",
    "Syracuse Nationals": "76人",
    "Fort Wayne Pistons": "活塞",
    "Rochester Royals": "国王",
    "Minneapolis Lakers": "湖人",
    "Tri-Cities Blackhawks": "老鹰",
}

ABBR_MAP = {
    "CHI": "公牛", "WAS": "奇才", "CLE": "骑士", "MIA": "热火",
    "LAL": "湖人", "MIL": "雄鹿", "SAS": "马刺", "GSW": "勇士",
    "BOS": "凯尔特人", "ORL": "魔术", "PHX": "太阳", "PHI": "76人",
    "HOU": "火箭", "TOR": "猛龙", "OKC": "雷霆", "SEA": "超音速",
    "BKN": "篮网", "NJN": "篮网", "IND": "步行者", "DEN": "掘金",
    "MIN": "森林狼", "POR": "开拓者", "SAC": "国王", "DET": "活塞",
    "ATL": "老鹰", "CHA": "黄蜂", "DAL": "独行侠", "MEM": "灰熊",
    "NOP": "鹈鹕", "NYK": "尼克斯", "UTA": "爵士", "WSB": "子弹",
    "SFW": "勇士", "PHW": "勇士", "LAC": "快船", "NOH": "鹈鹕",
    "NOK": "黄蜂", "VAN": "灰熊", "KCK": "国王", "CIN": "国王",
    "BAL": "子弹", "BUF": "快船", "SDC": "快船", "STL": "老鹰",
    "SYR": "76人", "FTW": "活塞", "ROC": "国王", "MNL": "湖人",
    "TRI": "老鹰", "CHH": "黄蜂",
    "TOT": None,  # 多队合计行，跳过
}

# 位置映射
POSITION_MAP = {
    "Guard": "G", "Guard-Forward": "G/F", "Forward-Guard": "F/G",
    "Forward": "F", "Forward-Center": "F/C", "Center-Forward": "C/F",
    "Center": "C", "": "",
}

# 手动补充的高级数据（得分王等 NBA API 不一定有的数据）
MANUAL_SUPPLEMENTS = {
    "Michael Jordan": {
        "position": "SG", "scoringTitle": 10, "assistTitle": 0, "reboundTitle": 0,
    },
    "LeBron James": {
        "position": "SF", "scoringTitle": 1, "assistTitle": 1, "reboundTitle": 0,
    },
    "Kobe Bryant": {
        "position": "SG", "scoringTitle": 2, "assistTitle": 0, "reboundTitle": 0,
    },
    "Kareem Abdul-Jabbar": {
        "position": "C", "scoringTitle": 2, "assistTitle": 0, "reboundTitle": 1,
    },
    "Magic Johnson": {
        "position": "PG", "scoringTitle": 0, "assistTitle": 4, "reboundTitle": 0,
    },
    "Larry Bird": {
        "position": "SF", "scoringTitle": 0, "assistTitle": 0, "reboundTitle": 0,
    },
    "Tim Duncan": {
        "position": "PF/C", "scoringTitle": 0, "assistTitle": 0, "reboundTitle": 0,
    },
    "Shaquille O'Neal": {
        "position": "C", "scoringTitle": 2, "assistTitle": 0, "reboundTitle": 0,
    },
    "Stephen Curry": {
        "position": "PG", "scoringTitle": 2, "assistTitle": 0, "reboundTitle": 0,
    },
    "Kevin Durant": {
        "position": "SF", "scoringTitle": 4, "assistTitle": 0, "reboundTitle": 0,
    },
    "Dwyane Wade": {
        "position": "SG", "scoringTitle": 1, "assistTitle": 0, "reboundTitle": 0,
    },
    "Giannis Antetokounmpo": {
        "position": "PF", "scoringTitle": 0, "assistTitle": 0, "reboundTitle": 0,
    },
    "Hakeem Olajuwon": {
        "position": "C", "scoringTitle": 0, "assistTitle": 0, "reboundTitle": 0,
    },
    "Allen Iverson": {
        "position": "SG", "scoringTitle": 4, "assistTitle": 0, "reboundTitle": 0,
    },
    "James Harden": {
        "position": "SG", "scoringTitle": 3, "assistTitle": 1, "reboundTitle": 0,
    },
    "Russell Westbrook": {
        "position": "PG", "scoringTitle": 2, "assistTitle": 3, "reboundTitle": 0,
    },
    "Wilt Chamberlain": {
        "position": "C", "scoringTitle": 7, "assistTitle": 1, "reboundTitle": 11,
        "fallback": {
            "gamesPlayed": 1045, "ppg": 30.1, "rpg": 22.9, "apg": 4.4,
            "spg": 0.0, "bpg": 0.0, "fgPct": 54.0, "totalPoints": 31419,
            "playoffPPG": 22.5, "playoffRPG": 24.5, "playoffAPG": 4.2,
            "playoffWins": 49, "playoffLosses": 36,
            "peakPPG": 50.4, "peakSeason": "1961-62",
            "championships": 2, "mvp": 4, "fmvp": 1, "allStar": 13,
            "allNBA1st": 7, "allNBA2nd": 3, "allNBA3rd": 0,
            "allDefense": 2, "dpoy": 0, "allStarMVP": 1, "roy": 1,
            "era": "1959-1973", "teams": ["勇士", "76人", "湖人"],
        },
    },
    "Bill Russell": {
        "position": "C", "scoringTitle": 0, "assistTitle": 0, "reboundTitle": 4,
        "fallback": {
            "gamesPlayed": 963, "ppg": 15.1, "rpg": 22.5, "apg": 4.3,
            "spg": 0.0, "bpg": 0.0, "fgPct": 44.0, "totalPoints": 14522,
            "playoffPPG": 16.2, "playoffRPG": 24.9, "playoffAPG": 4.7,
            "playoffWins": 108, "playoffLosses": 37,
            "peakPPG": 18.9, "peakSeason": "1961-62",
            "championships": 11, "mvp": 5, "fmvp": 0, "allStar": 12,
            "allNBA1st": 3, "allNBA2nd": 8, "allNBA3rd": 0,
            "allDefense": 1, "dpoy": 0, "allStarMVP": 1, "roy": 0,
            "era": "1956-1969", "teams": ["凯尔特人"],
        },
    },
}


def team_abbr_to_chinese(abbr):
    """将球队缩写转换为中文名"""
    return ABBR_MAP.get(abbr, abbr)


def get_all_nba_players():
    """获取所有 NBA 历史球员基础列表"""
    print("正在获取全部 NBA 球员列表...")
    all_p = nba_players.get_players()
    print(f"  共找到 {len(all_p)} 名球员")
    return all_p


def get_career_stats(player_id):
    """获取球员生涯常规赛和季后赛数据"""
    try:
        career = playercareerstats.PlayerCareerStats(player_id=player_id)
        time.sleep(0.6)

        data = career.get_dict()
        result_sets = data["resultSets"]

        regular_season = None
        playoff = None
        season_totals = None
        playoff_totals = None

        for rs in result_sets:
            if rs["name"] == "CareerTotalsRegularSeason":
                if rs["rowSet"]:
                    headers = rs["headers"]
                    row = rs["rowSet"][0]
                    regular_season = dict(zip(headers, row))
            elif rs["name"] == "CareerTotalsPostSeason":
                if rs["rowSet"]:
                    headers = rs["headers"]
                    row = rs["rowSet"][0]
                    playoff = dict(zip(headers, row))
            elif rs["name"] == "SeasonTotalsRegularSeason":
                if rs["rowSet"]:
                    headers = rs["headers"]
                    season_totals = [dict(zip(headers, r)) for r in rs["rowSet"]]
            elif rs["name"] == "SeasonTotalsPostSeason":
                if rs["rowSet"]:
                    headers = rs["headers"]
                    playoff_totals = [dict(zip(headers, r)) for r in rs["rowSet"]]

        return regular_season, playoff, season_totals, playoff_totals

    except Exception as e:
        print(f"  获取生涯数据失败: {e}")
        return None, None, None, None


def get_player_awards(player_id):
    """获取球员荣誉奖项"""
    try:
        awards = playerawards.PlayerAwards(player_id=player_id)
        time.sleep(0.6)

        data = awards.get_dict()
        result = {
            "championships": 0, "mvp": 0, "fmvp": 0, "allStar": 0,
            "allNBA1st": 0, "allNBA2nd": 0, "allNBA3rd": 0,
            "allDefense": 0, "dpoy": 0, "scoringTitle": 0,
            "assistTitle": 0, "reboundTitle": 0, "allStarMVP": 0, "roy": 0,
        }

        for rs in data["resultSets"]:
            if rs["name"] == "PlayerAwards":
                headers = rs["headers"]
                for row in rs["rowSet"]:
                    award = dict(zip(headers, row))
                    desc = award.get("DESCRIPTION", "")

                    if "NBA Champion" in desc:
                        result["championships"] += 1
                    elif desc == "NBA Most Valuable Player":
                        result["mvp"] += 1
                    elif "Finals Most Valuable Player" in desc or "Finals MVP" in desc:
                        result["fmvp"] += 1
                    elif desc == "NBA All-Star":
                        result["allStar"] += 1
                    elif desc == "All-NBA" and award.get("SUBTYPE1") == "First Team":
                        result["allNBA1st"] += 1
                    elif desc == "All-NBA" and award.get("SUBTYPE1") == "Second Team":
                        result["allNBA2nd"] += 1
                    elif desc == "All-NBA" and award.get("SUBTYPE1") == "Third Team":
                        result["allNBA3rd"] += 1
                    elif "All-Defensive" in desc:
                        result["allDefense"] += 1
                    elif "Defensive Player of the Year" in desc:
                        result["dpoy"] += 1
                    elif "Rookie of the Year" in desc:
                        result["roy"] += 1
                    elif desc == "NBA All-Star Most Valuable Player":
                        result["allStarMVP"] += 1

        return result

    except Exception as e:
        print(f"  获取荣誉数据失败: {e}")
        return None


def get_teams_from_seasons(season_data):
    """从赛季数据中提取球队历史"""
    if not season_data:
        return []
    teams_ordered = []
    seen = set()
    for season in season_data:
        team_abbr = season.get("TEAM_ABBREVIATION", "")
        if team_abbr and team_abbr not in seen:
            seen.add(team_abbr)
            teams_ordered.append(team_abbr)
    return teams_ordered


def get_era_from_seasons(season_data, is_active=False):
    """从赛季数据中推断生涯年份"""
    if not season_data:
        return ""
    first_season = season_data[0].get("SEASON_ID", "")
    last_season = season_data[-1].get("SEASON_ID", "")
    start_year = first_season.split("-")[0] if first_season else ""
    if is_active:
        return f"{start_year}-至今"
    else:
        end_parts = last_season.split("-")
        if len(end_parts) == 2:
            end_year = int(end_parts[0]) + 1
            return f"{start_year}-{end_year}"
        return f"{start_year}-"


def find_peak_season(season_data):
    """找到巅峰赛季（场均得分最高的赛季，最少出场 50 场）"""
    if not season_data:
        return 0.0, ""
    best_ppg = 0.0
    best_season = ""

    for threshold in [50, 30, 10, 1]:
        for season in season_data:
            gp = season.get("GP", 0)
            pts = season.get("PTS", 0)
            if gp and gp >= threshold:
                ppg = pts / gp
                if ppg > best_ppg:
                    best_ppg = round(ppg, 1)
                    best_season = season.get("SEASON_ID", "")
        if best_ppg > 0:
            break

    return best_ppg, best_season


def calculate_playoff_record(playoff_season_data):
    """计算季后赛胜负场次"""
    if not playoff_season_data:
        return 0, 0
    total_wins = 0
    total_losses = 0
    for season in playoff_season_data:
        w = season.get("W", 0) or 0
        l = season.get("L", 0) or 0
        total_wins += w
        total_losses += l
    return total_wins, total_losses


def fetch_player_full_data(nba_id, name_en, is_active=False):
    """获取单个球员的完整详细数据"""
    supplement = MANUAL_SUPPLEMENTS.get(name_en, {})

    # 检查是否有回退数据（历史球员 API 可能没有数据）
    fallback = supplement.get("fallback")

    # 获取生涯数据
    regular, playoff, season_data, playoff_season_data = get_career_stats(nba_id)

    if not regular:
        if fallback:
            return fallback, supplement
        return None, supplement

    # 获取荣誉数据
    awards = get_player_awards(nba_id)
    if not awards:
        awards = {
            "championships": 0, "mvp": 0, "fmvp": 0, "allStar": 0,
            "allNBA1st": 0, "allNBA2nd": 0, "allNBA3rd": 0,
            "allDefense": 0, "dpoy": 0, "scoringTitle": 0,
            "assistTitle": 0, "reboundTitle": 0, "allStarMVP": 0, "roy": 0,
        }

    # 补充手动数据
    for key in ["scoringTitle", "assistTitle", "reboundTitle"]:
        if key in supplement:
            awards[key] = supplement[key]

    # 使用回退数据中的荣誉覆盖
    if fallback:
        for key in ["championships", "mvp", "fmvp", "allStar", "allNBA1st",
                     "allNBA2nd", "allNBA3rd", "allDefense", "dpoy", "allStarMVP", "roy"]:
            if key in fallback:
                awards[key] = fallback[key]

    # 解析常规赛数据
    gp = regular.get("GP", 0) or 0
    pts = regular.get("PTS", 0) or 0
    reb = regular.get("REB", 0) or 0
    ast = regular.get("AST", 0) or 0
    stl = regular.get("STL", 0) or 0
    blk = regular.get("BLK", 0) or 0
    fgm = regular.get("FGM", 0) or 0
    fga = regular.get("FGA", 0) or 0

    ppg = round(pts / gp, 1) if gp > 0 else 0
    rpg = round(reb / gp, 1) if gp > 0 else 0
    apg = round(ast / gp, 1) if gp > 0 else 0
    spg = round(stl / gp, 1) if gp > 0 else 0
    bpg = round(blk / gp, 1) if gp > 0 else 0
    fg_pct = round(fgm / fga * 100, 1) if fga > 0 else 0

    # 季后赛数据
    if playoff:
        p_gp = playoff.get("GP", 0) or 0
        p_pts = playoff.get("PTS", 0) or 0
        p_reb = playoff.get("REB", 0) or 0
        p_ast = playoff.get("AST", 0) or 0
        playoff_ppg = round(p_pts / p_gp, 1) if p_gp > 0 else 0
        playoff_rpg = round(p_reb / p_gp, 1) if p_gp > 0 else 0
        playoff_apg = round(p_ast / p_gp, 1) if p_gp > 0 else 0
    else:
        playoff_ppg = playoff_rpg = playoff_apg = 0

    playoff_wins, playoff_losses = calculate_playoff_record(playoff_season_data)
    peak_ppg, peak_season = find_peak_season(season_data)

    # 球队和年代
    team_abbrs = get_teams_from_seasons(season_data)
    teams = []
    for abbr in team_abbrs:
        cn = team_abbr_to_chinese(abbr)
        if cn and cn not in teams:
            teams.append(cn)

    if not teams and fallback and "teams" in fallback:
        teams = fallback["teams"]

    era = get_era_from_seasons(season_data, is_active)
    if not era and fallback and "era" in fallback:
        era = fallback["era"]

    if peak_ppg == 0 and fallback and "peakPPG" in fallback:
        peak_ppg = fallback["peakPPG"]
        peak_season = fallback.get("peakSeason", "")

    stats = {
        "gamesPlayed": gp, "ppg": ppg, "rpg": rpg, "apg": apg,
        "spg": spg, "bpg": bpg, "fgPct": fg_pct, "totalPoints": pts,
        "playoffPPG": playoff_ppg, "playoffRPG": playoff_rpg,
        "playoffAPG": playoff_apg, "playoffWins": playoff_wins,
        "playoffLosses": playoff_losses, "peakPPG": peak_ppg,
        "peakSeason": peak_season, "era": era, "teams": teams,
        **awards,
    }

    return stats, supplement


def build_player_record(idx, nba_player_info, detailed_stats=None, supplement=None):
    """构建球员数据记录"""
    name_en = nba_player_info.get("full_name", "")
    is_active = nba_player_info.get("is_active", False)

    # 基本信息
    record = {
        "id": idx,
        "nbaId": nba_player_info.get("id", 0),
        "name": name_en,  # 默认用英文名，后续可以补充中文翻译
        "nameEn": name_en,
        "position": "",
        "era": "",
        "teams": [],
        "avatar": "🏀",  # 默认 emoji
        "isActive": is_active,
        # 荣誉默认值
        "championships": 0, "mvp": 0, "fmvp": 0, "allStar": 0,
        "allNBA1st": 0, "allNBA2nd": 0, "allNBA3rd": 0,
        "allDefense": 0, "dpoy": 0, "scoringTitle": 0,
        "assistTitle": 0, "reboundTitle": 0, "allStarMVP": 0, "roy": 0,
        # 数据默认值
        "gamesPlayed": 0, "ppg": 0, "rpg": 0, "apg": 0,
        "spg": 0, "bpg": 0, "fgPct": 0, "totalPoints": 0,
        "playoffPPG": 0, "playoffRPG": 0, "playoffAPG": 0,
        "playoffWins": 0, "playoffLosses": 0,
        "peakPPG": 0, "peakSeason": "",
        "hasDetailedStats": False,
    }

    if supplement and "position" in supplement:
        record["position"] = supplement["position"]

    # 如果有详细数据，合并
    if detailed_stats:
        record.update(detailed_stats)
        record["hasDetailedStats"] = True

    return record


# 知名球员英文名 -> emoji 映射
PLAYER_EMOJI_MAP = {
    "Michael Jordan": "🐐", "LeBron James": "👑", "Kobe Bryant": "🐍",
    "Kareem Abdul-Jabbar": "🪝", "Magic Johnson": "🪄", "Larry Bird": "🐦",
    "Tim Duncan": "🏔️", "Shaquille O'Neal": "🦸", "Stephen Curry": "🎯",
    "Bill Russell": "🏆", "Wilt Chamberlain": "💯", "Hakeem Olajuwon": "🌙",
    "Kevin Durant": "🔥", "Dwyane Wade": "⚡", "Giannis Antetokounmpo": "🦌",
    "Allen Iverson": "💎", "Dirk Nowitzki": "🇩🇪", "Kevin Garnett": "🐺",
    "Charles Barkley": "🔵", "Karl Malone": "📬", "John Stockton": "🎩",
    "Scottie Pippen": "🦅", "David Robinson": "⚓", "Oscar Robertson": "👔",
    "Jerry West": "🏅", "Julius Erving": "🎭", "Moses Malone": "💪",
    "Isiah Thomas": "🤴", "Patrick Ewing": "🗽", "Clyde Drexler": "✈️",
    "Gary Payton": "🧤", "Ray Allen": "🎬", "Reggie Miller": "🎪",
    "Kawhi Leonard": "🤖", "Anthony Davis": "🔨", "Nikola Jokic": "🃏",
    "Luka Doncic": "🧙", "Joel Embiid": "👊", "Jayson Tatum": "☘️",
    "Damian Lillard": "⌚", "Jimmy Butler": "☕", "Paul George": "⛵",
    "James Harden": "🧔", "Russell Westbrook": "⛈️", "Chris Paul": "🎓",
    "Carmelo Anthony": "🍯", "Vince Carter": "🦅", "Tracy McGrady": "🌟",
    "Paul Pierce": "🍀", "Jason Kidd": "🎯", "Steve Nash": "🇨🇦",
    "Dwight Howard": "💨", "Tony Parker": "🇫🇷", "Manu Ginobili": "🇦🇷",
    "Dennis Rodman": "🐛", "Ben Wallace": "💈", "Yao Ming": "🇨🇳",
    "Pau Gasol": "🇪🇸", "Draymond Green": "📢", "Klay Thompson": "🌊",
    "Kyrie Irving": "🌐", "Zion Williamson": "💥", "Ja Morant": "🦁",
    "Shai Gilgeous-Alexander": "🦊", "Victor Wembanyama": "🗼",
    "Trae Young": "❄️", "Devin Booker": "📚", "Karl-Anthony Towns": "🏘️",
}

# 知名球员英文名 -> 中文名映射
PLAYER_CN_MAP = {
    "Michael Jordan": "迈克尔·乔丹", "LeBron James": "勒布朗·詹姆斯",
    "Kobe Bryant": "科比·布莱恩特", "Kareem Abdul-Jabbar": "卡里姆·贾巴尔",
    "Magic Johnson": "魔术师约翰逊", "Larry Bird": "拉里·伯德",
    "Tim Duncan": "蒂姆·邓肯", "Shaquille O'Neal": "沙奎尔·奥尼尔",
    "Stephen Curry": "斯蒂芬·库里", "Bill Russell": "比尔·拉塞尔",
    "Wilt Chamberlain": "威尔特·张伯伦", "Hakeem Olajuwon": "哈基姆·奥拉朱旺",
    "Kevin Durant": "凯文·杜兰特", "Dwyane Wade": "德怀恩·韦德",
    "Giannis Antetokounmpo": "扬尼斯·字母哥", "Allen Iverson": "阿伦·艾弗森",
    "Dirk Nowitzki": "德克·诺维茨基", "Kevin Garnett": "凯文·加内特",
    "Charles Barkley": "查尔斯·巴克利", "Karl Malone": "卡尔·马龙",
    "John Stockton": "约翰·斯托克顿", "Scottie Pippen": "斯科蒂·皮蓬",
    "David Robinson": "大卫·罗宾逊", "Oscar Robertson": "奥斯卡·罗伯特森",
    "Jerry West": "杰里·韦斯特", "Julius Erving": "朱利叶斯·欧文",
    "Moses Malone": "摩西·马龙", "Isiah Thomas": "以赛亚·托马斯",
    "Patrick Ewing": "帕特里克·尤因", "Clyde Drexler": "克莱德·德雷克斯勒",
    "Gary Payton": "加里·佩顿", "Ray Allen": "雷·阿伦",
    "Reggie Miller": "雷吉·米勒", "Kawhi Leonard": "科怀·伦纳德",
    "Anthony Davis": "安东尼·戴维斯", "Nikola Jokic": "尼古拉·约基奇",
    "Luka Doncic": "卢卡·东契奇", "Joel Embiid": "乔尔·恩比德",
    "Jayson Tatum": "杰森·塔图姆", "Damian Lillard": "达米安·利拉德",
    "Jimmy Butler": "吉米·巴特勒", "Paul George": "保罗·乔治",
    "James Harden": "詹姆斯·哈登", "Russell Westbrook": "拉塞尔·威斯布鲁克",
    "Chris Paul": "克里斯·保罗", "Carmelo Anthony": "卡梅罗·安东尼",
    "Vince Carter": "文斯·卡特", "Tracy McGrady": "特雷西·麦格雷迪",
    "Paul Pierce": "保罗·皮尔斯", "Jason Kidd": "贾森·基德",
    "Steve Nash": "史蒂夫·纳什", "Dwight Howard": "德怀特·霍华德",
    "Tony Parker": "托尼·帕克", "Manu Ginobili": "马努·吉诺比利",
    "Dennis Rodman": "丹尼斯·罗德曼", "Ben Wallace": "本·华莱士",
    "Yao Ming": "姚明", "Pau Gasol": "保罗·加索尔",
    "Draymond Green": "德雷蒙德·格林", "Klay Thompson": "克莱·汤普森",
    "Kyrie Irving": "凯里·欧文", "Zion Williamson": "锡安·威廉森",
    "Ja Morant": "贾·莫兰特", "Shai Gilgeous-Alexander": "谢·吉尔杰斯-亚历山大",
    "Victor Wembanyama": "维克托·文班亚马", "Trae Young": "特雷·杨",
    "Devin Booker": "德文·布克", "Karl-Anthony Towns": "卡尔-安东尼·唐斯",
}


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="NBA GOAT Simulator - 全量球员数据抓取")
    parser.add_argument("--output", "-o", type=str, default=None,
                        help="指定 JSON 输出路径")
    parser.add_argument("--mode", "-m", type=str, default="full",
                        choices=["full", "quick", "update"],
                        help="抓取模式: full=全量, quick=基本信息+核心球星, update=增量更新")
    parser.add_argument("--limit", "-l", type=int, default=0,
                        help="限制抓取球员数量（调试用，0=不限制）")
    args = parser.parse_args()

    print("=" * 60)
    print("NBA GOAT Simulator - 全量球员数据抓取")
    print(f"模式: {args.mode}")
    print("=" * 60)

    # 1. 获取全部 NBA 球员列表
    all_nba_players = get_all_nba_players()

    if args.limit > 0:
        all_nba_players = all_nba_players[:args.limit]
        print(f"限制抓取前 {args.limit} 名球员")

    # 2. 加载已有数据（用于增量更新）
    existing_data = {}
    if args.mode == "update" and args.output and os.path.exists(args.output):
        try:
            with open(args.output, "r", encoding="utf-8") as f:
                existing_list = json.load(f)
                for p in existing_list:
                    existing_data[p.get("nbaId", 0)] = p
            print(f"  已加载 {len(existing_data)} 条已有数据")
        except Exception as e:
            print(f"  加载已有数据失败: {e}")

    # 3. 确定哪些球员需要抓取详细数据
    # "核心球星" = MANUAL_SUPPLEMENTS 中有的 + 全明星球员等
    core_player_names = set(MANUAL_SUPPLEMENTS.keys())

    all_players = []
    failed = []
    total = len(all_nba_players)

    for idx, nba_p in enumerate(all_nba_players, 1):
        nba_id = nba_p["id"]
        name_en = nba_p["full_name"]
        is_active = nba_p.get("is_active", False)

        # 进度显示
        if idx % 100 == 0 or idx == total:
            print(f"\n进度: {idx}/{total} ({idx*100//total}%)")

        # 增量更新模式: 如果已有详细数据且是退役球员，跳过
        if args.mode == "update" and nba_id in existing_data:
            existing = existing_data[nba_id]
            if existing.get("hasDetailedStats") and not is_active:
                existing["id"] = idx  # 更新序号
                all_players.append(existing)
                continue

        # 判断是否需要抓详细数据
        need_detailed = False
        if args.mode == "full":
            need_detailed = True
        elif args.mode == "quick":
            # quick 模式只抓核心球星的详细数据
            need_detailed = name_en in core_player_names
        elif args.mode == "update":
            # update 模式抓现役球员和之前没数据的
            need_detailed = is_active or nba_id not in existing_data

        supplement = MANUAL_SUPPLEMENTS.get(name_en, {})

        if need_detailed:
            try:
                # 检查是否有纯回退数据的球员（没有 NBA API 数据）
                fallback = supplement.get("fallback")

                # 先尝试通过 nba_id 抓取
                stats, supp = fetch_player_full_data(nba_id, name_en, is_active)

                if stats:
                    record = build_player_record(idx, nba_p, stats, supp)
                else:
                    record = build_player_record(idx, nba_p, supplement=supplement)
                    if not fallback:
                        failed.append(name_en)

            except Exception as e:
                print(f"  ❌ {name_en} 获取异常: {e}")
                record = build_player_record(idx, nba_p, supplement=supplement)
                failed.append(name_en)

            time.sleep(0.3)  # 请求间隔
        else:
            # 只保存基本信息
            record = build_player_record(idx, nba_p, supplement=supplement)

        # 补充中文名和 emoji
        if name_en in PLAYER_CN_MAP:
            record["name"] = PLAYER_CN_MAP[name_en]
        if name_en in PLAYER_EMOJI_MAP:
            record["avatar"] = PLAYER_EMOJI_MAP[name_en]

        all_players.append(record)

    print(f"\n{'='*60}")
    print(f"抓取完成!")
    print(f"总球员数: {len(all_players)}")
    print(f"详细数据: {sum(1 for p in all_players if p.get('hasDetailedStats'))}")
    if failed:
        print(f"失败 ({len(failed)}): {', '.join(failed[:20])}")
        if len(failed) > 20:
            print(f"  ... 及其他 {len(failed) - 20} 名")
    print(f"{'='*60}")

    # 保存到 JSON 文件
    if args.output:
        output_path = args.output
        os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else ".", exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(all_players, f, ensure_ascii=False, indent=2)
        print(f"\n数据已保存到: {output_path}")
        print(f"文件大小: {os.path.getsize(output_path)} bytes")
    else:
        # 默认路径
        output_path = "backend/data/players.json"
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(all_players, f, ensure_ascii=False, indent=2)
        print(f"\n数据已保存到: {output_path}")
        print(f"文件大小: {os.path.getsize(output_path)} bytes")

        # 前端副本
        frontend_path = "src/data/players.json"
        os.makedirs(os.path.dirname(frontend_path), exist_ok=True)
        with open(frontend_path, "w", encoding="utf-8") as f:
            json.dump(all_players, f, ensure_ascii=False, indent=2)
        print(f"前端数据已保存到: {frontend_path}")

    return 0 if not failed else 1


if __name__ == "__main__":
    sys.exit(main())
