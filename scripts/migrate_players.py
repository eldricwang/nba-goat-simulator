#!/usr/bin/env python3
"""
Migrate players.json from old format to new WEEK1 format.
- Renames fields: ppg->pts, rpg->reb, apg->ast, gamesPlayed->gp, name->nameZh
- Generates slug IDs: "michael-jordan"
- Adds missing fields: tpPct, tsPct, mp (hardcoded from known NBA career stats)
- Percentage format: 0-100 (e.g. 55.2 means 55.2%)
"""
import json
import re
import sys

# Known career stats for tpPct (3P%), tsPct (TS%), mp (MPG) - sourced from Basketball Reference
# For players where data is unavailable (pre-3pt era), use None
EXTRA_STATS = {
    "Michael Jordan":       {"tpPct": 32.7, "tsPct": 56.9, "mp": 38.3},
    "LeBron James":         {"tpPct": 34.6, "tsPct": 58.6, "mp": 38.2},
    "Kobe Bryant":          {"tpPct": 32.9, "tsPct": 55.0, "mp": 36.1},
    "Kareem Abdul-Jabbar":  {"tpPct": 5.6,  "tsPct": 55.9, "mp": 36.8},
    "Magic Johnson":        {"tpPct": 30.3, "tsPct": 61.0, "mp": 36.7},
    "Larry Bird":           {"tpPct": 37.6, "tsPct": 56.4, "mp": 38.4},
    "Tim Duncan":           {"tpPct": 17.4, "tsPct": 55.1, "mp": 34.0},
    "Shaquille O'Neal":     {"tpPct": 4.5,  "tsPct": 58.5, "mp": 36.2},
    "Stephen Curry":        {"tpPct": 42.6, "tsPct": 62.4, "mp": 34.3},
    "Bill Russell":         {"tpPct": None,  "tsPct": 48.4, "mp": 42.3},
    "Wilt Chamberlain":     {"tpPct": None,  "tsPct": 54.0, "mp": 45.8},
    "Hakeem Olajuwon":      {"tpPct": 20.2, "tsPct": 55.3, "mp": 35.7},
    "Kevin Durant":         {"tpPct": 38.5, "tsPct": 61.4, "mp": 36.7},
    "Dwyane Wade":          {"tpPct": 29.3, "tsPct": 55.5, "mp": 33.9},
    "Giannis Antetokounmpo":{"tpPct": 28.6, "tsPct": 59.8, "mp": 33.7},
    "Allen Iverson":        {"tpPct": 31.3, "tsPct": 51.8, "mp": 41.1},
    "Dirk Nowitzki":        {"tpPct": 38.0, "tsPct": 57.7, "mp": 33.7},
    "Kevin Garnett":        {"tpPct": 27.5, "tsPct": 54.6, "mp": 34.5},
    "Charles Barkley":      {"tpPct": 26.6, "tsPct": 61.6, "mp": 36.7},
    "Karl Malone":          {"tpPct": 27.4, "tsPct": 57.7, "mp": 37.2},
    "John Stockton":        {"tpPct": 38.4, "tsPct": 60.8, "mp": 31.8},
    "Scottie Pippen":       {"tpPct": 32.6, "tsPct": 53.2, "mp": 34.9},
    "David Robinson":       {"tpPct": 25.0, "tsPct": 58.1, "mp": 34.7},
    "Oscar Robertson":      {"tpPct": None,  "tsPct": 55.8, "mp": 42.2},
    "Jerry West":           {"tpPct": None,  "tsPct": 55.0, "mp": 36.6},
    "Nikola Jokic":         {"tpPct": 33.7, "tsPct": 63.5, "mp": 33.2},
    "Luka Doncic":          {"tpPct": 34.4, "tsPct": 57.8, "mp": 35.1},
    "Joel Embiid":          {"tpPct": 33.0, "tsPct": 59.4, "mp": 31.5},
    "James Harden":         {"tpPct": 36.4, "tsPct": 60.9, "mp": 35.6},
    "Russell Westbrook":    {"tpPct": 30.5, "tsPct": 52.9, "mp": 34.4},
    "Chris Paul":           {"tpPct": 36.9, "tsPct": 58.0, "mp": 33.4},
    "Isiah Thomas":         {"tpPct": 29.0, "tsPct": 51.6, "mp": 35.6},
    "Julius Erving":        {"tpPct": 22.0, "tsPct": 55.3, "mp": 36.0},
    "Moses Malone":         {"tpPct": 10.0, "tsPct": 54.0, "mp": 33.9},
    "Kawhi Leonard":        {"tpPct": 38.4, "tsPct": 58.5, "mp": 32.5},
    "Carmelo Anthony":      {"tpPct": 35.5, "tsPct": 54.3, "mp": 34.5},
    "Anthony Davis":        {"tpPct": 30.0, "tsPct": 58.3, "mp": 33.8},
    "Jayson Tatum":         {"tpPct": 37.0, "tsPct": 57.5, "mp": 35.8},
    "Vince Carter":         {"tpPct": 37.1, "tsPct": 54.1, "mp": 30.0},
    "Tracy McGrady":        {"tpPct": 33.8, "tsPct": 53.0, "mp": 34.7},
    "Damian Lillard":       {"tpPct": 37.1, "tsPct": 59.0, "mp": 35.3},
    "Patrick Ewing":        {"tpPct": 15.2, "tsPct": 54.0, "mp": 34.3},
    "Dwight Howard":        {"tpPct": 11.4, "tsPct": 59.1, "mp": 30.6},
    "Shai Gilgeous-Alexander": {"tpPct": 34.5, "tsPct": 59.8, "mp": 34.5},
    "Victor Wembanyama":    {"tpPct": 32.5, "tsPct": 57.0, "mp": 30.5},
    "Kyrie Irving":         {"tpPct": 39.2, "tsPct": 57.2, "mp": 33.5},
    "Yao Ming":             {"tpPct": 20.0, "tsPct": 55.2, "mp": 32.5},
    "Steve Nash":           {"tpPct": 42.8, "tsPct": 60.5, "mp": 31.3},
    "Dennis Rodman":        {"tpPct": 23.1, "tsPct": 52.4, "mp": 31.7},
    "Klay Thompson":        {"tpPct": 41.3, "tsPct": 56.2, "mp": 33.5},
    "Draymond Green":       {"tpPct": 31.5, "tsPct": 53.0, "mp": 31.5},
    "Tony Parker":          {"tpPct": 31.8, "tsPct": 55.0, "mp": 30.5},
    "Manu Ginobili":        {"tpPct": 36.9, "tsPct": 57.6, "mp": 25.4},
    "Pau Gasol":            {"tpPct": 26.8, "tsPct": 55.5, "mp": 31.4},
    "Ray Allen":            {"tpPct": 40.0, "tsPct": 57.6, "mp": 35.0},
    "Paul Pierce":          {"tpPct": 36.8, "tsPct": 56.5, "mp": 33.8},
    "Jason Kidd":           {"tpPct": 34.9, "tsPct": 51.2, "mp": 36.1},
    "Jimmy Butler":         {"tpPct": 32.3, "tsPct": 57.8, "mp": 33.2},
    "Paul George":          {"tpPct": 38.0, "tsPct": 57.3, "mp": 33.5},
    "Trae Young":           {"tpPct": 35.3, "tsPct": 58.0, "mp": 34.7},
    "Devin Booker":         {"tpPct": 35.5, "tsPct": 56.8, "mp": 34.2},
    "Ja Morant":            {"tpPct": 31.5, "tsPct": 54.5, "mp": 32.2},
    "Clyde Drexler":        {"tpPct": 31.8, "tsPct": 54.7, "mp": 35.5},
    "Gary Payton":          {"tpPct": 31.7, "tsPct": 52.2, "mp": 36.2},
    "Reggie Miller":        {"tpPct": 39.5, "tsPct": 61.4, "mp": 34.3},
    "Ben Wallace":          {"tpPct": 13.0, "tsPct": 48.0, "mp": 30.0},
}


def to_slug(name_en: str) -> str:
    """Convert English name to URL slug. e.g. 'LeBron James' -> 'lebron-james'"""
    slug = name_en.lower().strip()
    slug = slug.replace("'", "")   # O'Neal -> oneal
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = slug.strip("-")
    return slug


def migrate_player(old: dict) -> dict:
    name_en = old["nameEn"]
    slug = to_slug(name_en)
    extra = EXTRA_STATS.get(name_en, {})

    tp_pct = extra.get("tpPct")
    ts_pct = extra.get("tsPct")
    mp = extra.get("mp")

    player = {
        "id": slug,
        "nameZh": old["name"],
        "nameEn": name_en,
        "position": old.get("position", ""),
        "active": old.get("isActive", False),
        "career": {
            "gp": old.get("gamesPlayed", 0),
            "mp": round(mp, 1) if mp is not None else 0.0,
            "pts": old.get("ppg", 0.0),
            "reb": old.get("rpg", 0.0),
            "ast": old.get("apg", 0.0),
            "fgPct": old.get("fgPct", 0.0),
            "tpPct": round(tp_pct, 1) if tp_pct is not None else None,
            "tsPct": round(ts_pct, 1) if ts_pct is not None else None,
            "mvp": old.get("mvp", 0),
            "fmvp": old.get("fmvp", 0),
        },
    }

    return player


def main():
    input_path = "backend/data/players.json"
    output_path = "next-app/data/players.json"

    if len(sys.argv) > 1:
        input_path = sys.argv[1]
    if len(sys.argv) > 2:
        output_path = sys.argv[2]

    with open(input_path, "r", encoding="utf-8") as f:
        old_players = json.load(f)

    new_players = [migrate_player(p) for p in old_players]

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(new_players, f, ensure_ascii=False, indent=2)

    print(f"Migrated {len(new_players)} players -> {output_path}")
    # Print a sample
    print(json.dumps(new_players[0], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
