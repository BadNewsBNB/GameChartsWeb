# 阿里云 OSS 部署指南

## 📋 准备工作

1. **注册阿里云账号**：https://www.aliyun.com
2. **开通 OSS 服务**：对象存储 OSS
3. **获取 AccessKey**：在右上角 AccessKey 管理中创建

## 🚀 部署步骤

### 步骤1：创建 OSS Bucket

1. 进入 OSS 控制台
2. 创建 Bucket
   - Bucket 名称：如 `game-charts`
   - 区域：选择离你近的区域（如华东1-杭州）
   - 读写权限：**公共读**
   - 其他保持默认

### 步骤2：配置静态网站托管

1. 进入刚创建的 Bucket
2. 点击左侧 "基础设置" → "静态页面"
3. 设置：
   - 默认首页：`index.html`
   - 默认404页：`index.html`（用于 SPA 路由）
4. 保存

### 步骤3：安装阿里云 CLI（可选）

```bash
npm install -g @alicloud/cli
```

或使用网页上传：
1. 构建项目：`npm run build`
2. 在 OSS 控制台上传 `dist` 文件夹中的所有文件

### 步骤4：自动部署脚本（推荐）

安装 OSS 上传工具：

```bash
npm install --save-dev ali-oss
```

创建部署脚本 `deploy.js`：

```javascript
// 见下方文件
```

在 `package.json` 添加命令：

```json
{
  "scripts": {
    "deploy": "npm run build && node deploy.js"
  }
}
```

### 步骤5：设置环境变量

创建 `.env` 文件（不要提交到 Git）：

```env
ALI_ACCESS_KEY_ID=你的AccessKeyId
ALI_ACCESS_KEY_SECRET=你的AccessKeySecret
ALI_OSS_REGION=oss-cn-hangzhou
ALI_OSS_BUCKET=game-charts
```

### 步骤6：执行部署

```bash
npm run deploy
```

## 🌐 访问网站

部署完成后，通过以下地址访问：

```
http://你的bucket名称.oss-cn-hangzhou.aliyuncs.com
```

或使用自定义域名（需要备案）。

## 💰 费用说明

- **存储费用**：0.12元/GB/月（标准存储）
- **流量费用**：0.5元/GB（外网流出）
- **请求费用**：0.01元/万次（PUT请求）

小型项目每月费用通常 < 5元

## 🔄 更新网站

每次更新代码后，只需运行：

```bash
npm run deploy
```

## ⚡ 可选：配置 CDN 加速

1. 在阿里云开通 CDN 服务
2. 添加加速域名（需要备案）
3. 源站设置为 OSS Bucket
4. 配置缓存规则
5. 访问速度会更快

## 📞 常见问题

**Q: 需要备案吗？**
A: 使用 OSS 默认域名不需要备案，但使用自定义域名需要备案。

**Q: API 代理怎么办？**
A: OSS 是静态托管，需要配合阿里云函数计算或其他后端服务处理 API 代理。
或者直接在前端代码中调用 Bangumi API（需要处理 CORS）。

**Q: 如何回滚版本？**
A: OSS 支持版本控制功能，可以在控制台中恢复历史版本。

