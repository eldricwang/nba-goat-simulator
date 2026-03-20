# GitHub + Vercel 自动部署指南

## 已完成的操作

✅ 项目已推送到 GitHub: https://github.com/eldricwang/nba-goat-simulator  
✅ 已创建 GitHub Actions 配置文件  
✅ 项目已成功部署到 Vercel

## 当前的部署状态

项目已成功部署到以下地址：
- **最新生产版本**: https://nba-goat-simulator-1rl7-2f7nl1hdv-eldricwangs-projects.vercel.app
- **其他可用版本**: 查看上方 Vercel 部署列表

## 配置 GitHub Actions 自动部署

### 步骤 1: 获取 Vercel 配置信息

1. 登录 Vercel 控制台: https://vercel.com
2. 进入项目设置: nba-goat-simulator-1rl7
3. 获取以下信息：
   - **Vercel Token**: Settings → Tokens → Create Token
   - **Organization ID**: Settings → General
   - **Project ID**: Settings → General

### 步骤 2: 在 GitHub 仓库配置 Secrets

1. 进入 GitHub 仓库: https://github.com/eldricwang/nba-goat-simulator
2. 进入 Settings → Secrets and variables → Actions
3. 添加以下 Repository Secrets:

```
VERCEL_TOKEN = [你的Vercel Token]
VERCEL_ORG_ID = eldricwangs-projects
VERCEL_PROJECT_ID = nba-goat-simulator-1rl7
```

### 步骤 3: 测试自动部署

1. 推送新的提交到 GitHub
2. 查看 Actions 标签页的部署状态
3. 部署完成后，Vercel 会自动更新生产环境

## 部署流程说明

### 触发条件
- 每次推送到 `main` 分支
- 创建 Pull Request 到 `main` 分支

### 部署过程
1. GitHub Actions 自动运行
2. 安装依赖并构建 Next.js 应用
3. 使用 Vercel Action 部署到生产环境
4. 部署完成后自动生成新的 URL

## 故障排除

### 常见问题

1. **构建失败**
   - 检查 `next-app` 目录下的依赖是否正确
   - 确认 Node.js 版本兼容性

2. **部署失败**
   - 检查 Vercel Secrets 是否正确配置
   - 确认项目权限设置

3. **环境变量问题**
   - 在 Vercel 控制台配置所需的环境变量

### 手动部署

如果需要手动部署，可以使用以下命令：

```bash
cd next-app
vercel --prod
```

## 项目结构

```
├── .github/workflows/deploy.yml    # GitHub Actions 配置
├── next-app/                       # Next.js 应用主目录
│   ├── src/                       # 源代码
│   ├── public/                    # 静态资源
│   ├── package.json               # 依赖配置
│   └── vercel.json               # Vercel 部署配置
└── scripts/                       # 数据处理脚本
```

## 功能特性

✅ **自动构建和部署**  
✅ **预设球员对比功能**  
✅ **分析系统跟踪**  
✅ **响应式设计**  
✅ **社交媒体分享**  

## 联系方式

如有部署问题，请检查：
- GitHub Actions 日志
- Vercel 部署日志
- 项目依赖配置