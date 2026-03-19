#pragma once
#include <string>
#include <mutex>
#include <fstream>
#include <atomic>

// ============================================
// 日志级别
// ============================================
enum class LogLevel {
    DEBUG = 0,
    INFO  = 1,
    WARN  = 2,
    ERROR = 3,
    FATAL = 4
};

// ============================================
// 请求上下文（每个请求一个，用于链路追踪）
// ============================================
struct RequestContext {
    std::string requestId;   // 请求唯一ID
    std::string userId;      // 用户ID（未登录为 "anonymous"）
    std::string method;      // HTTP 方法
    std::string path;        // 请求路径
    std::string clientIp;    // 客户端 IP

    RequestContext() : userId("anonymous") {}
};

// ============================================
// Logger 单例
// ============================================
class Logger {
public:
    static Logger& instance();

    // 初始化：设置日志目录和最小日志级别
    void init(const std::string& logDir, LogLevel minLevel = LogLevel::INFO);

    // 通用日志方法
    void log(LogLevel level, const std::string& module, const std::string& message,
             const RequestContext* ctx = nullptr);

    // 便捷方法
    void debug(const std::string& module, const std::string& message, const RequestContext* ctx = nullptr);
    void info(const std::string& module, const std::string& message, const RequestContext* ctx = nullptr);
    void warn(const std::string& module, const std::string& message, const RequestContext* ctx = nullptr);
    void error(const std::string& module, const std::string& message, const RequestContext* ctx = nullptr);
    void fatal(const std::string& module, const std::string& message, const RequestContext* ctx = nullptr);

    // 请求生命周期日志
    void logRequest(const RequestContext& ctx, const std::string& queryString = "");
    void logResponse(const RequestContext& ctx, int statusCode, long durationMs);

    // 生成唯一请求ID
    static std::string generateRequestId();

private:
    Logger() = default;
    ~Logger();
    Logger(const Logger&) = delete;
    Logger& operator=(const Logger&) = delete;

    void ensureLogFile();
    std::string levelToString(LogLevel level);
    std::string getCurrentTimestamp();
    std::string getCurrentDate();
    void writeLog(const std::string& line);

    std::mutex mutex_;
    std::ofstream logFile_;
    std::string logDir_;
    std::string currentDate_;     // 当前日志文件的日期
    LogLevel minLevel_ = LogLevel::INFO;
    bool initialized_ = false;
    std::atomic<uint64_t> requestCounter_{0};
};

// ============================================
// 便捷宏（自动填充模块名）
// ============================================
#define LOG_DEBUG(module, msg)       Logger::instance().debug(module, msg)
#define LOG_INFO(module, msg)        Logger::instance().info(module, msg)
#define LOG_WARN(module, msg)        Logger::instance().warn(module, msg)
#define LOG_ERROR(module, msg)       Logger::instance().error(module, msg)
#define LOG_FATAL(module, msg)       Logger::instance().fatal(module, msg)

#define LOG_DEBUG_CTX(module, msg, ctx)  Logger::instance().debug(module, msg, ctx)
#define LOG_INFO_CTX(module, msg, ctx)   Logger::instance().info(module, msg, ctx)
#define LOG_WARN_CTX(module, msg, ctx)   Logger::instance().warn(module, msg, ctx)
#define LOG_ERROR_CTX(module, msg, ctx)  Logger::instance().error(module, msg, ctx)
#define LOG_FATAL_CTX(module, msg, ctx)  Logger::instance().fatal(module, msg, ctx)
