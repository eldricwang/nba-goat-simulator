#pragma once
#include "json.hpp"
#include <sqlite3.h>
#include <string>
#include <vector>

using json = nlohmann::json;

class CommentStore {
public:
    // 使用共享数据库连接
    CommentStore(sqlite3* db);

    // 获取评论列表 (最新50条)
    json getComments(int limit = 50);

    // 添加评论
    json addComment(const std::string& nickname, const std::string& content, 
                    const std::string& teamName = "");

private:
    sqlite3* db_ = nullptr;
    void initDB();
};
