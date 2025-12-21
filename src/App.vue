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
            @add-game-to-chart="handleAddGameToChart"
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

        <div
          class="game-list"
          @drop="handleFileDrop"
          @dragover.prevent="handleDragOver"
          @dragleave="handleDragLeave"
          :class="{ 'drag-over': isDragOver }"
        >
          <el-empty
            v-if="gameLibrary.length === 0"
            description="暂无游戏，点击上方按钮添加或拖拽图片到此处"
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
                @rename="handleRenameGame"
              />
            </div>
          </el-scrollbar>

          <!-- 拖拽提示遮罩 -->
          <div v-if="isDragOver" class="drag-overlay">
            <div class="drag-hint">
              <el-icon :size="48" color="#409eff"><Plus /></el-icon>
              <p>释放以添加图片</p>
            </div>
          </div>
        </div>

        <!-- 底部信息栏 -->
        <div class="footer-info">
          <p class="info-line">
            <a
              href="https://github.com/BadNewsBNB/GameChartsWeb"
              target="_blank"
              rel="noopener noreferrer"
            >
              Booo
            </a>
            <span> made with Cursor</span>
            <!-- <a
              href="https://github.com/BadNewsBNB/GameChartsWeb"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://img.shields.io/github/stars/BadNewsBNB/GameChartsWeb?style=social"
                alt="GitHub Stars"
              />
            </a> -->
          </p>
          <p class="info-line">
            <span>Powered by </span>
            <a href="https://bgm.tv" target="_blank" rel="noopener noreferrer">
              Bangumi
            </a>
          </p>
          <p class="info-line" style="margin-top: 3px">
            <img
              src="https://hits.sh/games.marblephantasm.org.svg?style=flat&label=visitors&color=409eff&labelColor=555"
              alt="访问统计"
            />
          </p>
          <p class="info-line" style="margin-top: 3px; font-size: 12px; color: #909399">
            Last update: {{ buildTime }}
          </p>
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
      @clear-chart="handleClearChart"
      @clear-all-data="handleClearAllData"
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

// 构建时间（在构建时注入）
const buildTime = __BUILD_TIME__;

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
    localStorage.setItem(
      STORAGE_KEY_AXIS_LABELS,
      JSON.stringify(axisLabels.value)
    );
    localStorage.setItem(
      STORAGE_KEY_CHART_TITLE,
      JSON.stringify(chartTitle.value)
    );
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
    positive: "好玩",
    negative: "不好玩",
  },
  vertical: {
    positive: "爱玩",
    negative: "不爱玩",
  },
});

// 图表标题
const chartTitle = ref({
  text: "",
  fontSize: 24,
  positionX: "center",
  positionY: "top",
  color: "#303133",
});

// 默认游戏大小（从本地存储加载）
const getDefaultGameSize = () => {
  try {
    const saved = localStorage.getItem("bangumi_default_game_size");
    if (saved) {
      const size = parseInt(saved, 10);
      if (size >= 40 && size <= 200) {
        return size;
      }
    }
  } catch (error) {
    console.error("加载默认游戏大小失败:", error);
  }
  return 60; // 默认值
};

// 搜索对话框显示状态
const searchDialogVisible = ref(false);

// 导入对话框显示状态
const importDialogVisible = ref(false);

// 设置对话框显示状态
const settingsDialogVisible = ref(false);

// 拖拽状态
const isDragOver = ref(false);

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
    // 导入图表标题（确保完整复制对象）
    if (data.chartTitle) {
      chartTitle.value = {
        text: data.chartTitle.text || "",
        fontSize: data.chartTitle.fontSize || 24,
        positionX: data.chartTitle.positionX || "center",
        positionY: data.chartTitle.positionY || "top",
        color: data.chartTitle.color || "#303133",
      };
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
    console.error("导入数据失败:", error);
    ElMessage.error("导入数据失败：" + error.message);
  }
};

// 清除坐标系（移回待选栏）
const handleClearChart = () => {
  // 只清空坐标系，游戏库保持不变
  gamesInChart.value = [];
};

// 清除所有数据
const handleClearAllData = () => {
  // 清空游戏库和坐标系
  gameLibrary.value = [];
  gamesInChart.value = [];
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

// 从待选区直接拖拽游戏到坐标系
const handleAddGameToChart = (gameData) => {
  // 检查游戏是否已在游戏库中
  const existingInLibrary = gameLibrary.value.find(g => g.id === gameData.id);
  
  if (!existingInLibrary) {
    // 如果不在游戏库中，先添加到游戏库
    gameLibrary.value.push({
      id: gameData.id,
      name: gameData.name_cn || gameData.name,
      nameOrigin: gameData.name,
      image: gameData.images?.common || gameData.images?.medium || gameData.images?.large || gameData.image,
      type: gameData.type,
      date: gameData.date,
      score: gameData.score,
    });
  }
  
  // 检查是否已在坐标系中
  const existingInChart = gamesInChart.value.find(g => g.id === gameData.id);
  
  if (existingInChart) {
    // 如果已在坐标系中，更新位置
    const index = gamesInChart.value.findIndex(g => g.id === gameData.id);
    gamesInChart.value[index] = {
      ...existingInChart,
      x: gameData.x,
      y: gameData.y,
    };
    ElMessage.success('已更新位置');
  } else {
    // 添加到坐标系
    gamesInChart.value.push({
      id: gameData.id,
      name: gameData.name_cn || gameData.name || existingInLibrary?.name,
      image: gameData.images?.common || gameData.images?.medium || gameData.images?.large || gameData.image || existingInLibrary?.image,
      x: gameData.x,
      y: gameData.y,
      size: gameData.size || 60,
    });
    // ElMessage.success(`已添加《${gameData.name_cn || gameData.name}》到坐标系`);
  }
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
    "确定要删除该游戏吗？如果该游戏在坐标系中，也会一并移除。",
    "删除确认",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
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

// 重命名游戏
const handleRenameGame = (gameId, newName) => {
  // 更新游戏库中的名称
  const libraryIndex = gameLibrary.value.findIndex((g) => g.id === gameId);
  if (libraryIndex !== -1) {
    gameLibrary.value[libraryIndex].name = newName;
    
    // 如果该游戏在坐标系中，也要同步更新名称
    const chartIndex = gamesInChart.value.findIndex((g) => g.id === gameId);
    if (chartIndex !== -1) {
      gamesInChart.value[chartIndex].name = newName;
    }
    
    ElMessage.success(newName ? `已重命名为《${newName}》` : '已清除名称');
  }
};

// 批量添加游戏
const handleBatchAddGames = (games) => {
  let addedCount = 0;
  games.forEach((game) => {
    // 检查是否已存在
    if (!existingGameIds.value.includes(game.id)) {
      gameLibrary.value.push(game);
      addedCount++;
    }
  });

  if (addedCount > 0) {
    ElMessage.success(`成功导入 ${addedCount} 个条目`);
  } else {
    ElMessage.info("所有条目都已在游戏库中");
  }
};

// 处理文件拖拽进入
const handleDragOver = (event) => {
  event.preventDefault();
  // 检查是否包含真正的文件（从文件管理器拖入）
  // 排除从游戏卡片拖出的情况（游戏卡片会设置 application/json 数据）
  const hasFiles = event.dataTransfer.files && event.dataTransfer.files.length > 0;
  const hasJsonData = event.dataTransfer.types.includes("application/json");
  
  // 只有当有真正的文件且不是从游戏卡片拖出时才显示提示
  if (hasFiles && !hasJsonData) {
    isDragOver.value = true;
  } else {
    isDragOver.value = false;
  }
};

// 处理文件拖拽离开
const handleDragLeave = (event) => {
  event.preventDefault();
  // 只有离开整个区域时才取消高亮
  if (event.target.classList.contains("game-list")) {
    isDragOver.value = false;
  }
};

// 处理文件拖放
const handleFileDrop = async (event) => {
  event.preventDefault();
  isDragOver.value = false;

  // 检查是否是从游戏卡片拖出的（包含 application/json 数据）
  const hasJsonData = event.dataTransfer.types.includes("application/json");
  if (hasJsonData) {
    // 这是从游戏卡片拖出的，不应该在这里处理，直接返回
    return;
  }

  const files = Array.from(event.dataTransfer.files);
  const imageFiles = files.filter((file) => file.type.startsWith("image/"));

  if (imageFiles.length === 0) {
    ElMessage.warning("请拖入图片文件");
    return;
  }

  // 处理每个图片文件
  let addedCount = 0;
  for (const file of imageFiles) {
    try {
      await addImageAsGame(file);
      addedCount++;
    } catch (error) {
      console.error("处理图片失败:", error);
      ElMessage.error(`处理图片 ${file.name} 失败`);
    }
  }

  if (addedCount > 0) {
    ElMessage.success(`成功添加 ${addedCount} 个图片`);
  }
};

// 将图片文件添加为游戏
const addImageAsGame = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        // 生成唯一ID（使用时间戳和随机数）
        const uniqueId = `local_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        // 从文件名提取游戏名（去除扩展名）
        const fileName = file.name.replace(/\.[^/.]+$/, "");

        // 创建游戏对象
        const newGame = {
          id: uniqueId,
          name: "", // 名称为空，用户可以后续通过右键编辑
          nameOrigin: fileName, // 原始文件名存储在这里
          image: e.target.result, // base64 图片数据
          type: "custom", // 标记为自定义图片
          date: new Date().toISOString().split("T")[0],
          score: null,
        };

        gameLibrary.value.push(newGame);
        resolve(newGame);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("读取图片失败"));
    };

    reader.readAsDataURL(file);
  });
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
  min-height: calc(100vh);
  height: 100vh;
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
  position: relative;
  transition: all 0.3s ease;
}

.game-list.drag-over {
  background: rgba(64, 158, 255, 0.05);
  border: 2px dashed #409eff;
  border-radius: 8px;
}

.drag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  pointer-events: none;
}

.drag-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #409eff;
}

.drag-hint p {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.game-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding-right: 8px;
  padding-bottom: 20px;
}

.footer-info {
  padding: 0px 0 20px;
  text-align: center;
  border-top: 1px solid #e4e7ed;
  margin-top: auto;
}

.info-line {
  margin: 2px 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.info-line a {
  color: #409eff;
  text-decoration: none;
  transition: color 0.3s;
}

.info-line a:hover {
  color: #66b1ff;
  text-decoration: underline;
}

.info-line span {
  color: #909399;
}
</style>
