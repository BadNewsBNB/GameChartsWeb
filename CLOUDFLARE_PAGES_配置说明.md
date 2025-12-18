# 🔧 Cloudflare Pages 正确配置

## ❌ 错误的配置（导致当前错误）

```
构建命令: npm run build
构建输出目录: dist
部署命令: npx wrangler deploy  ← 这是错误的！
```

**错误原因**: `npx wrangler deploy` 是用于 Cloudflare Workers 的命令，不适用于 Pages。

---

## ✅ 正确的配置

```
框架预设: Vite (或 None)
构建命令: npm run build
构建输出目录: dist
根目录: GameChartsWeb
部署命令: (留空或删除)  ← 关键：Pages 不需要部署命令！
```

---

## 📝 修改步骤

### 1. 登录 Cloudflare Dashboard
访问: https://dash.cloudflare.com/

### 2. 进入你的 Pages 项目
Workers & Pages → 选择你的项目

### 3. 修改设置
Settings → Builds & deployments → Edit configuration

### 4. 修改以下字段

| 字段 | 值 |
|------|-----|
| **Framework preset** | `Vite` 或 `None` |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Root directory** | `GameChartsWeb` |
| **Environment variables** | (可选) `NODE_VERSION=18` |

### 5. 删除部署命令
找到 "Deploy command" 或类似字段，**清空它**或确保它是空的。

### 6. 保存并重新部署
- 点击 **Save** 保存配置
- 进入 **Deployments** 标签
- 点击最新部署的 **View details**
- 点击 **Retry deployment** 按钮重新部署

---

## 🎯 关键点总结

1. **Cloudflare Pages 自动处理部署**，不需要 `npx wrangler deploy` 命令
2. **只需要指定构建命令和输出目录**
3. **构建完成后，Pages 会自动部署 `dist` 目录的内容**

---

## 🔍 验证配置

部署成功后，你会看到：

```
✅ Build command completed
✅ Deploying your site to Cloudflare's global network...
✅ Success! Your site is live at: https://your-project.pages.dev
```

---

## 💡 常见问题

### Q: 为什么删除部署命令？
A: Cloudflare Pages 是静态托管服务，它会自动部署构建输出目录。`npx wrangler deploy` 是 Workers（服务器端代码）使用的。

### Q: 如果我想用命令行部署怎么办？
A: 使用正确的 Pages 命令：
```bash
npx wrangler pages deploy dist --project-name=game-charts-web
```

### Q: 需要 wrangler.toml 文件吗？
A: **不需要**。Cloudflare Pages 通过控制台配置或命令行参数配置，不需要配置文件。

---

## 📞 需要帮助？

如果按照以上步骤操作后仍有问题：

1. 检查项目根目录设置是否正确（`GameChartsWeb`）
2. 确认 `package.json` 中有 `build` 脚本
3. 查看完整的构建日志，找到具体错误信息
4. 参考 `DEPLOY_CLOUDFLARE.md` 获取更多详细信息

