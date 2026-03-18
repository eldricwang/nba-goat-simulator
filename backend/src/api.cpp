#include "api.h"
#include "players.h"
#include "calculator.h"
#include <iostream>

// 设置 CORS 头
static void setCorsHeaders(httplib::Response& res) {
    res.set_header("Access-Control-Allow-Origin", "*");
    res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set_header("Access-Control-Allow-Headers", "Content-Type");
}

void setupRoutes(httplib::Server& svr, CommentStore& commentStore) {
    
    // CORS preflight
    svr.Options(R"(/api/.*)", [](const httplib::Request&, httplib::Response& res) {
        setCorsHeaders(res);
        res.status = 204;
    });

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

    // POST /api/comments - 发表评论
    svr.Post("/api/comments", [&commentStore](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        try {
            json body = json::parse(req.body);
            
            std::string nickname = body.value("nickname", "");
            std::string content = body.value("content", "");
            std::string teamName = body.value("team_name", "");

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
}
