# Render.com 免费部署指南

## 💡 优势

- ✅ 完全免费（有免费额度）
- ✅ 支持自动部署
- ✅ 支持自定义域名
- ✅ 自动 HTTPS
- ⚠️ 服务器在国外，国内访问速度一般
- ⚠️ 免费版有休眠机制（15分钟无访问会休眠）

## 🚀 部署步骤

### 步骤1：注册 Render

访问 https://render.com 注册账号

### 步骤2：连接 GitHub

连接你的 GitHub 账号

### 步骤3：创建 Static Site

1. 点击 "New +" → "Static Site"
2. 选择你的 GitHub 仓库
3. 配置：
   - Name: `game-charts`（自定义）
   - Root Directory: `bgm_web`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `bgm_web/dist`
4. 点击 "Create Static Site"

### 步骤4：等待部署

部署完成后会得到一个网址，如：
```
https://game-charts.onrender.com
```

### 步骤5：配置 API 重定向

创建 `bgm_web/render.yaml`：

```yaml
services:
  - type: web
    name: game-charts
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    routes:
      - type: rewrite
        source: /api/*
        destination: https://api.bgm.tv/*
```

## 🔄 自动部署

每次推送到 GitHub，Render 会自动重新部署。

## 💰 费用

- 免费版：100GB 带宽/月
- 静态网站托管完全免费
- 没有信用卡要求

## ⚠️ 限制

- 国内访问速度较慢
- 免费版有一些限制（但对静态站点影响不大）

