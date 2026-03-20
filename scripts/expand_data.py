#!/usr/bin/env python3
"""
Task-6 数据扩充脚本
从 NBA API 抓取更多球员数据，扩充 players.json 到 250+ 名，seasons.json 覆盖更多球员。

输出格式与 next-app/data/ 下现有 JSON 完全一致。
"""

import json
import time
import os
import sys

from nba_api.stats.endpoints import playercareerstats, playerawards
from nba_api.stats.static import players as nba_players

# ──────────────────────────────────────────────────────────
# 目标球员列表（250+ 名 NBA 历史 & 现役球星）
# 格式: (英文全名, 中文名, 位置, 是否现役)
# ──────────────────────────────────────────────────────────

TARGET_PLAYERS = [
    # ===== 已有 66 名（保留，确保不重复）=====
    ("Michael Jordan", "迈克尔·乔丹", "SG", False),
    ("LeBron James", "勒布朗·詹姆斯", "SF", True),
    ("Kobe Bryant", "科比·布莱恩特", "SG", False),
    ("Kareem Abdul-Jabbar", "卡里姆·贾巴尔", "C", False),
    ("Magic Johnson", "魔术师约翰逊", "PG", False),
    ("Larry Bird", "拉里·伯德", "SF", False),
    ("Tim Duncan", "蒂姆·邓肯", "PF", False),
    ("Shaquille O'Neal", "沙奎尔·奥尼尔", "C", False),
    ("Stephen Curry", "斯蒂芬·库里", "PG", True),
    ("Kevin Durant", "凯文·杜兰特", "SF", True),
    ("Hakeem Olajuwon", "哈基姆·奥拉朱旺", "C", False),
    ("Dwyane Wade", "德怀恩·韦德", "SG", False),
    ("Giannis Antetokounmpo", "扬尼斯·字母哥", "PF", True),
    ("Allen Iverson", "阿伦·艾弗森", "SG", False),
    ("Dirk Nowitzki", "德克·诺维茨基", "PF", False),
    ("Kevin Garnett", "凯文·加内特", "PF", False),
    ("Charles Barkley", "查尔斯·巴克利", "PF", False),
    ("Karl Malone", "卡尔·马龙", "PF", False),
    ("John Stockton", "约翰·斯托克顿", "PG", False),
    ("Scottie Pippen", "斯科蒂·皮蓬", "SF", False),
    ("David Robinson", "大卫·罗宾逊", "C", False),
    ("Oscar Robertson", "奥斯卡·罗伯特森", "PG", False),
    ("Jerry West", "杰里·韦斯特", "SG", False),
    ("Julius Erving", "朱利叶斯·欧文", "SF", False),
    ("Moses Malone", "摩西·马龙", "C", False),
    ("Isiah Thomas", "以赛亚·托马斯", "PG", False),
    ("Patrick Ewing", "帕特里克·尤因", "C", False),
    ("Bill Russell", "比尔·拉塞尔", "C", False),
    ("Wilt Chamberlain", "威尔特·张伯伦", "C", False),
    ("Kawhi Leonard", "科怀·伦纳德", "SF", True),
    ("Anthony Davis", "安东尼·戴维斯", "PF", True),
    ("Nikola Jokic", "尼古拉·约基奇", "C", True),
    ("Luka Doncic", "卢卡·东契奇", "PG", True),
    ("Joel Embiid", "乔尔·恩比德", "C", True),
    ("Jayson Tatum", "杰森·塔图姆", "SF", True),
    ("Damian Lillard", "达米安·利拉德", "PG", True),
    ("Jimmy Butler", "吉米·巴特勒", "SF", True),
    ("Paul George", "保罗·乔治", "SF", True),
    ("James Harden", "詹姆斯·哈登", "SG", True),
    ("Russell Westbrook", "拉塞尔·威斯布鲁克", "PG", True),
    ("Chris Paul", "克里斯·保罗", "PG", True),
    ("Carmelo Anthony", "卡梅罗·安东尼", "SF", False),
    ("Vince Carter", "文斯·卡特", "SG", False),
    ("Tracy McGrady", "特雷西·麦格雷迪", "SG", False),
    ("Paul Pierce", "保罗·皮尔斯", "SF", False),
    ("Jason Kidd", "贾森·基德", "PG", False),
    ("Steve Nash", "史蒂夫·纳什", "PG", False),
    ("Dwight Howard", "德怀特·霍华德", "C", False),
    ("Tony Parker", "托尼·帕克", "PG", False),
    ("Manu Ginobili", "马努·吉诺比利", "SG", False),
    ("Dennis Rodman", "丹尼斯·罗德曼", "PF", False),
    ("Ben Wallace", "本·华莱士", "C", False),
    ("Yao Ming", "姚明", "C", False),
    ("Pau Gasol", "保罗·加索尔", "PF", False),
    ("Draymond Green", "德雷蒙德·格林", "PF", True),
    ("Klay Thompson", "克莱·汤普森", "SG", True),
    ("Kyrie Irving", "凯里·欧文", "PG", True),
    ("Zion Williamson", "锡安·威廉森", "PF", True),
    ("Ja Morant", "贾·莫兰特", "PG", True),
    ("Clyde Drexler", "克莱德·德雷克斯勒", "SG", False),
    ("Gary Payton", "加里·佩顿", "PG", False),
    ("Reggie Miller", "雷吉·米勒", "SG", False),
    ("Ray Allen", "雷·阿伦", "SG", False),
    ("Shai Gilgeous-Alexander", "谢·吉尔杰斯-亚历山大", "SG", True),
    ("Victor Wembanyama", "维克托·文班亚马", "C", True),
    ("Trae Young", "特雷·杨", "PG", True),
    # ===== 新增 ~190 名球员 =====
    # 现役球星
    ("Devin Booker", "德文·布克", "SG", True),
    ("Karl-Anthony Towns", "卡尔-安东尼·唐斯", "C", True),
    ("Donovan Mitchell", "多诺万·米切尔", "SG", True),
    ("Bam Adebayo", "巴姆·阿德巴约", "C", True),
    ("Jaylen Brown", "杰伦·布朗", "SG", True),
    ("De'Aaron Fox", "德阿龙·福克斯", "PG", True),
    ("Tyrese Haliburton", "泰瑞斯·哈利伯顿", "PG", True),
    ("LaMelo Ball", "拉梅洛·鲍尔", "PG", True),
    ("Paolo Banchero", "保罗·班切罗", "PF", True),
    ("Anthony Edwards", "安东尼·爱德华兹", "SG", True),
    ("Chet Holmgren", "切特·霍姆格伦", "C", True),
    ("Domantas Sabonis", "多曼塔斯·萨博尼斯", "C", True),
    ("Jalen Brunson", "贾伦·布朗森", "PG", True),
    ("Tyrese Maxey", "泰瑞斯·马克西", "SG", True),
    ("Lauri Markkanen", "劳里·马尔卡宁", "PF", True),
    ("Pascal Siakam", "帕斯卡尔·西亚卡姆", "PF", True),
    ("Fred VanVleet", "弗雷德·范弗利特", "PG", True),
    ("Jrue Holiday", "朱·霍勒迪", "PG", True),
    ("Derrick White", "德里克·怀特", "SG", True),
    ("Mikal Bridges", "米卡尔·布里奇斯", "SF", True),
    ("Brandon Ingram", "布兰登·英格拉姆", "SF", True),
    ("Zach LaVine", "扎克·拉文", "SG", True),
    ("Scottie Barnes", "斯科蒂·巴恩斯", "SF", True),
    ("Cade Cunningham", "凯德·坎宁安", "PG", True),
    ("Evan Mobley", "埃文·莫布利", "PF", True),
    ("Alperen Sengun", "阿尔佩伦·森京", "C", True),
    ("Jaren Jackson Jr.", "贾伦·杰克逊", "PF", True),
    ("Desmond Bane", "德斯蒙德·贝恩", "SG", True),
    ("Franz Wagner", "弗朗茨·瓦格纳", "SF", True),
    ("Anfernee Simons", "安弗尼·西蒙斯", "SG", True),
    ("Josh Giddey", "乔什·基迪", "PG", True),
    ("Jabari Smith Jr.", "贾巴里·史密斯", "PF", True),
    ("Jalen Williams", "杰伦·威廉姆斯", "SF", True),
    ("Austin Reaves", "奥斯汀·里夫斯", "SG", True),
    ("Nikola Vucevic", "尼古拉·武切维奇", "C", True),
    ("Julius Randle", "朱利叶斯·兰德尔", "PF", True),
    ("Khris Middleton", "克里斯·米德尔顿", "SF", True),
    ("Bradley Beal", "布拉德利·比尔", "SG", True),
    ("Rudy Gobert", "鲁迪·戈贝尔", "C", True),
    ("DeMar DeRozan", "德玛尔·德罗赞", "SF", True),
    ("CJ McCollum", "CJ·麦科勒姆", "SG", True),
    # 近年退役/不太久远
    ("Derrick Rose", "德里克·罗斯", "PG", False),
    ("Blake Griffin", "布雷克·格里芬", "PF", False),
    ("LaMarcus Aldridge", "拉马库斯·阿尔德里奇", "PF", False),
    ("DeMarcus Cousins", "德马库斯·考辛斯", "C", False),
    ("Kemba Walker", "肯巴·沃克", "PG", False),
    ("Andre Drummond", "安德烈·德拉蒙德", "C", False),
    ("Gordon Hayward", "戈登·海沃德", "SF", False),
    ("John Wall", "约翰·沃尔", "PG", False),
    ("Mike Conley", "迈克·康利", "PG", True),
    ("Al Horford", "阿尔·霍福德", "C", True),
    ("Brook Lopez", "布鲁克·洛佩兹", "C", True),
    ("Marc Gasol", "马克·加索尔", "C", False),
    ("Rajon Rondo", "拉简·隆多", "PG", False),
    ("Andre Iguodala", "安德烈·伊戈达拉", "SF", False),
    ("Serge Ibaka", "塞尔吉·伊巴卡", "PF", False),
    ("Kyle Lowry", "凯尔·洛瑞", "PG", True),
    # 2000s 时代球星
    ("Amare Stoudemire", "阿马雷·斯塔德迈尔", "PF", False),
    ("Chris Bosh", "克里斯·波什", "PF", False),
    ("Chauncey Billups", "昌西·比卢普斯", "PG", False),
    ("Ben Simmons", "本·西蒙斯", "PG", True),
    ("Ricky Rubio", "里基·卢比奥", "PG", False),
    ("Joe Johnson", "乔·约翰逊", "SG", False),
    ("Gilbert Arenas", "吉尔伯特·阿里纳斯", "SG", False),
    ("Mitch Richmond", "米奇·里奇蒙德", "SG", False),
    ("Tim Hardaway", "蒂姆·哈达威", "PG", False),
    ("Alonzo Mourning", "阿隆佐·莫宁", "C", False),
    ("Chris Webber", "克里斯·韦伯", "PF", False),
    ("Grant Hill", "格兰特·希尔", "SF", False),
    ("Penny Hardaway", "佩尼·哈达威", "PG", False),
    ("Baron Davis", "拜伦·戴维斯", "PG", False),
    ("Michael Redd", "迈克尔·里德", "SG", False),
    ("Peja Stojakovic", "佩贾·斯托亚科维奇", "SF", False),
    ("Rasheed Wallace", "拉希德·华莱士", "PF", False),
    ("Jermaine O'Neal", "杰梅因·奥尼尔", "PF", False),
    ("Elton Brand", "埃尔顿·布兰德", "PF", False),
    ("Shawn Marion", "肖恩·马里昂", "SF", False),
    ("Lamar Odom", "拉马尔·奥多姆", "SF", False),
    ("Richard Hamilton", "理查德·汉密尔顿", "SG", False),
    ("Antawn Jamison", "安托万·贾米森", "PF", False),
    ("Rashard Lewis", "拉沙德·刘易斯", "SF", False),
    ("Jamal Crawford", "贾马尔·克劳福德", "SG", False),
    # 经典 90s 球星
    ("Dennis Johnson", "丹尼斯·约翰逊", "SG", False),
    ("Robert Parish", "罗伯特·帕里什", "C", False),
    ("Kevin McHale", "凯文·麦克海尔", "PF", False),
    ("Dominique Wilkins", "多米尼克·威尔金斯", "SF", False),
    ("James Worthy", "詹姆斯·沃西", "SF", False),
    ("Adrian Dantley", "阿德里安·丹特利", "SF", False),
    ("Bob McAdoo", "鲍勃·麦卡杜", "C", False),
    ("Bernard King", "伯纳德·金", "SF", False),
    ("Alex English", "阿莱克斯·英格利什", "SF", False),
    ("Mark Price", "马克·普莱斯", "PG", False),
    ("Dikembe Mutombo", "迪肯贝·穆托姆博", "C", False),
    ("Robert Horry", "罗伯特·霍里", "PF", False),
    ("Sam Cassell", "萨姆·卡塞尔", "PG", False),
    ("Horace Grant", "霍勒斯·格兰特", "PF", False),
    ("Detlef Schrempf", "德特勒夫·施伦普夫", "SF", False),
    ("Terry Porter", "特里·波特", "PG", False),
    ("Latrell Sprewell", "拉特里尔·斯普雷威尔", "SG", False),
    ("Allan Houston", "阿兰·休斯顿", "SG", False),
    ("Larry Johnson", "拉里·约翰逊", "PF", False),
    ("Shareef Abdur-Rahim", "谢里夫·阿卜杜尔-拉希姆", "SF", False),
    ("Stephon Marbury", "斯蒂芬·马布里", "PG", False),
    ("Steve Francis", "史蒂夫·弗朗西斯", "PG", False),
    ("Mehmet Okur", "穆罕默德·奥库尔", "C", False),
    ("Michael Finley", "迈克尔·芬利", "SG", False),
    ("Antoine Walker", "安托万·沃克", "PF", False),
    ("Kenyon Martin", "凯尼恩·马丁", "PF", False),
    ("Eddie Jones", "埃迪·琼斯", "SG", False),
    ("Glen Rice", "格伦·莱斯", "SF", False),
    ("Dan Majerle", "丹·马尔利", "SG", False),
    ("Derek Harper", "德里克·哈珀", "PG", False),
    # 80s 经典
    ("Robert Miller", "无", "SF", False),  # placeholder skip
    ("George Gervin", "乔治·格文", "SG", False),
    ("Walt Frazier", "沃尔特·弗雷泽", "PG", False),
    ("Elgin Baylor", "埃尔金·贝勒", "SF", False),
    ("Dave Cowens", "戴夫·考恩斯", "C", False),
    ("Bob Cousy", "鲍勃·库西", "PG", False),
    ("John Havlicek", "约翰·哈夫利切克", "SF", False),
    ("Rick Barry", "里克·巴里", "SF", False),
    ("Pete Maravich", "皮特·马拉维奇", "SG", False),
    ("Nate Archibald", "内特·阿奇博尔德", "PG", False),
    ("Willis Reed", "威利斯·里德", "C", False),
    ("Earl Monroe", "厄尔·门罗", "SG", False),
    ("Bob Pettit", "鲍勃·佩蒂特", "PF", False),
    ("Hal Greer", "哈尔·格里尔", "SG", False),
    ("Sam Jones", "萨姆·琼斯", "SG", False),
    ("Dave Bing", "戴夫·宾", "PG", False),
    ("Bob Lanier", "鲍勃·兰尼尔", "C", False),
    ("Artis Gilmore", "阿蒂斯·吉尔摩尔", "C", False),
    ("Dan Issel", "丹·伊塞尔", "C", False),
    # 2010s 关键角色球员
    ("Harrison Barnes", "哈里森·巴恩斯", "SF", True),
    ("DeAndre Jordan", "德安德鲁·乔丹", "C", False),
    ("Tobias Harris", "托拜厄斯·哈里斯", "PF", True),
    ("Aaron Gordon", "阿隆·戈登", "PF", True),
    ("Kristaps Porzingis", "克里斯塔普斯·波尔津吉斯", "C", True),
    ("Andrew Wiggins", "安德鲁·威金斯", "SF", True),
    ("D'Angelo Russell", "丹吉洛·拉塞尔", "PG", True),
    ("Jamal Murray", "贾马尔·穆雷", "PG", True),
    ("OG Anunoby", "OG·阿奴诺比", "SF", True),
    ("Terry Rozier", "特里·罗齐尔", "PG", True),
    ("Spencer Dinwiddie", "斯宾塞·丁维迪", "PG", True),
    ("Buddy Hield", "巴迪·希尔德", "SG", True),
    ("Bogdan Bogdanovic", "博格丹·博格达诺维奇", "SG", True),
    ("Malcolm Brogdon", "马尔科姆·布罗格登", "PG", True),
    ("Jarrett Allen", "贾雷特·阿伦", "C", True),
    ("Myles Turner", "迈尔斯·特纳", "C", True),
    ("Clint Capela", "克林特·卡佩拉", "C", True),
    ("Robert Williams III", "罗伯特·威廉姆斯三世", "C", True),
    ("Tyler Herro", "泰勒·希罗", "SG", True),
    ("Immanuel Quickley", "以马内利·奎克利", "PG", True),
    ("Herb Jones", "赫布·琼斯", "SF", True),
]

# 远古球员手动数据（NBA API 可能缺失）
MANUAL_CAREER_DATA = {
    "Bill Russell": {
        "gp": 963, "mp": 42.3, "pts": 15.1, "reb": 22.5, "ast": 4.3,
        "fgPct": 44.0, "tpPct": None, "tsPct": 48.4, "mvp": 5, "fmvp": 0,
    },
    "Wilt Chamberlain": {
        "gp": 1045, "mp": 45.8, "pts": 30.1, "reb": 22.9, "ast": 4.4,
        "fgPct": 54.0, "tpPct": None, "tsPct": 54.0, "mvp": 4, "fmvp": 1,
    },
    "Oscar Robertson": {
        "gp": 1040, "mp": 42.2, "pts": 25.7, "reb": 7.5, "ast": 9.5,
        "fgPct": 48.5, "tpPct": None, "tsPct": 55.8, "mvp": 1, "fmvp": 0,
    },
    "Jerry West": {
        "gp": 932, "mp": 36.6, "pts": 27.0, "reb": 5.8, "ast": 6.7,
        "fgPct": 47.4, "tpPct": None, "tsPct": 55.0, "mvp": 0, "fmvp": 1,
    },
    "Bob Cousy": {
        "gp": 924, "mp": 33.9, "pts": 18.4, "reb": 5.2, "ast": 7.5,
        "fgPct": 37.5, "tpPct": None, "tsPct": 44.8, "mvp": 1, "fmvp": 0,
    },
    "Bob Pettit": {
        "gp": 792, "mp": 37.8, "pts": 26.4, "reb": 16.2, "ast": 3.0,
        "fgPct": 43.6, "tpPct": None, "tsPct": 51.1, "mvp": 2, "fmvp": 0,
    },
    "Elgin Baylor": {
        "gp": 846, "mp": 40.7, "pts": 27.4, "reb": 13.5, "ast": 4.3,
        "fgPct": 43.1, "tpPct": None, "tsPct": 50.7, "mvp": 0, "fmvp": 0,
    },
    "Willis Reed": {
        "gp": 650, "mp": 36.5, "pts": 18.7, "reb": 12.9, "ast": 1.8,
        "fgPct": 47.6, "tpPct": None, "tsPct": 52.3, "mvp": 1, "fmvp": 2,
    },
    "Walt Frazier": {
        "gp": 825, "mp": 36.8, "pts": 18.9, "reb": 5.9, "ast": 6.1,
        "fgPct": 49.0, "tpPct": None, "tsPct": 52.1, "mvp": 0, "fmvp": 0,
    },
    "Earl Monroe": {
        "gp": 926, "mp": 32.2, "pts": 18.8, "reb": 3.0, "ast": 3.9,
        "fgPct": 46.4, "tpPct": None, "tsPct": 50.6, "mvp": 0, "fmvp": 0,
    },
    "Dave Cowens": {
        "gp": 766, "mp": 36.6, "pts": 17.6, "reb": 13.6, "ast": 3.8,
        "fgPct": 46.0, "tpPct": None, "tsPct": 51.0, "mvp": 1, "fmvp": 0,
    },
    "John Havlicek": {
        "gp": 1270, "mp": 36.6, "pts": 20.8, "reb": 6.3, "ast": 4.8,
        "fgPct": 43.9, "tpPct": None, "tsPct": 50.6, "mvp": 0, "fmvp": 1,
    },
    "Rick Barry": {
        "gp": 794, "mp": 36.3, "pts": 23.2, "reb": 6.5, "ast": 5.1,
        "fgPct": 44.9, "tpPct": None, "tsPct": 56.4, "mvp": 0, "fmvp": 1,
    },
    "Pete Maravich": {
        "gp": 658, "mp": 33.7, "pts": 24.2, "reb": 4.2, "ast": 5.4,
        "fgPct": 44.1, "tpPct": None, "tsPct": 51.2, "mvp": 0, "fmvp": 0,
    },
    "Nate Archibald": {
        "gp": 876, "mp": 34.5, "pts": 18.8, "reb": 2.3, "ast": 7.4,
        "fgPct": 46.7, "tpPct": None, "tsPct": 53.4, "mvp": 0, "fmvp": 0,
    },
    "Hal Greer": {
        "gp": 1122, "mp": 33.0, "pts": 19.2, "reb": 5.0, "ast": 4.0,
        "fgPct": 45.2, "tpPct": None, "tsPct": 50.5, "mvp": 0, "fmvp": 0,
    },
    "Sam Jones": {
        "gp": 871, "mp": 28.7, "pts": 17.7, "reb": 4.9, "ast": 2.5,
        "fgPct": 45.6, "tpPct": None, "tsPct": 51.5, "mvp": 0, "fmvp": 0,
    },
    "Dave Bing": {
        "gp": 901, "mp": 34.8, "pts": 20.3, "reb": 3.8, "ast": 6.0,
        "fgPct": 44.1, "tpPct": None, "tsPct": 49.8, "mvp": 0, "fmvp": 0,
    },
    "Bob Lanier": {
        "gp": 959, "mp": 33.5, "pts": 20.1, "reb": 10.1, "ast": 3.1,
        "fgPct": 51.4, "tpPct": None, "tsPct": 55.0, "mvp": 0, "fmvp": 0,
    },
    "George Gervin": {
        "gp": 791, "mp": 33.4, "pts": 25.1, "reb": 4.6, "ast": 2.8,
        "fgPct": 51.1, "tpPct": 27.8, "tsPct": 55.8, "mvp": 0, "fmvp": 0,
    },
}

# NBA ID 查找缓存
_nba_id_cache = {}

def lookup_nba_id(name_en):
    """根据英文名查找 NBA API 的 player ID"""
    global _nba_id_cache
    if not _nba_id_cache:
        for p in nba_players.get_players():
            _nba_id_cache[p["full_name"]] = p["id"]
            _nba_id_cache[p["full_name"].lower()] = p["id"]
    return _nba_id_cache.get(name_en) or _nba_id_cache.get(name_en.lower())


def name_to_slug(name_en):
    """英文名转 slug ID: 'LeBron James' -> 'lebron-james'"""
    return name_en.lower().replace("'", "").replace(".", "").replace(" iii", "").replace(" jr", "").replace(" ii", "").strip().replace("  ", " ").replace(" ", "-")


def fetch_career_from_api(nba_id):
    """从 NBA API 获取生涯数据"""
    try:
        career = playercareerstats.PlayerCareerStats(player_id=nba_id)
        time.sleep(0.7)
        data = career.get_dict()

        career_totals = None
        season_rows = []

        for rs in data["resultSets"]:
            if rs["name"] == "CareerTotalsRegularSeason" and rs["rowSet"]:
                headers = rs["headers"]
                career_totals = dict(zip(headers, rs["rowSet"][0]))
            elif rs["name"] == "SeasonTotalsRegularSeason" and rs["rowSet"]:
                headers = rs["headers"]
                season_rows = [dict(zip(headers, r)) for r in rs["rowSet"]]

        return career_totals, season_rows
    except Exception as e:
        print(f"    [!] career stats 失败: {e}")
        return None, []


def fetch_awards_from_api(nba_id):
    """从 NBA API 获取 MVP/FMVP 奖项"""
    try:
        awards = playerawards.PlayerAwards(player_id=nba_id)
        time.sleep(0.6)
        data = awards.get_dict()

        mvp = 0
        fmvp = 0
        for rs in data["resultSets"]:
            if rs["name"] == "PlayerAwards":
                headers = rs["headers"]
                for row in rs["rowSet"]:
                    award = dict(zip(headers, row))
                    desc = award.get("DESCRIPTION", "")
                    if desc == "NBA Most Valuable Player":
                        mvp += 1
                    elif "Finals Most Valuable Player" in desc or "Finals MVP" in desc:
                        fmvp += 1
        return mvp, fmvp
    except Exception as e:
        print(f"    [!] awards 失败: {e}")
        return 0, 0


def calculate_ts_pct(pts, fga, fta, gp):
    """计算 True Shooting %"""
    if gp == 0 or (fga == 0 and fta == 0):
        return None
    total_pts = pts
    tsa = fga + 0.44 * fta
    if tsa == 0:
        return None
    return round(total_pts / (2 * tsa) * 100, 1)


def build_player_data(name_en, name_zh, position, active, nba_id, career_totals, season_rows, mvp_count, fmvp_count):
    """构建 Player JSON 对象"""
    slug = name_to_slug(name_en)

    if career_totals:
        gp = career_totals.get("GP", 0) or 0
        pts_total = career_totals.get("PTS", 0) or 0
        reb_total = career_totals.get("REB", 0) or 0
        ast_total = career_totals.get("AST", 0) or 0
        fgm = career_totals.get("FGM", 0) or 0
        fga = career_totals.get("FGA", 0) or 0
        fg3m = career_totals.get("FG3M", 0) or 0
        fg3a = career_totals.get("FG3A", 0) or 0
        fta = career_totals.get("FTA", 0) or 0
        min_total = career_totals.get("MIN", 0) or 0

        ppg = round(pts_total / gp, 1) if gp > 0 else 0
        rpg = round(reb_total / gp, 1) if gp > 0 else 0
        apg = round(ast_total / gp, 1) if gp > 0 else 0
        mpg = round(min_total / gp, 1) if gp > 0 else 0
        fg_pct = round(fgm / fga * 100, 1) if fga > 0 else 0
        tp_pct = round(fg3m / fg3a * 100, 1) if fg3a > 0 else None
        ts_pct = calculate_ts_pct(pts_total, fga, fta, gp)

        # 如果三分出手为 0（远古球员），tp_pct = None
        if fg3a == 0:
            tp_pct = None

        player = {
            "id": slug,
            "nameZh": name_zh,
            "nameEn": name_en,
            "position": position,
            "active": active,
            "nbaId": nba_id,
            "career": {
                "gp": gp,
                "mp": mpg,
                "pts": ppg,
                "reb": rpg,
                "ast": apg,
                "fgPct": fg_pct,
                "tpPct": tp_pct,
                "tsPct": ts_pct,
                "mvp": mvp_count,
                "fmvp": fmvp_count,
            },
        }
    else:
        # fallback to manual data
        player = {
            "id": slug,
            "nameZh": name_zh,
            "nameEn": name_en,
            "position": position,
            "active": active,
            "nbaId": nba_id,
            "career": {
                "gp": 0, "mp": 0, "pts": 0, "reb": 0, "ast": 0,
                "fgPct": 0, "tpPct": None, "tsPct": None, "mvp": 0, "fmvp": 0,
            },
        }

    return player


def build_season_data(player_slug, season_rows):
    """从赛季原始数据构建 PlayerSeason 数组"""
    seasons = []
    # 合并多队赛季（TOT 行）
    seen_seasons = {}

    for row in season_rows:
        team_abbr = row.get("TEAM_ABBREVIATION", "")
        if team_abbr == "TOT":
            # 总计行 = 该赛季合并数据
            season_id = row.get("SEASON_ID", "")
            seen_seasons[season_id] = row
        else:
            season_id = row.get("SEASON_ID", "")
            if season_id not in seen_seasons:
                seen_seasons[season_id] = row

    for season_id, row in sorted(seen_seasons.items()):
        gp = row.get("GP", 0) or 0
        if gp < 10:
            continue  # 跳过出场太少的赛季

        pts = row.get("PTS", 0) or 0
        reb = row.get("REB", 0) or 0
        ast = row.get("AST", 0) or 0
        fgm = row.get("FGM", 0) or 0
        fga = row.get("FGA", 0) or 0
        fg3m = row.get("FG3M", 0) or 0
        fg3a = row.get("FG3A", 0) or 0
        fta = row.get("FTA", 0) or 0
        min_total = row.get("MIN", 0) or 0

        ppg = round(pts / gp, 1) if gp > 0 else 0
        rpg = round(reb / gp, 1) if gp > 0 else 0
        apg = round(ast / gp, 1) if gp > 0 else 0
        mpg = round(min_total / gp, 1) if gp > 0 else 0
        fg_pct = round(fgm / fga * 100, 1) if fga > 0 else 0
        tp_pct = round(fg3m / fg3a * 100, 1) if fg3a > 0 else 0
        ts_pct = calculate_ts_pct(pts, fga, fta, gp)

        seasons.append({
            "playerId": player_slug,
            "season": season_id,
            "gp": gp,
            "mp": mpg,
            "pts": ppg,
            "reb": rpg,
            "ast": apg,
            "fgPct": fg_pct,
            "tpPct": tp_pct,
            "tsPct": ts_pct if ts_pct else 0,
        })

    return seasons


def main():
    output_dir = os.path.join(os.path.dirname(__file__), "..", "next-app", "data")
    os.makedirs(output_dir, exist_ok=True)

    # 加载现有数据
    existing_players_path = os.path.join(output_dir, "players.json")
    existing_seasons_path = os.path.join(output_dir, "seasons.json")

    existing_players = {}
    existing_seasons = []
    if os.path.exists(existing_players_path):
        with open(existing_players_path, "r") as f:
            for p in json.load(f):
                existing_players[p["id"]] = p
        print(f"已有 {len(existing_players)} 名球员数据")
    if os.path.exists(existing_seasons_path):
        with open(existing_seasons_path, "r") as f:
            existing_seasons = json.load(f)
        print(f"已有 {len(existing_seasons)} 条赛季数据")

    # 已有赛季数据 player IDs
    existing_season_player_ids = set(s["playerId"] for s in existing_seasons)

    all_players = []
    all_seasons = list(existing_seasons)  # 保留现有赛季数据
    new_count = 0
    updated_count = 0
    failed = []
    skipped_names = set()

    # 去重
    seen_slugs = set()

    total = len(TARGET_PLAYERS)
    for idx, (name_en, name_zh, position, active) in enumerate(TARGET_PLAYERS, 1):
        slug = name_to_slug(name_en)

        # 跳过重复和 placeholder
        if slug in seen_slugs or name_zh == "无":
            continue
        seen_slugs.add(slug)

        nba_id = lookup_nba_id(name_en)

        # 如果已有这个球员且数据看起来正常（gp > 0），保留之
        if slug in existing_players:
            existing = existing_players[slug]
            if existing["career"]["gp"] > 0:
                # 确保 nbaId 字段存在
                if not existing.get("nbaId") and nba_id:
                    existing["nbaId"] = nba_id
                all_players.append(existing)

                # 如果这个球员还没有赛季数据，尝试抓取
                if slug not in existing_season_player_ids and nba_id:
                    print(f"  [{idx}/{total}] {name_en} (赛季补充)...", end="", flush=True)
                    _, season_rows = fetch_career_from_api(nba_id)
                    if season_rows:
                        new_seasons = build_season_data(slug, season_rows)
                        if new_seasons:
                            all_seasons.extend(new_seasons)
                            existing_season_player_ids.add(slug)
                            print(f" +{len(new_seasons)} 赛季")
                        else:
                            print(" 无有效赛季")
                    else:
                        print(" API 无数据")
                continue

        # 需要新抓取
        print(f"  [{idx}/{total}] {name_en}...", end="", flush=True)

        # 手动数据？
        if name_en in MANUAL_CAREER_DATA:
            manual = MANUAL_CAREER_DATA[name_en]
            player = {
                "id": slug,
                "nameZh": name_zh,
                "nameEn": name_en,
                "position": position,
                "active": active,
                "nbaId": nba_id,
                "career": {
                    "gp": manual["gp"],
                    "mp": manual["mp"],
                    "pts": manual["pts"],
                    "reb": manual["reb"],
                    "ast": manual["ast"],
                    "fgPct": manual["fgPct"],
                    "tpPct": manual["tpPct"],
                    "tsPct": manual["tsPct"],
                    "mvp": manual["mvp"],
                    "fmvp": manual["fmvp"],
                },
            }
            all_players.append(player)
            new_count += 1
            print(f" (手动数据)")
            continue

        if not nba_id:
            print(f" 未找到 NBA ID, 跳过")
            failed.append(name_en)
            continue

        # 从 API 抓取
        career_totals, season_rows = fetch_career_from_api(nba_id)
        mvp, fmvp = fetch_awards_from_api(nba_id)

        if career_totals:
            player = build_player_data(name_en, name_zh, position, active, nba_id, career_totals, season_rows, mvp, fmvp)
            all_players.append(player)
            new_count += 1

            # 赛季数据
            if season_rows:
                new_seasons = build_season_data(slug, season_rows)
                if new_seasons:
                    all_seasons.extend(new_seasons)
                    existing_season_player_ids.add(slug)

            gp = player["career"]["gp"]
            pts = player["career"]["pts"]
            n_seasons = len([s for s in all_seasons if s["playerId"] == slug])
            print(f" GP={gp} PTS={pts} 赛季={n_seasons}")
        else:
            print(f" API 无数据, 跳过")
            failed.append(name_en)

    # 排序：按 career pts 降序
    all_players.sort(key=lambda p: p["career"]["pts"], reverse=True)
    # 赛季数据排序
    all_seasons.sort(key=lambda s: (s["playerId"], s["season"]))

    # 去重赛季数据
    seen_season_keys = set()
    deduped_seasons = []
    for s in all_seasons:
        key = (s["playerId"], s["season"])
        if key not in seen_season_keys:
            seen_season_keys.add(key)
            deduped_seasons.append(s)
    all_seasons = deduped_seasons

    # 写入
    players_path = os.path.join(output_dir, "players.json")
    seasons_path = os.path.join(output_dir, "seasons.json")

    with open(players_path, "w", encoding="utf-8") as f:
        json.dump(all_players, f, ensure_ascii=False, indent=2)

    with open(seasons_path, "w", encoding="utf-8") as f:
        json.dump(all_seasons, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*60}")
    print(f"完成!")
    print(f"球员: {len(all_players)} (新增 {new_count})")
    print(f"赛季: {len(all_seasons)} 条")
    print(f"覆盖球员赛季数: {len(existing_season_player_ids)}")
    if failed:
        print(f"失败 ({len(failed)}): {', '.join(failed[:20])}")
    print(f"输出: {players_path}")
    print(f"输出: {seasons_path}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
