# 🔞 NSFW 内容访问说明

## 📋 概述

Bangumi API 默认会**排除** NSFW（R18）内容。要访问 NSFW 内容，需要：

1. ✅ **获取 Access Token**（必需）
2. ✅ **在搜索时传递 Token**
3. ✅ **在 filter 中设置 nsfw 参数**

## 🔑 获取 Access Token

### 步骤 1：登录 Bangumi
访问 https://bgm.tv/ 并登录你的账号

### 步骤 2：创建 Access Token
访问 https://next.bgm.tv/demo/access-token

或者：
1. 进入 https://bgm.tv/dev/app
2. 创建一个新的应用
3. 获取 Access Token

### 步骤 3：保存 Token
复制生成的 Access Token，格式类似：
```
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 🛠️ API 使用方法

### 方法 1：包含所有内容（包括 NSFW）

```javascript
import { searchSubjects } from '@/api/bangumi'

const results = await searchSubjects({
  keyword: '游戏名称',
  filter: {
    type: [4], // 游戏类型
    nsfw: null // null = 返回所有内容（包括 NSFW）
  },
  accessToken: 'YOUR_ACCESS_TOKEN' // 必需！
})
```

### 方法 2：只返回 NSFW 内容

```javascript
const results = await searchSubjects({
  keyword: '游戏名称',
  filter: {
    type: [4],
    nsfw: true // 只返回 R18 内容
  },
  accessToken: 'YOUR_ACCESS_TOKEN'
})
```

### 方法 3：排除 NSFW 内容（默认）

```javascript
const results = await searchSubjects({
  keyword: '游戏名称',
  filter: {
    type: [4],
    nsfw: false // 排除 R18 内容
  }
  // 不需要 accessToken
})
```

## 🔧 在项目中集成

### 选项 A：添加 NSFW 开关到搜索对话框

修改 `SearchDialog.vue`：

```vue
<template>
  <!-- 在搜索表单中添加 -->
  <el-form-item label="包含 R18">
    <el-switch v-model="includeNSFW" />
    <el-text type="info" size="small">需要 Access Token</el-text>
  </el-form-item>
  
  <el-form-item label="Access Token" v-if="includeNSFW">
    <el-input 
      v-model="accessToken" 
      type="password"
      placeholder="输入你的 Bangumi Access Token"
    />
  </el-form-item>
</template>

<script setup>
const includeNSFW = ref(false)
const accessToken = ref('')

// 在搜索时
const handleSearch = async () => {
  const filter = {
    type: searchForm.value.types,
    nsfw: includeNSFW.value ? null : false // null=包含, false=排除
  }
  
  const res = await searchSubjects({
    keyword: searchForm.value.keyword,
    sort: searchForm.value.sort,
    limit: pageSize.value,
    offset: offset,
    filter: filter,
    accessToken: includeNSFW.value ? accessToken.value : null
  })
}
</script>
```

### 选项 B：在设置中全局配置

在 `SettingsDialog.vue` 中添加 Access Token 配置：

```vue
<el-tab-pane label="账号设置" name="account">
  <el-form label-width="120px">
    <el-form-item label="Access Token">
      <el-input 
        v-model="accessToken" 
        type="password"
        placeholder="用于访问 NSFW 内容"
      />
      <el-text type="info" size="small">
        <a href="https://next.bgm.tv/demo/access-token" target="_blank">
          点击获取 Access Token
        </a>
      </el-text>
    </el-form-item>
    
    <el-form-item label="包含 R18 内容">
      <el-switch v-model="includeNSFW" />
    </el-form-item>
  </el-form>
</el-tab-pane>
```

然后保存到 localStorage：

```javascript
// 保存
localStorage.setItem('bangumi_access_token', accessToken)
localStorage.setItem('bangumi_include_nsfw', includeNSFW)

// 读取
const savedToken = localStorage.getItem('bangumi_access_token')
const savedNSFW = localStorage.getItem('bangumi_include_nsfw') === 'true'
```

## ⚠️ 重要注意事项

### 1. 安全性
- ⚠️ **不要将 Access Token 硬编码在代码中**
- ⚠️ **不要将 Token 提交到 Git 仓库**
- ✅ 使用 localStorage 存储在用户浏览器中
- ✅ 或者让用户每次手动输入

### 2. 权限
- 只有**登录用户的 Access Token** 才能访问 NSFW 内容
- 未授权的请求会**自动忽略** nsfw 参数

### 3. 隐私
- localStorage 中的 Token 只存在用户本地
- 不会上传到服务器
- 用户可以随时清除

## 📊 NSFW 参数说明

| nsfw 值 | 说明 | 需要 Token |
|---------|------|-----------|
| `null` 或不设置 | 返回所有内容（包括 R18） | ✅ 是 |
| `true` | 只返回 R18 内容 | ✅ 是 |
| `false` | 排除 R18 内容（默认） | ❌ 否 |

## 🧪 测试

### 测试 1：不带 Token（默认行为）
```javascript
// 不会返回 R18 内容
await searchSubjects({
  keyword: '测试',
  filter: { type: [4] }
})
```

### 测试 2：带 Token，包含 NSFW
```javascript
// 会返回包括 R18 在内的所有内容
await searchSubjects({
  keyword: '测试',
  filter: { 
    type: [4],
    nsfw: null 
  },
  accessToken: 'YOUR_TOKEN'
})
```

### 测试 3：带 Token，只要 NSFW
```javascript
// 只返回 R18 内容
await searchSubjects({
  keyword: '测试',
  filter: { 
    type: [4],
    nsfw: true 
  },
  accessToken: 'YOUR_TOKEN'
})
```

## 💡 推荐实现

建议在设置中添加一个"高级选项"：

1. 用户可以输入并保存 Access Token
2. 添加一个"包含 R18 内容"的开关
3. Token 和设置保存在 localStorage
4. 在所有搜索和导入时自动使用这些设置

这样用户只需要配置一次，之后就能正常搜索所有内容了。

