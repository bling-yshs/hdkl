<template>
  <!-- 历史记录浮动按钮 -->
  <a-float-button
    type="primary"
    tooltip="历史记录"
    @click="historyStore.showHistoryModal"
  >
    <template #icon>
      <history-outlined />
    </template>
  </a-float-button>
  
  <!-- 历史记录弹窗 -->
  <a-modal
    v-model:visible="historyStore.historyModalVisible"
    title="历史记录"
    width="800px"
    @cancel="historyStore.hideHistoryModal"
  >
    <a-list
      :dataSource="historyStore.historyRecords"
      bordered
    >
      <template #renderItem="{ item, index }">
        <a-list-item>
          <a-list-item-meta>
            <template #title>
              <a @click="loadRecord(item)">{{ item.name }} - {{ item.image }}</a>
            </template>
            <template #description>
              <span>{{ formatDate(item.timestamp) }}</span>
            </template>
          </a-list-item-meta>
          <template #extra>
            <a-button type="link" @click="deleteRecord(index)">
              <delete-outlined />
            </a-button>
          </template>
        </a-list-item>
      </template>
      <template #empty>
        <div style="text-align: center; padding: 20px;">暂无历史记录</div>
      </template>
    </a-list>
  </a-modal>
</template>

<script setup lang="ts">
import { HistoryOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { useHistoryStore, type DockerConfig } from '@/pinia/historyStore'
import { message } from 'ant-design-vue'

const historyStore = useHistoryStore()
const emit = defineEmits<{
  (e: 'load-record', record: DockerConfig): void
}>()

// 格式化日期
function formatDate(timestamp?: number) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 加载历史记录
function loadRecord(record: DockerConfig) {
  emit('load-record', record)
  historyStore.hideHistoryModal()
  message.success('已加载历史配置')
}

// 删除历史记录
function deleteRecord(index: number) {
  const result = historyStore.deleteHistoryRecord(index)
  message.success(result)
}
</script>
