<template>
  <div id="app">
    <el-container class="main-container">
      <!-- 顶部标题栏 -->
      <!-- <el-header class="header">
        <h1>🎮 游戏排名图</h1>
        <p class="subtitle">将游戏拖到坐标系中表达你的评价</p>
      </el-header> -->

      <!-- 主体区域 -->
      <el-main class="main-content">
        <!-- 左侧：坐标系绘图区 -->
        <div class="chart-section">
          <CoordinateChart
            :games="gamesInChart"
            :axis-labels="axisLabels"
            :chart-title="chartTitle"
            @update-game="handleUpdateGame"
            @remove-game="handleRemoveFromChart"
            @bring-to-front="handleBringToFront"
            @open-settings="openSettingsDialog"
          />
        </div>
      </el-main>

      <!-- 右侧：游戏列表（固定定位） -->
      <div class="game-list-sidebar">
        <div class="list-header">
          <h3>待选游戏库</h3>
          <div class="header-actions">
            <el-button
              type="success"
              @click="openImportDialog"
              :icon="Download"
              size="small"
            >
              导入收藏
            </el-button>
            <el-button
              type="primary"
              @click="openSearchDialog"
              :icon="Plus"
              size="small"
            >
              添加条目
            </el-button>
          </div>
        </div>

        <el-divider style="margin: 12px 0" />

        <div class="game-list">
          <el-empty
            v-if="gameLibrary.length === 0"
            description="暂无游戏，点击上方按钮添加"
            :image-size="100"
          />

          <el-scrollbar v-else :height="scrollbarHeight">
            <div class="game-cards">
              <GameCard
                v-for="game in gameLibrary"
                :key="game.id"
                :game="game"
                :disabled="isGameInChart(game.id)"
                @start-drag="handleStartDrag"
                @delete="handleDeleteGame"
                @bring-to-front="handleBringToFront"
              />
            </div>
          </el-scrollbar>
        </div>
      </div>
    </el-container>

    <!-- 搜索对话框 -->
    <SearchDialog
      v-model:visible="searchDialogVisible"
      :existing-game-ids="existingGameIds"
      @add-game="handleAddGame"
    />

    <!-- 导入对话框 -->
    <ImportDialog
      v-model:visible="importDialogVisible"
      :existing-game-ids="existingGameIds"
      @add-games="handleBatchAddGames"
    />

    <!-- 设置对话框 -->
    <SettingsDialog
      v-model:visible="settingsDialogVisible"
      :axis-labels="axisLabels"
      :chart-title="chartTitle"
      :game-library="gameLibrary"
      :games-in-chart="gamesInChart"
      @update-axis-labels="handleUpdateAxisLabels"
      @update-chart-title="handleUpdateChartTitle"
      @import-data="handleImportData"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { Plus, Download } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import SearchDialog from "./components/SearchDialog.vue";
import ImportDialog from "./components/ImportDialog.vue";
import SettingsDialog from "./components/SettingsDialog.vue";
import CoordinateChart from "./components/CoordinateChart.vue";
import GameCard from "./components/GameCard.vue";

// LocalStorage 键名
const STORAGE_KEY_LIBRARY = "bangumi_game_library";
const STORAGE_KEY_CHART = "bangumi_games_in_chart";
const STORAGE_KEY_AXIS_LABELS = "bangumi_axis_labels";
const STORAGE_KEY_CHART_TITLE = "bangumi_chart_title";

// 从本地存储加载数据
const loadFromStorage = () => {
  try {
    const libraryData = localStorage.getItem(STORAGE_KEY_LIBRARY);
    const chartData = localStorage.getItem(STORAGE_KEY_CHART);
    const axisLabelsData = localStorage.getItem(STORAGE_KEY_AXIS_LABELS);
    const chartTitleData = localStorage.getItem(STORAGE_KEY_CHART_TITLE);

    if (libraryData) {
      gameLibrary.value = JSON.parse(libraryData);
    }
    if (chartData) {
      gamesInChart.value = JSON.parse(chartData);
    }
    if (axisLabelsData) {
      axisLabels.value = JSON.parse(axisLabelsData);
    }
    if (chartTitleData) {
      chartTitle.value = JSON.parse(chartTitleData);
    }
  } catch (error) {
    console.error("加载本地数据失败:", error);
  }
};

// 保存到本地存储
const saveToStorage = () => {
  try {
    localStorage.setItem(
      STORAGE_KEY_LIBRARY,
      JSON.stringify(gameLibrary.value)
    );
    localStorage.setItem(STORAGE_KEY_CHART, JSON.stringify(gamesInChart.value));
    localStorage.setItem(STORAGE_KEY_AXIS_LABELS, JSON.stringify(axisLabels.value));
    localStorage.setItem(STORAGE_KEY_CHART_TITLE, JSON.stringify(chartTitle.value));
  } catch (error) {
    console.error("保存本地数据失败:", error);
  }
};

// 游戏库（所有添加的游戏）
const gameLibrary = ref([]);

// 坐标系中的游戏
const gamesInChart = ref([]);

// 坐标轴标签
const axisLabels = ref({
  horizontal: {
    positive: '好玩',
    negative: '不好玩'
  },
  vertical: {
    positive: '爱玩',
    negative: '不爱玩'
  }
});

// 图表标题
const chartTitle = ref({
  text: '',
  fontSize: 24,
  positionX: 'center',
  positionY: 'top',
  color: '#303133'
});

// 默认游戏大小（从本地存储加载）
const getDefaultGameSize = () => {
  try {
    const saved = localStorage.getItem('bangumi_default_game_size');
    if (saved) {
      const size = parseInt(saved, 10);
      if (size >= 40 && size <= 200) {
        return size;
      }
    }
  } catch (error) {
    console.error('加载默认游戏大小失败:', error);
  }
  return 60; // 默认值
};

// 搜索对话框显示状态
const searchDialogVisible = ref(false);

// 导入对话框显示状态
const importDialogVisible = ref(false);

// 设置对话框显示状态
const settingsDialogVisible = ref(false);

// 计算滚动区域高度
const scrollbarHeight = computed(() => {
  return "calc(100vh - 180px)";
});

// 已存在的游戏ID（用于去重）
const existingGameIds = computed(() => {
  return gameLibrary.value.map((g) => g.id);
});

// 判断游戏是否在坐标系中
const isGameInChart = (gameId) => {
  return gamesInChart.value.some((g) => g.id === gameId);
};

// 打开搜索对话框
const openSearchDialog = () => {
  searchDialogVisible.value = true;
};

// 打开导入对话框
const openImportDialog = () => {
  importDialogVisible.value = true;
};

// 打开设置对话框
const openSettingsDialog = () => {
  settingsDialogVisible.value = true;
};

// 更新坐标轴标签
const handleUpdateAxisLabels = (newLabels) => {
  axisLabels.value = JSON.parse(JSON.stringify(newLabels));
};

// 更新图表标题
const handleUpdateChartTitle = (newTitle) => {
  chartTitle.value = JSON.parse(JSON.stringify(newTitle));
};

// 导入数据
const handleImportData = (data) => {
  try {
    // 更新所有数据
    if (data.axisLabels) {
      axisLabels.value = data.axisLabels;
    }
    if (data.chartTitle) {
      chartTitle.value = data.chartTitle;
    }
    if (data.gameLibrary) {
      gameLibrary.value = data.gameLibrary;
    }
    if (data.gamesInChart) {
      gamesInChart.value = data.gamesInChart;
    }
    
    // 立即保存到本地存储
    saveToStorage();
  } catch (error) {
    console.error('导入数据失败:', error);
    ElMessage.error('导入数据失败：' + error.message);
  }
};

// 添加游戏到游戏库
const handleAddGame = (game) => {
  // 检查是否已存在
  if (existingGameIds.value.includes(game.id)) {
    ElMessage.warning("该游戏已在游戏库中");
    return;
  }

  gameLibrary.value.push({
    id: game.id,
    name: game.name_cn || game.name,
    nameOrigin: game.name,
    image: game.images?.common || game.images?.medium || game.images?.large,
    type: game.type,
    date: game.date,
    score: game.score,
  });

  ElMessage.success(`已添加《${game.name_cn || game.name}》`);
};

// 开始拖拽
const handleStartDrag = (game) => {
  // 将游戏添加到坐标系中心，使用当前的默认大小
  const chartGame = {
    ...game,
    x: 0, // 中心位置
    y: 0,
    size: getDefaultGameSize(), // 使用动态获取的默认大小
  };
  gamesInChart.value.push(chartGame);
};

// 更新坐标系中的游戏
const handleUpdateGame = (updatedGame) => {
  const index = gamesInChart.value.findIndex((g) => g.id === updatedGame.id);
  if (index !== -1) {
    gamesInChart.value[index] = updatedGame;
  }
};

// 从坐标系中移除游戏
const handleRemoveFromChart = (gameId) => {
  const index = gamesInChart.value.findIndex((g) => g.id === gameId);
  if (index !== -1) {
    gamesInChart.value.splice(index, 1);
    ElMessage.info("游戏已移回待选库");
  }
};

// 从游戏库中删除游戏
const handleDeleteGame = (gameId) => {
  ElMessageBox.confirm(
    '确定要删除该游戏吗？如果该游戏在坐标系中，也会一并移除。',
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      // 从游戏库中移除
      const libraryIndex = gameLibrary.value.findIndex((g) => g.id === gameId);
      if (libraryIndex !== -1) {
        const gameName = gameLibrary.value[libraryIndex].name;
        gameLibrary.value.splice(libraryIndex, 1);
        
        // 如果在坐标系中，也要移除
        const chartIndex = gamesInChart.value.findIndex((g) => g.id === gameId);
        if (chartIndex !== -1) {
          gamesInChart.value.splice(chartIndex, 1);
        }
        
        ElMessage.success(`已删除《${gameName}》`);
      }
    })
    .catch(() => {
      // 用户取消删除
    });
};

// 将游戏在坐标系中置顶
const handleBringToFront = (gameId) => {
  const index = gamesInChart.value.findIndex((g) => g.id === gameId);
  if (index !== -1) {
    // 将该游戏移到数组末尾（渲染时后渲染的在上层）
    const game = gamesInChart.value.splice(index, 1)[0];
    gamesInChart.value.push(game);
    // ElMessage.success("已置顶");
  }
};

// 批量添加游戏
const handleBatchAddGames = (games) => {
  let addedCount = 0;
  games.forEach(game => {
    // 检查是否已存在
    if (!existingGameIds.value.includes(game.id)) {
      gameLibrary.value.push(game);
      addedCount++;
    }
  });
  
  if (addedCount > 0) {
    ElMessage.success(`成功导入 ${addedCount} 个条目`);
  } else {
    ElMessage.info('所有条目都已在游戏库中');
  }
};

// 监听数据变化并保存
watch(
  [gameLibrary, gamesInChart, axisLabels, chartTitle],
  () => {
    saveToStorage();
  },
  { deep: true }
);

// 组件挂载时加载数据
onMounted(() => {
  loadFromStorage();
});
</script>

<style scoped>
#app {
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB",
    "Microsoft YaHei", Arial, sans-serif;
  min-height: 100vh;
  background: #f5f7fa;
}

.main-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  height: auto;
}

.header h1 {
  margin: 0 0 5px 0;
  font-size: 28px;
  color: #303133;
  font-weight: 600;
}

.subtitle {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.main-content {
  flex: 1;
  padding: 0;
  overflow: auto;
  margin-right: 360px;
}

.chart-section {
  width: 100%;
  min-height: calc(100vh - 120px);
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.game-list-sidebar {
  position: fixed;
  top: 0px;
  right: 0;
  width: 325px;
  height: calc(100vh);
  background: #fff;
  border-left: 2px solid #e4e7ed;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  padding: 20px;
  z-index: 100;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.list-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.game-list {
  flex: 1;
  overflow: hidden;
}

.game-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding-right: 8px;
  padding-bottom: 20px;
}
</style>
