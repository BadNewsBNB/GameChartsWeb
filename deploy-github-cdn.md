# GitHub Pages + CDN 加速部署指南

## 💡 原理

- 代码托管在 GitHub
- 使用 GitHub Pages 部署
- 通过 jsDelivr 等 CDN 加速静态资源
- 在中国大陆访问速度较快

## 🚀 部署步骤

### 步骤1：修改 vite.config.js

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: '/GameChartsWeb/', // 改为你的仓库名
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'https://api.bgm.tv',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

### 步骤2：添加部署脚本

在 `package.json` 中添加：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

### 步骤3：安装 gh-pages

```bash
npm install --save-dev gh-pages
```

### 步骤4：推送代码到 GitHub

```bash
git add .
git commit -m "准备部署"
git push origin main
```

### 步骤5：部署到 GitHub Pages

```bash
npm run deploy
```

### 步骤6：启用 GitHub Pages

1. 进入 GitHub 仓库
2. Settings → Pages
3. Source 选择 `gh-pages` 分支
4. 保存

访问地址：`https://你的用户名.github.io/仓库名/`

## ⚡ CDN 加速（可选）

### 使用 Cloudflare（免费）

1. 注册 Cloudflare 账号
2. 添加你的域名（如果有）
3. 修改 DNS 服务器到 Cloudflare
4. 开启 CDN 代理

### 使用国内 CDN

如果有域名且已备案，可以使用：
- 阿里云 CDN（有免费额度）
- 腾讯云 CDN（有免费额度）
- 七牛云 CDN（有免费额度）

源站地址设置为：`https://你的用户名.github.io`

## ⚠️ 注意事项

### API 代理问题

GitHub Pages 是纯静态托管，不支持服务端代理。需要：

**方案A：使用 Cloudflare Workers（推荐）**

创建免费的 Cloudflare Worker 处理 API 请求：

```javascript
// worker.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // 转发到 Bangumi API
  if (url.pathname.startsWith('/api/')) {
    const apiUrl = 'https://api.bgm.tv' + url.pathname.replace('/api', '')
    const apiRequest = new Request(apiUrl, request)
    
    const response = await fetch(apiRequest)
    const newResponse = new Response(response.body, response)
    
    // 添加 CORS 头
    newResponse.headers.set('Access-Control-Allow-Origin', '*')
    
    return newResponse
  }
  
  return fetch(request)
}
```

然后在前端使用 Worker 的地址访问 API。

**方案B：直接使用 CORS 代理服务**

修改 `src/api/bangumi.js`，使用公共 CORS 代理：

```javascript
const instance = axios.create({
  baseURL: 'https://cors-anywhere.herokuapp.com/https://api.bgm.tv',
  // 或使用其他 CORS 代理
})
```

## 💰 费用

完全免费！

## 🔄 更新

每次更新只需：

```bash
npm run deploy
```

## 📝 其他注意事项

- GitHub Pages 有每月 100GB 流量限制（通常够用）
- 每个仓库最大 1GB
- 构建时间有限制

