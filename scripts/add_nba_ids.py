#!/usr/bin/env python3
"""Add nbaId field to players.json for headshot URLs."""
import json

# NBA official player IDs (from stats.nba.com)
NBA_IDS = {
    "michael-jordan": 893,
    "lebron-james": 2544,
    "kobe-bryant": 977,
    "kareem-abdul-jabbar": 76003,
    "magic-johnson": 77142,
    "larry-bird": 1449,
    "wilt-chamberlain": 76375,
    "bill-russell": 78049,
    "tim-duncan": 1495,
    "shaquille-oneal": 406,
    "hakeem-olajuwon": 165,
    "oscar-robertson": 78643,
    "jerry-west": 78531,
    "stephen-curry": 201939,
    "kevin-durant": 201142,
    "giannis-antetokounmpo": 203507,
    "nikola-jokic": 203999,
    "luka-doncic": 1629029,
    "kawhi-leonard": 202695,
    "joel-embiid": 203954,
    "jayson-tatum": 1628369,
    "anthony-davis": 203076,
    "jimmy-butler": 202710,
    "damian-lillard": 203081,
    "james-harden": 201935,
    "russell-westbrook": 201566,
    "chris-paul": 101108,
    "dwyane-wade": 2548,
    "dirk-nowitzki": 1717,
    "kevin-garnett": 708,
    "allen-iverson": 947,
    "charles-barkley": 787,
    "karl-malone": 252,
    "john-stockton": 304,
    "david-robinson": 229,
    "patrick-ewing": 121,
    "isiah-thomas": 432,
    "julius-erving": 76680,
    "moses-malone": 77461,
    "scottie-pippen": 937,
    "dennis-rodman": 367,
    "steve-nash": 959,
    "jason-kidd": 429,
    "ray-allen": 951,
    "paul-pierce": 1718,
    "reggie-miller": 397,
    "gary-payton": 136,
    "dominique-wilkins": 472,
    "clyde-drexler": 76443,
    "john-havlicek": 76964,
    "elgin-baylor": 76147,
    "bob-cousy": 76432,
    "george-mikan": 77412,
    "bob-pettit": 78226,
    "walt-frazier": 76808,
    "dave-cowens": 76434,
    "rick-barry": 76103,
    "george-gervin": 76843,
    "pete-maravich": 77450,
    "willis-reed": 78392,
    "bill-walton": 78499,
    "shai-gilgeous-alexander": 1628983,
    "anthony-edwards": 1630162,
    "victor-wembanyama": 1641705,
    "ja-morant": 1629630,
    "devin-booker": 1626164,
    "trae-young": 1629027,
}

with open("next-app/data/players.json", "r") as f:
    players = json.load(f)

updated = 0
for p in players:
    pid = p["id"]
    if pid in NBA_IDS:
        p["nbaId"] = NBA_IDS[pid]
        updated += 1
    else:
        p["nbaId"] = None

with open("next-app/data/players.json", "w") as f:
    json.dump(players, f, ensure_ascii=False, indent=2)

print(f"Updated {updated}/{len(players)} players with nbaId")
