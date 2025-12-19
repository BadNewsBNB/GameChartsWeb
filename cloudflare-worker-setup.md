# Cloudflare Workers 部署指南

## 📋 准备工作

1. 注册 Cloudflare 账号：https://dash.cloudflare.com/sign-up
2. 完全免费，每天 100,000 次请求

## 🚀 部署步骤

### 方法1：网页控制台部署（推荐，最简单）

#### 步骤1：创建 Worker

1. 登录 Cloudflare Dashboard：https://dash.cloudflare.com
2. 点击左侧 **Workers & Pages**
3. 点击 **Create application**
4. 选择 **Create Worker**
5. 给 Worker 命名（如 `bangumi-api-proxy`）
6. 点击 **Deploy**

#### 步骤2：编辑 Worker 代码

1. 部署后，点击 **Edit code**
2. 删除默认代码
3. 复制 `cloudflare-worker.js` 文件的所有内容
4. 粘贴到编辑器中
5. 点击右上角 **Save and Deploy**

#### 步骤3：获取 Worker URL

部署成功后，你会看到 Worker 的 URL，格式如：
```
https://bangumi-api-proxy.your-subdomain.workers.dev
```

**复制这个 URL，后面要用！**

#### 步骤4：测试 Worker

在浏览器访问：
```
https://bangumi-api-proxy.your-subdomain.workers.dev/v0/subjects/8
```

如果返回 JSON 数据，说明部署成功！

### 方法2：使用 Wrangler CLI（高级）

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录
wrangler login

# 创建 wrangler.toml
cat > wrangler.toml << EOF
name = "bangumi-api-proxy"
main = "cloudflare-worker.js"
compatibility_date = "2024-01-01"
EOF

# 部署
wrangler deploy
```

## 🔧 修改前端代码

部署完成后，修改 `src/api/bangumi.js`：

```javascript
const request = axios.create({
  // 使用 Cloudflare Worker 代理
  baseURL: 'https://bangumi-api-proxy.your-subdomain.workers.dev',
  // ↑ 替换为你的 Worker URL
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    "User-Agent": "bangumi-web/1.0.0 (https://github.com/bangumi)",
  },
});
```

## ✅ 验证部署

### 1. 测试 API 调用

```bash
# 测试获取条目信息
curl https://your-worker.workers.dev/v0/subjects/8

# 测试搜索（POST 请求）
curl -X POST https://your-worker.workers.dev/v0/search/subjects \
  -H "Content-Type: application/json" \
  -d '{"keyword":"三体"}'
```

### 2. 在前端测试

1. 修改 `src/api/bangumi.js` 中的 baseURL
2. 运行 `npm run dev`
3. 尝试搜索游戏
4. 检查浏览器控制台，确认没有 CORS 错误

## 📊 监控和限制

### 查看使用情况

1. 在 Cloudflare Dashboard 的 Workers 页面
2. 点击你的 Worker
3. 查看 **Metrics** 标签页

### 免费版限制

- **每天 100,000 次请求**（对个人项目足够了）
- **CPU 时间：10ms/请求**
- **请求大小：100MB**

超过限制会收费，但费用很低：
- $0.50 / 百万次请求

## 🔒 安全配置（可选）

### 限制来源域名

如果想限制只有你的网站可以访问：

```javascript
// 在 handleRequest 函数开头添加
const allowedOrigins = [
  'https://a445734211.github.io',
  'http://localhost:3000'  // 开发环境
]

const origin = request.headers.get('Origin')
if (!allowedOrigins.includes(origin)) {
  return new Response('Forbidden', { status: 403 })
}
```

### 添加访问日志

```javascript
console.log(`[${new Date().toISOString()}] ${request.method} ${url.pathname}`)
```

在 Cloudflare Dashboard 可以查看实时日志。

## 🔄 更新 Worker

修改代码后：

1. 在 Cloudflare Dashboard 点击 **Edit code**
2. 更新代码
3. 点击 **Save and Deploy**

或使用命令行：
```bash
wrangler deploy
```

## ❓ 常见问题

### Q: Worker 部署后立即生效吗？
A: 是的，保存后几秒钟内全球生效。

### Q: 可以自定义域名吗？
A: 可以，在 Worker 设置中添加自定义域名（需要域名在 Cloudflare）。

### Q: 如何删除 Worker？
A: 在 Workers 列表中点击 Worker → Settings → Delete。

### Q: 出现 "Worker threw an exception" 错误？
A: 检查代码是否正确复制，特别是引号和括号。

### Q: 请求超时？
A: Cloudflare Workers 有 50ms 的 CPU 时间限制，如果 Bangumi API 响应慢，可能会超时。这种情况很少见。

## 🎉 完成

现在你的 GitHub Pages 网站可以通过 Cloudflare Workers 访问 Bangumi API 了！

完整流程：
```
用户浏览器 
  ↓
GitHub Pages (你的网站)
  ↓
Cloudflare Workers (代理)
  ↓
Bangumi API
```

优势：
- ✅ 完全免费
- ✅ 速度快（全球 CDN）
- ✅ 解决 CORS 问题
- ✅ 不需要后端服务器

