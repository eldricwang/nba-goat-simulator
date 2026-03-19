#include "auth.h"
#include <iostream>
#include <sstream>
#include <iomanip>
#include <random>
#include <chrono>
#include <cstring>

// ---- 简易 SHA-256 实现（纯 C++，不依赖 OpenSSL）----

namespace {

static const uint32_t K[64] = {
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
};

inline uint32_t rotr(uint32_t x, int n) { return (x >> n) | (x << (32 - n)); }
inline uint32_t ch(uint32_t x, uint32_t y, uint32_t z) { return (x & y) ^ (~x & z); }
inline uint32_t maj(uint32_t x, uint32_t y, uint32_t z) { return (x & y) ^ (x & z) ^ (y & z); }
inline uint32_t sigma0(uint32_t x) { return rotr(x,2) ^ rotr(x,13) ^ rotr(x,22); }
inline uint32_t sigma1(uint32_t x) { return rotr(x,6) ^ rotr(x,11) ^ rotr(x,25); }
inline uint32_t gamma0(uint32_t x) { return rotr(x,7) ^ rotr(x,18) ^ (x >> 3); }
inline uint32_t gamma1(uint32_t x) { return rotr(x,17) ^ rotr(x,19) ^ (x >> 10); }

std::string computeSHA256(const std::string& input) {
    // Pre-processing
    uint64_t bitLen = input.size() * 8;
    std::vector<uint8_t> msg(input.begin(), input.end());
    msg.push_back(0x80);
    while (msg.size() % 64 != 56) msg.push_back(0x00);
    for (int i = 7; i >= 0; --i) msg.push_back((bitLen >> (i * 8)) & 0xFF);

    uint32_t h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
    uint32_t h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

    for (size_t offset = 0; offset < msg.size(); offset += 64) {
        uint32_t w[64];
        for (int i = 0; i < 16; ++i) {
            w[i] = (msg[offset+i*4] << 24) | (msg[offset+i*4+1] << 16) |
                   (msg[offset+i*4+2] << 8) | msg[offset+i*4+3];
        }
        for (int i = 16; i < 64; ++i) {
            w[i] = gamma1(w[i-2]) + w[i-7] + gamma0(w[i-15]) + w[i-16];
        }

        uint32_t a=h0, b=h1, c=h2, d=h3, e=h4, f=h5, g=h6, h=h7;
        for (int i = 0; i < 64; ++i) {
            uint32_t t1 = h + sigma1(e) + ch(e,f,g) + K[i] + w[i];
            uint32_t t2 = sigma0(a) + maj(a,b,c);
            h=g; g=f; f=e; e=d+t1; d=c; c=b; b=a; a=t1+t2;
        }
        h0+=a; h1+=b; h2+=c; h3+=d; h4+=e; h5+=f; h6+=g; h7+=h;
    }

    std::ostringstream oss;
    for (auto v : {h0,h1,h2,h3,h4,h5,h6,h7})
        oss << std::hex << std::setw(8) << std::setfill('0') << v;
    return oss.str();
}

} // anonymous namespace

// ---- UserStore 实现 ----

UserStore::UserStore(sqlite3* db) : db_(db) {
    initDB();
    migrateDB();
}

void UserStore::initDB() {
    if (!db_) return;

    const char* sql = R"(
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            nickname TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS tokens (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE INDEX IF NOT EXISTS idx_tokens_user ON tokens(user_id);
    )";

    char* errMsg = nullptr;
    int rc = sqlite3_exec(db_, sql, nullptr, nullptr, &errMsg);
    if (rc != SQLITE_OK) {
        std::cerr << "Auth DB init error: " << errMsg << std::endl;
        sqlite3_free(errMsg);
    }
}

void UserStore::migrateDB() {
    if (!db_) return;

    // 安全地添加新列（如果不存在则添加，已存在则忽略错误）
    const char* migrations[] = {
        "ALTER TABLE users ADD COLUMN birthday TEXT DEFAULT ''",
        "ALTER TABLE users ADD COLUMN gender TEXT DEFAULT ''",
        "ALTER TABLE users ADD COLUMN avatar_url TEXT DEFAULT ''"
    };

    for (const char* sql : migrations) {
        char* errMsg = nullptr;
        sqlite3_exec(db_, sql, nullptr, nullptr, &errMsg);
        if (errMsg) {
            // "duplicate column name" 是正常的（列已存在），忽略
            sqlite3_free(errMsg);
        }
    }
}

std::string UserStore::sha256(const std::string& input) {
    return computeSHA256(input);
}

std::string UserStore::generateSalt() {
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(0, 255);

    std::ostringstream oss;
    for (int i = 0; i < 16; ++i) {
        oss << std::hex << std::setw(2) << std::setfill('0') << dis(gen);
    }
    return oss.str();
}

std::string UserStore::hashPassword(const std::string& password, const std::string& salt) {
    return sha256(salt + password + salt);
}

std::string UserStore::generateToken(int userId) {
    auto now = std::chrono::system_clock::now().time_since_epoch().count();
    std::string raw = std::to_string(userId) + ":" + std::to_string(now) + ":nba_goat_secret_2024";
    return sha256(raw);
}

json UserStore::registerUser(const std::string& username, const std::string& password, const std::string& nickname) {
    if (!db_) return json{{"error", "Database not available"}};

    // 验证输入
    if (username.empty() || username.size() > 60) {
        return json{{"error", "用户名不能为空且不能超过20个字符"}};
    }
    if (password.size() < 6 || password.size() > 100) {
        return json{{"error", "密码长度需要在6-100个字符之间"}};
    }
    if (nickname.empty() || nickname.size() > 60) {
        return json{{"error", "昵称不能为空且不能超过20个字符"}};
    }

    // 检查用户名是否已存在
    {
        const char* checkSql = "SELECT id FROM users WHERE username = ?";
        sqlite3_stmt* stmt;
        int rc = sqlite3_prepare_v2(db_, checkSql, -1, &stmt, nullptr);
        if (rc == SQLITE_OK) {
            sqlite3_bind_text(stmt, 1, username.c_str(), -1, SQLITE_TRANSIENT);
            if (sqlite3_step(stmt) == SQLITE_ROW) {
                sqlite3_finalize(stmt);
                return json{{"error", "用户名已存在"}};
            }
            sqlite3_finalize(stmt);
        }
    }

    // 创建用户
    std::string salt = generateSalt();
    std::string passwordHash = hashPassword(password, salt);

    const char* sql = "INSERT INTO users (username, nickname, password_hash, salt) VALUES (?, ?, ?, ?)";
    sqlite3_stmt* stmt;
    int rc = sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr);
    if (rc != SQLITE_OK) {
        return json{{"error", "注册失败，请重试"}};
    }

    sqlite3_bind_text(stmt, 1, username.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 2, nickname.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 3, passwordHash.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 4, salt.c_str(), -1, SQLITE_TRANSIENT);

    rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);

    if (rc != SQLITE_DONE) {
        return json{{"error", "注册失败，请重试"}};
    }

    int userId = static_cast<int>(sqlite3_last_insert_rowid(db_));

    // 自动登录：生成 token
    std::string token = generateToken(userId);

    const char* tokenSql = "INSERT INTO tokens (token, user_id) VALUES (?, ?)";
    rc = sqlite3_prepare_v2(db_, tokenSql, -1, &stmt, nullptr);
    if (rc == SQLITE_OK) {
        sqlite3_bind_text(stmt, 1, token.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_int(stmt, 2, userId);
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
    }

    return json{
        {"user", {
            {"id", userId},
            {"username", username},
            {"nickname", nickname}
        }},
        {"token", token}
    };
}

json UserStore::loginUser(const std::string& username, const std::string& password) {
    if (!db_) return json{{"error", "Database not available"}};

    if (username.empty() || password.empty()) {
        return json{{"error", "用户名和密码不能为空"}};
    }

    // 查找用户
    const char* sql = "SELECT id, username, nickname, password_hash, salt FROM users WHERE username = ?";
    sqlite3_stmt* stmt;
    int rc = sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr);
    if (rc != SQLITE_OK) {
        return json{{"error", "登录失败，请重试"}};
    }

    sqlite3_bind_text(stmt, 1, username.c_str(), -1, SQLITE_TRANSIENT);

    if (sqlite3_step(stmt) != SQLITE_ROW) {
        sqlite3_finalize(stmt);
        return json{{"error", "用户名或密码错误"}};
    }

    int userId = sqlite3_column_int(stmt, 0);
    std::string dbUsername = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1));
    std::string dbNickname = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2));
    std::string dbPasswordHash = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 3));
    std::string dbSalt = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 4));
    sqlite3_finalize(stmt);

    // 验证密码
    std::string inputHash = hashPassword(password, dbSalt);
    if (inputHash != dbPasswordHash) {
        return json{{"error", "用户名或密码错误"}};
    }

    // 生成 token
    std::string token = generateToken(userId);

    const char* tokenSql = "INSERT INTO tokens (token, user_id) VALUES (?, ?)";
    rc = sqlite3_prepare_v2(db_, tokenSql, -1, &stmt, nullptr);
    if (rc == SQLITE_OK) {
        sqlite3_bind_text(stmt, 1, token.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_int(stmt, 2, userId);
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
    }

    return json{
        {"user", {
            {"id", userId},
            {"username", dbUsername},
            {"nickname", dbNickname}
        }},
        {"token", token}
    };
}

std::optional<UserInfo> UserStore::verifyToken(const std::string& token) {
    if (!db_ || token.empty()) return std::nullopt;

    const char* sql = R"(
        SELECT u.id, u.username, u.nickname, u.created_at,
               u.birthday, u.gender, u.avatar_url
        FROM tokens t 
        JOIN users u ON t.user_id = u.id 
        WHERE t.token = ?
    )";

    sqlite3_stmt* stmt;
    int rc = sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr);
    if (rc != SQLITE_OK) return std::nullopt;

    sqlite3_bind_text(stmt, 1, token.c_str(), -1, SQLITE_TRANSIENT);

    if (sqlite3_step(stmt) != SQLITE_ROW) {
        sqlite3_finalize(stmt);
        return std::nullopt;
    }

    UserInfo user;
    user.id = sqlite3_column_int(stmt, 0);
    user.username = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1));
    user.nickname = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2));
    const char* ca = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 3));
    user.created_at = ca ? std::string(ca) : "";
    const char* bd = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 4));
    user.birthday = bd ? std::string(bd) : "";
    const char* gd = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 5));
    user.gender = gd ? std::string(gd) : "";
    const char* av = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 6));
    user.avatar_url = av ? std::string(av) : "";
    sqlite3_finalize(stmt);

    return user;
}

json UserStore::getUserProfile(int userId) {
    if (!db_) return json{{"error", "Database not available"}};

    const char* sql = "SELECT id, username, nickname, created_at, birthday, gender, avatar_url FROM users WHERE id = ?";
    sqlite3_stmt* stmt;
    int rc = sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr);
    if (rc != SQLITE_OK) return json{{"error", "查询失败"}};

    sqlite3_bind_int(stmt, 1, userId);

    if (sqlite3_step(stmt) != SQLITE_ROW) {
        sqlite3_finalize(stmt);
        return json{{"error", "用户不存在"}};
    }

    json result;
    result["id"] = sqlite3_column_int(stmt, 0);
    result["username"] = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1));
    result["nickname"] = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2));
    const char* ca = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 3));
    result["created_at"] = ca ? std::string(ca) : "";
    const char* bd = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 4));
    result["birthday"] = bd ? std::string(bd) : "";
    const char* gd = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 5));
    result["gender"] = gd ? std::string(gd) : "";
    const char* av = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 6));
    result["avatar_url"] = av ? std::string(av) : "";
    sqlite3_finalize(stmt);

    return result;
}

json UserStore::updateUserProfile(int userId, const json& updates) {
    if (!db_) return json{{"error", "Database not available"}};

    // 构建动态 UPDATE 语句
    std::vector<std::string> setClauses;
    std::vector<std::string> values;

    if (updates.contains("nickname") && updates["nickname"].is_string()) {
        std::string nick = updates["nickname"].get<std::string>();
        if (nick.empty() || nick.size() > 60) {
            return json{{"error", "昵称不能为空且不能超过20个字符"}};
        }
        setClauses.push_back("nickname = ?");
        values.push_back(nick);
    }

    if (updates.contains("birthday") && updates["birthday"].is_string()) {
        std::string bd = updates["birthday"].get<std::string>();
        // 简单验证：空字符串或 YYYY-MM-DD 格式
        if (!bd.empty() && bd.size() != 10) {
            return json{{"error", "生日格式应为 YYYY-MM-DD"}};
        }
        setClauses.push_back("birthday = ?");
        values.push_back(bd);
    }

    if (updates.contains("gender") && updates["gender"].is_string()) {
        std::string gd = updates["gender"].get<std::string>();
        if (!gd.empty() && gd != "male" && gd != "female" && gd != "other") {
            return json{{"error", "性别只能是 male、female 或 other"}};
        }
        setClauses.push_back("gender = ?");
        values.push_back(gd);
    }

    if (updates.contains("avatar_url") && updates["avatar_url"].is_string()) {
        std::string av = updates["avatar_url"].get<std::string>();
        if (av.size() > 500) {
            return json{{"error", "头像URL过长"}};
        }
        setClauses.push_back("avatar_url = ?");
        values.push_back(av);
    }

    if (setClauses.empty()) {
        return json{{"error", "没有要更新的字段"}};
    }

    // 拼接 SQL
    std::string sql = "UPDATE users SET ";
    for (size_t i = 0; i < setClauses.size(); ++i) {
        if (i > 0) sql += ", ";
        sql += setClauses[i];
    }
    sql += " WHERE id = ?";

    sqlite3_stmt* stmt;
    int rc = sqlite3_prepare_v2(db_, sql.c_str(), -1, &stmt, nullptr);
    if (rc != SQLITE_OK) {
        return json{{"error", "更新失败，请重试"}};
    }

    // 绑定参数
    for (size_t i = 0; i < values.size(); ++i) {
        sqlite3_bind_text(stmt, static_cast<int>(i + 1), values[i].c_str(), -1, SQLITE_TRANSIENT);
    }
    sqlite3_bind_int(stmt, static_cast<int>(values.size() + 1), userId);

    rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);

    if (rc != SQLITE_DONE) {
        return json{{"error", "更新失败，请重试"}};
    }

    // 返回更新后的用户资料
    return getUserProfile(userId);
}
