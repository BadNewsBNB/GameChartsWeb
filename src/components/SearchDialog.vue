<template>
  <el-dialog
    v-model="dialogVisible"
    title="搜索游戏"
    width="80%"
    :close-on-click-modal="false"
    class="search-dialog"
    top="5vh"
  >
    <!-- 搜索表单 -->
    <el-form :model="searchForm" label-width="80px" class="search-form">
      <el-row :gutter="20">
        <el-col :span="16">
          <el-form-item label="条目名称" required>
            <el-input
              v-model="searchForm.keyword"
              placeholder="请输入条目名称"
              clearable
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-form-item>
        </el-col>

        <el-col :span="8">
          <el-form-item label="排序">
            <el-select v-model="searchForm.sort" placeholder="请选择">
              <el-option label="匹配度" value="match" />
              <el-option label="热度" value="heat" />
              <el-option label="评分" value="score" />
              <el-option label="排名" value="rank" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="条目类型">
            <el-checkbox-group v-model="searchForm.types">
              <el-checkbox :label="4">游戏</el-checkbox>
              <el-checkbox :label="2">动画</el-checkbox>
              <el-checkbox :label="1">书籍</el-checkbox>
              <el-checkbox :label="3">音乐</el-checkbox>
              <el-checkbox :label="6">三次元</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label=" " class="search-btn-group">
            <el-button type="primary" @click="handleSearch" :loading="loading">
              <el-icon><Search /></el-icon>
              <span style="margin-left: 5px">搜索</span>
            </el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <el-divider />

    <!-- 搜索结果 -->
    <div class="search-results" v-loading="loading">
      <div v-if="!hasSearched" class="empty-tips">
        <el-empty
          description="请输入条目名称并选择类型开始搜索"
          :image-size="100"
        />
      </div>

      <div v-else-if="resultList.length === 0" class="empty-tips">
        <el-empty
          description="未找到相关条目，请尝试其他关键词或类型"
          :image-size="100"
        />
      </div>

      <div v-else class="result-list">
        <div class="result-header">
          <span class="result-count">共找到 {{ total }} 个条目</span>
        </div>

        <el-scrollbar height="450px">
          <div class="result-items">
            <div v-for="item in resultList" :key="item.id" class="result-item">
              <div class="item-content">
                <div class="item-cover">
                  <el-image
                    :src="item.images?.common || item.images?.medium"
                    fit="cover"
                    lazy
                  >
                    <template #error>
                      <div class="image-slot">
                        <el-icon><Picture /></el-icon>
                      </div>
                    </template>
                  </el-image>
                </div>

                <div class="item-info">
                  <div class="item-title">
                    <h3>{{ item.name_cn || item.name }}</h3>
                    <p
                      class="item-name-origin"
                      v-if="item.name_cn && item.name !== item.name_cn"
                    >
                      {{ item.name }}
                    </p>
                  </div>

                  <div class="item-meta">
                    <el-space wrap>
                      <el-tag v-if="item.date" size="small" type="info">
                        {{ item.date }}
                      </el-tag>
                      <el-tag v-if="item.rank" size="small" type="warning">
                        <el-icon><TrendCharts /></el-icon>
                        #{{ item.rank }}
                      </el-tag>
                      <el-tag v-if="item.score" size="small" type="success">
                        <el-icon><StarFilled /></el-icon>
                        {{ item.score }}
                      </el-tag>
                    </el-space>
                  </div>

                  <div class="item-summary" v-if="item.summary">
                    <p>{{ truncateSummary(item.summary, 100) }}</p>
                  </div>
                </div>

                <div class="item-actions">
                  <el-button
                    v-if="isGameAdded(item.id)"
                    disabled
                    size="default"
                  >
                    已添加
                  </el-button>
                  <el-button
                    v-else
                    type="primary"
                    @click="handleAddGame(item)"
                    size="default"
                  >
                    <el-icon><Plus /></el-icon>
                    添加
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-scrollbar>

        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 30, 50]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import {
  Search,
  Picture,
  Calendar,
  TrendCharts,
  StarFilled,
  Plus,
} from "@element-plus/icons-vue";
import { searchSubjects } from "@/api/bangumi";
import { getAccountSettings } from "@/utils/accountSettings";

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  existingGameIds: {
    type: Array,
    default: () => [],
  },
});

// Emits
const emit = defineEmits(["update:visible", "add-game"]);

// 对话框显示状态
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit("update:visible", val),
});

// 搜索表单 - 默认选中游戏类型
const searchForm = ref({
  keyword: "",
  sort: "match",
  types: [4], // 默认选中游戏
});

// 搜索状态
const loading = ref(false);
const hasSearched = ref(false);
const resultList = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);

// 判断游戏是否已添加
const isGameAdded = (gameId) => {
  return props.existingGameIds.includes(gameId);
};

// 获取类型名称
const getTypeName = (types) => {
  if (!types || types.length === 0) return "所有类型";
  const typeMap = {
    1: "书籍",
    2: "动画",
    3: "音乐",
    4: "游戏",
    6: "三次元",
  };
  return types.map((t) => typeMap[t] || "未知").join("、");
};

// 重置表单
const handleReset = () => {
  searchForm.value = {
    keyword: "",
    sort: "match",
    types: [4], // 重置时也默认选中游戏
  };
  resultList.value = [];
  total.value = 0;
  hasSearched.value = false;
  currentPage.value = 1;
};

// 执行搜索
const handleSearch = async () => {
  if (!searchForm.value.keyword.trim()) {
    ElMessage.warning("请输入条目名称");
    return;
  }

  if (!searchForm.value.types || searchForm.value.types.length === 0) {
    ElMessage.warning("请至少选择一种条目类型");
    return;
  }

  loading.value = true;
  hasSearched.value = true;

  try {
    // 从 localStorage 读取账号设置
    const { accessToken, includeNSFW } = getAccountSettings();

    // 构建筛选条件 - 使用用户选择的类型
    const filter = {
      type: searchForm.value.types,
    };

    // 如果启用了 NSFW 且有 Token，添加 nsfw 过滤器
    if (includeNSFW && accessToken) {
      filter.nsfw = null; // null = 包含所有内容（包括 R18）
    }

    // 调用搜索 API
    const offset = (currentPage.value - 1) * pageSize.value;
    const res = await searchSubjects({
      keyword: searchForm.value.keyword,
      sort: searchForm.value.sort,
      limit: pageSize.value,
      offset: offset,
      filter: filter,
      accessToken: includeNSFW && accessToken ? accessToken : null,
    });

    // 处理返回数据
    if (res && res.data) {
      resultList.value = res.data;
      total.value = res.total || 0;

      if (total.value > 0) {
        const typeText = getTypeName(searchForm.value.types);
        ElMessage.success(`找到 ${total.value} 个条目（${typeText}）`);
      } else {
        ElMessage.info("未找到相关条目");
      }
    } else {
      resultList.value = [];
      total.value = 0;
      ElMessage.info("未找到相关条目");
    }
  } catch (error) {
    console.error("搜索失败:", error);
    ElMessage.error("搜索失败，请稍后重试");
    resultList.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

// 添加游戏
const handleAddGame = (game) => {
  emit("add-game", game);
};

// 分页大小改变
const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1;
  handleSearch();
};

// 当前页改变
const handleCurrentChange = (val) => {
  currentPage.value = val;
  handleSearch();
};

// 截断简介
const truncateSummary = (text, maxLength = 100) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

// 监听对话框关闭
watch(dialogVisible, (val) => {
  if (!val) {
    // 对话框关闭时不清空搜索结果
  }
});
</script>

<style scoped>
.search-dialog :deep(.el-dialog__body) {
  padding: 20px;
}

.search-dialog :deep(.el-space_item) {
  display: flex;
}

.search-form {
  margin-bottom: 20px;
}

.search-btn-group {
  text-align: center;
}

.search-results {
  min-height: 300px;
}

.empty-tips {
  padding: 60px 0;
}

.result-header {
  margin-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-count {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.result-items {
  padding-right: 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s;
}

.result-item:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.item-content {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.item-cover {
  flex-shrink: 0;
  width: 100px;
  height: 140px;
  border-radius: 6px;
  overflow: hidden;
  background: #f5f7fa;
}

.item-cover .el-image {
  width: 100%;
  height: 100%;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
  font-size: 28px;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.item-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.item-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-name-origin {
  margin: 4px 0 0;
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.item-summary {
  color: #606266;
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
}

.item-summary p {
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
