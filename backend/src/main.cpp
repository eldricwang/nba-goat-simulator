#include "httplib.h"
#include "api.h"
#include "comments.h"
#include "auth.h"
#include "players.h"
#include <iostream>
#include <string>
#include <cstdlib>
#include <csignal>
#include <sqlite3.h>

// 全局服务器指针，用于信号处理优雅退出
static httplib::Server* g_svr = nullptr;

static void signalHandler(int signum) {
    std::cout << "\n[INFO] Received signal " << signum << ", shutting down..." << std::endl;
    stopAutoUpdate();
    if (g_svr) {
        g_svr->stop();
    }
}

int main(int argc, char* argv[]) {
    // 默认端口 8080，可通过命令行参数或环境变量修改
    int port = 8080;
    if (argc > 1) {
        port = std::atoi(argv[1]);
    } else {
        const char* envPort = std::getenv("PORT");
        if (envPort) {
            port = std::atoi(envPort);
        }
    }

    // 自动更新配置：可通过环境变量调整
    // UPDATE_INTERVAL: 更新间隔（小时），默认 24
    // UPDATE_SCRIPT: Python 脚本路径，默认 /data/scripts/fetch_players.py
    // UPDATE_JSON: JSON 输出路径，默认 data/players.json
    int updateInterval = 24;
    std::string updateScript = "/data/scripts/fetch_players.py";
    std::string updateJson = "data/players.json";

    const char* envInterval = std::getenv("UPDATE_INTERVAL");
    if (envInterval) {
        updateInterval = std::atoi(envInterval);
        if (updateInterval < 1) updateInterval = 24;
    }
    const char* envScript = std::getenv("UPDATE_SCRIPT");
    if (envScript) {
        updateScript = envScript;
    }
    const char* envJson = std::getenv("UPDATE_JSON");
    if (envJson) {
        updateJson = envJson;
    }

    // 注册信号处理器
    signal(SIGINT, signalHandler);
    signal(SIGTERM, signalHandler);

    // 打开共享数据库
    sqlite3* db = nullptr;
    int rc = sqlite3_open("nba_goat.db", &db);
    if (rc != SQLITE_OK) {
        std::cerr << "Cannot open database: " << sqlite3_errmsg(db) << std::endl;
        return 1;
    }

    // 初始化各模块（共享同一个数据库连接）
    CommentStore commentStore(db);
    UserStore userStore(db);

    // 创建 HTTP 服务器
    httplib::Server svr;
    g_svr = &svr;

    // 设置路由
    setupRoutes(svr, commentStore, userStore);

    std::cout << "🏀 NBA GOAT Simulator Backend" << std::endl;
    std::cout << "━━━━━━━━━━━━━━━━━━━━━━━━━━━━" << std::endl;
    std::cout << "Server starting on http://localhost:" << port << std::endl;
    std::cout << "API endpoints:" << std::endl;
    std::cout << "  GET  /api/health             - Health check" << std::endl;
    std::cout << "  GET  /api/players            - Get all players" << std::endl;
    std::cout << "  POST /api/rankings           - Calculate rankings" << std::endl;
    std::cout << "  GET  /api/presets            - Get weight presets" << std::endl;
    std::cout << "  GET  /api/comments           - Get comments" << std::endl;
    std::cout << "  POST /api/comments           - Add comment" << std::endl;
    std::cout << "  POST /api/auth/register      - Register" << std::endl;
    std::cout << "  POST /api/auth/login         - Login" << std::endl;
    std::cout << "  GET  /api/auth/me            - Current user" << std::endl;
    std::cout << "  POST /api/players/update      - Trigger data update" << std::endl;
    std::cout << "  GET  /api/players/update-status - Update status" << std::endl;
    std::cout << "  GET  /api/players/search       - Search players" << std::endl;
    std::cout << "  GET  /api/players/detail/:id   - Player detail" << std::endl;
    std::cout << "━━━━━━━━━━━━━━━━━━━━━━━━━━━━" << std::endl;
    std::cout << "Auto-update: every " << updateInterval << "h" << std::endl;
    std::cout << "  Script: " << updateScript << std::endl;
    std::cout << "  JSON:   " << updateJson << std::endl;
    std::cout << "━━━━━━━━━━━━━━━━━━━━━━━━━━━━" << std::endl;

    // 启动后台自动更新线程
    startAutoUpdate(updateScript, updateJson, updateInterval);

    if (!svr.listen("0.0.0.0", port)) {
        std::cerr << "Error: Failed to start server on port " << port << std::endl;
        stopAutoUpdate();
        sqlite3_close(db);
        return 1;
    }

    // 服务器停止后，清理资源
    stopAutoUpdate();
    sqlite3_close(db);
    return 0;
}
