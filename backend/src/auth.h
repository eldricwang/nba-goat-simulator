#pragma once
#include "json.hpp"
#include <sqlite3.h>
#include <string>
#include <optional>

using json = nlohmann::json;

struct UserInfo {
    int id;
    std::string username;
    std::string nickname;
    std::string birthday;    // YYYY-MM-DD 或空
    std::string gender;      // male / female / other / 空
    std::string avatar_url;  // 头像 URL 或空
    std::string created_at;
};

class UserStore {
public:
    UserStore(sqlite3* db);

    // 注册新用户
    json registerUser(const std::string& username, const std::string& password, const std::string& nickname);

    // 用户登录，返回 token
    json loginUser(const std::string& username, const std::string& password);

    // 验证 token，返回用户信息
    std::optional<UserInfo> verifyToken(const std::string& token);

    // 获取用户完整资料
    json getUserProfile(int userId);

    // 更新用户资料（昵称、生日、性别、头像）
    json updateUserProfile(int userId, const json& updates);

private:
    sqlite3* db_;
    void initDB();
    void migrateDB();  // 数据库迁移：添加新字段

    // 密码哈希
    std::string hashPassword(const std::string& password, const std::string& salt);
    std::string generateSalt();
    std::string generateToken(int userId);
    std::string sha256(const std::string& input);
};
