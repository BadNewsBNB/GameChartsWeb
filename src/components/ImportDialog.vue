<template>
  <el-dialog
    v-model="dialogVisible"
    title="从 Bangumi 导入收藏"
    width="70%"
    :close-on-click-modal="false"
    class="import-dialog"
  >
    <!-- Access Token 输入 -->
    <el-alert
      title="使用说明"
      type="info"
      :closable="false"
      style="margin-bottom: 20px"
    >
      <p>
        1. 在
        <a href="https://next.bgm.tv/demo/access-token" target="_blank"
          >Bangumi</a
        >
        生成 Access Token
      </p>
      <p>2. 输入 Token 后点击"加载收藏"</p>
      <p>3. 选择要导入的条目，点击"批量添加"</p>
    </el-alert>

    <el-form :model="form" label-width="150px">
      <el-row :gutter="20">
        <el-col :span="16">
          <el-form-item label="Access Token" required>
            <el-input
              v-model="form.accessToken"
              placeholder="请输入您的 Bangumi Access Token"
              type="password"
              show-password
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label=" ">
            <el-button
              type="primary"
              @click="loadCollections"
              :loading="loading"
              :disabled="!form.accessToken"
            >
              加载收藏
            </el-button>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="条目类型">
            <el-select v-model="form.subjectType" placeholder="全部类型">
              <el-option label="全部类型" :value="undefined" />
              <el-option label="游戏" :value="4" />
              <el-option label="动画" :value="2" />
              <el-option label="书籍" :value="1" />
              <el-option label="音乐" :value="3" />
              <el-option label="三次元" :value="6" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="收藏状态">
            <el-select v-model="form.collectionType" placeholder="全部状态">
              <el-option label="全部状态" :value="undefined" />
              <el-option label="在看/在玩" :value="3" />
              <el-option label="看过/玩过" :value="2" />
              <el-option label="想看/想玩" :value="1" />
              <el-option label="搁置" :value="4" />
              <el-option label="抛弃" :value="5" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="用户标签">
            <el-select
              v-model="form.selectedTags"
              multiple
              filterable
              placeholder="选择标签进行筛选（可多选）"
              :disabled="availableTags.length === 0"
            >
              <el-option
                v-for="tag in availableTags"
                :key="tag"
                :label="`${tag} (${tagCounts[tag]})`"
                :value="tag"
              />
            </el-select>
            <template #append v-if="availableTags.length > 0">
              <el-button @click="clearTagFilter" size="small">清除</el-button>
            </template>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <el-divider />

    <!-- 收藏列表 -->
    <div v-if="hasLoaded" class="collections-section">
      <div class="section-header">
        <div class="header-left">
          <span class="result-count"
            >共 {{ filteredCollections.length }} 个收藏</span
          >
          <el-button-group style="margin-left: 12px">
            <el-button
              size="small"
              @click="selectAll"
              :disabled="filteredCollections.length === 0"
            >
              全选
            </el-button>
            <el-button
              size="small"
              @click="selectNone"
              :disabled="selectedIds.length === 0"
            >
              反选
            </el-button>
          </el-button-group>
        </div>
        <el-button
          type="success"
          size="small"
          :disabled="selectedIds.length === 0"
          @click="handleBatchAdd"
        >
          批量添加 ({{ selectedIds.length }})
        </el-button>
      </div>

      <el-scrollbar height="400px">
        <div v-if="filteredCollections.length === 0" class="empty-state">
          <el-empty
            :description="
              collections.length === 0
                ? '暂无收藏数据'
                : '没有符合筛选条件的收藏'
            "
          />
        </div>
        <div v-else class="collection-list">
          <div
            v-for="item in filteredCollections"
            :key="item.subject_id"
            class="collection-item"
            :class="{ 'is-selected': selectedIds.includes(item.subject_id) }"
            @click="toggleSelect(item.subject_id)"
          >
            <el-checkbox
              :model-value="selectedIds.includes(item.subject_id)"
              @click.stop="toggleSelect(item.subject_id)"
            />
            <div class="item-cover">
              <el-image :src="item.subject?.images?.common" fit="cover">
                <template #error>
                  <div class="image-slot">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
            </div>
            <div class="item-info">
              <div class="item-title-row">
                <div class="item-name">
                  {{ item.subject?.name_cn || item.subject?.name }}
                </div>
              </div>
              <div class="item-meta">
                <el-tag size="small" type="info">{{
                  getTypeName(item.subject_type)
                }}</el-tag>
                <el-tag size="small">{{
                  getCollectionTypeName(item.type)
                }}</el-tag>
                <span v-if="item.rate" class="rating">
                  <el-icon><StarFilled /></el-icon>
                  {{ item.rate }}
                </span>
              </div>
              <div v-if="item.tags && item.tags.length > 0" class="item-tags">
                <el-tag
                  v-for="tag in item.tags.slice(0, 5)"
                  :key="tag"
                  size="small"
                  type="info"
                  effect="plain"
                  class="tag-item"
                >
                  {{ tag }}
                </el-tag>
                <span v-if="item.tags.length > 5" class="more-tags"
                  >+{{ item.tags.length - 5 }}</span
                >
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
          :total="total"
          :page-sizes="[30, 50, 100, 200]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import { Picture, StarFilled } from "@element-plus/icons-vue";
import {
  getCurrentUser,
  getUserCollections,
  getSubjectsByIds,
} from "@/api/bangumi";

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

const emit = defineEmits(["update:visible", "add-games"]);

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit("update:visible", val),
});

// 表单数据
const form = ref({
  accessToken: "",
  subjectType: undefined,
  collectionType: undefined,
  selectedTags: [],
});

// 加载状态
const loading = ref(false);
const hasLoaded = ref(false);

// 收藏数据
const collections = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(50);

// 当前用户信息
const currentUsername = ref("");

// 选中的ID
const selectedIds = ref([]);

// 计算所有可用的标签和数量
const availableTags = computed(() => {
  const tagSet = new Set();
  collections.value.forEach((item) => {
    if (item.tags && Array.isArray(item.tags)) {
      item.tags.forEach((tag) => {
        if (tag && tag.trim()) {
          tagSet.add(tag.trim());
        }
      });
    }
  });
  return Array.from(tagSet).sort();
});

const tagCounts = computed(() => {
  const counts = {};
  collections.value.forEach((item) => {
    if (item.tags && Array.isArray(item.tags)) {
      item.tags.forEach((tag) => {
        if (tag && tag.trim()) {
          const trimmedTag = tag.trim();
          counts[trimmedTag] = (counts[trimmedTag] || 0) + 1;
        }
      });
    }
  });
  return counts;
});

// 根据选中的标签筛选收藏
const filteredCollections = computed(() => {
  let filtered = collections.value;

  // 1. 根据条目类型过滤（前端过滤）
  if (form.value.subjectType !== undefined) {
    filtered = filtered.filter((item) => {
      return item.subject?.type === form.value.subjectType;
    });
  }

  // 2. 根据用户标签过滤（前端过滤）
  if (form.value.selectedTags.length > 0) {
    filtered = filtered.filter((item) => {
      if (!item.tags || !Array.isArray(item.tags) || item.tags.length === 0) {
        return false;
      }
      // 检查是否包含所有选中的标签（AND 逻辑）
      return form.value.selectedTags.every((selectedTag) =>
        item.tags.some((itemTag) => itemTag && itemTag.trim() === selectedTag)
      );
    });
  }

  return filtered;
});

// 保存 Access Token 并清除用户名
watch(
  () => form.value.accessToken,
  (token, oldToken) => {
    if (token) {
      localStorage.setItem("bangumi_access_token", token);
    }
    // Token 改变时清除用户名，需要重新验证
    if (token !== oldToken) {
      currentUsername.value = "";
      hasLoaded.value = false;
      collections.value = [];
      total.value = 0;
    }
  }
);

// 加载 Access Token
const loadSavedToken = () => {
  const saved = localStorage.getItem("bangumi_access_token");
  if (saved) {
    form.value.accessToken = saved;
  }
};

// 加载收藏
const loadCollections = async () => {
  if (!form.value.accessToken) {
    ElMessage.warning("请输入 Access Token");
    return;
  }

  loading.value = true;
  try {
    // 先获取当前用户信息
    if (!currentUsername.value) {
      ElMessage.info("正在验证 Access Token...");
      const userInfo = await getCurrentUser(form.value.accessToken);
      currentUsername.value = userInfo.username;
      ElMessage.success(
        `登录成功，欢迎 ${userInfo.nickname || userInfo.username}`
      );
    }

    // 使用实际的用户名加载收藏
    const offset = (currentPage.value - 1) * pageSize.value;
    // 注意：只传递 type（收藏状态）参数给后端，subjectType（条目类型）在前端过滤
    const res = await getUserCollections({
      username: currentUsername.value,
      accessToken: form.value.accessToken,
      type: form.value.collectionType,
      limit: pageSize.value,
      offset,
    });

    if (res && res.data) {
      collections.value = res.data;
      total.value = res.total || 0;
      hasLoaded.value = true;

      if (total.value === 0) {
        ElMessage.info("暂无符合条件的收藏");
      } else {
        ElMessage.success(`加载成功，共 ${total.value} 个收藏`);
      }
    }
  } catch (error) {
    console.error("加载收藏失败:", error);
    if (error.response?.status === 401) {
      ElMessage.error("Access Token 无效或已过期，请重新生成");
      currentUsername.value = "";
    } else if (error.response?.status === 404) {
      ElMessage.error("用户不存在或无权限查看该收藏");
    } else {
      ElMessage.error(
        "加载失败：" +
          (error.response?.data?.description || error.message || "未知错误")
      );
    }
  } finally {
    loading.value = false;
  }
};

// 切换选中
const toggleSelect = (id) => {
  const index = selectedIds.value.indexOf(id);
  if (index > -1) {
    selectedIds.value.splice(index, 1);
  } else {
    selectedIds.value.push(id);
  }
};

// 全选
const selectAll = () => {
  selectedIds.value = filteredCollections.value.map((item) => item.subject_id);
  ElMessage.success(`已选中 ${selectedIds.value.length} 个条目`);
};

// 反选
const selectNone = () => {
  selectedIds.value = [];
  ElMessage.info("已清空选择");
};

// 清除标签筛选
const clearTagFilter = () => {
  form.value.selectedTags = [];
};

// 批量添加
const handleBatchAdd = () => {
  const selectedGames = collections.value
    .filter((c) => selectedIds.value.includes(c.subject_id))
    .filter((c) => !props.existingGameIds.includes(c.subject_id))
    .map((c) => ({
      id: c.subject_id,
      name: c.subject?.name_cn || c.subject?.name,
      nameOrigin: c.subject?.name,
      image: c.subject?.images?.common || c.subject?.images?.medium,
      type: c.subject_type,
      date: c.subject?.date,
      score: c.subject?.score,
    }));

  if (selectedGames.length === 0) {
    ElMessage.warning("所选条目都已在游戏库中");
    return;
  }

  emit("add-games", selectedGames);
  selectedIds.value = [];
  ElMessage.success(`已添加 ${selectedGames.length} 个条目`);
};

// 分页改变
const handleSizeChange = () => {
  currentPage.value = 1;
  loadCollections();
};

const handlePageChange = () => {
  loadCollections();
};

// 获取类型名称
const getTypeName = (type) => {
  const typeMap = {
    1: "书籍",
    2: "动画",
    3: "音乐",
    4: "游戏",
    6: "三次元",
  };
  return typeMap[type] || "未知";
};

// 获取收藏类型名称
const getCollectionTypeName = (type) => {
  const typeMap = {
    1: "想看",
    2: "看过",
    3: "在看",
    4: "搁置",
    5: "抛弃",
  };
  return typeMap[type] || "未知";
};

// 监听对话框打开
watch(dialogVisible, (val) => {
  if (val) {
    loadSavedToken();
  }
});

// 监听收藏状态变化 - 需要重新请求 API（后端过滤）
watch(() => form.value.collectionType, () => {
  if (hasLoaded.value) {
    currentPage.value = 1;
    loadCollections();
  }
});

// 监听条目类型变化 - 仅前端过滤，不需要重新请求
watch(() => form.value.subjectType, () => {
  if (hasLoaded.value) {
    // 只保留仍在筛选结果中的选择
    const filteredIds = filteredCollections.value.map((item) => item.subject_id);
    selectedIds.value = selectedIds.value.filter((id) => filteredIds.includes(id));
  }
});

// 监听用户标签变化 - 仅前端过滤，不需要重新请求
watch(
  () => form.value.selectedTags,
  () => {
    if (hasLoaded.value) {
      // 只保留仍在筛选结果中的选择
      const filteredIds = filteredCollections.value.map((item) => item.subject_id);
      selectedIds.value = selectedIds.value.filter((id) => filteredIds.includes(id));
    }
  },
  { deep: true }
);

</script>

<style scoped>
.import-dialog :deep(.el-dialog__body) {
  padding: 20px;
}

.import-dialog a {
  color: #409eff;
  text-decoration: none;
}

.import-dialog a:hover {
  text-decoration: underline;
}

.collections-section {
  margin-top: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.header-left {
  display: flex;
  align-items: center;
}

.result-count {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.empty-state {
  padding: 60px 0;
}

.collection-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 10px;
}

.collection-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.collection-item:hover {
  border-color: #409eff;
  background: #f0f9ff;
}

.collection-item.is-selected {
  border-color: #409eff;
  background: #e6f7ff;
}

.item-cover {
  width: 60px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  background: #f5f7fa;
  flex-shrink: 0;
}

.item-cover .el-image {
  width: 100%;
  height: 100%;
}

.image-slot {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 20px;
}

.item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.item-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.rating {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #f7ba2a;
  font-size: 12px;
  font-weight: 600;
}

.item-tags {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.tag-item {
  cursor: default;
}

.more-tags {
  font-size: 12px;
  color: #909399;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
