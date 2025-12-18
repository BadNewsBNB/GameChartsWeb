# Cloudflare Pages 部署指南

## ⚠️ 重要：Cloudflare Pages 部署配置

### 方法一：通过 Cloudflare Pages 控制台（推荐）

### 1. 在 Cloudflare 控制台配置

登录 [Cloudflare Dashboard](https://dash.cloudflare.com/) 并进入 Pages：

#### 初次设置：

1. 点击 **Create a project**
2. 连接你的 Git 仓库（GitHub/GitLab）
3. 选择仓库和分支
4. 配置构建设置：

**构建配置：**
- **框架预设**: `None` 或 `Vite`
- **构建命令**: `npm run build`
- **构建输出目录**: `dist`
- **根目录**: `GameChartsWeb`（如果仓库根目录不是项目目录）
- **部署命令**: 留空或删除默认的 `npx wrangler deploy`

**环境变量**（可选）：
- `NODE_VERSION`: `18` 或更高

#### 已有项目的修改：

如果你已经创建了项目但遇到错误：

1. 进入项目 **Settings** > **Builds & deployments**
2. 找到 **Build configurations** 部分
3. 点击 **Edit configuration**
4. **关键修改**：删除或清空 **部署命令（Deploy command）** 字段
5. 确保：
   - **构建命令**: `npm run build`
   - **构建输出目录**: `dist`
   - **根目录**: `GameChartsWeb`
6. 保存并重新部署

### 2. 注意事项

由于项目使用了代理配置来访问 Bangumi API，在 Cloudflare Pages 上需要注意：

1. **Vite 的开发服务器代理不会在生产环境中工作**
2. API 请求会直接从浏览器发送到 `api.bgm.tv`
3. 可能会遇到 CORS 问题

#### 解决 CORS 问题的方法

**选项 A：使用 Cloudflare Workers 作为代理**

创建一个 Cloudflare Worker 来代理 API 请求：

```javascript
// _worker.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // 如果是 API 请求，代理到 Bangumi
    if (url.pathname.startsWith('/api/')) {
      const apiUrl = 'https://api.bgm.tv' + url.pathname.replace('/api', '');
      const apiRequest = new Request(apiUrl, request);
      return fetch(apiRequest);
    }
    
    // 否则返回静态资源
    return env.ASSETS.fetch(request);
  }
};
```

**选项 B：修改 API 基础路径**

在生产环境中直接使用 Bangumi API（如果 CORS 允许）：

```javascript
// src/api/bangumi.js
const baseURL = import.meta.env.PROD 
  ? 'https://api.bgm.tv' 
  : '/api';
```

## 方法二：使用 Wrangler CLI 本地部署

如果你想通过命令行部署：

```bash
# 进入项目目录
cd GameChartsWeb

# 安装依赖
npm install

# 构建项目
npm run build

# 登录 Cloudflare（首次使用）
npx wrangler login

# 部署到 Cloudflare Pages
npx wrangler pages deploy dist --project-name=game-charts-web
```

## 方法三：GitHub Actions 自动部署

在 `.github/workflows/deploy-cloudflare.yml` 中添加：

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd GameChartsWeb
          npm ci
          
      - name: Build
        run: |
          cd GameChartsWeb
          npm run build
          
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=game-charts-web
          workingDirectory: GameChartsWeb
```

需要在 GitHub 仓库设置中添加以下 Secrets：
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## 🚨 快速修复当前错误

### 问题原因
Cloudflare Pages 控制台中配置了错误的部署命令 `npx wrangler deploy`，这个命令用于 Workers，不是 Pages。

### 解决步骤

1. **进入 Cloudflare Pages 控制台**
   - 登录 https://dash.cloudflare.com/
   - 选择你的项目

2. **修改构建配置**
   - 进入 **Settings** > **Builds & deployments**
   - 点击 **Edit configuration**

3. **关键修改**
   - ✅ **构建命令**: `npm run build`
   - ✅ **构建输出目录**: `dist`
   - ✅ **根目录**: `GameChartsWeb`
   - ⚠️ **部署命令**: **删除或留空**（不要填 `npx wrangler deploy`）

4. **保存并重新部署**
   - 保存配置
   - 进入 **Deployments** 标签
   - 点击 **Retry deployment** 重新部署

## 验证部署

部署成功后，访问你的 Cloudflare Pages URL 即可查看应用。

## 常见问题

### 1. 路由问题

如果使用了 Vue Router 的 history 模式，需要在项目根目录创建 `_redirects` 文件：

```
/* /index.html 200
```

### 2. Base URL 问题

确保 `vite.config.js` 中的 `base` 配置正确：

```javascript
// 对于 Cloudflare Pages，通常设置为 '/'
base: '/',
```

### 3. 环境变量

在 Cloudflare Pages 控制台的 Settings > Environment variables 中配置所需的环境变量。

