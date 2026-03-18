#pragma once
#include "players.h"
#include "json.hpp"
#include <map>

using json = nlohmann::json;

struct WeightConfig {
    double championships = 70;
    double mvp = 65;
    double fmvp = 60;
    double allStar = 25;
    double allNBA = 35;
    double allDefense = 20;
    double dpoy = 30;
    double scoringTitle = 25;
    double ppg = 40;
    double rpg = 20;
    double apg = 20;
    double totalPoints = 30;
    double playoffPPG = 45;
    double playoffWins = 35;
    double peakPPG = 35;

    static WeightConfig fromJson(const json& j);
    json toJson() const;
};

struct RankedPlayer {
    PlayerData player;
    double score;
    std::map<std::string, double> breakdown;

    json toJson() const;
};

// 计算所有球员排名
std::vector<RankedPlayer> calculateRankings(
    const std::vector<PlayerData>& players,
    const WeightConfig& weights
);

// 获取预设权重方案列表
json getPresetsJson();
