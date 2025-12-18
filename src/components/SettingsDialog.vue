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
            <el-radio-group v-model="localChartTitle.positionX" :disabled="!localChartTitle.text">
              <el-radio label="left">左对齐</el-radio>
              <el-radio label="center">居中</el-radio>
              <el-radio label="right">右对齐</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="垂直位置">
            <el-radio-group v-model="localChartTitle.positionY" :disabled="!localChartTitle.text">
              <el-radio label="top">顶部</el-radio>
              <el-radio label="bottom">底部</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="标题颜色">
            <el-color-picker v-model="localChartTitle.color" :disabled="!localChartTitle.text" />
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

      <!-- 数据导入导出 -->
      <el-tab-pane label="数据管理" name="data">
        <div class="data-management">
          <el-alert
            title="说明"
            type="info"
            :closable="false"
            style="margin-bottom: 20px"
          >
            <p>导出的JSON文件包含：待选游戏库、坐标系中的游戏位置和大小、图表标题、坐标轴标签设置</p>
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
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Upload } from '@element-plus/icons-vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  axisLabels: {
    type: Object,
    required: true
  },
  chartTitle: {
    type: Object,
    required: true
  },
  gameLibrary: {
    type: Array,
    default: () => []
  },
  gamesInChart: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:visible', 'update-axis-labels', 'update-chart-title', 'import-data'])

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const activeTab = ref('title')

// 本地坐标轴标签副本
const localAxisLabels = ref({
  horizontal: { positive: '', negative: '' },
  vertical: { positive: '', negative: '' }
})

// 本地图表标题副本
const localChartTitle = ref({
  text: '',
  fontSize: 24,
  positionX: 'center',
  positionY: 'top',
  color: '#303133'
})

// 监听props变化，更新本地副本
watch(() => props.axisLabels, (newVal) => {
  if (newVal) {
    localAxisLabels.value = JSON.parse(JSON.stringify(newVal))
  }
}, { deep: true, immediate: true })

watch(() => props.chartTitle, (newVal) => {
  if (newVal) {
    localChartTitle.value = JSON.parse(JSON.stringify(newVal))
  }
}, { deep: true, immediate: true })

// 导出数据
const handleExport = () => {
  try {
    const exportData = {
      version: '1.0',
      exportTime: new Date().toISOString(),
      axisLabels: props.axisLabels,
      chartTitle: props.chartTitle,
      gameLibrary: props.gameLibrary,
      gamesInChart: props.gamesInChart
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `游戏排名图_${new Date().getTime()}.json`
    link.click()
    
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功！')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败：' + error.message)
  }
}

// 导入数据
const handleImportFile = (file) => {
  const reader = new FileReader()
  
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      
      // 验证数据格式
      if (!data.gameLibrary || !data.gamesInChart || !data.axisLabels) {
        throw new Error('JSON格式不正确，缺少必要字段')
      }

      ElMessageBox.confirm(
        '导入数据将覆盖当前所有数据，是否继续？',
        '确认导入',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        emit('import-data', data)
        ElMessage.success('导入成功！')
        dialogVisible.value = false
      }).catch(() => {
        // 用户取消
      })
    } catch (error) {
      console.error('导入失败:', error)
      ElMessage.error('导入失败：' + error.message)
    }
  }
  
  reader.onerror = () => {
    ElMessage.error('读取文件失败')
  }
  
  reader.readAsText(file.raw)
}

// 确定
const handleConfirm = () => {
  emit('update-axis-labels', localAxisLabels.value)
  emit('update-chart-title', localChartTitle.value)
  dialogVisible.value = false
}

// 取消
const handleCancel = () => {
  // 恢复原始值
  localAxisLabels.value = JSON.parse(JSON.stringify(props.axisLabels))
  localChartTitle.value = JSON.parse(JSON.stringify(props.chartTitle))
  dialogVisible.value = false
}
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
  color: #303133;
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
</style>

