#pragma once
#include <string>
#include <vector>
#include <functional>
#include "json.hpp"

using json = nlohmann::json;

struct PlayerData {
    int id;
    int nbaId;                  // NBA 官方球员 ID
    std::string name;
    std::string nameEn;
    std::string position;
    std::string era;
    std::vector<std::string> teams;
    std::string avatar;
    bool isActive;              // 是否现役
    bool hasDetailedStats;      // 是否有详细数据

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

    // 从 JSON 对象构造
    static PlayerData fromJson(const json& j);
};

// 更新状态信息
struct UpdateStatus {
    bool isUpdating;           // 是否正在更新
    std::string lastUpdateTime; // 上次更新时间
    std::string lastResult;     // 上次更新结果 ("success" / "failed" / "never")
    std::string lastError;      // 上次失败原因
    int updateCount;            // 累计更新次数
    int playerCount;            // 当前球员数量
    int intervalHours;          // 更新间隔（小时）

    json toJson() const;
};

// 搜索筛选参数
struct PlayerSearchParams {
    std::string keyword;     // 搜索关键词（中文名/英文名模糊匹配）
    std::string position;    // 位置筛选（如 "PG", "SG", "SF", "PF", "C"）
    std::string team;        // 球队筛选
    bool activeOnly;         // 只看现役球员
    bool hasStatsOnly;       // 只看有详细数据的球员
    std::string sortBy;      // 排序字段: "ppg", "rpg", "apg", "championships", "mvp", "name" 等
    bool sortDesc;           // 是否降序
    int page;                // 页码，从 1 开始
    int pageSize;            // 每页数量
    
    PlayerSearchParams()
        : activeOnly(false), hasStatsOnly(false), sortBy("ppg"), sortDesc(true),
          page(1), pageSize(20) {}
};

// 搜索结果
struct PlayerSearchResult {
    std::vector<PlayerData> players;
    int total;       // 符合条件的总数
    int page;        // 当前页
    int pageSize;    // 每页数量
    int totalPages;  // 总页数

    json toJson() const;
};

// 获取所有球员数据（线程安全，返回快照副本）
std::vector<PlayerData> getAllPlayers();

// 搜索球员（支持关键词、筛选、分页、排序）
PlayerSearchResult searchPlayers(const PlayerSearchParams& params);

// 根据 nbaId 获取单个球员
PlayerData* findPlayerByNbaId(int nbaId);

// 从指定 JSON 文件加载球员数据
bool loadPlayersFromFile(const std::string& filepath);

// 手动触发一次数据更新（非阻塞，在后台线程执行）
// 返回 false 表示已有更新在进行中
bool triggerUpdate();

// 启动后台自动更新线程
// scriptPath: Python 抓取脚本路径
// jsonPath: JSON 数据文件输出路径
// intervalHours: 更新间隔（小时），默认 24
void startAutoUpdate(const std::string& scriptPath, const std::string& jsonPath, int intervalHours = 24);

// 停止后台自动更新线程
void stopAutoUpdate();

// 获取更新状态
UpdateStatus getUpdateStatus();
