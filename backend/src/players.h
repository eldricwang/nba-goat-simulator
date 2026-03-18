#pragma once
#include <string>
#include <vector>
#include "json.hpp"

using json = nlohmann::json;

struct PlayerData {
    int id;
    std::string name;
    std::string nameEn;
    std::string position;
    std::string era;
    std::vector<std::string> teams;
    std::string avatar;

    // 荣誉
    int championships;
    int mvp;
    int fmvp;
    int allStar;
    int allNBA1st;
    int allNBA2nd;
    int allNBA3rd;
    int allDefense;
    int dpoy;
    int scoringTitle;
    int assistTitle;
    int reboundTitle;
    int allStarMVP;
    int roy;

    // 常规赛生涯数据
    int gamesPlayed;
    double ppg;
    double rpg;
    double apg;
    double spg;
    double bpg;
    double fgPct;
    int totalPoints;

    // 季后赛数据
    double playoffPPG;
    double playoffRPG;
    double playoffAPG;
    int playoffWins;
    int playoffLosses;

    // 巅峰赛季
    double peakPPG;
    std::string peakSeason;

    json toJson() const;
};

// 获取所有球员数据
const std::vector<PlayerData>& getAllPlayers();
