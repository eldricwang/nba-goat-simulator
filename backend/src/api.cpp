#include "api.h"
#include "players.h"
#include "calculator.h"
#include "logger.h"
#include <iostream>
#include <chrono>
#include <sstream>

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

// 从请求中提取客户端 IP（支持 X-Real-IP / X-Forwarded-For）
static std::string getClientIp(const httplib::Request& req) {
    auto it = req.headers.find("X-Real-IP");
    if (it != req.headers.end() && !it->second.empty()) {
        return it->second;
    }
    it = req.headers.find("X-Forwarded-For");
    if (it != req.headers.end() && !it->second.empty()) {
        // X-Forwarded-For 可能有多个 IP，取第一个
        auto pos = it->second.find(',');
        if (pos != std::string::npos) {
            return it->second.substr(0, pos);
        }
        return it->second;
    }
    return req.remote_addr;
}

// 构造请求上下文（每个请求调用一次）
static RequestContext buildRequestContext(const httplib::Request& req, UserStore* userStore = nullptr) {
    RequestContext ctx;
    ctx.requestId = Logger::generateRequestId();
    ctx.method = req.method;
    ctx.path = req.path;
    ctx.clientIp = getClientIp(req);

    // 尝试从 token 中解析用户
    if (userStore) {
        std::string token = getTokenFromRequest(req);
        if (!token.empty()) {
            auto user = userStore->verifyToken(token);
            if (user) {
                ctx.userId = std::to_string(user->id);
            }
        }
    }

    return ctx;
}

// 获取请求的查询字符串（用于日志）
static std::string getQueryString(const httplib::Request& req) {
    std::ostringstream oss;
    bool first = true;
    for (const auto& param : req.params) {
        if (!first) oss << "&";
        oss << param.first << "=" << param.second;
        first = false;
    }
    return oss.str();
}

// 获取当前时间（毫秒级）
static long long nowMs() {
    return std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::steady_clock::now().time_since_epoch()).count();
}

void setupRoutes(httplib::Server& svr, CommentStore& commentStore, UserStore& userStore) {
    
    // ====== 全局请求/响应日志 ======
    // httplib 的 set_pre_routing_handler 可以在每个请求前执行
    svr.set_logger([](const httplib::Request& req, const httplib::Response& res) {
        // httplib 的 logger 在响应发送后调用，但我们用自己的方案在路由内记录
        // 这里留空，用路由内的日志代替
    });

    // CORS preflight
    svr.Options(R"(/api/.*)", [](const httplib::Request&, httplib::Response& res) {
        setCorsHeaders(res);
        res.status = 204;
    });

    // ====== Auth 路由 ======

    // POST /api/auth/register - 注册
    svr.Post("/api/auth/register", [&userStore](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        auto start = nowMs();
        RequestContext ctx = buildRequestContext(req);
        Logger::instance().logRequest(ctx);

        try {
            json body = json::parse(req.body);
            std::string username = body.value("username", "");
            std::string password = body.value("password", "");
            std::string nickname = body.value("nickname", "");

            LOG_INFO_CTX("AUTH", "Register attempt: username=" + username + ", nickname=" + nickname, &ctx);

            json result = userStore.registerUser(username, password, nickname);
            if (result.contains("error")) {
                res.status = 400;
                LOG_WARN_CTX("AUTH", "Register failed: " + result["error"].get<std::string>(), &ctx);
            } else {
                LOG_INFO_CTX("AUTH", "Register success: username=" + username, &ctx);
            }
            res.set_content(result.dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            LOG_ERROR_CTX("AUTH", std::string("Register exception: ") + e.what(), &ctx);
            res.set_content(json{{"error", e.what()}}.dump(), "application/json");
        }

        Logger::instance().logResponse(ctx, res.status, nowMs() - start);
    });

    // POST /api/auth/login - 登录
    svr.Post("/api/auth/login", [&userStore](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        auto start = nowMs();
        RequestContext ctx = buildRequestContext(req);
        Logger::instance().logRequest(ctx);

        try {
            json body = json::parse(req.body);
            std::string username = body.value("username", "");
            std::string password = body.value("password", "");

            LOG_INFO_CTX("AUTH", "Login attempt: username=" + username, &ctx);

            json result = userStore.loginUser(username, password);
            if (result.contains("error")) {
                res.status = 401;
                LOG_WARN_CTX("AUTH", "Login failed: " + result["error"].get<std::string>() + " (username=" + username + ")", &ctx);
            } else {
                std::string uid = std::to_string(result["user"]["id"].get<int>());
                LOG_INFO_CTX("AUTH", "Login success: username=" + username + ", userId=" + uid, &ctx);
            }
            res.set_content(result.dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            LOG_ERROR_CTX("AUTH", std::string("Login exception: ") + e.what(), &ctx);
            res.set_content(json{{"error", e.what()}}.dump(), "application/json");
        }

        Logger::instance().logResponse(ctx, res.status, nowMs() - start);
    });

    // GET /api/auth/me - 获取当前登录用户信息
    svr.Get("/api/auth/me", [&userStore](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        auto start = nowMs();
        RequestContext ctx = buildRequestContext(req, &userStore);
        Logger::instance().logRequest(ctx);

        std::string token = getTokenFromRequest(req);
        if (token.empty()) {
            res.status = 401;
            LOG_WARN_CTX("AUTH", "Auth/me: no token provided", &ctx);
            res.set_content(json{{"error", "未登录"}}.dump(), "application/json");
            Logger::instance().logResponse(ctx, res.status, nowMs() - start);
            return;
        }

        auto user = userStore.verifyToken(token);
        if (!user) {
            res.status = 401;
            LOG_WARN_CTX("AUTH", "Auth/me: invalid or expired token", &ctx);
            res.set_content(json{{"error", "登录已过期，请重新登录"}}.dump(), "application/json");
            Logger::instance().logResponse(ctx, res.status, nowMs() - start);
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

        Logger::instance().logResponse(ctx, res.status, nowMs() - start);
    });

    // GET /api/auth/profile - 获取当前用户完整资料
    svr.Get("/api/auth/profile", [&userStore](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        auto start = nowMs();
        RequestContext ctx = buildRequestContext(req, &userStore);
        Logger::instance().logRequest(ctx);

        std::string token = getTokenFromRequest(req);
        if (token.empty()) {
            res.status = 401;
            res.set_content(json{{"error", "未登录"}}.dump(), "application/json");
            Logger::instance().logResponse(ctx, res.status, nowMs() - start);
            return;
        }

        auto user = userStore.verifyToken(token);
        if (!user) {
            res.status = 401;
            res.set_content(json{{"error", "登录已过期，请重新登录"}}.dump(), "application/json");
            Logger::instance().logResponse(ctx, res.status, nowMs() - start);
            return;
        }

        json profile = userStore.getUserProfile(user->id);
        if (profile.contains("error")) {
            res.status = 404;
            LOG_WARN_CTX("AUTH", "Profile not found for userId=" + std::to_string(user->id), &ctx);
        }
        res.set_content(profile.dump(), "application/json");

        Logger::instance().logResponse(ctx, res.status, nowMs() - start);
    });

    // PUT /api/auth/profile - 更新当前用户资料
    svr.Put("/api/auth/profile", [&userStore](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        auto start = nowMs();
        RequestContext ctx = buildRequestContext(req, &userStore);
        Logger::instance().logRequest(ctx);

        std::string token = getTokenFromRequest(req);
        if (token.empty()) {
            res.status = 401;
            res.set_content(json{{"error", "未登录"}}.dump(), "application/json");
            Logger::instance().logResponse(ctx, res.status, nowMs() - start);
            return;
        }

        auto user = userStore.verifyToken(token);
        if (!user) {
            res.status = 401;
            res.set_content(json{{"error", "登录已过期，请重新登录"}}.dump(), "application/json");
            Logger::instance().logResponse(ctx, res.status, nowMs() - start);
            return;
        }

        try {
            json body = json::parse(req.body);
            LOG_INFO_CTX("AUTH", "Profile update for userId=" + std::to_string(user->id), &ctx);
            json result = userStore.updateUserProfile(user->id, body);
            if (result.contains("error")) {
                res.status = 400;
                LOG_WARN_CTX("AUTH", "Profile update failed: " + result["error"].get<std::string>(), &ctx);
            }
            res.set_content(result.dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            LOG_ERROR_CTX("AUTH", std::string("Profile update exception: ") + e.what(), &ctx);
            res.set_content(json{{"error", e.what()}}.dump(), "application/json");
        }

        Logger::instance().logResponse(ctx, res.status, nowMs() - start);
    });

    // ====== 球员数据路由 ======

    // GET /api/players - 获取所有球员数据
    svr.Get("/api/players", [&userStore](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        auto start = nowMs();
        RequestContext ctx = buildRequestContext(req, &userStore);
        Logger::instance().logRequest(ctx);

        const auto& players = getAllPlayers();
        json result = json::array();
        for (const auto& p : players) {
            result.push_back(p.toJson());
        }

        LOG_INFO_CTX("PLAYER", "Get all players: count=" + std::to_string(players.size()), &ctx);
        res.set_content(result.dump(), "application/json");

        Logger::instance().logResponse(ctx, res.status, nowMs() - start);
    });

    // GET /api/players/search - 搜索球员（支持分页、筛选、排序）
    svr.Get("/api/players/search", [&userStore](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        auto start = nowMs();
        RequestContext ctx = buildRequestContext(req, &userStore);
        std::string qs = getQueryString(req);
        Logger::instance().logRequest(ctx, qs);

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

        LOG_INFO_CTX("PLAYER", "Search: keyword=" + params.keyword
            + " position=" + params.position
            + " team=" + params.team
            + " sortBy=" + params.sortBy
            + " page=" + std::to_string(params.page)
            + " pageSize=" + std::to_string(params.pageSize), &ctx);

        auto result = searchPlayers(params);

        LOG_INFO_CTX("PLAYER", "Search result: total=" + std::to_string(result.total)
            + " page=" + std::to_string(result.page)
            + "/" + std::to_string(result.totalPages)
            + " returned=" + std::to_string(result.players.size()), &ctx);

        res.set_content(result.toJson().dump(), "application/json");

        Logger::instance().logResponse(ctx, res.status, nowMs() - start);
    });

    // GET /api/players/detail/:nbaId - 根据 NBA ID 获取单个球员详情
    svr.Get(R"(/api/players/detail/(\d+))", [&userStore](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        auto start = nowMs();
        RequestContext ctx = buildRequestContext(req, &userStore);
        Logger::instance().logRequest(ctx);

        int nbaId = 0;
        try {
            nbaId = std::stoi(req.matches[1]);
        } catch (...) {
            res.status = 400;
            LOG_WARN_CTX("PLAYER", "Invalid player ID in URL: " + std::string(req.matches[1]), &ctx);
            res.set_content(json{{"error", "Invalid player ID"}}.dump(), "application/json");
            Logger::instance().logResponse(ctx, res.status, nowMs() - start);
            return;
        }

        LOG_INFO_CTX("PLAYER", "Get player detail: nbaId=" + std::to_string(nbaId), &ctx);

        PlayerData* player = findPlayerByNbaId(nbaId);
        if (player) {
            LOG_INFO_CTX("PLAYER", "Player found: " + player->nameEn + " (" + player->name + ")", &ctx);
            res.set_content(player->toJson().dump(), "application/json");
            delete player;
        } else {
            res.status = 404;
            LOG_WARN_CTX("PLAYER", "Player not found: nbaId=" + std::to_string(nbaId), &ctx);
            res.set_content(json{{"error", "Player not found"}}.dump(), "application/json");
        }

        Logger::instance().logResponse(ctx, res.status, nowMs() - start);
    });

    // POST /api/rankings - 根据权重计算排名
    svr.Post("/api/rankings", [&userStore](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        auto start = nowMs();
        RequestContext ctx = buildRequestContext(req, &userStore);
        Logger::instance().logRequest(ctx);

        try {
            json body = json::parse(req.body);
            WeightConfig weights;
            if (body.contains("weights")) {
                weights = WeightConfig::fromJson(body["weights"]);
            }

            const auto& players = getAllPlayers();
            LOG_INFO_CTX("RANKING", "Calculate rankings: playerCount=" + std::to_string(players.size()), &ctx);

            auto rankings = calculateRankings(players, weights);

            json result = json::array();
            for (const auto& r : rankings) {
                result.push_back(r.toJson());
            }

            LOG_INFO_CTX("RANKING", "Rankings calculated: resultCount=" + std::to_string(rankings.size()), &ctx);
            res.set_content(result.dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            LOG_ERROR_CTX("RANKING", std::string("Rankings exception: ") + e.what(), &ctx);
            res.set_content(json{{"error", e.what()}}.dump(), "application/json");
        }

        Logger::instance().logResponse(ctx, res.status, nowMs() - start);
    });

    // GET /api/presets - 获取预设权重方案
    svr.Get("/api/presets", [](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        auto start = nowMs();
        RequestContext ctx = buildRequestContext(req);
        Logger::instance().logRequest(ctx);

        json presets = getPresetsJson();
        res.set_content(presets.dump(), "application/json");

        Logger::instance().logResponse(ctx, res.status, nowMs() - start);
    });

    // GET /api/comments - 获取评论列表
    svr.Get("/api/comments", [&commentStore, &userStore](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        auto start = nowMs();
        RequestContext ctx = buildRequestContext(req, &userStore);
        Logger::instance().logRequest(ctx);

        json comments = commentStore.getComments(50);
        LOG_INFO_CTX("COMMENT", "Get comments: count=" + std::to_string(comments.size()), &ctx);
        res.set_content(comments.dump(), "application/json");

        Logger::instance().logResponse(ctx, res.status, nowMs() - start);
    });

    // POST /api/comments - 发表评论
    svr.Post("/api/comments", [&commentStore, &userStore](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        auto start = nowMs();
        RequestContext ctx = buildRequestContext(req, &userStore);
        Logger::instance().logRequest(ctx);

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
                LOG_WARN_CTX("COMMENT", "Add comment failed: empty nickname or content", &ctx);
                res.set_content(json{{"error", "昵称和内容不能为空"}}.dump(), "application/json");
                Logger::instance().logResponse(ctx, res.status, nowMs() - start);
                return;
            }

            LOG_INFO_CTX("COMMENT", "Add comment: nickname=" + nickname + ", contentLen=" + std::to_string(content.size()), &ctx);

            json result = commentStore.addComment(nickname, content, teamName);
            if (result.contains("error")) {
                res.status = 400;
                LOG_WARN_CTX("COMMENT", "Add comment failed: " + result["error"].get<std::string>(), &ctx);
            } else {
                LOG_INFO_CTX("COMMENT", "Comment added successfully", &ctx);
            }
            res.set_content(result.dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            LOG_ERROR_CTX("COMMENT", std::string("Add comment exception: ") + e.what(), &ctx);
            res.set_content(json{{"error", e.what()}}.dump(), "application/json");
        }

        Logger::instance().logResponse(ctx, res.status, nowMs() - start);
    });

    // 健康检查
    svr.Get("/api/health", [](const httplib::Request&, httplib::Response& res) {
        setCorsHeaders(res);
        res.set_content(json{{"status", "ok"}, {"service", "nba-goat-backend"}}.dump(), "application/json");
    });

    // ====== 数据更新路由 ======

    // POST /api/players/update - 手动触发球员数据更新
    svr.Post("/api/players/update", [&userStore](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        auto start = nowMs();
        RequestContext ctx = buildRequestContext(req, &userStore);
        Logger::instance().logRequest(ctx);

        LOG_INFO_CTX("UPDATE", "Manual update triggered", &ctx);

        bool ok = triggerUpdate();
        if (ok) {
            LOG_INFO_CTX("UPDATE", "Update triggered successfully", &ctx);
            res.set_content(json{
                {"status", "ok"},
                {"message", "数据更新已触发，正在后台执行"}
            }.dump(), "application/json");
        } else {
            res.status = 409;
            LOG_WARN_CTX("UPDATE", "Update rejected: already in progress", &ctx);
            res.set_content(json{
                {"status", "busy"},
                {"message", "数据更新正在进行中，请稍后再试"}
            }.dump(), "application/json");
        }

        Logger::instance().logResponse(ctx, res.status, nowMs() - start);
    });

    // GET /api/players/update-status - 查询数据更新状态
    svr.Get("/api/players/update-status", [](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        auto start = nowMs();
        RequestContext ctx = buildRequestContext(req);
        Logger::instance().logRequest(ctx);

        UpdateStatus status = getUpdateStatus();
        res.set_content(status.toJson().dump(), "application/json");

        Logger::instance().logResponse(ctx, res.status, nowMs() - start);
    });
}
