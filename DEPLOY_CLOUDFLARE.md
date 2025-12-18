# Cloudflare Pages 部署指南

## 方法一：使用 Wrangler CLI（已配置）

项目已经添加了 `wrangler.toml` 配置文件，可以直接使用命令行部署：

```bash
# 安装 wrangler（如果还没安装）
npm install -g wrangler

# 登录到 Cloudflare
wrangler login

# 构建并部署
npm run build
npx wrangler pages deploy dist --project-name=game-charts-web
```

## 方法二：通过 Cloudflare Pages 控制台

### 1. 在 Cloudflare 控制台配置

登录 [Cloudflare Dashboard](https://dash.cloudflare.com/) 并进入 Pages：

1. 选择你的项目
2. 进入 **Settings** > **Builds & deployments**
3. 配置如下：

**构建配置：**
- **框架预设**: `None` 或 `Vite`
- **构建命令**: `npm run build`
- **构建输出目录**: `dist`
- **根目录**: `/GameChartsWeb`（如果仓库根目录不是项目目录）

**环境变量**（可选）：
- `NODE_VERSION`: `18` 或更高

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

## 方法三：自动部署

### GitHub Actions 自动部署

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

## 快速修复当前错误

如果你现在正在 Cloudflare Pages 控制台部署，最快的修复方法：

1. 将项目根目录的 `wrangler.toml` 推送到你的仓库
2. 或者修改 Cloudflare Pages 的部署命令为：
   ```
   npx wrangler pages deploy dist --project-name=game-charts-web
   ```
   （将 `npx wrangler deploy` 改为 `npx wrangler pages deploy dist`）

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

