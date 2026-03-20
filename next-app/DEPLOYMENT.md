# Vercel 部署指南

## 部署准备

### 1. 环境要求
- Node.js 18+ 
- npm 或 yarn
- Vercel 账号

### 2. 本地测试
确保项目可以正常构建和运行：

```bash
cd next-app
npm install
npm run build
npm start
```

## Vercel 部署步骤

### 方法一：Vercel CLI（推荐）

1. 安装 Vercel CLI
```bash
npm i -g vercel
```

2. 登录并部署
```bash
cd next-app
vercel
```

3. 按照提示操作：
- 选择默认设置
- 项目名称：`goat-nba-comparator`
- 框架：Next.js
- 构建命令：`npm run build`
- 输出目录：`.next`

### 方法二：GitHub 集成

1. 将代码推送到 GitHub 仓库

2. 访问 [Vercel](https://vercel.com) 并登录

3. 导入项目：
- 点击 "New Project"
- 选择你的 GitHub 仓库
- 配置项目设置：
  - **Framework Preset**: Next.js
  - **Build Command**: `npm run build`
  - **Output Directory**: `.next`
  - **Install Command**: `npm install`

4. 点击 "Deploy"

## 环境变量配置（可选）

如果需要接入外部分析服务，在 Vercel 项目设置中添加环境变量：

```bash
# Google Analytics 4
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Plausible Analytics
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=your-domain.com
```

## 自定义域名（可选）

1. 在 Vercel 项目设置中，点击 "Domains"
2. 添加你的域名
3. 按照提示配置 DNS 记录

## 部署检查清单

✅ 项目构建成功  
✅ 所有页面正常访问  
✅ 预设对比功能正常  
✅ 分享卡片生成正常  
✅ 埋点系统工作正常  
✅ 关于页面内容完整  

## 故障排除

### 构建失败
- 检查 Node.js 版本（需要 18+）
- 清理依赖重新安装：`rm -rf node_modules package-lock.json && npm install`

### 页面空白
- 检查浏览器控制台错误
- 验证 API 路由是否正常工作

### 图片加载失败  
- 检查 `next.config.ts` 中的图片域名配置

## 部署后的维护

### 更新部署
```bash
# 提交代码到 GitHub（如果使用 GitHub 集成）
git add .
git commit -m "feat: update feature"
git push origin main

# 或者使用 Vercel CLI
vercel --prod
```

### 监控和分析
- 查看 Vercel 的 Analytics 面板
- 监控埋点数据（通过控制台日志）
- 定期检查页面性能

## 安全注意事项

- 确保 API 路由有适当的 CORS 配置
- 避免在客户端暴露敏感信息
- 定期更新依赖包到安全版本

---

**部署状态**: ✅ 准备就绪  
**预计部署时间**: 5-10 分钟  
**部署方式**: Vercel CLI 或 GitHub 集成