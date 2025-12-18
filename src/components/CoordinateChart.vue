<template>
  <div class="coordinate-chart-wrapper">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button @click="openSettings" :icon="Setting">
          图表设置
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="exportImage" :icon="Download">
          导出图片
        </el-button>
      </div>
    </div>

    <div 
      class="coordinate-chart" 
      ref="chartContainer"
      :style="{ transform: `scale(${scale})`, transformOrigin: 'center center' }"
    >
      <!-- 图表标题（顶部） -->
      <div 
        v-if="chartTitle.text && chartTitle.positionY === 'top'" 
        class="chart-title"
        :style="{
          fontSize: chartTitle.fontSize + 'px',
          textAlign: chartTitle.positionX,
          color: chartTitle.color
        }"
      >
        {{ chartTitle.text }}
      </div>

      <!-- 坐标系 SVG -->
      <svg class="coordinate-svg" :width="width" :height="height">
        <!-- 背景网格 -->
        <defs>
          <pattern
            id="grid"
            :width="gridSize"
            :height="gridSize"
            patternUnits="userSpaceOnUse"
          >
            <path
              :d="`M ${gridSize} 0 L 0 0 0 ${gridSize}`"
              fill="none"
              stroke="#e4e7ed"
              stroke-width="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        <!-- 坐标轴 -->
        <line
          :x1="centerX"
          y1="0"
          :x2="centerX"
          :y2="height"
          stroke="#909399"
          stroke-width="2"
        />
        <line
          x1="0"
          :y1="centerY"
          :x2="width"
          :y2="centerY"
          stroke="#909399"
          stroke-width="2"
        />

         <!-- 象限标签 -->
         <text :x="centerX + 20" y="30" class="axis-label" fill="#67C23A">
           {{ axisLabels.vertical.positive }}
         </text>
         <text
           :x="centerX + 20"
           :y="height - 20"
           class="axis-label"
           fill="#F56C6C"
         >
           {{ axisLabels.vertical.negative }}
         </text>
         <text x="20" :y="centerY - 10" class="axis-label" fill="#F56C6C">
           {{ axisLabels.horizontal.negative }}
         </text>
         <text
           :x="width - 80"
           :y="centerY - 10"
           class="axis-label"
           fill="#67C23A"
         >
           {{ axisLabels.horizontal.positive }}
         </text>

        <!-- 坐标轴箭头 -->
        <polygon
          :points="`${centerX},5 ${centerX - 5},15 ${centerX + 5},15`"
          fill="#909399"
        />
        <polygon
          :points="`${width - 5},${centerY} ${width - 15},${centerY - 5} ${
            width - 15
          },${centerY + 5}`"
          fill="#909399"
        />
      </svg>

      <!-- 游戏元素层 -->
      <div
        class="game-items-layer"
        @drop="handleDrop"
        @dragover.prevent
        @dragenter.prevent
      >
        <div
          v-for="game in games"
          :key="game.id"
          class="game-item"
          :class="{ 'is-dragging': draggingGameId === game.id }"
          :style="getGameStyle(game)"
          @mousedown="startDrag($event, game)"
          @contextmenu.prevent="showContextMenu($event, game)"
        >
          <el-image :src="game.image" fit="cover" class="game-image">
            <template #error>
              <div class="image-error">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>

          <!-- 调整大小控制点 -->
          <div
            class="resize-handle"
            @mousedown.stop="startResize($event, game)"
          >
            <el-icon><FullScreen /></el-icon>
          </div>

          <!-- 游戏名称提示 -->

          <div class="game-name-badge">{{ game.name }}</div>
        </div>
      </div>

       <!-- 右键菜单 -->
       <teleport to="body">
         <div
           v-if="contextMenu.visible"
           class="context-menu"
           :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
           @click="hideContextMenu"
         >
           <div class="menu-item" @click="bringToFront">
             <el-icon><Top /></el-icon>
             <span>置顶</span>
           </div>
           <div class="menu-item" @click="resetSize">
             <el-icon><RefreshLeft /></el-icon>
             <span>重置大小</span>
           </div>
           <el-divider style="margin: 4px 0" />
           <div class="menu-item danger" @click="removeGame">
             <el-icon><Delete /></el-icon>
             <span>移除</span>
           </div>
         </div>
       </teleport>
       
       <!-- 缩放控制 -->
       <div class="zoom-controls">
         <div class="control-group">
           <span class="control-label">整体缩放</span>
           <el-button-group>
             <el-button :icon="ZoomOut" @click="zoomOut" :disabled="scale <= 0.5">
              -
             </el-button>
             <el-button @click="resetZoom">
               {{ Math.round(scale * 100) }}%
             </el-button>
             <el-button :icon="ZoomIn" @click="zoomIn" :disabled="scale >= 2">
              +
             </el-button>
           </el-button-group>
         </div>
         
         <el-divider direction="vertical" style="height: 32px; margin: 0 8px" />
         
         <div class="control-group">
           <span class="control-label">图标大小</span>
           <el-button-group>
             <el-button 
               :icon="ZoomOut" 
               @click="shrinkAllGames" 
               :disabled="!canShrinkAll"
               size="small"
             >
              缩小
             </el-button>
             <el-button size="small" @click="resetAllGamesSize">
               {{ defaultGameSize }}px
             </el-button>
             <el-button 
               :icon="ZoomIn" 
               @click="enlargeAllGames" 
               :disabled="!canEnlargeAll"
               size="small"
             >
              放大
             </el-button>
           </el-button-group>
         </div>
       </div>

      <!-- 图表标题（底部） -->
      <div 
        v-if="chartTitle.text && chartTitle.positionY === 'bottom'" 
        class="chart-title chart-title-bottom"
        :style="{
          fontSize: chartTitle.fontSize + 'px',
          textAlign: chartTitle.positionX,
          color: chartTitle.color
        }"
      >
        {{ chartTitle.text }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import {
  Picture,
  FullScreen,
  Delete,
  RefreshLeft,
  Download,
  ZoomIn,
  ZoomOut,
  Top,
  Setting,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import html2canvas from "html2canvas";

const props = defineProps({
  games: {
    type: Array,
    default: () => [],
  },
  axisLabels: {
    type: Object,
    required: true
  },
  chartTitle: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(["update-game", "remove-game", "bring-to-front", "open-settings"]);

// 容器引用
const chartContainer = ref(null);
// 固定为1080P基础的绘图区域大小 - 调整为适合1080p屏幕左侧显示
const width = ref(900);
const height = ref(800);
const gridSize = 20;

// 缩放比例
const scale = ref(1);

// 默认游戏大小（用于新添加的游戏）
const defaultGameSize = ref(60);

// 检查是否可以继续放大/缩小
// 只有当所有图标都已经是最大值/最小值时才禁用按钮
const canEnlargeAll = computed(() => {
  if (props.games.length === 0) return false;
  // 只要有任何一个图标小于200px，就可以继续放大
  return props.games.some(g => (g.size || defaultGameSize.value) < 200);
});

const canShrinkAll = computed(() => {
  if (props.games.length === 0) return false;
  // 只要有任何一个图标大于40px，就可以继续缩小
  return props.games.some(g => (g.size || defaultGameSize.value) > 40);
});

// 中心点
const centerX = computed(() => width.value / 2);
const centerY = computed(() => height.value / 2);

// 拖拽状态
const draggingGameId = ref(null);
const dragStartPos = ref({ x: 0, y: 0 });
const gameStartPos = ref({ x: 0, y: 0 });

// 缩放状态
const resizingGameId = ref(null);
const resizeStartSize = ref(0);
const resizeStartPos = ref({ x: 0, y: 0 });

// 右键菜单
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  gameId: null,
});

// 导出图片功能
const exportImage = async () => {
  if (!chartContainer.value) return;

  try {
    ElMessage.info("正在生成图片...");

    // 隐藏不需要导出的元素（缩放控制、调整大小手柄、游戏名称徽章）
    const zoomControls = chartContainer.value.querySelector('.zoom-controls');
    const resizeHandles = chartContainer.value.querySelectorAll('.resize-handle');
    const gameNameBadges = chartContainer.value.querySelectorAll('.game-name-badge');
    
    if (zoomControls) zoomControls.style.display = 'none';
    resizeHandles.forEach(handle => handle.style.display = 'none');
    gameNameBadges.forEach(badge => badge.style.display = 'none');

    const canvas = await html2canvas(chartContainer.value, {
      backgroundColor: "#fafafa",
      scale: 2, // 提高清晰度
      useCORS: true,
      allowTaint: true,
    });

    // 恢复隐藏的元素
    if (zoomControls) zoomControls.style.display = '';
    resizeHandles.forEach(handle => handle.style.display = '');
    gameNameBadges.forEach(badge => badge.style.display = '');

    // 转换为图片并下载
    const link = document.createElement("a");
    const fileName = props.chartTitle.text || '游戏排名图';
    link.download = `${fileName}_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    ElMessage.success("图片导出成功！");
  } catch (error) {
    console.error("导出失败:", error);
    ElMessage.error("图片导出失败，请重试");
    
    // 发生错误时也要恢复隐藏的元素
    const zoomControls = chartContainer.value?.querySelector('.zoom-controls');
    const resizeHandles = chartContainer.value?.querySelectorAll('.resize-handle');
    const gameNameBadges = chartContainer.value?.querySelectorAll('.game-name-badge');
    
    if (zoomControls) zoomControls.style.display = '';
    if (resizeHandles) resizeHandles.forEach(handle => handle.style.display = '');
    if (gameNameBadges) gameNameBadges.forEach(badge => badge.style.display = '');
  }
};

// 获取游戏样式
const getGameStyle = (game) => {
  const size = game.size || defaultGameSize.value;
  const x = centerX.value + game.x - size / 2;
  const y = centerY.value - game.y - size / 2;

  return {
    left: `${x}px`,
    top: `${y}px`,
    width: `${size}px`,
    height: `${size}px`,
  };
};

// 开始拖拽游戏
const startDrag = (event, game) => {
  if (event.button !== 0) return; // 只响应左键

  draggingGameId.value = game.id;
  dragStartPos.value = { x: event.clientX, y: event.clientY };
  gameStartPos.value = { x: game.x, y: game.y };

  document.addEventListener("mousemove", onDragMove);
  document.addEventListener("mouseup", onDragEnd);

  event.preventDefault();
};

// 拖拽移动
const onDragMove = (event) => {
  if (!draggingGameId.value) return;

  const dx = event.clientX - dragStartPos.value.x;
  const dy = event.clientY - dragStartPos.value.y;

  const game = props.games.find((g) => g.id === draggingGameId.value);
  if (game) {
    emit("update-game", {
      ...game,
      x: gameStartPos.value.x + dx,
      y: gameStartPos.value.y - dy, // Y轴反向
    });
  }
};

// 拖拽结束
const onDragEnd = () => {
  draggingGameId.value = null;
  document.removeEventListener("mousemove", onDragMove);
  document.removeEventListener("mouseup", onDragEnd);
};

// 开始调整大小
const startResize = (event, game) => {
  resizingGameId.value = game.id;
  resizeStartSize.value = game.size || defaultGameSize.value;
  resizeStartPos.value = { x: event.clientX, y: event.clientY };

  document.addEventListener("mousemove", onResizeMove);
  document.addEventListener("mouseup", onResizeEnd);

  event.preventDefault();
  event.stopPropagation();
};

// 调整大小移动
const onResizeMove = (event) => {
  if (!resizingGameId.value) return;

  const dx = event.clientX - resizeStartPos.value.x;
  const dy = event.clientY - resizeStartPos.value.y;
  const delta = Math.max(dx, dy);

  const newSize = Math.max(40, Math.min(200, resizeStartSize.value + delta));

  const game = props.games.find((g) => g.id === resizingGameId.value);
  if (game) {
    emit("update-game", {
      ...game,
      size: newSize,
    });
  }
};

// 调整大小结束
const onResizeEnd = () => {
  resizingGameId.value = null;
  document.removeEventListener("mousemove", onResizeMove);
  document.removeEventListener("mouseup", onResizeEnd);
};

// 处理拖放（从游戏列表拖入）
const handleDrop = (event) => {
  event.preventDefault();
  // 此功能已在 GameCard 中通过点击实现
};

// 显示右键菜单
const showContextMenu = (event, game) => {
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    gameId: game.id,
  };

  document.addEventListener("click", hideContextMenu);
};

// 隐藏右键菜单
const hideContextMenu = () => {
  contextMenu.value.visible = false;
  document.removeEventListener("click", hideContextMenu);
};

// 置顶游戏
const bringToFront = () => {
  if (contextMenu.value.gameId) {
    emit("bring-to-front", contextMenu.value.gameId);
    ElMessage.success("已置顶");
  }
};

// 移除游戏
const removeGame = () => {
  if (contextMenu.value.gameId) {
    emit("remove-game", contextMenu.value.gameId);
  }
};

// 重置大小
const resetSize = () => {
  const game = props.games.find((g) => g.id === contextMenu.value.gameId);
  if (game) {
    emit("update-game", {
      ...game,
      size: defaultGameSize.value,
    });
  }
};

// 缩放控制
const zoomIn = () => {
  if (scale.value < 2) {
    scale.value = Math.min(2, scale.value + 0.1);
  }
};

const zoomOut = () => {
  if (scale.value > 0.5) {
    scale.value = Math.max(0.5, scale.value - 0.1);
  }
};

const resetZoom = () => {
  scale.value = 1;
};

// 放大所有游戏图标
const enlargeAllGames = () => {
  props.games.forEach(game => {
    const currentSize = game.size || defaultGameSize.value;
    const newSize = Math.min(200, currentSize + 10);
    emit("update-game", {
      ...game,
      size: newSize,
    });
  });
  // 更新默认大小
  defaultGameSize.value = Math.min(200, defaultGameSize.value + 10);
  ElMessage.success(`已放大所有图标，当前默认大小：${defaultGameSize.value}px`);
};

// 缩小所有游戏图标
const shrinkAllGames = () => {
  props.games.forEach(game => {
    const currentSize = game.size || defaultGameSize.value;
    const newSize = Math.max(40, currentSize - 10);
    emit("update-game", {
      ...game,
      size: newSize,
    });
  });
  // 更新默认大小
  defaultGameSize.value = Math.max(40, defaultGameSize.value - 10);
  ElMessage.success(`已缩小所有图标，当前默认大小：${defaultGameSize.value}px`);
};

// 重置所有游戏图标大小
const resetAllGamesSize = () => {
  props.games.forEach(game => {
    emit("update-game", {
      ...game,
      size: defaultGameSize.value,
    });
  });
  ElMessage.info(`已重置所有图标为 ${defaultGameSize.value}px`);
};

// 打开设置对话框
const openSettings = () => {
  emit('open-settings');
};

// 从本地存储加载默认游戏大小
const loadDefaultGameSize = () => {
  try {
    const saved = localStorage.getItem('bangumi_default_game_size');
    if (saved) {
      const size = parseInt(saved, 10);
      if (size >= 40 && size <= 200) {
        defaultGameSize.value = size;
      }
    }
  } catch (error) {
    console.error('加载默认游戏大小失败:', error);
  }
};

// 保存默认游戏大小到本地存储
const saveDefaultGameSize = () => {
  try {
    localStorage.setItem('bangumi_default_game_size', defaultGameSize.value.toString());
  } catch (error) {
    console.error('保存默认游戏大小失败:', error);
  }
};

// 监听默认游戏大小变化并保存
watch(defaultGameSize, () => {
  saveDefaultGameSize();
});

// 生命周期
onMounted(() => {
  // 固定尺寸，无需监听resize
  loadDefaultGameSize();
});

onUnmounted(() => {
  document.removeEventListener("mousemove", onDragMove);
  document.removeEventListener("mouseup", onDragEnd);
  document.removeEventListener("mousemove", onResizeMove);
  document.removeEventListener("mouseup", onResizeEnd);
  document.removeEventListener("click", hideContextMenu);
});
</script>

<style scoped>
.coordinate-chart-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: auto;
  background: #f5f7fa;
}

.toolbar {
  padding: 16px 20px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.toolbar-left {
  display: flex;
  gap: 10px;
}

.toolbar-right {
  display: flex;
  gap: 10px;
}

.coordinate-chart {
  position: relative;
  width: 900px;
  height: 800px;
  margin: 20px auto;
  background: #fafafa;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.chart-title {
  position: absolute;
  width: 100%;
  padding: 15px 20px;
  font-weight: bold;
  z-index: 10;
  pointer-events: none;
  user-select: none;
}

.chart-title:not(.chart-title-bottom) {
  top: 0;
}

.chart-title-bottom {
  bottom: 0;
}

.coordinate-svg {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.axis-label {
  font-size: 14px;
  font-weight: 600;
  user-select: none;
}

.game-items-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.game-item {
  position: absolute;
  cursor: move;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  transition: box-shadow 0.3s;
  background: #fff;
}

.game-item:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  z-index: 10;
}

.game-item.is-dragging {
  opacity: 0.8;
  z-index: 100;
}

.game-image {
  width: 100%;
  height: 100%;
}

.game-image :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #909399;
  font-size: 24px;
}

.resize-handle {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 28px;
  height: 28px;
  background: rgba(64, 158, 255, 0.9);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: nwse-resize;
  opacity: 0;
  transition: all 0.3s;
  color: #fff;
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.game-item:hover .resize-handle {
  opacity: 1;
  transform: scale(1.1);
}

.game-name-badge {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 12px;
  padding: 4px 6px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0;
  transition: opacity 0.3s;
}

.game-item:hover .game-name-badge {
  opacity: 1;
}

.context-menu {
  position: fixed;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 4px 0;
  z-index: 3000;
  min-width: 120px;
}

.menu-item {
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
  transition: all 0.3s;
}

.menu-item:hover {
  background: #f5f7fa;
  color: #409eff;
}

.menu-item.danger {
  color: #f56c6c;
}

.menu-item.danger:hover {
  background: #fef0f0;
  color: #f56c6c;
}

.menu-item .el-icon {
  font-size: 16px;
}

.zoom-controls {
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 10;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.control-label {
  font-size: 12px;
  color: #606266;
  font-weight: 500;
}

.zoom-controls :deep(.el-button-group) {
  display: flex;
}

.zoom-controls :deep(.el-button) {
  font-weight: 600;
}
</style>
