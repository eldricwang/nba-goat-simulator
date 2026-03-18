#include "calculator.h"
#include <algorithm>
#include <cmath>
#include <functional>

// 各维度的历史最大值（用于归一化）
static const std::map<std::string, double> MAX_VALUES = {
    {"championships", 11},    // 拉塞尔
    {"mvp", 6},               // 贾巴尔
    {"fmvp", 6},              // 乔丹
    {"allStar", 20},          // 詹姆斯
    {"allNBA", 18},           // 詹姆斯 (1st+2nd+3rd)
    {"allDefense", 15},       // 邓肯
    {"dpoy", 4},              // 穆托姆博/华莱士
    {"scoringTitle", 10},     // 乔丹
    {"ppg", 30.1},            // 乔丹/张伯伦
    {"rpg", 22.9},            // 张伯伦
    {"apg", 11.2},            // 魔术师
    {"totalPoints", 40474},   // 詹姆斯
    {"playoffPPG", 33.4},     // 乔丹
    {"playoffWins", 183},     // 詹姆斯
    {"peakPPG", 50.4},        // 张伯伦
};

// 归一化：将原始值映射到 0-100
static double normalize(double value, double maxValue) {
    if (maxValue == 0) return 0;
    return std::min((value / maxValue) * 100.0, 100.0);
}

// 获取球员在某个维度的原始值
static double getPlayerValue(const PlayerData& player, const std::string& key) {
    if (key == "championships") return player.championships;
    if (key == "mvp") return player.mvp;
    if (key == "fmvp") return player.fmvp;
    if (key == "allStar") return player.allStar;
    if (key == "allNBA") return player.allNBA1st + player.allNBA2nd + player.allNBA3rd;
    if (key == "allDefense") return player.allDefense;
    if (key == "dpoy") return player.dpoy;
    if (key == "scoringTitle") return player.scoringTitle;
    if (key == "ppg") return player.ppg;
    if (key == "rpg") return player.rpg;
    if (key == "apg") return player.apg;
    if (key == "totalPoints") return player.totalPoints;
    if (key == "playoffPPG") return player.playoffPPG;
    if (key == "playoffWins") return player.playoffWins;
    if (key == "peakPPG") return player.peakPPG;
    return 0;
}

WeightConfig WeightConfig::fromJson(const json& j) {
    WeightConfig w;
    if (j.contains("championships")) w.championships = j["championships"].get<double>();
    if (j.contains("mvp")) w.mvp = j["mvp"].get<double>();
    if (j.contains("fmvp")) w.fmvp = j["fmvp"].get<double>();
    if (j.contains("allStar")) w.allStar = j["allStar"].get<double>();
    if (j.contains("allNBA")) w.allNBA = j["allNBA"].get<double>();
    if (j.contains("allDefense")) w.allDefense = j["allDefense"].get<double>();
    if (j.contains("dpoy")) w.dpoy = j["dpoy"].get<double>();
    if (j.contains("scoringTitle")) w.scoringTitle = j["scoringTitle"].get<double>();
    if (j.contains("ppg")) w.ppg = j["ppg"].get<double>();
    if (j.contains("rpg")) w.rpg = j["rpg"].get<double>();
    if (j.contains("apg")) w.apg = j["apg"].get<double>();
    if (j.contains("totalPoints")) w.totalPoints = j["totalPoints"].get<double>();
    if (j.contains("playoffPPG")) w.playoffPPG = j["playoffPPG"].get<double>();
    if (j.contains("playoffWins")) w.playoffWins = j["playoffWins"].get<double>();
    if (j.contains("peakPPG")) w.peakPPG = j["peakPPG"].get<double>();
    return w;
}

json WeightConfig::toJson() const {
    return json{
        {"championships", championships},
        {"mvp", mvp},
        {"fmvp", fmvp},
        {"allStar", allStar},
        {"allNBA", allNBA},
        {"allDefense", allDefense},
        {"dpoy", dpoy},
        {"scoringTitle", scoringTitle},
        {"ppg", ppg},
        {"rpg", rpg},
        {"apg", apg},
        {"totalPoints", totalPoints},
        {"playoffPPG", playoffPPG},
        {"playoffWins", playoffWins},
        {"peakPPG", peakPPG}
    };
}

json RankedPlayer::toJson() const {
    json breakdownJson = json::object();
    for (const auto& [k, v] : breakdown) {
        breakdownJson[k] = std::round(v * 10.0) / 10.0;
    }
    return json{
        {"player", player.toJson()},
        {"score", std::round(score * 10.0) / 10.0},
        {"breakdown", breakdownJson}
    };
}

std::vector<RankedPlayer> calculateRankings(
    const std::vector<PlayerData>& players,
    const WeightConfig& weights
) {
    // 将权重转为 map 方便遍历
    std::map<std::string, double> weightMap = {
        {"championships", weights.championships},
        {"mvp", weights.mvp},
        {"fmvp", weights.fmvp},
        {"allStar", weights.allStar},
        {"allNBA", weights.allNBA},
        {"allDefense", weights.allDefense},
        {"dpoy", weights.dpoy},
        {"scoringTitle", weights.scoringTitle},
        {"ppg", weights.ppg},
        {"rpg", weights.rpg},
        {"apg", weights.apg},
        {"totalPoints", weights.totalPoints},
        {"playoffPPG", weights.playoffPPG},
        {"playoffWins", weights.playoffWins},
        {"peakPPG", weights.peakPPG},
    };

    std::vector<RankedPlayer> results;
    results.reserve(players.size());

    for (const auto& player : players) {
        std::map<std::string, double> breakdown;
        double totalWeightedScore = 0;
        double totalWeight = 0;

        for (const auto& [key, weight] : weightMap) {
            if (weight == 0) continue;

            double rawValue = getPlayerValue(player, key);
            auto it = MAX_VALUES.find(key);
            double maxValue = (it != MAX_VALUES.end()) ? it->second : 1.0;
            double normalizedValue = normalize(rawValue, maxValue);
            double weightedScore = normalizedValue * (weight / 100.0);

            breakdown[key] = std::round(normalizedValue * 10.0) / 10.0;
            totalWeightedScore += weightedScore;
            totalWeight += weight / 100.0;
        }

        double finalScore = (totalWeight > 0) ? (totalWeightedScore / totalWeight) : 0;

        results.push_back({
            player,
            std::round(finalScore * 10.0) / 10.0,
            breakdown
        });
    }

    // 按分数降序排列
    std::sort(results.begin(), results.end(),
        [](const RankedPlayer& a, const RankedPlayer& b) {
            return a.score > b.score;
        });

    return results;
}

json getPresetsJson() {
    WeightConfig defaultW;

    json presets = json::array();

    // 均衡模式
    presets.push_back({
        {"name", "均衡模式"}, {"emoji", "⚖️"},
        {"description", "各维度均衡考量"},
        {"weights", defaultW.toJson()}
    });

    // 冠军至上
    {
        WeightConfig w = defaultW;
        w.championships = 100; w.fmvp = 90; w.mvp = 50;
        w.playoffWins = 70; w.playoffPPG = 60; w.ppg = 20; w.allStar = 10;
        presets.push_back({
            {"name", "冠军至上"}, {"emoji", "💍"},
            {"description", "总冠军和FMVP权重最高"},
            {"weights", w.toJson()}
        });
    }

    // 数据为王
    {
        WeightConfig w = defaultW;
        w.ppg = 90; w.totalPoints = 85; w.rpg = 60; w.apg = 60;
        w.peakPPG = 80; w.championships = 30; w.mvp = 40; w.fmvp = 30;
        presets.push_back({
            {"name", "数据为王"}, {"emoji", "📊"},
            {"description", "个人数据和统计至上"},
            {"weights", w.toJson()}
        });
    }

    // 荣誉收割
    {
        WeightConfig w = defaultW;
        w.mvp = 100; w.allStar = 70; w.allNBA = 80;
        w.dpoy = 60; w.scoringTitle = 60; w.championships = 40; w.ppg = 30;
        presets.push_back({
            {"name", "荣誉收割"}, {"emoji", "🏅"},
            {"description", "MVP、全明星等个人荣誉优先"},
            {"weights", w.toJson()}
        });
    }

    // 季后赛之王
    {
        WeightConfig w = defaultW;
        w.playoffPPG = 100; w.playoffWins = 90; w.championships = 85;
        w.fmvp = 85; w.ppg = 20; w.allStar = 10; w.mvp = 30;
        presets.push_back({
            {"name", "季后赛之王"}, {"emoji", "⚔️"},
            {"description", "季后赛表现决定一切"},
            {"weights", w.toJson()}
        });
    }

    // 科密专用
    {
        WeightConfig w = defaultW;
        w.championships = 90; w.allDefense = 80; w.fmvp = 85;
        w.peakPPG = 90; w.scoringTitle = 70; w.playoffPPG = 80;
        w.mvp = 30; w.totalPoints = 20; w.apg = 5;
        presets.push_back({
            {"name", "科密专用"}, {"emoji", "🐍"},
            {"description", "曼巴精神！防守+冠军+巅峰"},
            {"weights", w.toJson()}
        });
    }

    // 詹密专用
    {
        WeightConfig w = defaultW;
        w.totalPoints = 100; w.apg = 80; w.rpg = 70;
        w.allNBA = 90; w.allStar = 70; w.playoffWins = 80;
        w.mvp = 70; w.championships = 50; w.scoringTitle = 20;
        presets.push_back({
            {"name", "詹密专用"}, {"emoji", "👑"},
            {"description", "全能+长青+总数据"},
            {"weights", w.toJson()}
        });
    }

    return presets;
}
