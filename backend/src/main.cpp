#include "httplib.h"
#include "api.h"
#include "comments.h"
#include <iostream>
#include <string>
#include <cstdlib>

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

    // 初始化评论存储
    CommentStore commentStore("comments.db");

    // 创建 HTTP 服务器
    httplib::Server svr;

    // 设置路由
    setupRoutes(svr, commentStore);

    std::cout << "🏀 NBA GOAT Simulator Backend" << std::endl;
    std::cout << "━━━━━━━━━━━━━━━━━━━━━━━━━━━━" << std::endl;
    std::cout << "Server starting on http://localhost:" << port << std::endl;
    std::cout << "API endpoints:" << std::endl;
    std::cout << "  GET  /api/health    - Health check" << std::endl;
    std::cout << "  GET  /api/players   - Get all players" << std::endl;
    std::cout << "  POST /api/rankings  - Calculate rankings" << std::endl;
    std::cout << "  GET  /api/presets   - Get weight presets" << std::endl;
    std::cout << "  GET  /api/comments  - Get comments" << std::endl;
    std::cout << "  POST /api/comments  - Add comment" << std::endl;
    std::cout << "━━━━━━━━━━━━━━━━━━━━━━━━━━━━" << std::endl;

    if (!svr.listen("0.0.0.0", port)) {
        std::cerr << "Error: Failed to start server on port " << port << std::endl;
        return 1;
    }

    return 0;
}
