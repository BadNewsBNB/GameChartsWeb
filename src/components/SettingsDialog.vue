<template>
  <el-dialog
    v-model="dialogVisible"
    title="图表设置"
    width="600px"
    :close-on-click-modal="false"
  >
    <el-tabs v-model="activeTab">
      <!-- 图表标题设置 -->
      <el-tab-pane label="图表标题" name="title">
        <el-form label-width="100px" class="title-form">
          <el-form-item label="标题文本">
            <el-input
              v-model="localChartTitle.text"
              placeholder="输入图表标题（可留空）"
              maxlength="30"
              show-word-limit
              clearable
            />
          </el-form-item>
          <el-form-item label="字号大小">
            <el-slider
              v-model="localChartTitle.fontSize"
              :min="16"
              :max="48"
              :step="2"
              show-input
              :disabled="!localChartTitle.text"
            />
          </el-form-item>
          <el-form-item label="水平位置">
            <el-radio-group
              v-model="localChartTitle.positionX"
              :disabled="!localChartTitle.text"
            >
              <el-radio label="left">左对齐</el-radio>
              <el-radio label="center">居中</el-radio>
              <el-radio label="right">右对齐</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="垂直位置">
            <el-radio-group
              v-model="localChartTitle.positionY"
              :disabled="!localChartTitle.text"
            >
              <el-radio label="top">顶部</el-radio>
              <el-radio label="bottom">底部</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="标题颜色">
            <el-color-picker
              v-model="localChartTitle.color"
              :disabled="!localChartTitle.text"
            />
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 坐标轴设置 -->
      <el-tab-pane label="坐标轴标签" name="axis">
        <el-form label-width="100px" class="axis-form">
          <el-divider content-position="left">横轴（X轴）</el-divider>
          <el-form-item label="正向（右）">
            <el-input
              v-model="localAxisLabels.horizontal.positive"
              placeholder="如：好玩"
              maxlength="10"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="负向（左）">
            <el-input
              v-model="localAxisLabels.horizontal.negative"
              placeholder="如：不好玩"
              maxlength="10"
              show-word-limit
            />
          </el-form-item>

          <el-divider content-position="left">纵轴（Y轴）</el-divider>
          <el-form-item label="正向（上）">
            <el-input
              v-model="localAxisLabels.vertical.positive"
              placeholder="如：爱玩"
              maxlength="10"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="负向（下）">
            <el-input
              v-model="localAxisLabels.vertical.negative"
              placeholder="如：不爱玩"
              maxlength="10"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 账号设置 -->
      <el-tab-pane label="账号设置" name="account">
        <el-form label-width="120px" class="account-form">
          <el-alert
            title="说明"
            type="info"
            :closable="false"
            style="margin-bottom: 20px"
          >
            <p>配置 Access Token 后可以访问 Bangumi 的 NSFW(R18) 内容</p>
          </el-alert>

          <el-form-item label="Access Token">
            <el-input
              v-model="localAccessToken"
              type="password"
              placeholder="输入你的 Bangumi Access Token"
              show-password
              clearable
            />
            <el-text type="info" size="small" style="margin-top: 4px">
              <a
                href="https://next.bgm.tv/demo/access-token"
                target="_blank"
                rel="noopener noreferrer"
                style="color: #409eff"
              >
                点击获取 Access Token
              </a>
            </el-text>
          </el-form-item>

          <el-form-item label="包含 R18 内容">
            <el-switch v-model="localIncludeNSFW" />
            <el-text type="warning" size="small" style="margin-left: 12px">
              需要先配置 Access Token
            </el-text>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 数据导入导出 -->
      <el-tab-pane label="数据管理" name="data">
        <div class="data-management">
          <el-alert
            title="说明"
            type="info"
            :closable="false"
            style="margin-bottom: 20px"
          >
            <p>
              导出的JSON文件包含：待选游戏库、坐标系中的游戏位置和大小、图表标题、坐标轴标签设置
            </p>
          </el-alert>

          <div class="action-group">
            <h4>导出数据</h4>
            <p class="desc">将当前所有数据导出为JSON文件</p>
            <el-button type="primary" @click="handleExport" :icon="Download">
              导出JSON文件
            </el-button>
          </div>

          <el-divider />

          <div class="action-group">
            <h4>导入数据</h4>
            <p class="desc">从JSON文件恢复数据（会覆盖当前数据）</p>
            <el-upload
              ref="uploadRef"
              :auto-upload="false"
              :show-file-list="false"
              accept=".json"
              :on-change="handleImportFile"
            >
              <el-button type="success" :icon="Upload">
                选择JSON文件导入
              </el-button>
            </el-upload>
          </div>

          <el-divider />

          <div class="action-group">
            <h4>导出方案（含图片）</h4>
            <p class="desc">导出为ZIP文件，包含JSON数据和所有自行添加的图片</p>
            <el-button type="primary" @click="handleExportPackage" :icon="Download">
              导出方案包
            </el-button>
          </div>

          <el-divider />

          <div class="action-group">
            <h4>导入方案（含图片）</h4>
            <p class="desc">从ZIP文件恢复数据（会覆盖当前数据）</p>
            <el-upload
              ref="packageUploadRef"
              :auto-upload="false"
              :show-file-list="false"
              accept=".zip"
              :on-change="handleImportPackage"
            >
              <el-button type="success" :icon="Upload">
                选择方案包导入
              </el-button>
            </el-upload>
          </div>

          <el-divider />

          <div class="action-group">
            <h4>清除图表</h4>
            <p class="desc">清除坐标系中的游戏</p>
            <el-button type="warning" @click="handleClearChart" :icon="Delete">
              清除坐标系
            </el-button>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Download, Upload, Delete } from "@element-plus/icons-vue";
import JSZip from "jszip";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  axisLabels: {
    type: Object,
    required: true,
  },
  chartTitle: {
    type: Object,
    required: true,
  },
  gameLibrary: {
    type: Array,
    default: () => [],
  },
  gamesInChart: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits([
  "update:visible",
  "update-axis-labels",
  "update-chart-title",
  "import-data",
  "clear-chart",
  "clear-all-data",
]);

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit("update:visible", val),
});

const activeTab = ref("title");
const uploadRef = ref(null);
const packageUploadRef = ref(null);

// 本地坐标轴标签副本
const localAxisLabels = ref({
  horizontal: { positive: "", negative: "" },
  vertical: { positive: "", negative: "" },
});

// 本地图表标题副本
const localChartTitle = ref({
  text: "",
  fontSize: 24,
  positionX: "center",
  positionY: "top",
  color: "#a3a5a9",
});

// 本地账号设置
const localAccessToken = ref("");
const localIncludeNSFW = ref(false);

// 监听props变化，更新本地副本
watch(
  () => props.axisLabels,
  (newVal) => {
    if (newVal) {
      localAxisLabels.value = JSON.parse(JSON.stringify(newVal));
    }
  },
  { deep: true, immediate: true }
);

watch(
  () => props.chartTitle,
  (newVal) => {
    if (newVal) {
      localChartTitle.value = JSON.parse(JSON.stringify(newVal));
    }
  },
  { deep: true, immediate: true }
);

// 从 localStorage 加载账号设置
const loadAccountSettings = () => {
  try {
    const savedToken = localStorage.getItem("bangumi_access_token");
    const savedNSFW = localStorage.getItem("bangumi_include_nsfw");
    if (savedToken) {
      localAccessToken.value = savedToken;
    }
    if (savedNSFW !== null) {
      localIncludeNSFW.value = savedNSFW === "true";
    }
  } catch (error) {
    console.error("加载账号设置失败:", error);
  }
};

// 保存账号设置到 localStorage
const saveAccountSettings = () => {
  try {
    localStorage.setItem("bangumi_access_token", localAccessToken.value);
    localStorage.setItem("bangumi_include_nsfw", localIncludeNSFW.value.toString());
  } catch (error) {
    console.error("保存账号设置失败:", error);
  }
};

// 监听对话框打开，加载设置
watch(() => props.visible, (newVal) => {
  if (newVal) {
    loadAccountSettings();
  }
});

// 导出数据
const handleExport = () => {
  try {
    const exportData = {
      version: "1.0",
      exportTime: new Date().toISOString(),
      axisLabels: props.axisLabels,
      chartTitle: props.chartTitle,
      gameLibrary: props.gameLibrary,
      gamesInChart: props.gamesInChart,
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // 生成文件名：使用图表标题或默认名称
    const chartTitle = props.chartTitle?.text || "游戏排名图";
    const timestamp = new Date().getTime();
    const fileName = `${chartTitle}_${timestamp}.json`;

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
    ElMessage.success("导出成功！");
  } catch (error) {
    console.error("导出失败:", error);
    ElMessage.error("导出失败：" + error.message);
  }
};

// 导入数据
const handleImportFile = (file) => {
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);

      // 验证数据格式（chartTitle 可选，为了兼容旧版本）
      if (!data.gameLibrary || !data.gamesInChart || !data.axisLabels) {
        throw new Error("JSON格式不正确，缺少必要字段");
      }

      // 如果没有 chartTitle，使用默认值
      if (!data.chartTitle) {
        data.chartTitle = {
          text: "",
          fontSize: 24,
          positionX: "center",
          positionY: "top",
          color: "#303133",
        };
      }

      ElMessageBox.confirm(
        "导入数据将覆盖当前所有数据，是否继续？",
        "确认导入",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        }
      )
        .then(() => {
          emit("import-data", data);
          ElMessage.success("导入成功！");
          dialogVisible.value = false;
        })
        .catch(() => {
          // 用户取消
        });
    } catch (error) {
      console.error("导入失败:", error);
      ElMessage.error("导入失败：" + error.message);
    }
  };

  reader.onerror = () => {
    ElMessage.error("读取文件失败");
  };

  reader.readAsText(file.raw);
};

// 导出方案包（包含图片）
const handleExportPackage = async () => {
  try {
    ElMessage.info("正在打包方案...");
    
    const zip = new JSZip();
    
    // 判断是否为本地图片（base64格式）
    const isLocalImage = (image) => {
      if (!image || typeof image !== 'string') return false;
      return image.startsWith("data:image") || image.startsWith("data:application/octet-stream");
    };
    
    // 判断是否为自定义游戏（本地添加的）
    // 检测条件：type === 'custom' 或 id 以 'local_' 开头
    const isCustomGame = (game) => {
      if (!game) return false;
      // 确保 id 是字符串类型
      const gameId = String(game.id || '');
      const isCustomType = game.type === "custom" || gameId.startsWith("local_");
      return isCustomType;
    };
    
    // 收集所有有本地图片的游戏（包括自定义游戏和可能有本地图片的Bangumi游戏）
    const allGamesWithLocalImages = [
      ...props.gameLibrary.filter((game) => game && isLocalImage(game.image)),
      ...props.gamesInChart.filter((game) => game && isLocalImage(game.image)),
    ];
    
    console.log(`[导出] 检测到有本地图片的游戏: ${allGamesWithLocalImages.length} 个`);
    console.log(`[导出] gameLibrary 总数: ${props.gameLibrary.length}, gamesInChart 总数: ${props.gamesInChart.length}`);
    
    // 去重（基于id，确保id转换为字符串）
    const uniqueGamesWithLocalImages = [];
    const seenIds = new Set();
    allGamesWithLocalImages.forEach((game) => {
      const gameId = String(game.id || '');
      if (!seenIds.has(gameId)) {
        seenIds.add(gameId);
        uniqueGamesWithLocalImages.push(game);
      }
    });
    
    console.log(`[导出] 去重后有本地图片的游戏: ${uniqueGamesWithLocalImages.length} 个`);
    
    // 将base64图片转换为文件并添加到zip
    const imageMap = {}; // 记录图片ID到文件名的映射
    let imagesFolder = null;
    
    if (uniqueGamesWithLocalImages.length > 0) {
      // 创建images文件夹
      imagesFolder = zip.folder("images");
      
      for (let i = 0; i < uniqueGamesWithLocalImages.length; i++) {
        const game = uniqueGamesWithLocalImages[i];
        const gameId = String(game.id || '');
        
        // 检查图片格式（只处理本地base64图片）
        if (!game.image || !isLocalImage(game.image)) {
          console.warn(`[导出] 跳过非本地图片 (游戏ID: ${gameId}):`, game.image?.substring(0, 50));
          continue;
        }
        
        // 处理 base64 图片（包括 data:image 和 data:application/octet-stream）
        if (isLocalImage(game.image)) {
          try {
            // 提取base64数据
            const base64Data = game.image.split(",")[1];
            
            // 尝试从 MIME 类型获取图片格式
            let mimeType = "png";
            let extension = "png";
            
            if (game.image.startsWith("data:image")) {
              const mimeMatch = game.image.match(/data:image\/([^;]+)/);
              if (mimeMatch) {
                mimeType = mimeMatch[1];
                extension = mimeType === "jpeg" ? "jpg" : mimeType;
              }
            } else if (game.image.startsWith("data:application/octet-stream")) {
              // 对于 application/octet-stream，尝试从 base64 数据推断图片类型
              // 检查文件头（magic bytes）
              try {
                const binaryString = atob(base64Data.substring(0, 20)); // 只解码前20个字符用于检测
                const bytes = new Uint8Array(binaryString.length);
                for (let j = 0; j < binaryString.length; j++) {
                  bytes[j] = binaryString.charCodeAt(j);
                }
                
                // 检查常见的图片文件头
                if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
                  // JPEG: FF D8
                  mimeType = "jpeg";
                  extension = "jpg";
                } else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
                  // PNG: 89 50 4E 47
                  mimeType = "png";
                  extension = "png";
                } else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
                  // GIF: 47 49 46
                  mimeType = "gif";
                  extension = "gif";
                } else if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
                  // WebP: RIFF...WEBP
                  mimeType = "webp";
                  extension = "webp";
                } else {
                  // 默认使用 jpg（因为大多数情况是 jpg）
                  console.warn(`[导出] 无法识别图片类型，使用默认 jpg (游戏ID: ${gameId})`);
                  mimeType = "jpeg";
                  extension = "jpg";
                }
              } catch (e) {
                console.warn(`[导出] 检测图片类型失败，使用默认 jpg (游戏ID: ${gameId}):`, e);
                mimeType = "jpeg";
                extension = "jpg";
              }
            }
            
            // 生成文件名（使用字符串类型的id）
            const fileName = `image_${gameId}.${extension}`;
            imageMap[gameId] = fileName;
            
            // 将base64转换为二进制并添加到zip
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let j = 0; j < binaryString.length; j++) {
              bytes[j] = binaryString.charCodeAt(j);
            }
            imagesFolder.file(fileName, bytes);
            console.log(`[导出] 已添加base64图片: ${fileName} (游戏ID: ${gameId}, 类型: ${mimeType})`);
          } catch (error) {
            console.error(`[导出] 处理base64图片失败 (游戏ID: ${gameId}):`, error);
          }
        }
      }
    }
    
    console.log(`[导出] 最终图片映射:`, Object.keys(imageMap).length, "张");
    console.log(`[导出] 有本地图片的游戏总数: ${uniqueGamesWithLocalImages.length}, 成功导出图片: ${Object.keys(imageMap).length}`);
    
    // 准备导出数据，只替换本地图片的路径为文件名，保留线上图片的URL
    const exportData = {
      version: "2.0", // 方案包版本
      exportTime: new Date().toISOString(),
      axisLabels: props.axisLabels,
      chartTitle: props.chartTitle,
      gameLibrary: props.gameLibrary.map((game) => {
        if (!game) return game;
        const gameId = String(game.id || '');
        // 只替换本地图片（base64），保留线上图片（URL）
        if (isLocalImage(game.image) && imageMap[gameId]) {
          return { ...game, image: `images/${imageMap[gameId]}` };
        }
        return game;
      }),
      gamesInChart: props.gamesInChart.map((game) => {
        if (!game) return game;
        const gameId = String(game.id || '');
        // 只替换本地图片（base64），保留线上图片（URL）
        if (isLocalImage(game.image) && imageMap[gameId]) {
          return { ...game, image: `images/${imageMap[gameId]}` };
        }
        return game;
      }),
      imageMap, // 保存映射关系
    };
    
    // 添加JSON文件到zip
    const dataStr = JSON.stringify(exportData, null, 2);
    zip.file("data.json", dataStr);
    
    // 生成zip文件
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    
    // 生成文件名
    const chartTitle = props.chartTitle?.text || "游戏排名图";
    const timestamp = new Date().getTime();
    const fileName = `${chartTitle}_方案包_${timestamp}.zip`;
    
    // 下载
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    
    URL.revokeObjectURL(url);
    const imageCount = Object.keys(imageMap).length;
    if (imageCount > 0) {
      ElMessage.success(`导出成功！包含 ${imageCount} 张图片`);
    } else {
      ElMessage.success("导出成功！");
    }
  } catch (error) {
    console.error("导出方案包失败:", error);
    ElMessage.error("导出方案包失败：" + error.message);
  }
};

// 导入方案包（包含图片）
const handleImportPackage = async (file) => {
  try {
    ElMessage.info("正在解压方案包...");
    
    const zip = new JSZip();
    const zipData = await zip.loadAsync(file.raw);
    
    // 读取JSON数据
    const dataFile = zipData.file("data.json");
    if (!dataFile) {
      throw new Error("方案包中缺少 data.json 文件");
    }
    
    const dataStr = await dataFile.async("string");
    const data = JSON.parse(dataStr);
    
    // 验证数据格式
    if (!data.gameLibrary || !data.gamesInChart || !data.axisLabels) {
      throw new Error("JSON格式不正确，缺少必要字段");
    }
    
    // 如果没有 chartTitle，使用默认值
    if (!data.chartTitle) {
      data.chartTitle = {
        text: "",
        fontSize: 24,
        positionX: "center",
        positionY: "top",
        color: "#303133",
      };
    }
    
    // 读取images文件夹中的图片并转换为base64
    const imagesFolder = zipData.folder("images");
    if (imagesFolder) {
      // 获取所有文件（包括子文件夹中的文件）
      const imageBase64Map = {};
      const filePromises = [];
      
      // 遍历zip中的所有文件，查找images文件夹下的文件
      zipData.forEach((relativePath, file) => {
        if (!file.dir && relativePath.startsWith("images/")) {
          // 提取文件名（去除images/前缀）
          const fileName = relativePath.replace("images/", "");
          
          // 创建异步任务读取文件
          const filePromise = (async () => {
            try {
              const blob = await file.async("blob");
              const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
              imageBase64Map[fileName] = base64;
            } catch (error) {
              console.error(`读取图片 ${fileName} 失败:`, error);
            }
          })();
          
          filePromises.push(filePromise);
        }
      });
      
      // 等待所有文件读取完成
      await Promise.all(filePromises);
      
      if (Object.keys(imageBase64Map).length > 0) {
        console.log("已加载图片:", Object.keys(imageBase64Map));
        
        // 恢复游戏数据中的图片路径为base64
        // 只要 image 是 images/ 路径，就尝试转换（不限制 type，因为导入的数据可能 type 字段不一致）
        const restoreImage = (game) => {
          if (game && game.image && game.image.startsWith("images/")) {
            const fileName = game.image.replace("images/", "");
            if (imageBase64Map[fileName]) {
              console.log(`[导入] 恢复图片: ${fileName} (游戏ID: ${game.id})`);
              return { ...game, image: imageBase64Map[fileName] };
            } else {
              console.warn(`[导入] 未找到图片文件: ${fileName}`, "可用文件:", Object.keys(imageBase64Map));
            }
          }
          return game;
        };
        
        data.gameLibrary = data.gameLibrary.map(restoreImage);
        data.gamesInChart = data.gamesInChart.map(restoreImage);
      }
    }
    
    ElMessageBox.confirm(
      "导入方案包将覆盖当前所有数据，是否继续？",
      "确认导入",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    )
      .then(() => {
        emit("import-data", data);
        ElMessage.success("导入成功！");
        dialogVisible.value = false;
      })
      .catch(() => {
        // 用户取消
      });
  } catch (error) {
    console.error("导入方案包失败:", error);
    ElMessage.error("导入方案包失败：" + error.message);
  }
};

// 清除图表
const handleClearChart = () => {
  ElMessageBox.confirm(
    '请选择清除方式',
    '清除坐标系',
    {
      distinguishCancelAndClose: true,
      confirmButtonText: '移回待选栏',
      cancelButtonText: '清除全部数据',
      type: 'warning',
      message: '选择"移回待选栏"将坐标系中的游戏移回游戏库；选择"清除全部数据"将清空所有游戏（包括游戏库）'
    }
  )
    .then(() => {
      // 用户点击了"移回待选栏"
      emit('clear-chart', 'move-to-library');
      ElMessage.success('已将坐标系中的游戏移回待选栏');
      dialogVisible.value = false;
    })
    .catch((action) => {
      if (action === 'cancel') {
        // 用户点击了"清除全部数据"
        ElMessageBox.confirm(
          '此操作将清除所有游戏数据（包括游戏库和坐标系），且无法恢复！',
          '确认清除全部数据',
          {
            confirmButtonText: '确定清除',
            cancelButtonText: '取消',
            type: 'error'
          }
        )
          .then(() => {
            emit('clear-all-data');
            ElMessage.success('已清除所有数据');
            dialogVisible.value = false;
          })
          .catch(() => {
            // 用户取消了清除全部数据
          });
      }
      // 如果 action === 'close'，说明用户点击了 X 关闭，不做任何操作
    });
};

// 确定
const handleConfirm = () => {
  emit("update-axis-labels", localAxisLabels.value);
  emit("update-chart-title", localChartTitle.value);
  saveAccountSettings(); // 保存账号设置
  dialogVisible.value = false;
  ElMessage.success("设置已保存");
};

// 取消
const handleCancel = () => {
  // 恢复原始值
  localAxisLabels.value = JSON.parse(JSON.stringify(props.axisLabels));
  localChartTitle.value = JSON.parse(JSON.stringify(props.chartTitle));
  loadAccountSettings(); // 恢复账号设置
  dialogVisible.value = false;
};
</script>

<style scoped>
.title-form {
  padding: 10px 0;
}

.axis-form {
  padding: 10px 0;
}

.data-management {
  padding: 10px 0;
}

.action-group {
  margin-bottom: 20px;
}

.action-group h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #a3a5a9;
}

.action-group .desc {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
}

.action-group :deep(.el-alert__description) {
  margin-top: 8px;
}

.action-group :deep(.el-alert__description) p {
  margin: 0;
}

.account-form {
  padding: 10px 0;
}

.account-form :deep(.el-input) {
  max-width: 400px;
}
</style>
