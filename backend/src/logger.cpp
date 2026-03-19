#include "logger.h"
#include <iostream>
#include <sstream>
#include <iomanip>
#include <chrono>
#include <random>
#include <sys/stat.h>

// ============================================
// 单例
// ============================================

Logger& Logger::instance() {
    static Logger inst;
    return inst;
}

Logger::~Logger() {
    std::lock_guard<std::mutex> lock(mutex_);
    if (logFile_.is_open()) {
        logFile_.close();
    }
}

// ============================================
// 初始化
// ============================================

void Logger::init(const std::string& logDir, LogLevel minLevel) {
    std::lock_guard<std::mutex> lock(mutex_);
    logDir_ = logDir;
    minLevel_ = minLevel;
    initialized_ = true;

    // 创建日志目录
    mkdir(logDir.c_str(), 0755);

    // 打开当天的日志文件
    currentDate_ = getCurrentDate();
    std::string filePath = logDir_ + "/nba_backend_" + currentDate_ + ".log";
    logFile_.open(filePath, std::ios::app);

    if (!logFile_.is_open()) {
        std::cerr << "[LOGGER] Failed to open log file: " << filePath << std::endl;
    }
}

// ============================================
// 日期轮转：如果跨天了，切换新的日志文件
// ============================================

void Logger::ensureLogFile() {
    if (!initialized_) return;

    std::string today = getCurrentDate();
    if (today != currentDate_) {
        if (logFile_.is_open()) {
            logFile_.close();
        }
        currentDate_ = today;
        std::string filePath = logDir_ + "/nba_backend_" + currentDate_ + ".log";
        logFile_.open(filePath, std::ios::app);
        if (!logFile_.is_open()) {
            std::cerr << "[LOGGER] Failed to open log file: " << filePath << std::endl;
        }
    }
}

// ============================================
// 核心日志写入
// ============================================

void Logger::log(LogLevel level, const std::string& module, const std::string& message,
                 const RequestContext* ctx) {
    if (level < minLevel_) return;

    std::ostringstream oss;
    oss << getCurrentTimestamp()
        << " [" << levelToString(level) << "]"
        << " [" << module << "]";

    if (ctx) {
        oss << " [rid:" << ctx->requestId << "]"
            << " [uid:" << ctx->userId << "]";
    }

    oss << " " << message;

    std::string line = oss.str();

    // 同时输出到 stderr（docker logs 能看到）和文件
    {
        std::lock_guard<std::mutex> lock(mutex_);
        std::cerr << line << std::endl;

        if (initialized_) {
            ensureLogFile();
            writeLog(line);
        }
    }
}

void Logger::writeLog(const std::string& line) {
    if (logFile_.is_open()) {
        logFile_ << line << std::endl;
        logFile_.flush();
    }
}

// ============================================
// 便捷方法
// ============================================

void Logger::debug(const std::string& module, const std::string& msg, const RequestContext* ctx) {
    log(LogLevel::DEBUG, module, msg, ctx);
}

void Logger::info(const std::string& module, const std::string& msg, const RequestContext* ctx) {
    log(LogLevel::INFO, module, msg, ctx);
}

void Logger::warn(const std::string& module, const std::string& msg, const RequestContext* ctx) {
    log(LogLevel::WARN, module, msg, ctx);
}

void Logger::error(const std::string& module, const std::string& msg, const RequestContext* ctx) {
    log(LogLevel::ERROR, module, msg, ctx);
}

void Logger::fatal(const std::string& module, const std::string& msg, const RequestContext* ctx) {
    log(LogLevel::FATAL, module, msg, ctx);
}

// ============================================
// 请求生命周期日志
// ============================================

void Logger::logRequest(const RequestContext& ctx, const std::string& queryString) {
    std::ostringstream oss;
    oss << ">>> " << ctx.method << " " << ctx.path;
    if (!queryString.empty()) {
        oss << "?" << queryString;
    }
    oss << " | client=" << ctx.clientIp;
    info("API", oss.str(), &ctx);
}

void Logger::logResponse(const RequestContext& ctx, int statusCode, long durationMs) {
    std::ostringstream oss;
    oss << "<<< " << ctx.method << " " << ctx.path
        << " | status=" << statusCode
        << " | duration=" << durationMs << "ms";

    if (statusCode >= 500) {
        error("API", oss.str(), &ctx);
    } else if (statusCode >= 400) {
        warn("API", oss.str(), &ctx);
    } else {
        info("API", oss.str(), &ctx);
    }
}

// ============================================
// 生成唯一请求 ID
// ============================================

std::string Logger::generateRequestId() {
    static std::atomic<uint64_t> counter{0};

    auto now = std::chrono::system_clock::now();
    auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(
        now.time_since_epoch()).count();

    uint64_t seq = counter.fetch_add(1);

    // 格式：时间戳后6位 + 序号后4位 = 10位请求ID
    std::ostringstream oss;
    oss << std::hex << std::setfill('0')
        << std::setw(8) << (ms & 0xFFFFFFFF)
        << std::setw(4) << (seq & 0xFFFF);
    return oss.str();
}

// ============================================
// 工具函数
// ============================================

std::string Logger::levelToString(LogLevel level) {
    switch (level) {
        case LogLevel::DEBUG: return "DEBUG";
        case LogLevel::INFO:  return "INFO ";
        case LogLevel::WARN:  return "WARN ";
        case LogLevel::ERROR: return "ERROR";
        case LogLevel::FATAL: return "FATAL";
        default: return "?????";
    }
}

std::string Logger::getCurrentTimestamp() {
    auto now = std::chrono::system_clock::now();
    auto t = std::chrono::system_clock::to_time_t(now);
    auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(
        now.time_since_epoch()).count() % 1000;

    std::tm tm_buf;
    localtime_r(&t, &tm_buf);

    std::ostringstream oss;
    oss << std::put_time(&tm_buf, "%Y-%m-%d %H:%M:%S")
        << '.' << std::setfill('0') << std::setw(3) << ms;
    return oss.str();
}

std::string Logger::getCurrentDate() {
    auto now = std::chrono::system_clock::now();
    auto t = std::chrono::system_clock::to_time_t(now);

    std::tm tm_buf;
    localtime_r(&t, &tm_buf);

    std::ostringstream oss;
    oss << std::put_time(&tm_buf, "%Y-%m-%d");
    return oss.str();
}
