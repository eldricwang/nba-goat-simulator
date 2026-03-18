# ============================================
# Stage 1: 编译 C++ 后端
# ============================================
FROM ubuntu:22.04 AS backend-builder

RUN apt-get update && apt-get install -y \
    g++ \
    cmake \
    make \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend
COPY backend/ .

RUN mkdir -p build && cd build \
    && cmake .. \
    && make -j$(nproc)

# ============================================
# Stage 2: 构建前端
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ============================================
# Stage 3: 运行环境
# ============================================
FROM ubuntu:22.04 AS runtime

RUN apt-get update && apt-get install -y \
    nginx \
    libsqlite3-0 \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# 复制后端可执行文件
COPY --from=backend-builder /app/backend/build/nba_backend /usr/local/bin/nba_backend
RUN chmod +x /usr/local/bin/nba_backend

# 复制前端构建产物
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf
# 删除默认 nginx 配置避免冲突
RUN rm -f /etc/nginx/sites-enabled/default

# 复制 supervisor 配置（同时管理 nginx + 后端进程）
COPY supervisord.conf /etc/supervisor/conf.d/app.conf

# 创建数据目录（SQLite 数据库持久化用）
RUN mkdir -p /data
WORKDIR /data

EXPOSE 80

CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/conf.d/app.conf"]
