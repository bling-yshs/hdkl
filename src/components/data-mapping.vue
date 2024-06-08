<template>
  <a-flex gap="small" vertical>
    <p>数据映射</p>
    <normal-content>
      <div class="flex flex-col gap-10">
        <a-row :gutter="16" v-if="localPath.length > 0">
          <a-col :span="9">本地路径</a-col>
          <a-col :span="4" class="text-center">
            <span>操作</span>
          </a-col>
          <a-col :span="9">容器路径</a-col>
        </a-row>
        <a-row :gutter="16" align="middle" v-for="(_, index) in localPath" :key="index">
          <a-col :span="9">
            <a-input v-model:value="localPath[index]">
              <template #suffix>
                <a-tooltip title="选择文件夹">
                  <folder-outlined @click="selectFolder(index)" />
                </a-tooltip>
              </template>
            </a-input>
          </a-col>
          <a-col class="text-center" :span="4">
            <span>同步修改</span>
          </a-col>
          <a-col :span="9">
            <a-input v-model:value="containerPath[index]"></a-input>
          </a-col>
          <a-col :span="2">
            <a @click="handleDelete(index)">删除</a>
          </a-col>
        </a-row>
        <!--添加按钮-->
        <a-row>
          <a-col>
            <a-button type="dashed" @click="handleAdd">添加</a-button>
          </a-col>
        </a-row>
      </div>
    </normal-content>
  </a-flex>
</template>

<script setup lang="ts">
import NormalContent from '@/components/normal-content.vue'
import { FolderOutlined } from '@ant-design/icons-vue'
import { open } from '@tauri-apps/api/dialog'

async function handleDelete(x: number) {
  localPath.value.splice(x, 1)
  containerPath.value.splice(x, 1)
}

async function handleAdd() {
  localPath.value.push('')
  containerPath.value.push('')
}

const localPath = defineModel<Array<string>>('localPath', {
  required: true,
  default: []
})
const containerPath = defineModel<Array<string>>('containerPath', {
  required: true,
  default: []
})

async function selectFolder(index: number) {
  let selected = await open({
    directory: true,
    multiple: false
  })
  if (selected) {
    localPath.value[index] = selected as string
  }
}
</script>
