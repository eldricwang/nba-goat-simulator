#include "comments.h"
#include <iostream>
#include <chrono>
#include <sstream>
#include <iomanip>
#include <ctime>

CommentStore::CommentStore(sqlite3* db) : db_(db) {
    initDB();
}

void CommentStore::initDB() {
    if (!db_) return;

    const char* sql = R"(
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nickname TEXT NOT NULL,
            content TEXT NOT NULL,
            team_name TEXT DEFAULT '',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
    )";

    char* errMsg = nullptr;
    int rc = sqlite3_exec(db_, sql, nullptr, nullptr, &errMsg);
    if (rc != SQLITE_OK) {
        std::cerr << "SQL error: " << errMsg << std::endl;
        sqlite3_free(errMsg);
    }
}

json CommentStore::getComments(int limit) {
    json result = json::array();
    if (!db_) return result;

    std::string sql = "SELECT id, nickname, content, team_name, created_at FROM comments ORDER BY created_at DESC LIMIT ?";
    
    sqlite3_stmt* stmt;
    int rc = sqlite3_prepare_v2(db_, sql.c_str(), -1, &stmt, nullptr);
    if (rc != SQLITE_OK) {
        std::cerr << "Failed to prepare statement: " << sqlite3_errmsg(db_) << std::endl;
        return result;
    }

    sqlite3_bind_int(stmt, 1, limit);

    while (sqlite3_step(stmt) == SQLITE_ROW) {
        json comment;
        comment["id"] = std::to_string(sqlite3_column_int(stmt, 0));
        comment["nickname"] = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1));
        comment["content"] = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2));
        
        const char* teamName = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 3));
        comment["team_name"] = teamName ? std::string(teamName) : "";
        
        const char* createdAt = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 4));
        comment["created_at"] = createdAt ? std::string(createdAt) : "";

        result.push_back(comment);
    }

    sqlite3_finalize(stmt);
    return result;
}

json CommentStore::addComment(const std::string& nickname, const std::string& content, 
                              const std::string& teamName) {
    if (!db_) {
        return json{{"error", "Database not available"}};
    }

    // 验证输入
    if (nickname.empty() || nickname.size() > 60) { // UTF-8 中文最多20字 ≈ 60 bytes
        return json{{"error", "昵称不能为空且不能超过20个字符"}};
    }
    if (content.empty() || content.size() > 1500) { // UTF-8 中文最多500字 ≈ 1500 bytes
        return json{{"error", "评论不能为空且不能超过500个字符"}};
    }

    const char* sql = "INSERT INTO comments (nickname, content, team_name) VALUES (?, ?, ?)";
    
    sqlite3_stmt* stmt;
    int rc = sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr);
    if (rc != SQLITE_OK) {
        return json{{"error", "Failed to prepare statement"}};
    }

    sqlite3_bind_text(stmt, 1, nickname.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 2, content.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 3, teamName.c_str(), -1, SQLITE_TRANSIENT);

    rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);

    if (rc != SQLITE_DONE) {
        return json{{"error", "Failed to insert comment"}};
    }

    int64_t lastId = sqlite3_last_insert_rowid(db_);

    // 获取刚插入的记录
    std::string selectSql = "SELECT id, nickname, content, team_name, created_at FROM comments WHERE id = ?";
    rc = sqlite3_prepare_v2(db_, selectSql.c_str(), -1, &stmt, nullptr);
    if (rc != SQLITE_OK) {
        return json{{"id", std::to_string(lastId)}, {"nickname", nickname}, {"content", content}, {"team_name", teamName}};
    }

    sqlite3_bind_int64(stmt, 1, lastId);
    
    json result;
    if (sqlite3_step(stmt) == SQLITE_ROW) {
        result["id"] = std::to_string(sqlite3_column_int(stmt, 0));
        result["nickname"] = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1));
        result["content"] = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2));
        const char* tn = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 3));
        result["team_name"] = tn ? std::string(tn) : "";
        const char* ca = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 4));
        result["created_at"] = ca ? std::string(ca) : "";
    }
    sqlite3_finalize(stmt);

    return result;
}
