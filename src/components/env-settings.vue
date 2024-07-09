<template>
  <a-flex gap="small" vertical>
    <p>环境变量</p>
    <normal-content>
      <div class="flex flex-col gap-10">
        <a-row :gutter="16" v-if="envSettings.length > 0">
          <a-col :span="11">变量名</a-col>
          <a-col :span="11">值</a-col>
        </a-row>
        <a-row :gutter="16" align="middle" v-for="(_, index) in envSettings" :key="index">
          <a-col :span="11">
            <a-input v-model:value="envSettings[index].key"></a-input>
          </a-col>
          <a-col :span="11">
            <a-input v-model:value="envSettings[index].value"></a-input>
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
import type { IEnvSettings } from '@/interface/IEnvSettings'

async function handleAdd() {
  envSettings.value.push({ key: '', value: '' })
}

// handleDelete
async function handleDelete(x: number) {
  envSettings.value.splice(x, 1)
}

const envSettings = defineModel<Array<IEnvSettings>>('envSettings', {
  required: true,
  default: []
})
</script>

<style scoped>

</style>
