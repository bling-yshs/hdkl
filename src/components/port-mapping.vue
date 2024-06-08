<template>
  <a-flex gap="small" vertical>
    <p>端口映射</p>
    <normal-content>
      <div class="flex flex-col gap-10">
        <a-row :gutter="16" v-if="portMapping.length > 0">
          <a-col :span="9">本地端口</a-col>
          <a-col :span="4">类型</a-col>
          <a-col :span="9">容器端口</a-col>
        </a-row>
        <a-row :gutter="16" align="middle" v-for="(_, index) in portMapping" :key="index">
          <a-col :span="9">
            <a-input v-model:value="portMapping[index].localPort"></a-input>
          </a-col>
          <a-col :span="4">
            <a-select v-model:value="portMapping[index].type" style="width: 100%">
              <a-select-option value="tcp">TCP</a-select-option>
              <a-select-option value="udp">UDP</a-select-option>
            </a-select>
          </a-col>
          <a-col :span="9">
            <a-input v-model:value="portMapping[index].containerPort"></a-input>
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
import type { IPortMapping } from '@/interface/IPortMapping'

async function handleDelete(x: number) {
  portMapping.value.splice(x, 1)
}

async function handleAdd() {
  portMapping.value.push({ type: 'tcp', localPort: '', containerPort: '' })
}

const portMapping = defineModel<Array<IPortMapping>>('portMapping', {
  required: true,
  default: []
})
</script>
