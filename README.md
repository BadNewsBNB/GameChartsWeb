# 🎮 游戏排名可视化工具

基于 Vue 3 + Element Plus 开发的游戏排名可视化应用，使用 Bangumi API 搜索游戏数据。

## 功能特性

- 🎯 **四象限坐标系**：直观展示游戏在"好玩-不好玩"和"爱玩-不爱玩"两个维度的评价
- 🔍 **游戏搜索**：通过 Bangumi API 搜索海量游戏数据
- 🖱️ **拖拽放置**：点击游戏卡片即可添加到坐标系中
- 📏 **自由缩放**：每个游戏封面可以单独调整大小
- 🎨 **现代化 UI**：基于 Element Plus 组件库的精美界面
- 💾 **游戏库管理**：右侧游戏列表管理待选游戏

## 技术栈

- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **UI 组件库**: Element Plus
- **HTTP 客户端**: Axios
- **API**: Bangumi API (https://api.bgm.tv)

## 开始使用

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:3000` 启动。

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 项目结构

```
bgm_web/
├── src/
│   ├── api/                      # API 接口封装
│   │   └── bangumi.js            # Bangumi API 调用
│   ├── components/               # 组件
│   │   ├── CoordinateChart.vue   # 四象限坐标系组件
│   │   ├── GameCard.vue          # 游戏卡片组件
│   │   └── SearchDialog.vue      # 游戏搜索对话框
│   ├── App.vue                   # 根组件（主布局）
│   └── main.js                   # 应用入口
├── index.html                    # HTML 模板
├── vite.config.js               # Vite 配置
├── package.json                 # 项目配置
└── README.md                    # 项目说明
```

## API 说明

本项目使用 [Bangumi API](https://bangumi.github.io/api) 获取数据。

### 主要接口

- `POST /v0/search/subjects` - 条目搜索

### 搜索参数

- `keyword`: 搜索关键词（必填）
- `sort`: 排序方式（match/heat/rank/score）
- `type`: 条目类型（1=书籍, 2=动画, 3=音乐, 4=游戏, 6=三次元）
- `tag`: 标签筛选
- `limit`: 每页数量
- `offset`: 分页偏移量

## 使用指南

### 1. 添加游戏到游戏库

1. 点击右侧列表顶部的 **"添加游戏"** 按钮
2. 在弹出的搜索对话框中输入游戏名称（如：原神、塞尔达传说）
3. 点击搜索或按回车键
4. 在搜索结果中点击 **"添加"** 按钮将游戏加入游戏库
5. 添加后的游戏会出现在右侧的待选游戏列表中

### 2. 将游戏放置到坐标系

1. 在右侧游戏列表中，点击任意游戏卡片
2. 游戏会自动添加到左侧坐标系的中心位置
3. 拖动游戏封面可以移动到任意位置
   - **横轴**：不好玩（左）↔ 好玩（右）
   - **纵轴**：不爱玩（下）↔ 爱玩（上）

### 3. 调整游戏封面大小

1. 鼠标悬停在坐标系中的游戏封面上
2. 右下角会出现缩放控制点（图标）
3. 按住控制点拖动即可调整大小
4. 或右键点击游戏，选择 **"重置大小"** 恢复默认

### 4. 管理游戏

- **移除游戏**：右键点击坐标系中的游戏，选择 **"移除"**，游戏会返回右侧列表
- **查看名称**：鼠标悬停在游戏上会显示完整游戏名称
- **重复添加**：每个游戏只能在坐标系中出现一次

## 坐标系说明

四象限坐标系帮助你直观地评价游戏：

- **右上角（好玩 + 爱玩）**：高质量且喜欢的游戏
- **左上角（不好玩 + 爱玩）**：质量一般但很喜欢的游戏
- **右下角（好玩 + 不爱玩）**：高质量但不太喜欢的游戏
- **左下角（不好玩 + 不爱玩）**：质量和喜好都较低的游戏

## 技术实现

### 坐标系组件 (CoordinateChart.vue)

- 使用 SVG 绘制坐标轴和网格
- 实现游戏元素的拖拽和缩放
- 支持右键菜单操作
- 坐标转换：将屏幕坐标映射到数学坐标系

### 游戏卡片 (GameCard.vue)

- 展示游戏封面、名称、评分等信息
- 点击添加到坐标系
- 悬停提示效果

### 搜索功能 (SearchDialog.vue)

- 集成 Bangumi API 搜索
- 自动筛选游戏类型（type=4）
- 防止重复添加
- 支持分页浏览

### 代理配置

项目配置了开发代理（`vite.config.js`），将 `/api` 路径代理到 `https://api.bgm.tv`，解决跨域问题。

## 🚀 部署到线上

想要将项目部署到线上供其他人使用？根据目标用户选择合适的方案：

### 🇨🇳 中国大陆用户（推荐）

**最佳方案**：
- ⭐⭐⭐⭐⭐ **腾讯云 COS**（前6个月免费）→ [详细教程](./deploy-tencent.md)
- ⭐⭐⭐⭐⭐ **阿里云 OSS**（有免费额度）→ [详细教程](./deploy-aliyun.md)
- ⭐⭐⭐⭐ **又拍云联盟**（永久免费，需申请）

**免费方案对比**：查看 [中国大陆免费部署方案](./deploy-china-free.md)

### 🌏 海外用户

**推荐平台**：
- ⭐ **Vercel**：零配置，自动部署 → [快速部署](./快速部署.md)
- **Netlify**：简单易用，免费额度充足
- **Cloudflare Pages**：全球加速，速度快

**配置文件**（开箱即用）：
- ✅ `vercel.json` - Vercel配置
- ✅ `netlify.toml` - Netlify配置
- ✅ `public/_redirects` - Cloudflare Pages配置

### 📚 完整指南

- **所有平台对比**：[DEPLOYMENT.md](./DEPLOYMENT.md)
- **GitHub Pages + CDN**：[deploy-github-cdn.md](./deploy-github-cdn.md)

## 注意事项

1. 本项目仅供学习交流使用
2. 请遵守 Bangumi API 的使用规范
3. 建议配置合适的 User Agent
4. API 请求有频率限制，请合理使用

## License

MIT

