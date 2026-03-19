#include "players.h"
#include "logger.h"
#include <fstream>
#include <iostream>
#include <mutex>
#include <shared_mutex>
#include <thread>
#include <atomic>
#include <condition_variable>
#include <chrono>
#include <ctime>
#include <sstream>
#include <cstdlib>
#include <array>
#include <algorithm>
#include <cctype>

// ============================================
// 全局状态（读写锁保护的球员数据）
// ============================================
static std::vector<PlayerData> g_players;
static std::shared_mutex g_dataMutex;  // 读写锁：读多写少场景
static bool g_initialLoaded = false;

// ============================================
// 更新状态
// ============================================
static std::mutex g_statusMutex;
static UpdateStatus g_status = {
    false,    // isUpdating
    "",       // lastUpdateTime
    "never",  // lastResult
    "",       // lastError
    0,        // updateCount
    0,        // playerCount
    24        // intervalHours
};

// ============================================
// 后台更新线程相关
// ============================================
static std::thread g_updateThread;
static std::atomic<bool> g_running{false};
static std::condition_variable g_cv;
static std::mutex g_cvMutex;
static std::atomic<bool> g_triggerNow{false};  // 手动触发标志

// 脚本和数据文件路径
static std::string g_scriptPath;
static std::string g_jsonPath;

// ============================================
// 工具函数
// ============================================

static std::string getCurrentTimeStr() {
    auto now = std::chrono::system_clock::now();
    auto t = std::chrono::system_clock::to_time_t(now);
    std::tm tm_buf;
    localtime_r(&t, &tm_buf);
    char buf[64];
    strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", &tm_buf);
    return std::string(buf);
}

// 执行命令并获取输出
static std::pair<int, std::string> execCommand(const std::string& cmd) {
    std::string output;
    std::array<char, 256> buffer;

    FILE* pipe = popen((cmd + " 2>&1").c_str(), "r");
    if (!pipe) {
        return {-1, "Failed to execute command"};
    }

    while (fgets(buffer.data(), buffer.size(), pipe) != nullptr) {
        output += buffer.data();
    }

    int exitCode = pclose(pipe);
    // pclose 返回的是 wait status，需要用 WEXITSTATUS 提取退出码
    if (WIFEXITED(exitCode)) {
        exitCode = WEXITSTATUS(exitCode);
    }

    return {exitCode, output};
}

// ============================================
// PlayerData 序列化
// ============================================

json PlayerData::toJson() const {
    return json{
        {"id", id},
        {"nbaId", nbaId},
        {"name", name},
        {"nameEn", nameEn},
        {"position", position},
        {"era", era},
        {"teams", teams},
        {"avatar", avatar},
        {"isActive", isActive},
        {"hasDetailedStats", hasDetailedStats},
        {"championships", championships},
        {"mvp", mvp},
        {"fmvp", fmvp},
        {"allStar", allStar},
        {"allNBA1st", allNBA1st},
        {"allNBA2nd", allNBA2nd},
        {"allNBA3rd", allNBA3rd},
        {"allDefense", allDefense},
        {"dpoy", dpoy},
        {"scoringTitle", scoringTitle},
        {"assistTitle", assistTitle},
        {"reboundTitle", reboundTitle},
        {"allStarMVP", allStarMVP},
        {"roy", roy},
        {"gamesPlayed", gamesPlayed},
        {"ppg", ppg},
        {"rpg", rpg},
        {"apg", apg},
        {"spg", spg},
        {"bpg", bpg},
        {"fgPct", fgPct},
        {"totalPoints", totalPoints},
        {"playoffPPG", playoffPPG},
        {"playoffRPG", playoffRPG},
        {"playoffAPG", playoffAPG},
        {"playoffWins", playoffWins},
        {"playoffLosses", playoffLosses},
        {"peakPPG", peakPPG},
        {"peakSeason", peakSeason}
    };
}

PlayerData PlayerData::fromJson(const json& j) {
    PlayerData p;
    p.id = j.value("id", 0);
    p.nbaId = j.value("nbaId", 0);
    p.name = j.value("name", "");
    p.nameEn = j.value("nameEn", "");
    p.position = j.value("position", "");
    p.era = j.value("era", "");
    p.avatar = j.value("avatar", "");
    p.isActive = j.value("isActive", false);
    p.hasDetailedStats = j.value("hasDetailedStats", false);

    // teams 数组
    if (j.contains("teams") && j["teams"].is_array()) {
        for (const auto& t : j["teams"]) {
            p.teams.push_back(t.get<std::string>());
        }
    }

    // 荣誉
    p.championships = j.value("championships", 0);
    p.mvp = j.value("mvp", 0);
    p.fmvp = j.value("fmvp", 0);
    p.allStar = j.value("allStar", 0);
    p.allNBA1st = j.value("allNBA1st", 0);
    p.allNBA2nd = j.value("allNBA2nd", 0);
    p.allNBA3rd = j.value("allNBA3rd", 0);
    p.allDefense = j.value("allDefense", 0);
    p.dpoy = j.value("dpoy", 0);
    p.scoringTitle = j.value("scoringTitle", 0);
    p.assistTitle = j.value("assistTitle", 0);
    p.reboundTitle = j.value("reboundTitle", 0);
    p.allStarMVP = j.value("allStarMVP", 0);
    p.roy = j.value("roy", 0);

    // 常规赛数据
    p.gamesPlayed = j.value("gamesPlayed", 0);
    p.ppg = j.value("ppg", 0.0);
    p.rpg = j.value("rpg", 0.0);
    p.apg = j.value("apg", 0.0);
    p.spg = j.value("spg", 0.0);
    p.bpg = j.value("bpg", 0.0);
    p.fgPct = j.value("fgPct", 0.0);
    p.totalPoints = j.value("totalPoints", 0);

    // 季后赛数据
    p.playoffPPG = j.value("playoffPPG", 0.0);
    p.playoffRPG = j.value("playoffRPG", 0.0);
    p.playoffAPG = j.value("playoffAPG", 0.0);
    p.playoffWins = j.value("playoffWins", 0);
    p.playoffLosses = j.value("playoffLosses", 0);

    // 巅峰赛季
    p.peakPPG = j.value("peakPPG", 0.0);
    p.peakSeason = j.value("peakSeason", "");

    return p;
}

// ============================================
// UpdateStatus 序列化
// ============================================

json UpdateStatus::toJson() const {
    return json{
        {"isUpdating", isUpdating},
        {"lastUpdateTime", lastUpdateTime},
        {"lastResult", lastResult},
        {"lastError", lastError},
        {"updateCount", updateCount},
        {"playerCount", playerCount},
        {"intervalHours", intervalHours}
    };
}

// ============================================
// 数据加载（线程安全）
// ============================================

bool loadPlayersFromFile(const std::string& filepath) {
    LOG_INFO("DATA", "Loading players from file: " + filepath);

    std::ifstream file(filepath);
    if (!file.is_open()) {
        LOG_ERROR("DATA", "Cannot open players data file: " + filepath);
        return false;
    }

    try {
        json data = json::parse(file);
        if (!data.is_array()) {
            LOG_ERROR("DATA", "Players data file is not a JSON array: " + filepath);
            return false;
        }

        // 先解析到临时 vector，避免持有写锁时做 JSON 解析
        std::vector<PlayerData> newPlayers;
        newPlayers.reserve(data.size());
        int parseErrors = 0;
        for (size_t i = 0; i < data.size(); i++) {
            try {
                newPlayers.push_back(PlayerData::fromJson(data[i]));
            } catch (const std::exception& e) {
                parseErrors++;
                if (parseErrors <= 5) {
                    LOG_WARN("DATA", "Failed to parse player at index " + std::to_string(i) + ": " + e.what());
                }
            }
        }

        if (parseErrors > 0) {
            LOG_WARN("DATA", "Total parse errors: " + std::to_string(parseErrors) + " out of " + std::to_string(data.size()) + " records");
        }

        // 获取写锁，原子替换数据
        {
            std::unique_lock<std::shared_mutex> lock(g_dataMutex);
            g_players = std::move(newPlayers);
            g_initialLoaded = true;
        }

        LOG_INFO("DATA", "Successfully loaded " + std::to_string(g_players.size()) + " players from " + filepath);
        return true;

    } catch (const json::parse_error& e) {
        LOG_ERROR("DATA", "JSON parse error in " + filepath + ": " + std::string(e.what()));
        return false;
    } catch (const std::exception& e) {
        LOG_ERROR("DATA", "Error loading players from " + filepath + ": " + std::string(e.what()));
        return false;
    }
}

// 获取球员数据（读锁保护，返回副本）
std::vector<PlayerData> getAllPlayers() {
    // 如果还没初始加载过，先尝试加载
    {
        std::shared_lock<std::shared_mutex> lock(g_dataMutex);
        if (g_initialLoaded) {
            return g_players;  // 返回副本
        }
    }

    // 首次加载：尝试多个可能的路径
    static std::once_flag initFlag;
    std::call_once(initFlag, []() {
        std::vector<std::string> searchPaths = {
            "data/players.json",
            "./data/players.json",
            "../data/players.json",
            "/data/data/players.json",
            "/data/players.json",
            "players.json",
        };

        for (const auto& path : searchPaths) {
            if (loadPlayersFromFile(path)) {
                return;
            }
        }

        std::cerr << "[WARN] Could not load players.json from any path, using empty data" << std::endl;
        LOG_ERROR("DATA", "Could not load players.json from any search path! Using empty data. Searched: data/players.json, ./data/players.json, ../data/players.json, /data/data/players.json, /data/players.json, players.json");
    });

    std::shared_lock<std::shared_mutex> lock(g_dataMutex);
    return g_players;
}

// ============================================
// 执行一次数据更新
// ============================================

static void doUpdate() {
    std::string timeStr = getCurrentTimeStr();
    LOG_INFO("UPDATE", "Starting player data update at " + timeStr);

    // 标记更新中
    {
        std::lock_guard<std::mutex> lock(g_statusMutex);
        g_status.isUpdating = true;
    }

    // 调用 Python 脚本
    std::string cmd = "python3 " + g_scriptPath + " --output " + g_jsonPath;
    LOG_INFO("UPDATE", "Running command: " + cmd);

    auto [exitCode, output] = execCommand(cmd);

    if (exitCode == 0) {
        // 脚本执行成功，重新加载 JSON 数据
        LOG_INFO("UPDATE", "Script executed successfully, reloading data...");
        if (loadPlayersFromFile(g_jsonPath)) {
            std::lock_guard<std::mutex> lock(g_statusMutex);
            g_status.isUpdating = false;
            g_status.lastUpdateTime = getCurrentTimeStr();
            g_status.lastResult = "success";
            g_status.lastError = "";
            g_status.updateCount++;
            // 读取球员数量
            {
                std::shared_lock<std::shared_mutex> dataLock(g_dataMutex);
                g_status.playerCount = static_cast<int>(g_players.size());
            }
            LOG_INFO("UPDATE", "Data update successful! " + std::to_string(g_status.playerCount) + " players loaded.");
        } else {
            std::lock_guard<std::mutex> lock(g_statusMutex);
            g_status.isUpdating = false;
            g_status.lastUpdateTime = getCurrentTimeStr();
            g_status.lastResult = "failed";
            g_status.lastError = "JSON file reload failed after script execution";
            LOG_ERROR("UPDATE", "Failed to reload JSON after successful script execution");
        }
    } else {
        // 提取脚本最后几行输出作为错误信息
        std::istringstream iss(output);
        std::string line;
        std::vector<std::string> lines;
        while (std::getline(iss, line)) {
            lines.push_back(line);
        }
        std::string lastLines;
        int start = std::max(0, static_cast<int>(lines.size()) - 10);
        for (int i = start; i < static_cast<int>(lines.size()); i++) {
            lastLines += lines[i] + "\n";
        }

        std::lock_guard<std::mutex> lock(g_statusMutex);
        g_status.isUpdating = false;
        g_status.lastUpdateTime = getCurrentTimeStr();
        g_status.lastResult = "failed";
        g_status.lastError = "Script exited with code " + std::to_string(exitCode);
        LOG_ERROR("UPDATE", "Script failed (exit code " + std::to_string(exitCode) + "): " + lastLines);
    }
}

// ============================================
// 后台更新线程
// ============================================

static void updateThreadFunc(int intervalHours) {
    LOG_INFO("UPDATE", "Auto-update thread started (interval: " + std::to_string(intervalHours) + " hours)");

    while (g_running.load()) {
        // 等待指定时间或被手动唤醒
        {
            std::unique_lock<std::mutex> lock(g_cvMutex);
            g_cv.wait_for(lock, std::chrono::hours(intervalHours), []() {
                return !g_running.load() || g_triggerNow.load();
            });
        }

        if (!g_running.load()) {
            break;
        }

        // 清除手动触发标志
        bool wasManual = g_triggerNow.exchange(false);
        if (wasManual) {
            LOG_INFO("UPDATE", "Manual update trigger received");
        }

        // 执行更新
        try {
            doUpdate();
        } catch (const std::exception& e) {
            LOG_ERROR("UPDATE", std::string("Exception during update: ") + e.what());
            std::lock_guard<std::mutex> lock(g_statusMutex);
            g_status.isUpdating = false;
            g_status.lastResult = "failed";
            g_status.lastError = std::string("Exception: ") + e.what();
        }
    }

    LOG_INFO("UPDATE", "Auto-update thread stopped");
}

// ============================================
// 公开接口
// ============================================

bool triggerUpdate() {
    // 检查是否已经在更新
    {
        std::lock_guard<std::mutex> lock(g_statusMutex);
        if (g_status.isUpdating) {
            return false;  // 已经在更新中
        }
    }

    if (g_running.load()) {
        // 有后台线程在跑，通过条件变量唤醒它
        g_triggerNow.store(true);
        g_cv.notify_one();
        LOG_INFO("UPDATE", "Manual update: signaled background thread");
    } else {
        // 没有后台线程，直接在新线程中执行一次
        LOG_INFO("UPDATE", "Manual update: spawning one-off update thread");
        std::thread([]() {
            try {
                doUpdate();
            } catch (const std::exception& e) {
                LOG_ERROR("UPDATE", std::string("Exception during manual update: ") + e.what());
            }
        }).detach();
    }
    return true;
}

void startAutoUpdate(const std::string& scriptPath, const std::string& jsonPath, int intervalHours) {
    // 如果已经在运行，先停止
    if (g_running.load()) {
        stopAutoUpdate();
    }

    g_scriptPath = scriptPath;
    g_jsonPath = jsonPath;

    {
        std::lock_guard<std::mutex> lock(g_statusMutex);
        g_status.intervalHours = intervalHours;
        // 初始化球员数量
        {
            std::shared_lock<std::shared_mutex> dataLock(g_dataMutex);
            g_status.playerCount = static_cast<int>(g_players.size());
        }
    }

    g_running.store(true);
    g_updateThread = std::thread(updateThreadFunc, intervalHours);

    LOG_INFO("UPDATE", "Auto-update started: script=" + scriptPath
        + ", json=" + jsonPath + ", interval=" + std::to_string(intervalHours) + "h");
}

void stopAutoUpdate() {
    if (!g_running.load()) return;

    g_running.store(false);
    g_cv.notify_one();

    if (g_updateThread.joinable()) {
        g_updateThread.join();
    }

    std::cout << "[UPDATE] Auto-update stopped" << std::endl;
    LOG_INFO("UPDATE", "Auto-update stopped");
}

UpdateStatus getUpdateStatus() {
    std::lock_guard<std::mutex> lock(g_statusMutex);
    return g_status;
}

// ============================================
// PlayerSearchResult 序列化
// ============================================

json PlayerSearchResult::toJson() const {
    json result;
    result["total"] = total;
    result["page"] = page;
    result["pageSize"] = pageSize;
    result["totalPages"] = totalPages;
    
    json playersJson = json::array();
    for (const auto& p : players) {
        playersJson.push_back(p.toJson());
    }
    result["players"] = playersJson;
    return result;
}

// ============================================
// 搜索功能
// ============================================

// 大小写无关的字符串包含检查
static bool containsIgnoreCase(const std::string& haystack, const std::string& needle) {
    if (needle.empty()) return true;
    if (haystack.empty()) return false;
    
    auto it = std::search(
        haystack.begin(), haystack.end(),
        needle.begin(), needle.end(),
        [](char ch1, char ch2) {
            return std::toupper(static_cast<unsigned char>(ch1)) == 
                   std::toupper(static_cast<unsigned char>(ch2));
        }
    );
    return it != haystack.end();
}

// 检查字符串是否以指定前缀开头（用于位置匹配，如 "PG" 匹配 "PG/SG"）
static bool positionMatches(const std::string& playerPos, const std::string& filterPos) {
    if (filterPos.empty()) return true;
    if (playerPos.empty()) return false;
    // 精确匹配或者包含匹配
    return playerPos == filterPos || 
           playerPos.find(filterPos) != std::string::npos ||
           containsIgnoreCase(playerPos, filterPos);
}

PlayerSearchResult searchPlayers(const PlayerSearchParams& params) {
    // 获取数据快照（通过 getAllPlayers 确保数据已加载）
    std::vector<PlayerData> allData = getAllPlayers();

    // 1. 筛选
    std::vector<PlayerData> filtered;
    filtered.reserve(allData.size());

    for (const auto& p : allData) {
        // 关键词匹配（中文名或英文名）
        if (!params.keyword.empty()) {
            if (!containsIgnoreCase(p.name, params.keyword) &&
                !containsIgnoreCase(p.nameEn, params.keyword)) {
                continue;
            }
        }

        // 位置筛选
        if (!params.position.empty() && !positionMatches(p.position, params.position)) {
            continue;
        }

        // 球队筛选
        if (!params.team.empty()) {
            bool found = false;
            for (const auto& t : p.teams) {
                if (containsIgnoreCase(t, params.team)) {
                    found = true;
                    break;
                }
            }
            if (!found) continue;
        }

        // 现役筛选
        if (params.activeOnly && !p.isActive) {
            continue;
        }

        // 有详细数据筛选
        if (params.hasStatsOnly && !p.hasDetailedStats) {
            continue;
        }

        filtered.push_back(p);
    }

    // 2. 排序
    auto getFieldValue = [](const PlayerData& p, const std::string& field) -> double {
        if (field == "ppg") return p.ppg;
        if (field == "rpg") return p.rpg;
        if (field == "apg") return p.apg;
        if (field == "spg") return p.spg;
        if (field == "bpg") return p.bpg;
        if (field == "fgPct") return p.fgPct;
        if (field == "totalPoints") return static_cast<double>(p.totalPoints);
        if (field == "gamesPlayed") return static_cast<double>(p.gamesPlayed);
        if (field == "championships") return static_cast<double>(p.championships);
        if (field == "mvp") return static_cast<double>(p.mvp);
        if (field == "fmvp") return static_cast<double>(p.fmvp);
        if (field == "allStar") return static_cast<double>(p.allStar);
        if (field == "playoffPPG") return p.playoffPPG;
        if (field == "playoffWins") return static_cast<double>(p.playoffWins);
        if (field == "peakPPG") return p.peakPPG;
        return 0.0;
    };

    if (params.sortBy == "name") {
        std::sort(filtered.begin(), filtered.end(),
            [&](const PlayerData& a, const PlayerData& b) {
                return params.sortDesc ? (a.nameEn > b.nameEn) : (a.nameEn < b.nameEn);
            });
    } else {
        std::sort(filtered.begin(), filtered.end(),
            [&](const PlayerData& a, const PlayerData& b) {
                double va = getFieldValue(a, params.sortBy);
                double vb = getFieldValue(b, params.sortBy);
                return params.sortDesc ? (va > vb) : (va < vb);
            });
    }

    // 3. 分页
    int total = static_cast<int>(filtered.size());
    int pageSize = std::max(1, std::min(params.pageSize, 100)); // 限制 1-100
    int totalPages = (total + pageSize - 1) / pageSize;
    int page = std::max(1, std::min(params.page, std::max(1, totalPages)));
    
    int startIdx = (page - 1) * pageSize;
    int endIdx = std::min(startIdx + pageSize, total);

    PlayerSearchResult result;
    result.total = total;
    result.page = page;
    result.pageSize = pageSize;
    result.totalPages = totalPages;

    if (startIdx < total) {
        result.players.assign(filtered.begin() + startIdx, filtered.begin() + endIdx);
    }

    return result;
}

// 根据 nbaId 查找球员（返回 nullptr 如果未找到）
PlayerData* findPlayerByNbaId(int nbaId) {
    // 注意：这个函数返回指向全局数据的指针，调用者需要在读锁保护下使用
    // 这里简化处理，返回副本
    std::shared_lock<std::shared_mutex> lock(g_dataMutex);
    for (auto& p : g_players) {
        if (p.nbaId == nbaId) {
            // 返回一个堆上的副本
            return new PlayerData(p);
        }
    }
    return nullptr;
}
