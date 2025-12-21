<template>
  <div class="coordinate-chart-wrapper">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button @click="openSettings" :icon="Setting"> 图表设置 </el-button>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="exportImage" :icon="Download">
          生成{{ chartTitle.text ? chartTitle.text : "你的图表" }}
        </el-button>
      </div>
    </div>

    <!-- 图表滚动容器 -->
    <div 
      class="chart-scroll-container" 
      :class="{ 'is-dragging-scroll': isDraggingScroll }"
      ref="scrollContainer"
      @mousedown="startScrollDrag"
    >
      <div
        class="coordinate-chart"
        ref="chartContainer"
        :style="{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }"
      >
        <!-- 图表标题（顶部） -->
        <div
          v-if="chartTitle.text && chartTitle.positionY === 'top'"
          class="chart-title"
          :style="{
            fontSize: chartTitle.fontSize + 'px',
            textAlign: chartTitle.positionX,
            color: chartTitle.color,
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
          <text :x="centerX + 20" :y="30" class="axis-label" fill="#67C23A">
            {{ axisLabels.vertical.positive }}
          </text>
          <text
            :x="centerX + 20"
            :y="height - 30"
            class="axis-label"
            fill="#F56C6C"
          >
            {{ axisLabels.vertical.negative }}
          </text>
          <text :x="20" :y="centerY - 10" class="axis-label" fill="#F56C6C">
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
          :class="{ 'is-drag-over': isDragOver }"
          @drop="handleDrop"
          @dragover.prevent="handleDragOver"
          @dragenter.prevent="handleDragEnter"
          @dragleave="handleDragLeave"
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
            <el-image 
            :src="game.image" 
            fit="cover" 
            :class="['game-image', { 'character-image': game.type === 'character' }]"
          >
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
            <div 
              class="game-name-badge" 
              :class="{ 'always-visible': showNamesAlways }"
            >
              {{ game.name }}
            </div>
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
        <div
          class="zoom-controls"
          :class="{ 'is-collapsed': isControlsCollapsed }"
          ref="zoomControls"
          :style="{
            transform: `translate(${controlsPosition.x}px, ${controlsPosition.y}px)`,
          }"
        >
          <!-- 拖动手柄 -->
          <div
            class="drag-handle"
            @mousedown="startDragControls"
            :title="isControlsCollapsed ? '拖动工具栏' : '拖动此工具栏'"
          >
            <span>⋮⋮</span>
          </div>

          <!-- 展开/收起按钮 -->
          <div class="toggle-button" @click="toggleControls" title="展开/收起">
            <el-icon v-if="isControlsCollapsed"><DArrowRight /></el-icon>
            <el-icon v-else><DArrowLeft /></el-icon>
          </div>

          <!-- 控制面板内容（可折叠） -->
          <template v-if="!isControlsCollapsed">
            <el-divider
              direction="vertical"
              style="height: 32px; margin: 0 8px"
            />

            <div class="control-group">
              <span class="control-label">整体缩放</span>
              <el-button-group>
                <el-button
                  :icon="ZoomOut"
                  @click="zoomOut"
                  :disabled="scale <= 0.5"
                  size="small"
                >
                  -
                </el-button>
                <el-button @click="resetZoom" size="small">
                  {{ Math.round(scale * 100) }}%
                </el-button>
                <el-button
                  :icon="ZoomIn"
                  @click="zoomIn"
                  :disabled="scale >= 2"
                  size="small"
                >
                  +
                </el-button>
              </el-button-group>
            </div>

            <el-divider
              direction="vertical"
              style="height: 32px; margin: 0 8px"
            />

            <div class="control-group">
              <span class="control-label">图标大小</span>
              <el-button-group>
                <el-button
                  :icon="ZoomOut"
                  @click="shrinkAllGames"
                  :disabled="!canShrinkAll"
                  size="small"
                >
                  -
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
                  +
                </el-button>
              </el-button-group>
            </div>

            <el-divider
              direction="vertical"
              style="height: 32px; margin: 0 8px"
            />

            <div class="control-group">
              <span class="control-label">显示名称</span>
              <el-switch
                v-model="showNamesAlways"
                @change="saveShowNamesSetting"
                size="small"
              />
            </div>
          </template>
        </div>

        <!-- 图表标题（底部） -->
        <div
          v-if="chartTitle.text && chartTitle.positionY === 'bottom'"
          class="chart-title chart-title-bottom"
          :style="{
            fontSize: chartTitle.fontSize + 'px',
            textAlign: chartTitle.positionX,
            color: chartTitle.color,
          }"
        >
          {{ chartTitle.text }}
        </div>

        <!-- 水印 - 右下角 -->
        <div class="watermark">games.marblephantasm.org</div>
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
  DArrowLeft,
  DArrowRight,
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
    required: true,
  },
  chartTitle: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits([
  "update-game",
  "remove-game",
  "bring-to-front",
  "open-settings",
  "add-game-to-chart",
]);

// 容器引用
const chartContainer = ref(null);
const scrollContainer = ref(null);
const zoomControls = ref(null);
// 固定为1080P基础的绘图区域大小 - 调整为适合1080p屏幕左侧显示
const width = ref(900);
const height = ref(800);
const gridSize = 20;

// 控制面板位置（可拖动）
const controlsPosition = ref({ x: 20, y: 720 }); // 默认左下角
const isDraggingControls = ref(false);
const controlsDragStart = ref({ x: 0, y: 0 });
const controlsDragBounds = ref({ maxX: 500, maxY: 700 }); // 缓存边界值，避免频繁访问 DOM
const isControlsCollapsed = ref(false); // 控制面板展开/收起状态
let rafId = null; // requestAnimationFrame ID，用于节流

// 图表滚动拖拽
const isDraggingScroll = ref(false);
const scrollDragStart = ref({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

// 缩放比例
const scale = ref(1);

// 默认游戏大小（用于新添加的游戏）
const defaultGameSize = ref(60);

// 是否常态显示名称
const showNamesAlways = ref(false);

// 检查是否可以继续放大/缩小
// 只有当所有图标都已经是最大值/最小值时才禁用按钮
const canEnlargeAll = computed(() => {
  if (props.games.length === 0) return false;
  // 只要有任何一个图标小于200px，就可以继续放大
  return props.games.some((g) => (g.size || defaultGameSize.value) < 200);
});

const canShrinkAll = computed(() => {
  if (props.games.length === 0) return false;
  // 只要有任何一个图标大于40px，就可以继续缩小
  return props.games.some((g) => (g.size || defaultGameSize.value) > 40);
});

// 中心点
const centerX = computed(() => width.value / 2);
const centerY = computed(() => height.value / 2);

// 拖拽状态
const draggingGameId = ref(null);
const dragStartPos = ref({ x: 0, y: 0 });
const gameStartPos = ref({ x: 0, y: 0 });
const isDragOver = ref(false);

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

  // 🔥 保存原始缩放比例
  const originalScale = scale.value;

  try {
    ElMessage.info("正在生成图片...");

    // 🔥 临时重置缩放比例为 1，避免 html2canvas 处理 transform 时出现问题
    scale.value = 1;

    // 等待 DOM 更新完成
    await new Promise(resolve => setTimeout(resolve, 100));

    // 隐藏不需要导出的元素（缩放控制、调整大小手柄、游戏名称徽章）
    const zoomControls = chartContainer.value.querySelector(".zoom-controls");
    const resizeHandles =
      chartContainer.value.querySelectorAll(".resize-handle");
    const gameNameBadges =
      chartContainer.value.querySelectorAll(".game-name-badge");

    if (zoomControls) zoomControls.style.display = "none";
    resizeHandles.forEach((handle) => (handle.style.display = "none"));
    gameNameBadges.forEach((badge) => (badge.style.display = "none"));

    // 处理图片的 object-fit，因为 html2canvas 不支持 object-fit
    const gameImages = chartContainer.value.querySelectorAll(".game-image img");
    const imageBackups = [];

    gameImages.forEach((img) => {
      // 保存原始样式
      const backup = {
        element: img,
        originalWidth: img.style.width,
        originalHeight: img.style.height,
        originalObjectFit: img.style.objectFit,
      };
      imageBackups.push(backup);

      // 获取容器尺寸
      const container = img.closest(".game-item");
      if (container) {
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;

        // 计算缩放比例（模拟 object-fit: cover）
        const containerRatio = containerWidth / containerHeight;
        const imageRatio = naturalWidth / naturalHeight;

        let renderWidth, renderHeight;
        if (imageRatio > containerRatio) {
          // 图片更宽，以高度为准
          renderHeight = containerHeight;
          renderWidth = (naturalWidth / naturalHeight) * containerHeight;
        } else {
          // 图片更高，以宽度为准
          renderWidth = containerWidth;
          renderHeight = (naturalHeight / naturalWidth) * containerWidth;
        }

        // 设置图片样式以模拟 cover 效果
        img.style.width = `${renderWidth}px`;
        img.style.height = `${renderHeight}px`;
        img.style.objectFit = "none";
        img.style.objectPosition = "center";
        img.style.position = "relative";
        img.style.left = `${(containerWidth - renderWidth) / 2}px`;
        img.style.top = `${(containerHeight - renderHeight) / 2}px`;
      }
    });

    const canvas = await html2canvas(chartContainer.value, {
      backgroundColor: "#fafafa",
      scale: 2, // 提高清晰度
      useCORS: true,
      allowTaint: true,
    });

    // 恢复隐藏的元素
    if (zoomControls) zoomControls.style.display = "";
    resizeHandles.forEach((handle) => (handle.style.display = ""));
    gameNameBadges.forEach((badge) => (badge.style.display = ""));

    // 恢复图片样式
    imageBackups.forEach((backup) => {
      backup.element.style.width = backup.originalWidth;
      backup.element.style.height = backup.originalHeight;
      backup.element.style.objectFit = backup.originalObjectFit;
      backup.element.style.objectPosition = "";
      backup.element.style.position = "";
      backup.element.style.left = "";
      backup.element.style.top = "";
    });

    // 🔥 恢复原始缩放比例
    scale.value = originalScale;

    // 转换为图片并下载
    const link = document.createElement("a");
    const fileName = props.chartTitle.text || "游戏排名图";
    link.download = `${fileName}_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    ElMessage.success("图片导出成功！");
  } catch (error) {
    console.error("导出失败:", error);
    ElMessage.error("图片导出失败，请重试");

    // 发生错误时也要恢复隐藏的元素
    const zoomControls = chartContainer.value?.querySelector(".zoom-controls");
    const resizeHandles =
      chartContainer.value?.querySelectorAll(".resize-handle");
    const gameNameBadges =
      chartContainer.value?.querySelectorAll(".game-name-badge");

    if (zoomControls) zoomControls.style.display = "";
    if (resizeHandles)
      resizeHandles.forEach((handle) => (handle.style.display = ""));
    if (gameNameBadges)
      gameNameBadges.forEach((badge) => (badge.style.display = ""));

    // 🔥 恢复原始缩放比例
    scale.value = originalScale;
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

  // 考虑图表缩放比例：鼠标移动距离需要除以 scale
  const dx = (event.clientX - dragStartPos.value.x) / scale.value;
  const dy = (event.clientY - dragStartPos.value.y) / scale.value;

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

  // 考虑图表缩放比例：鼠标移动距离需要除以 scale
  const dx = (event.clientX - resizeStartPos.value.x) / scale.value;
  const dy = (event.clientY - resizeStartPos.value.y) / scale.value;
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
const handleDragEnter = (event) => {
  event.preventDefault();
  isDragOver.value = true;
};

const handleDragOver = (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
};

const handleDragLeave = (event) => {
  // 只有当离开整个game-items-layer时才重置
  if (event.target.classList.contains("game-items-layer")) {
    isDragOver.value = false;
  }
};

const handleDrop = (event) => {
  event.preventDefault();
  isDragOver.value = false;

  try {
    // 尝试获取拖拽的游戏数据
    const gameData = event.dataTransfer.getData("application/json");
    if (!gameData) return;

    const game = JSON.parse(gameData);

    // 获取drop位置相对于坐标系容器的坐标
    const rect = chartContainer.value.getBoundingClientRect();
    // 考虑图表缩放比例：屏幕坐标需要除以 scale
    const dropX = (event.clientX - rect.left) / scale.value;
    const dropY = (event.clientY - rect.top) / scale.value;

    // 转换为坐标系坐标（相对于中心点）
    // 坐标系：中心为(0,0)，右为正X，上为正Y
    const gameX = dropX - centerX.value;
    const gameY = -(dropY - centerY.value); // Y轴反转

    console.log("拖放位置:", { dropX, dropY, gameX, gameY });

    // 检查游戏是否已存在于坐标系中
    const existingGame = props.games.find((g) => g.id === game.id);
    if (existingGame) {
      // 如果已存在，更新位置
      emit("update-game", {
        ...existingGame,
        x: gameX,
        y: gameY,
      });
    } else {
      // 如果不存在，添加新游戏（通过父组件）
      emit("add-game-to-chart", {
        ...game,
        x: gameX,
        y: gameY,
        size: defaultGameSize.value,
      });
    }
  } catch (error) {
    console.error("处理拖放失败:", error);
  }
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
  props.games.forEach((game) => {
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
  props.games.forEach((game) => {
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
  props.games.forEach((game) => {
    emit("update-game", {
      ...game,
      size: defaultGameSize.value,
    });
  });
  ElMessage.info(`已重置所有图标为 ${defaultGameSize.value}px`);
};

// 打开设置对话框
const openSettings = () => {
  emit("open-settings");
};

// 拖动控制面板
const startDragControls = (event) => {
  if (event.button !== 0) return; // 只响应左键

  isDraggingControls.value = true;
  // 考虑图表缩放比例：将屏幕坐标转换为图表坐标系
  controlsDragStart.value = {
    x: event.clientX / scale.value - controlsPosition.value.x,
    y: event.clientY / scale.value - controlsPosition.value.y,
  };

  // 🔥 关键优化：在拖动开始时就计算好边界值，避免在拖动过程中频繁访问 DOM
  if (zoomControls.value) {
    const controlsWidth = zoomControls.value.offsetWidth;
    const controlsHeight = zoomControls.value.offsetHeight;
    controlsDragBounds.value = {
      maxX: 900 - controlsWidth,
      maxY: 800 - controlsHeight,
    };
  }

  document.addEventListener("mousemove", onDragControlsMove);
  document.addEventListener("mouseup", onDragControlsEnd);

  event.preventDefault();
  event.stopPropagation();
};

const onDragControlsMove = (event) => {
  if (!isDraggingControls.value) return;

  // 考虑图表缩放比例：将屏幕坐标转换为图表坐标系
  const newX = event.clientX / scale.value - controlsDragStart.value.x;
  const newY = event.clientY / scale.value - controlsDragStart.value.y;

  // 🔥 关键优化：使用 requestAnimationFrame 节流更新
  // 取消之前的帧请求
  if (rafId) {
    cancelAnimationFrame(rafId);
  }

  rafId = requestAnimationFrame(() => {
    // 限制边界
    const boundedX = Math.max(0, Math.min(controlsDragBounds.value.maxX, newX));
    const boundedY = Math.max(0, Math.min(controlsDragBounds.value.maxY, newY));

    // 更新位置
    controlsPosition.value = { x: boundedX, y: boundedY };
  });
};

const onDragControlsEnd = () => {
  isDraggingControls.value = false;

  // 清理 requestAnimationFrame
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  document.removeEventListener("mousemove", onDragControlsMove);
  document.removeEventListener("mouseup", onDragControlsEnd);

  // 保存位置到本地存储
  saveControlsPosition();
};

// 切换控制面板展开/收起
const toggleControls = () => {
  isControlsCollapsed.value = !isControlsCollapsed.value;
  saveControlsState();

  // 切换后更新边界值（因为工具栏尺寸改变了）
  setTimeout(() => {
    if (zoomControls.value) {
      const controlsWidth = zoomControls.value.offsetWidth;
      const controlsHeight = zoomControls.value.offsetHeight;
      controlsDragBounds.value = {
        maxX: 900 - controlsWidth,
        maxY: 800 - controlsHeight,
      };

      // 确保当前位置在新的边界内
      controlsPosition.value = {
        x: Math.max(
          0,
          Math.min(controlsDragBounds.value.maxX, controlsPosition.value.x)
        ),
        y: Math.max(
          0,
          Math.min(controlsDragBounds.value.maxY, controlsPosition.value.y)
        ),
      };
    }
  }, 350); // 等待动画完成后再计算尺寸
};

// 保存和加载控制面板位置
const saveControlsPosition = () => {
  try {
    localStorage.setItem(
      "bangumi_controls_position",
      JSON.stringify(controlsPosition.value)
    );
  } catch (error) {
    console.error("保存控制面板位置失败:", error);
  }
};

const loadControlsPosition = () => {
  try {
    const saved = localStorage.getItem("bangumi_controls_position");
    if (saved) {
      controlsPosition.value = JSON.parse(saved);
    }
  } catch (error) {
    console.error("加载控制面板位置失败:", error);
  }
};

// 保存和加载控制面板状态（展开/收起）
const saveControlsState = () => {
  try {
    localStorage.setItem(
      "bangumi_controls_collapsed",
      JSON.stringify(isControlsCollapsed.value)
    );
  } catch (error) {
    console.error("保存控制面板状态失败:", error);
  }
};

const loadControlsState = () => {
  try {
    const saved = localStorage.getItem("bangumi_controls_collapsed");
    if (saved) {
      isControlsCollapsed.value = JSON.parse(saved);
    }
  } catch (error) {
    console.error("加载控制面板状态失败:", error);
  }
};

// 从本地存储加载默认游戏大小
const loadDefaultGameSize = () => {
  try {
    const saved = localStorage.getItem("bangumi_default_game_size");
    if (saved) {
      const size = parseInt(saved, 10);
      if (size >= 40 && size <= 200) {
        defaultGameSize.value = size;
      }
    }
  } catch (error) {
    console.error("加载默认游戏大小失败:", error);
  }
};

// 保存默认游戏大小到本地存储
const saveDefaultGameSize = () => {
  try {
    localStorage.setItem(
      "bangumi_default_game_size",
      defaultGameSize.value.toString()
    );
  } catch (error) {
    console.error("保存默认游戏大小失败:", error);
  }
};

// 加载名称显示设置
const loadShowNamesSetting = () => {
  try {
    const saved = localStorage.getItem("bangumi_show_names_always");
    if (saved !== null) {
      showNamesAlways.value = saved === "true";
    }
  } catch (error) {
    console.error("加载名称显示设置失败:", error);
  }
};

// 保存名称显示设置
const saveShowNamesSetting = () => {
  try {
    localStorage.setItem(
      "bangumi_show_names_always",
      showNamesAlways.value.toString()
    );
  } catch (error) {
    console.error("保存名称显示设置失败:", error);
  }
};

// 监听默认游戏大小变化并保存
watch(defaultGameSize, () => {
  saveDefaultGameSize();
});

// ==================== 图表滚动拖拽 ====================
// 开始拖拽滚动
const startScrollDrag = (event) => {
  // 只响应左键
  if (event.button !== 0) return;
  
  // 排除特定元素：游戏图标、工具栏、右键菜单等
  const target = event.target;
  const classList = target.classList;
  
  // 如果点击的是以下元素，不启动滚动拖拽
  if (
    // 游戏相关元素
    classList.contains('game-item') ||
    classList.contains('game-image') ||
    classList.contains('resize-handle') ||
    classList.contains('game-name-badge') ||
    target.closest('.game-item') ||
    
    // 工具栏相关元素
    classList.contains('zoom-controls') ||
    classList.contains('drag-handle') ||
    classList.contains('toggle-button') ||
    classList.contains('control-group') ||
    target.closest('.zoom-controls') ||
    
    // 右键菜单
    classList.contains('context-menu') ||
    target.closest('.context-menu') ||
    
    // 图表标题
    classList.contains('chart-title') ||
    
    // El-Image 组件内部元素
    target.closest('.el-image') ||
    
    // 按钮等交互元素
    target.tagName === 'BUTTON' ||
    target.closest('button')
  ) {
    return;
  }

  if (!scrollContainer.value) return;

  isDraggingScroll.value = true;
  scrollDragStart.value = {
    x: event.clientX,
    y: event.clientY,
    scrollLeft: scrollContainer.value.scrollLeft,
    scrollTop: scrollContainer.value.scrollTop,
  };

  document.addEventListener("mousemove", onScrollDragMove);
  document.addEventListener("mouseup", onScrollDragEnd);

  // 阻止默认行为，避免文本选择
  event.preventDefault();
};

// 拖拽滚动移动
const onScrollDragMove = (event) => {
  if (!isDraggingScroll.value || !scrollContainer.value) return;

  const deltaX = event.clientX - scrollDragStart.value.x;
  const deltaY = event.clientY - scrollDragStart.value.y;

  // 反向移动滚动条（拖拽方向与滚动方向相反，符合直觉）
  scrollContainer.value.scrollLeft = scrollDragStart.value.scrollLeft - deltaX;
  scrollContainer.value.scrollTop = scrollDragStart.value.scrollTop - deltaY;

  event.preventDefault();
};

// 结束拖拽滚动
const onScrollDragEnd = () => {
  isDraggingScroll.value = false;

  document.removeEventListener("mousemove", onScrollDragMove);
  document.removeEventListener("mouseup", onScrollDragEnd);
};

// 生命周期
onMounted(() => {
  // 固定尺寸，无需监听resize
  loadDefaultGameSize();
  loadControlsPosition();
  loadControlsState();
  loadShowNamesSetting();

  // 初始化边界值
  setTimeout(() => {
    if (zoomControls.value) {
      const controlsWidth = zoomControls.value.offsetWidth;
      const controlsHeight = zoomControls.value.offsetHeight;
      controlsDragBounds.value = {
        maxX: 900 - controlsWidth,
        maxY: 800 - controlsHeight,
      };
    }
  }, 100);
});

onUnmounted(() => {
  // 清理所有事件监听器
  document.removeEventListener("mousemove", onDragMove);
  document.removeEventListener("mouseup", onDragEnd);
  document.removeEventListener("mousemove", onResizeMove);
  document.removeEventListener("mouseup", onResizeEnd);
  document.removeEventListener("mousemove", onDragControlsMove);
  document.removeEventListener("mouseup", onDragControlsEnd);
  document.removeEventListener("mousemove", onScrollDragMove);
  document.removeEventListener("mouseup", onScrollDragEnd);
  document.removeEventListener("click", hideContextMenu);

  // 清理 requestAnimationFrame
  if (rafId) {
    cancelAnimationFrame(rafId);
  }
});
</script>

<style scoped>
.coordinate-chart-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  flex-shrink: 0; /* 工具栏不缩小 */
}

.toolbar-left {
  display: flex;
  gap: 10px;
}

.toolbar-right {
  display: flex;
  gap: 10px;
}

/* 图表滚动容器 - 确保内容不被裁剪 */
.chart-scroll-container {
  flex: 1;
  overflow: auto;
  min-height: 0; /* 修复 flex 子元素滚动问题 */
  padding: 40px; /* 为图表四周留出空间 */
  cursor: grab; /* 默认抓手光标 */
}

/* 拖拽滚动时的光标和样式 */
.chart-scroll-container.is-dragging-scroll {
  cursor: grabbing !important; /* 拖拽中的光标 */
  user-select: none; /* 防止拖拽时选中文本 */
}

/* 拖拽时禁用图表内所有元素的指针事件，提升性能 */
.chart-scroll-container.is-dragging-scroll * {
  pointer-events: none;
}

.coordinate-chart {
  position: relative;
  width: 900px;
  height: 800px;
  flex-shrink: 0; /* 防止图表被压缩 */
  background: #fafafa;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
  transition: transform 0.3s ease;
  margin: 0 auto; /* 水平居中，同时允许滚动查看完整内容 */
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
  z-index: 15; /* 确保坐标轴标签在图表标题之上 */
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
  z-index: 20; /* 确保游戏封面在坐标系网格之上 */
  transition: background-color 0.3s;
}

.game-items-layer.is-drag-over {
  background-color: rgba(64, 158, 255, 0.05);
  outline: 2px dashed #409eff;
  outline-offset: -2px;
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
  display: block;
  overflow: hidden;
}

.game-image :deep(.el-image__inner) {
  width: 100%;
  height: 100%;
  object-fit: cover !important;
  object-position: center;
}

.game-image :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover !important;
  object-position: center;
}

.character-image :deep(.el-image__inner),
.character-image :deep(img) {
  object-fit: cover !important;
  object-position: top center !important;
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

.game-name-badge.always-visible {
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
  left: 0; /* transform 相对于这个位置 */
  top: 0;
  z-index: 30;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 12px 16px;
  padding-left: 8px; /* 为拖动手柄留空间 */
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: default;
  user-select: none;
  /* 🔥 关键：使用 GPU 加速的 transform，不要动画 transform */
  transition: padding 0.3s ease, gap 0.3s ease;
  will-change: transform; /* 提示浏览器优化 transform */
}

/* 收起状态 */
.zoom-controls.is-collapsed {
  padding: 8px;
  gap: 4px;
}

/* 拖动手柄 */
.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 100%;
  cursor: move;
  color: #909399;
  font-size: 14px;
  margin-right: 4px;
  border-right: 1px solid #e4e7ed;
  padding-right: 8px;
  transition: color 0.3s;
  user-select: none;
}

.zoom-controls.is-collapsed .drag-handle {
  border-right: none;
  margin-right: 0;
  padding-right: 0;
}

.drag-handle:hover {
  color: #409eff;
}

.drag-handle:active {
  color: #3a8ee6;
  cursor: grabbing;
}

/* 展开/收起按钮 */
.toggle-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  cursor: pointer;
  color: #606266;
  font-size: 16px;
  border-radius: 4px;
  transition: all 0.3s;
  flex-shrink: 0;
}

.toggle-button:hover {
  background: #f5f7fa;
  color: #409eff;
}

.toggle-button:active {
  background: #e6f7ff;
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

.watermark {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.25);
  font-family: Arial, sans-serif;
  user-select: none;
  pointer-events: none;
  z-index: 5;
  letter-spacing: 0.5px;
}
</style>
