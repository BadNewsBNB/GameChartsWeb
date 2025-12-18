# 🚀 Cloudflare Workers 部署说明

## 📋 当前配置

你的项目使用的是 **Cloudflare Workers** (不是 Pages)，这是通过 Workers Site 部署静态网站的方式。

### 项目结构
```
GameChartsWeb/
├── wrangler.toml              # Cloudflare Workers 配置文件
├── workers-site/              # Workers 静态站点代码
│   ├── index.js              # Worker 入口文件（处理请求和 API 代理）
│   └── package.json          # Workers 依赖
├── dist/                      # 构建输出目录
├── src/                       # 源代码
└── package.json              # 项目依赖
```

---

## ✅ 已完成的配置

### 1. `wrangler.toml`
```toml
name = "gameschartweb"
compatibility_date = "2025-12-18"
main = "workers-site/index.js"

[site]
bucket = "./dist"
```

### 2. `workers-site/index.js`
- ✅ 静态文件服务
- ✅ API 代理到 Bangumi (`/api/*` → `https://api.bgm.tv/*`)
- ✅ SPA 路由支持（404 回退到 index.html）
- ✅ 安全头设置

### 3. 依赖安装
已添加 `@cloudflare/kv-asset-handler` 到 `package.json`

---

## 🔧 Cloudflare 控制台配置

根据你提供的信息，当前配置为：

```
名称: gameschartweb
Git 存储库: BadNewsBNB/GameChartsWeb
构建命令: npm run build
部署命令: npx wrangler deploy
版本命令: npx wrangler versions upload
根目录: /
生产分支: main
```

### ⚠️ 需要修改的地方

如果你的 `GameChartsWeb` 不在仓库根目录，需要修改：

**当前配置:**
```
根目录: /
```

**如果项目在子目录，改为:**
```
根目录: /GameChartsWeb
```

---

## 📦 部署步骤

### 方式 1：通过 Git 自动部署（推荐）

1. **提交代码到 Git 仓库**
```bash
git add .
git commit -m "Add Cloudflare Workers configuration"
git push origin main
```

2. **Cloudflare 会自动触发构建和部署**
   - 检测到 push 事件
   - 运行 `npm run build`
   - 运行 `npx wrangler deploy`
   - 自动部署到生产环境

3. **查看部署状态**
   - 登录 Cloudflare Dashboard
   - Workers & Pages → 选择 `gameschartweb`
   - 查看 Deployments 标签

---

### 方式 2：本地手动部署

```bash
# 1. 进入项目目录
cd GameChartsWeb

# 2. 安装依赖
npm install

# 3. 安装 workers-site 依赖
cd workers-site
npm install
cd ..

# 4. 构建项目
npm run build

# 5. 登录 Cloudflare（首次）
npx wrangler login

# 6. 部署
npx wrangler deploy
```

---

## 🔍 验证部署

部署成功后会看到：

```
✨ Successfully published your script to
   https://gameschartweb.你的用户名.workers.dev
```

访问这个 URL 查看你的应用。

---

## 🐛 故障排除

### 问题 1: `workers-site/index.js` 找不到

**错误信息:**
```
✘ [ERROR] The entry-point file at "workers-site/index.js" was not found.
```

**解决方案:**
确保 `workers-site/index.js` 文件存在并且已提交到 Git 仓库。

```bash
git add workers-site/
git commit -m "Add workers-site directory"
git push
```

---

### 问题 2: 依赖安装失败

**错误信息:**
```
Module not found: @cloudflare/kv-asset-handler
```

**解决方案:**
```bash
# 在项目根目录
npm install @cloudflare/kv-asset-handler --save-dev

# 在 workers-site 目录
cd workers-site
npm install
cd ..
```

---

### 问题 3: 根目录配置错误

**症状:** 找不到 `package.json` 或构建失败

**解决方案:**
在 Cloudflare 控制台中检查根目录配置：

- 如果仓库结构是 `repo/GameChartsWeb/`，设置根目录为 `/GameChartsWeb`
- 如果仓库结构是 `repo/`（直接就是项目），设置根目录为 `/`

---

### 问题 4: API 请求 CORS 错误

**症状:** 浏览器控制台显示 CORS 错误

**解决方案:**
Workers Site 的 `index.js` 已经包含了 API 代理功能：
- 前端请求 `/api/*`
- Workers 代理到 `https://api.bgm.tv/*`

确保前端代码使用正确的 API 路径：

```javascript
// src/api/bangumi.js
const baseURL = '/api'; // 不是完整的 URL
```

---

## 📊 监控和日志

### 查看实时日志

```bash
npx wrangler tail
```

### 查看部署历史

在 Cloudflare Dashboard:
- Workers & Pages → gameschartweb
- Deployments 标签
- 查看每次部署的详细信息和日志

---

## 🎯 下一步

1. ✅ 提交所有更改到 Git 仓库
2. ✅ 推送到 GitHub（触发自动部署）
3. ✅ 在 Cloudflare 控制台查看部署状态
4. ✅ 测试应用是否正常工作
5. ✅ 测试 API 调用是否成功

---

## 💡 提示

### 自定义域名

如果想使用自定义域名：

1. 在 Cloudflare Dashboard 中添加域名
2. Workers & Pages → gameschartweb → Settings → Domains
3. 添加你的域名
4. 按照提示配置 DNS

### 环境变量

如果需要环境变量：

1. Workers & Pages → gameschartweb → Settings → Variables
2. 添加环境变量
3. 在 `workers-site/index.js` 中通过 `env` 访问

```javascript
async function handleEvent(event, env) {
  const apiKey = env.API_KEY; // 访问环境变量
  // ...
}
```

---

## 📞 需要帮助？

如果遇到问题：

1. 查看 Cloudflare 构建日志（Deployments → 选择部署 → View details）
2. 查看 `wrangler tail` 实时日志
3. 确认所有文件都已提交到 Git
4. 确认根目录配置正确

---

## 🆚 Workers vs Pages 对比

你当前使用的是 **Workers**：
- ✅ 可以运行服务器端代码
- ✅ 支持 API 代理
- ✅ 更灵活的请求处理
- ⚠️ 配置稍微复杂

如果只需要静态托管，也可以考虑切换到 **Pages**：
- ✅ 配置更简单
- ✅ 自动 HTTPS
- ✅ 预览环境
- ⚠️ 需要额外配置才能做 API 代理

当前的 Workers 配置已经包含了所需功能，可以继续使用。

