# 腾讯云 COS 部署详细指南（6个月免费）

## 🎁 免费额度

新用户免费6个月：
- 存储空间：50GB
- CDN流量：10GB/月
- 请求次数：100万次/月

**申请地址**：https://cloud.tencent.com/act/free

## 📋 详细步骤

### 第一步：注册并实名认证

1. 访问 https://cloud.tencent.com
2. 注册账号（微信扫码即可）
3. 完成实名认证（个人认证即可，需要身份证）

### 第二步：开通 COS 服务

1. 搜索"对象存储"或访问：https://console.cloud.tencent.com/cos5
2. 点击"立即开通"
3. 同意服务协议

### 第三步：创建存储桶

1. 点击"存储桶列表" → "创建存储桶"
2. 配置信息：
   - **名称**：game-charts-xxx（系统会自动加数字后缀）
   - **所属地域**：选择离你近的地域（如北京、上海、广州）
   - **访问权限**：公有读私有写
   - **其他保持默认**
3. 点击"下一步" → "创建"

### 第四步：配置静态网站托管

1. 进入刚创建的存储桶
2. 点击左侧"基础配置" → "静态网站"
3. 点击"编辑"，开启静态网站
4. 配置：
   - **索引文档**：index.html
   - **错误文档**：index.html
   - **重定向规则**：不填
5. 保存

### 第五步：上传网站文件

#### 方式1：使用网页上传（简单）

1. 构建项目：
   ```bash
   cd bgm_web
   npm run build
   ```

2. 在 COS 控制台，点击"文件列表"
3. 点击"上传文件"
4. 选择 `dist` 文件夹中的**所有文件**（不要上传 dist 文件夹本身）
5. 等待上传完成

#### 方式2：使用 COSBrowser 客户端（推荐）

1. 下载 COSBrowser：
   - Windows：https://cos5.cloud.tencent.com/cosbrowser/cosbrowser-setup-latest.exe
   - Mac：https://cos5.cloud.tencent.com/cosbrowser/cosbrowser-latest.dmg

2. 安装并登录腾讯云账号

3. 选择存储桶，直接拖拽 `dist` 文件夹中的文件上传

#### 方式3：使用命令行工具（高级）

```bash
# 安装 COSCMD
pip install coscmd

# 配置（替换为你的信息）
coscmd config -a <SecretId> -s <SecretKey> -b <BucketName-APPID> -r <Region>

# 上传
cd bgm_web
npm run build
coscmd upload -r dist/ / --delete
```

### 第六步：获取访问地址

1. 在存储桶"基础配置"中找到"静态网站"部分
2. 会显示访问地址，类似：
   ```
   http://game-charts-xxx.cos-website.ap-beijing.myqcloud.com
   ```

3. 访问这个地址即可看到你的网站！

### 第七步：配置 CDN 加速（可选，推荐）

1. 在存储桶左侧点击"域名与传输管理" → "自定义 CDN 加速域名"
2. 点击"添加域名"
3. 如果有自己的域名：
   - 输入域名（如 game.yourdomain.com）
   - 需要在域名服务商添加 CNAME 记录
   - **需要备案**
4. 如果没有域名，直接使用默认的 CDN 域名

## 🔄 后续更新

每次更新网站，只需：

```bash
# 1. 构建
npm run build

# 2. 上传（使用 COSBrowser 或网页上传）
```

或者创建自动部署脚本（见下方）。

## 🤖 自动部署脚本（可选）

### 安装依赖

```bash
npm install --save-dev cos-nodejs-sdk-v5
```

### 创建 deploy.js

```javascript
const COS = require('cos-nodejs-sdk-v5');
const fs = require('fs');
const path = require('path');

const cos = new COS({
  SecretId: process.env.TENCENT_SECRET_ID,
  SecretKey: process.env.TENCENT_SECRET_KEY,
});

const Bucket = 'your-bucket-name'; // 替换为你的存储桶名
const Region = 'ap-beijing'; // 替换为你的地域

function uploadDir(dirPath) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      uploadDir(filePath);
    } else {
      const key = path.relative('dist', filePath).replace(/\\/g, '/');
      cos.putObject({
        Bucket,
        Region,
        Key: key,
        Body: fs.createReadStream(filePath),
      }, (err, data) => {
        if (err) {
          console.error(`上传失败: ${key}`, err);
        } else {
          console.log(`上传成功: ${key}`);
        }
      });
    }
  });
}

uploadDir('dist');
```

### 在 package.json 添加脚本

```json
{
  "scripts": {
    "deploy": "npm run build && node deploy.js"
  }
}
```

### 使用

```bash
# 设置环境变量
export TENCENT_SECRET_ID=your_secret_id
export TENCENT_SECRET_KEY=your_secret_key

# 部署
npm run deploy
```

## 💰 费用说明

### 免费期间（前6个月）
- 完全免费

### 6个月后
- **存储费用**：0.099元/GB/月（标准存储）
- **流量费用**：0.5元/GB（外网流出）
- **请求费用**：0.01元/万次

**示例计算：**
- 网站大小：10MB
- 月访问量：1000次
- 月流量：10GB

**费用** ≈ 0.1元（存储）+ 5元（流量）= **约5元/月**

小型项目通常每月 2-5 元。

## ⚠️ 注意事项

### 1. API 代理问题

COS 是纯静态托管，需要配合云函数处理 API 代理：

**创建云函数**（腾讯云函数也有免费额度）：

```javascript
// 云函数代码
exports.main_handler = async (event) => {
  const https = require('https');
  
  return new Promise((resolve) => {
    https.get('https://api.bgm.tv' + event.path, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: data
        });
      });
    });
  });
};
```

### 2. 自定义域名

如果要使用自己的域名：
- 域名必须在国内备案
- 在 DNS 中添加 CNAME 记录指向 COS 提供的域名

### 3. HTTPS

- 使用 COS 默认域名支持 HTTPS
- 自定义域名需要上传 SSL 证书（腾讯云可以申请免费证书）

## 📞 常见问题

**Q: 一定要实名认证吗？**
A: 是的，这是国家规定，所有云服务都需要。

**Q: 6个月后不想付费怎么办？**
A: 可以删除存储桶，不会产生费用。或者迁移到其他平台。

**Q: 能绑定自己的域名吗？**
A: 可以，但域名需要备案。

**Q: 如何删除所有文件？**
A: 在控制台选中所有文件，点击删除。或者直接删除存储桶。

## 🎉 完成

现在你的网站已经部署到腾讯云了！

- 访问速度快
- 6个月免费
- 国内用户友好

需要帮助可以随时问我！

