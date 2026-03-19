#include "api.h"
#include "players.h"
#include "calculator.h"
#include <iostream>

// 设置 CORS 头
static void setCorsHeaders(httplib::Response& res) {
    res.set_header("Access-Control-Allow-Origin", "*");
    res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
    res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

// 从请求头中提取 token
static std::string getTokenFromRequest(const httplib::Request& req) {
    auto it = req.headers.find("Authorization");
    if (it != req.headers.end()) {
        const std::string& auth = it->second;
        if (auth.substr(0, 7) == "Bearer ") {
            return auth.substr(7);
        }
    }
    return "";
}

void setupRoutes(httplib::Server& svr, CommentStore& commentStore, UserStore& userStore) {
    
    // CORS preflight
    svr.Options(R"(/api/.*)", [](const httplib::Request&, httplib::Response& res) {
        setCorsHeaders(res);
        res.status = 204;
    });

    // ====== Auth 路由 ======

    // POST /api/auth/register - 注册
    svr.Post("/api/auth/register", [&userStore](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        try {
            json body = json::parse(req.body);
            std::string username = body.value("username", "");
            std::string password = body.value("password", "");
            std::string nickname = body.value("nickname", "");

            json result = userStore.registerUser(username, password, nickname);
            if (result.contains("error")) {
                res.status = 400;
            }
            res.set_content(result.dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(json{{"error", e.what()}}.dump(), "application/json");
        }
    });

    // POST /api/auth/login - 登录
    svr.Post("/api/auth/login", [&userStore](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        try {
            json body = json::parse(req.body);
            std::string username = body.value("username", "");
            std::string password = body.value("password", "");

            json result = userStore.loginUser(username, password);
            if (result.contains("error")) {
                res.status = 401;
            }
            res.set_content(result.dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(json{{"error", e.what()}}.dump(), "application/json");
        }
    });

    // GET /api/auth/me - 获取当前登录用户信息
    svr.Get("/api/auth/me", [&userStore](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        std::string token = getTokenFromRequest(req);
        if (token.empty()) {
            res.status = 401;
            res.set_content(json{{"error", "未登录"}}.dump(), "application/json");
            return;
        }

        auto user = userStore.verifyToken(token);
        if (!user) {
            res.status = 401;
            res.set_content(json{{"error", "登录已过期，请重新登录"}}.dump(), "application/json");
            return;
        }

        res.set_content(json{
            {"id", user->id},
            {"username", user->username},
            {"nickname", user->nickname},
            {"birthday", user->birthday},
            {"gender", user->gender},
            {"avatar_url", user->avatar_url},
            {"created_at", user->created_at}
        }.dump(), "application/json");
    });

    // GET /api/auth/profile - 获取当前用户完整资料
    svr.Get("/api/auth/profile", [&userStore](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        std::string token = getTokenFromRequest(req);
        if (token.empty()) {
            res.status = 401;
            res.set_content(json{{"error", "未登录"}}.dump(), "application/json");
            return;
        }

        auto user = userStore.verifyToken(token);
        if (!user) {
            res.status = 401;
            res.set_content(json{{"error", "登录已过期，请重新登录"}}.dump(), "application/json");
            return;
        }

        json profile = userStore.getUserProfile(user->id);
        if (profile.contains("error")) {
            res.status = 404;
        }
        res.set_content(profile.dump(), "application/json");
    });

    // PUT /api/auth/profile - 更新当前用户资料
    svr.Put("/api/auth/profile", [&userStore](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        std::string token = getTokenFromRequest(req);
        if (token.empty()) {
            res.status = 401;
            res.set_content(json{{"error", "未登录"}}.dump(), "application/json");
            return;
        }

        auto user = userStore.verifyToken(token);
        if (!user) {
            res.status = 401;
            res.set_content(json{{"error", "登录已过期，请重新登录"}}.dump(), "application/json");
            return;
        }

        try {
            json body = json::parse(req.body);
            json result = userStore.updateUserProfile(user->id, body);
            if (result.contains("error")) {
                res.status = 400;
            }
            res.set_content(result.dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(json{{"error", e.what()}}.dump(), "application/json");
        }
    });

    // ====== 原有路由 ======

    // GET /api/players - 获取所有球员数据
    svr.Get("/api/players", [](const httplib::Request&, httplib::Response& res) {
        setCorsHeaders(res);
        const auto& players = getAllPlayers();
        json result = json::array();
        for (const auto& p : players) {
            result.push_back(p.toJson());
        }
        res.set_content(result.dump(), "application/json");
    });

    // GET /api/players/search - 搜索球员（支持分页、筛选、排序）
    svr.Get("/api/players/search", [](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        
        PlayerSearchParams params;
        
        // 解析查询参数
        if (req.has_param("keyword")) {
            params.keyword = req.get_param_value("keyword");
        }
        if (req.has_param("position")) {
            params.position = req.get_param_value("position");
        }
        if (req.has_param("team")) {
            params.team = req.get_param_value("team");
        }
        if (req.has_param("activeOnly")) {
            params.activeOnly = req.get_param_value("activeOnly") == "true";
        }
        if (req.has_param("hasStatsOnly")) {
            params.hasStatsOnly = req.get_param_value("hasStatsOnly") == "true";
        }
        if (req.has_param("sortBy")) {
            params.sortBy = req.get_param_value("sortBy");
        }
        if (req.has_param("sortDesc")) {
            params.sortDesc = req.get_param_value("sortDesc") != "false";
        }
        if (req.has_param("page")) {
            try { params.page = std::stoi(req.get_param_value("page")); } catch (...) {}
        }
        if (req.has_param("pageSize")) {
            try { params.pageSize = std::stoi(req.get_param_value("pageSize")); } catch (...) {}
        }

        auto result = searchPlayers(params);
        res.set_content(result.toJson().dump(), "application/json");
    });

    // GET /api/players/:nbaId - 根据 NBA ID 获取单个球员详情
    svr.Get(R"(/api/players/detail/(\d+))", [](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        
        int nbaId = 0;
        try {
            nbaId = std::stoi(req.matches[1]);
        } catch (...) {
            res.status = 400;
            res.set_content(json{{"error", "Invalid player ID"}}.dump(), "application/json");
            return;
        }

        PlayerData* player = findPlayerByNbaId(nbaId);
        if (player) {
            res.set_content(player->toJson().dump(), "application/json");
            delete player;
        } else {
            res.status = 404;
            res.set_content(json{{"error", "Player not found"}}.dump(), "application/json");
        }
    });

    // POST /api/rankings - 根据权重计算排名
    svr.Post("/api/rankings", [](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        try {
            json body = json::parse(req.body);
            WeightConfig weights;
            if (body.contains("weights")) {
                weights = WeightConfig::fromJson(body["weights"]);
            }

            const auto& players = getAllPlayers();
            auto rankings = calculateRankings(players, weights);

            json result = json::array();
            for (const auto& r : rankings) {
                result.push_back(r.toJson());
            }
            res.set_content(result.dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(json{{"error", e.what()}}.dump(), "application/json");
        }
    });

    // GET /api/presets - 获取预设权重方案
    svr.Get("/api/presets", [](const httplib::Request&, httplib::Response& res) {
        setCorsHeaders(res);
        json presets = getPresetsJson();
        res.set_content(presets.dump(), "application/json");
    });

    // GET /api/comments - 获取评论列表
    svr.Get("/api/comments", [&commentStore](const httplib::Request&, httplib::Response& res) {
        setCorsHeaders(res);
        json comments = commentStore.getComments(50);
        res.set_content(comments.dump(), "application/json");
    });

    // POST /api/comments - 发表评论（支持登录用户自动填充昵称）
    svr.Post("/api/comments", [&commentStore, &userStore](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        try {
            json body = json::parse(req.body);
            
            std::string nickname = body.value("nickname", "");
            std::string content = body.value("content", "");
            std::string teamName = body.value("team_name", "");

            // 如果有 token，用登录用户的昵称
            std::string token = getTokenFromRequest(req);
            if (!token.empty()) {
                auto user = userStore.verifyToken(token);
                if (user) {
                    nickname = user->nickname;
                }
            }

            if (nickname.empty() || content.empty()) {
                res.status = 400;
                res.set_content(json{{"error", "昵称和内容不能为空"}}.dump(), "application/json");
                return;
            }

            json result = commentStore.addComment(nickname, content, teamName);
            if (result.contains("error")) {
                res.status = 400;
            }
            res.set_content(result.dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(json{{"error", e.what()}}.dump(), "application/json");
        }
    });

    // 健康检查
    svr.Get("/api/health", [](const httplib::Request&, httplib::Response& res) {
        setCorsHeaders(res);
        res.set_content(json{{"status", "ok"}, {"service", "nba-goat-backend"}}.dump(), "application/json");
    });

    // ====== 数据更新路由 ======

    // POST /api/players/update - 手动触发球员数据更新
    svr.Post("/api/players/update", [](const httplib::Request&, httplib::Response& res) {
        setCorsHeaders(res);
        bool ok = triggerUpdate();
        if (ok) {
            res.set_content(json{
                {"status", "ok"},
                {"message", "数据更新已触发，正在后台执行"}
            }.dump(), "application/json");
        } else {
            res.status = 409;  // Conflict
            res.set_content(json{
                {"status", "busy"},
                {"message", "数据更新正在进行中，请稍后再试"}
            }.dump(), "application/json");
        }
    });

    // GET /api/players/update-status - 查询数据更新状态
    svr.Get("/api/players/update-status", [](const httplib::Request&, httplib::Response& res) {
        setCorsHeaders(res);
        UpdateStatus status = getUpdateStatus();
        res.set_content(status.toJson().dump(), "application/json");
    });
}
