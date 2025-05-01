import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface DockerConfig {
  name: string
  image: string | undefined
  network: string
  runBackGround: boolean
  localPath: string[]
  containerPath: string[]
  portMapping: {
    localPort: string
    containerPort: string
    type: string
  }[]
  envSettings: {
    key: string
    value: string
  }[]
  restart: string
  command: string
  timestamp?: number
}

export const useHistoryStore = defineStore('history', () => {
  const historyRecords = ref<DockerConfig[]>([])
  const historyModalVisible = ref(false)
  
  // 从localStorage加载历史记录
  function loadHistoryRecords() {
    const historyData = localStorage.getItem('dockerHistory')
    if (historyData) {
      historyRecords.value = JSON.parse(historyData)
    }
  }
  
  // 保存当前配置到历史记录
  function saveToHistory(dockerConfig: DockerConfig): void {
    if (!dockerConfig.name || !dockerConfig.image) return
    
    const historyItem = {
      ...dockerConfig,
      timestamp: new Date().getTime()
    }
    
    let history: DockerConfig[] = []
    const historyData = localStorage.getItem('dockerHistory')
    if (historyData) {
      history = JSON.parse(historyData)
    }
    
    // 限制历史记录最多保存20条
    history.unshift(historyItem)
    if (history.length > 20) {
      history = history.slice(0, 20)
    }
    
    localStorage.setItem('dockerHistory', JSON.stringify(history))
    historyRecords.value = history
  }
  
  // 删除历史记录项
  function deleteHistoryRecord(index: number) {
    historyRecords.value.splice(index, 1)
    localStorage.setItem('dockerHistory', JSON.stringify(historyRecords.value))
    return '已删除历史记录'
  }
  
  // 显示历史记录弹窗
  function showHistoryModal() {
    loadHistoryRecords()
    historyModalVisible.value = true
  }
  
  // 隐藏历史记录弹窗
  function hideHistoryModal() {
    historyModalVisible.value = false
  }
  
  return {
    historyRecords,
    historyModalVisible,
    loadHistoryRecords,
    saveToHistory,
    deleteHistoryRecord,
    showHistoryModal,
    hideHistoryModal
  }
})
