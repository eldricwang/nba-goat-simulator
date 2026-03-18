#pragma once
#include "json.hpp"
#include <sqlite3.h>
#include <string>
#include <vector>

using json = nlohmann::json;

class CommentStore {
public:
    CommentStore(const std::string& dbPath = "comments.db");
    ~CommentStore();

    // 获取评论列表 (最新50条)
    json getComments(int limit = 50);

    // 添加评论
    json addComment(const std::string& nickname, const std::string& content, 
                    const std::string& teamName = "");

private:
    sqlite3* db_ = nullptr;
    void initDB();
};
