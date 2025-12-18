<template>
  <div 
    class="game-card" 
    :class="{ 'is-disabled': disabled }"
    @click="handleClick"
  >
    <div class="game-cover">
      <el-image
        :src="game.image"
        fit="cover"
        class="cover-image"
      >
        <template #error>
          <div class="image-slot">
            <el-icon><Picture /></el-icon>
          </div>
        </template>
      </el-image>
      
      <!-- 删除按钮 -->
      <el-button
        class="delete-btn"
        :icon="Close"
        circle
        size="small"
        type="danger"
        @click.stop="handleDelete"
      />
      
      <!-- 已使用标记 -->
      <div v-if="disabled" class="used-badge">
        <el-icon><Check /></el-icon>
      </div>
    </div>
    
    <div class="game-name" :title="game.name || '未命名'">
      {{ game.name || '未命名' }}
    </div>
  </div>
</template>

<script setup>
import { Picture, Check, Close } from '@element-plus/icons-vue'

const props = defineProps({
  game: {
    type: Object,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['start-drag', 'delete', 'bring-to-front'])

const handleClick = () => {
  if (props.disabled) {
    // 如果已在坐标系中，点击置顶
    emit('bring-to-front', props.game.id)
  } else {
    // 如果未在坐标系中，点击添加
    emit('start-drag', props.game)
  }
}

const handleDelete = () => {
  emit('delete', props.game.id)
}
</script>

<style scoped>
.game-card {
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  background: #fff;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.game-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #409eff;
}

.game-card.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f5f7fa;
}

.game-card.is-disabled:hover {
  transform: none;
  box-shadow: none;
  border-color: #e4e7ed;
}

.game-cover {
  position: relative;
  width: 100%;
  height: 100px;
  overflow: hidden;
  background: #f5f7fa;
}

.cover-image {
  width: 100%;
  height: 100%;
}

.image-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
  font-size: 24px;
}

.delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 2;
}

.game-card:hover .delete-btn {
  opacity: 1;
}

.used-badge {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #67C23A;
  font-size: 32px;
  pointer-events: none;
}

.game-name {
  padding: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #303133;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}
</style>

