#!/bin/bash
# ============================================
# NBA GOAT Simulator 部署脚本
# ============================================
set -e

echo "🏀 NBA GOAT Simulator 部署"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ 未检测到 Docker，请先安装："
    echo "   curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# 检查 docker compose
if docker compose version &> /dev/null; then
    COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE="docker-compose"
else
    echo "❌ 未检测到 Docker Compose，请先安装"
    exit 1
fi

echo ""
echo "📦 构建镜像（首次可能需要几分钟）..."
$COMPOSE build

echo ""
echo "🚀 启动服务..."
$COMPOSE up -d

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 部署完成！"
echo ""
echo "   访问地址: http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'your-server-ip'):80"
echo "   查看日志: $COMPOSE logs -f"
echo "   停止服务: $COMPOSE down"
echo "   重启服务: $COMPOSE restart"
echo ""
echo "   评论数据存储在 Docker volume 'nba-data' 中"
echo "   容器重建不会丢失数据"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"
