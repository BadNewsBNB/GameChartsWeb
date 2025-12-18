# 🚀 部署指南

本文档介绍如何将游戏排名图项目部署到线上供他人使用。

## 📋 部署前准备

1. 确保项目可以正常构建：
```bash
npm run build
```

2. 构建产物会在 `dist` 目录中生成

---

## 方案一：Vercel（⭐ 最推荐）

### 优点
- ✅ 完全免费
- ✅ 自动构建和部署
- ✅ 全球CDN加速
- ✅ 支持自定义域名
- ✅ 自动处理API代理

### 部署步骤

#### 方式A：通过GitHub自动部署（推荐）

1. **将项目推送到GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/你的用户名/你的仓库名.git
   git push -u origin main
   ```

2. **在Vercel部署**
   - 访问 [vercel.com](https://vercel.com)
   - 使用GitHub账号登录
   - 点击 "New Project"
   - 选择你的GitHub仓库
   - 配置项目：
     - Framework Preset: `Vite`
     - Root Directory: `bgm_web`（如果项目在子目录）
     - Build Command: `npm run build`
     - Output Directory: `dist`
   - 点击 "Deploy"

3. **等待部署完成**
   - Vercel会自动构建和部署
   - 部署完成后会得到一个网址，例如：`https://你的项目名.vercel.app`

#### 方式B：通过CLI部署

1. **安装Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录Vercel**
   ```bash
   vercel login
   ```

3. **部署项目**
   ```bash
   cd bgm_web
   vercel
   ```

4. **按照提示操作**，Vercel会自动识别配置

### 注意事项
- `vercel.json` 已配置API代理，无需额外设置
- 每次推送到GitHub，Vercel会自动重新部署

---

## 方案二：Netlify

### 优点
- ✅ 免费额度充足
- ✅ 配置简单
- ✅ 支持表单和函数

### 部署步骤

1. **创建netlify.toml配置文件**（已包含在项目中）

2. **通过GitHub部署**
   - 访问 [netlify.com](https://netlify.com)
   - 使用GitHub登录
   - 点击 "New site from Git"
   - 选择你的仓库
   - 配置：
     - Base directory: `bgm_web`
     - Build command: `npm run build`
     - Publish directory: `bgm_web/dist`
   - 点击 "Deploy site"

3. **配置API代理**
   - Netlify需要使用重定向规则处理API请求
   - 配置文件已在 `netlify.toml` 中

---

## 方案三：Cloudflare Pages

### 优点
- ✅ 完全免费
- ✅ 速度快（Cloudflare全球网络）
- ✅ 无限带宽

### 部署步骤

1. **访问** [pages.cloudflare.com](https://pages.cloudflare.com)

2. **连接GitHub仓库**

3. **配置构建设置**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `bgm_web`

4. **配置API重定向**
   - 在项目设置中添加 `_redirects` 文件（已包含）

---

## 方案四：GitHub Pages

### 优点
- ✅ 完全免费
- ✅ 与GitHub集成

### 缺点
- ⚠️ 需要额外处理API代理问题
- ⚠️ 不支持服务端重定向

### 部署步骤

1. **修改vite.config.js**，添加base路径：
   ```javascript
   export default defineConfig({
     base: '/你的仓库名/',
     // ...其他配置
   })
   ```

2. **创建部署脚本**（在package.json中添加）：
   ```json
   {
     "scripts": {
       "deploy": "npm run build && gh-pages -d dist"
     }
   }
   ```

3. **安装gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

4. **部署**
   ```bash
   npm run deploy
   ```

**注意**：GitHub Pages不支持API代理，需要使用CORS代理服务或后端中转。

---

## 方案五：自己的服务器（VPS）

### 适用场景
- 已有服务器
- 需要完全控制
- 需要后端服务

### 部署步骤（以Nginx为例）

1. **构建项目**
   ```bash
   npm run build
   ```

2. **上传dist目录到服务器**
   ```bash
   scp -r dist/* user@your-server:/var/www/game-ranking
   ```

3. **配置Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       root /var/www/game-ranking;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       # API代理
       location /api/ {
           proxy_pass https://api.bgm.tv/;
           proxy_set_header Host api.bgm.tv;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

4. **重启Nginx**
   ```bash
   sudo systemctl restart nginx
   ```

---

## 🔧 API代理问题说明

由于Bangumi API的CORS限制，部署到线上需要处理跨域问题：

### 开发环境
- 使用Vite的proxy配置（已配置）

### 生产环境
- **Vercel**: 使用 `vercel.json` 的rewrites
- **Netlify**: 使用 `netlify.toml` 的redirects
- **Cloudflare Pages**: 使用 `_redirects` 文件
- **自己服务器**: 使用Nginx反向代理

---

## 📝 推荐配置

### 1. 为Vercel创建的配置文件
**vercel.json**
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.bgm.tv/:path*"
    }
  ]
}
```

### 2. 为Netlify创建的配置文件
**netlify.toml**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "https://api.bgm.tv/:splat"
  status = 200
  force = true
```

### 3. 为Cloudflare Pages创建的配置文件
**public/_redirects**
```
/api/* https://api.bgm.tv/:splat 200
```

---

## ✅ 部署检查清单

部署完成后，请检查：

- [ ] 页面可以正常访问
- [ ] 可以添加游戏到游戏库
- [ ] 可以拖动游戏到坐标系
- [ ] 可以调整游戏大小
- [ ] 可以导出图片
- [ ] 可以导出/导入JSON
- [ ] 从Bangumi导入收藏功能正常
- [ ] localStorage数据持久化正常
- [ ] 刷新页面后数据不丢失

---

## 🎯 推荐方案总结

**最简单快速**: Vercel（通过GitHub自动部署）
- 5分钟内完成
- 零配置
- 自动更新

**最稳定**: 自己的服务器
- 完全控制
- 无流量限制
- 可自定义域名

**最经济**: GitHub Pages
- 完全免费
- 但需要额外处理API问题

---

## 📞 常见问题

### Q: 部署后API调用失败？
A: 检查API代理配置是否正确，确保平台支持重定向/代理功能。

### Q: 用户数据会丢失吗？
A: 不会，所有数据存储在用户浏览器的localStorage中，即使网站重新部署也不影响。

### Q: 可以使用自定义域名吗？
A: 可以，Vercel、Netlify、Cloudflare Pages都支持免费的自定义域名。

### Q: 需要后端服务器吗？
A: 不需要，这是纯前端项目，所有数据存储在客户端。

---

## 🔗 相关链接

- [Vercel文档](https://vercel.com/docs)
- [Netlify文档](https://docs.netlify.com)
- [Cloudflare Pages文档](https://developers.cloudflare.com/pages)
- [Vite部署指南](https://vitejs.dev/guide/static-deploy.html)

