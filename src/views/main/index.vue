<template>
  <div>
    <a-flex gap="middle" vertical>
      <a-flex gap="small" vertical>
        <p>名称</p>
        <a-auto-complete
          v-model:value="docker.name"
          :options="getDockerNameOptions"
          style="width: 100%"
          placeholder="请输入名称"
        />
      </a-flex>
      
      <a-flex gap="small" vertical>
        <p>镜像</p>
        <a-select
          placeholder="请选择一个镜像"
          show-search
          v-model:value="imagesState.value"
          style="width: 100%"
          :options="imagesState.data"
          @focus="getDockerImageList"
          @blur="() => (imagesState.data = [])"
          :not-found-content="imagesState.fetching ? undefined : null"
        >
          <template v-if="imagesState.fetching" #notFoundContent>
            <a-spin size="small" />
          </template>
        </a-select>
      </a-flex>
      
      <a-flex gap="small" vertical>
        <p>网络</p>
        <a-select
          v-model:value="networkState.value"
          show-search
          placeholder="选择一个网络"
          style="width: 100%"
          :options="networkState.data"
          @focus="getDockerNetworkList"
          @blur="() => (networkState.data = [])"
          :not-found-content="networkState.fetching ? undefined : null"
        >
          <template v-if="networkState.fetching" #notFoundContent>
            <a-spin size="small" />
          </template>
        </a-select>
      </a-flex>
      
      <a-flex gap="small">
        <a-checkbox v-model:checked="docker.runBackGround"></a-checkbox>
        <p>后台运行</p>
      </a-flex>
      
      <data-mapping
        v-model:localPath="docker.localPath"
        v-model:container-path="docker.containerPath"
      />
      
      <port-mapping v-model:port-mapping="docker.portMapping"></port-mapping>
      
      <env-settings v-model:env-settings="docker.envSettings"></env-settings>
      <a-flex gap="small" vertical>
        <p>运行命令</p>
        <a-auto-complete
          v-model:value="commandText"
          :options="[{value: 'sleep infinity',text: 'sleep infinity'}]"
          style="width: 100%"
        />
      </a-flex>
      
      <a-flex gap="small" vertical>
        <p>重启规则</p>
        <a-radio-group v-model:value="docker.restart" :options="restartOptions" />
      </a-flex>
      
      <a-flex justify="center">
        <p>{{ dockerCommand }}</p>
      </a-flex>
      
      <a-flex justify="center">
        <a-dropdown placement="bottomLeft">
          <a-button type="primary" @click="copyCommand">复制</a-button>
          <template #overlay>
            <a-menu>
              <a-menu-item key="1" @click="runCommand">直接运行</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </a-flex>
      <a-button type="primary" @click="testFn">测试</a-button>
    </a-flex>
    
    <!-- 引入历史记录组件 -->
    <history-records @load-record="loadHistoryRecord" />
  </div>
</template>
<script setup lang="ts">
import { Command } from '@tauri-apps/api/shell'
import { computed, onMounted, type Ref, ref, watch } from 'vue'
import { message, type SelectProps } from 'ant-design-vue'
import HistoryRecords from '@/components/history-records.vue'
import { type DockerConfig, useHistoryStore } from '@/pinia/historyStore'
import { writeText } from '@tauri-apps/api/clipboard'
import { writeTextFile } from '@tauri-apps/api/fs'
import DataMapping from '@/components/data-mapping.vue'
import PortMapping from '@/components/port-mapping.vue'
import EnvSettings from '@/components/env-settings.vue'
import { path } from '@tauri-apps/api'
import { appCacheDir, appDataDir } from '@tauri-apps/api/path'

// 使用Pinia历史记录store
const historyStore = useHistoryStore()

// 加载历史记录项
function loadHistoryRecord(record: DockerConfig) {
  docker.value = { ...record }
  commandText.value = record.command || ''
  imagesState.value.value = record.image
  networkState.value.value = record.network
  message.success('已加载历史配置')
}

onMounted(async () => {
  // 先检查是否有Docker有没有在运行
  let command = new Command('ps', ['docker', 'ps'])
  let result = await command.execute()
  if (result.stdout === '') {
    message.error('Docker 未运行，请先启动 Docker')
  } else {
    message.success('Docker 正在运行')
  }
})

// 计算器
const getDockerNameOptions = computed(() => {
  let first = docker.value.network
  // last 需要分割/号，取最后一个，再分割:号，取第一个
  let last = docker.value.image?.split('/').pop()?.split(':').shift()
  let secondOption = `${first}-${last}`
  let list = [{ value: last, text: last }, { value: secondOption, text: secondOption }]
  return list
})

const restartOptions = ['no', 'on-failure', 'always', 'unless-stopped']

const commandText = ref('')

async function testFn() {
  let value = await appDataDir()
  let b = value + '2333'
  message.info(JSON.stringify(b))
}

async function runCommand() {
  // 判断是否指定了name和image
  if (docker.value.name === '' || docker.value.image === '') {
    message.error('请指定名称和镜像')
    return
  }
  
  // 保存到历史记录
  historyStore.saveToHistory(docker.value)
  // 如果存在同名容器，先删除
  let command = new Command('ps', ['docker', 'ps', '-a', '--filter', `name=${docker.value.name}`])
  let result = await command.execute()
  let text = result.stdout
  let strings = text.split('\n')
  if (strings.length > 2) {
    message.info('正在删除已存在的同名容器')
    new Command('ps', ['docker', 'rm', '-f', docker.value.name]).execute()
    // 稍微等待1秒
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  
  // 构建实际执行的命令，将环境变量转换为env-file格式
  let execCommand = await getExecutableDockerCommand()
  command = new Command('ps', [execCommand])
  let runResult = await command.execute()
  if (runResult.stderr !== '') {
    message.error(runResult.stderr)
  } else {
    message.success('容器已成功启动')
  }
}

const dockerCommand = computed(() => {
  let d = ''
  if (docker.value.runBackGround) {
    d = '-d'
  }
  let v = ''
  for (let i = 0; i < docker.value.localPath.length; i++) {
    if (docker.value.localPath[i] !== '' && docker.value.containerPath[i] !== '') {
      v += `-v "${docker.value.localPath[i]}:${docker.value.containerPath[i]}" `
    }
  }
  let p = ''
  let portMapping = docker.value.portMapping
  for (let i = 0; i < portMapping.length; i++) {
    if (portMapping[i].localPort !== '' && portMapping[i].containerPort !== '') {
      p += `-p ${portMapping[i].localPort}:${portMapping[i].containerPort}/${portMapping[i].type} `
    }
  }
  let e = ''
  let envSettings = docker.value.envSettings
  for (let i = 0; i < envSettings.length; i++) {
    if (envSettings[i].key !== '' && envSettings[i].value !== '') {
      e += `-e ${envSettings[i].key}=${envSettings[i].value} `
    }
  }
  return `docker run ${d} --restart=${docker.value.restart} ${e} ${p} ${v} --name=${docker.value.name} --net=${docker.value.network} ${docker.value.image} ${docker.value.command}`
})

async function copyCommand() {
  await writeText(dockerCommand.value)
  message.success('已成功复制到剪贴板')
}

// 获取用于实际执行的Docker命令，将环境变量转换为env-file格式
async function getExecutableDockerCommand() {
  let d = ''
  if (docker.value.runBackGround) {
    d = '-d'
  }
  let v = ''
  for (let i = 0; i < docker.value.localPath.length; i++) {
    if (docker.value.localPath[i] !== '' && docker.value.containerPath[i] !== '') {
      v += `-v "${docker.value.localPath[i]}:${docker.value.containerPath[i]}" `
    }
  }
  let p = ''
  let portMapping = docker.value.portMapping
  for (let i = 0; i < portMapping.length; i++) {
    if (portMapping[i].localPort !== '' && portMapping[i].containerPort !== '') {
      p += `-p ${portMapping[i].localPort}:${portMapping[i].containerPort}/${portMapping[i].type} `
    }
  }
  
  // 处理环境变量 - 如果有环境变量，创建临时env文件
  let e = ''
  let envSettings = docker.value.envSettings
  if (envSettings.length > 0) {
    // 创建一个临时的env文件名
    const tempEnvFile = await path.join(await appCacheDir(), `${docker.value.name}-${new Date().getTime()}.env`)
    
    // 创建env文件内容
    let envFileContent = ''
    for (let i = 0; i < envSettings.length; i++) {
      if (envSettings[i].key !== '' && envSettings[i].value !== '') {
        envFileContent += `${envSettings[i].key}=${envSettings[i].value}\n`
      }
    }
    
    // 使用Tauri的文件系统API写入临时env文件
    try {
      await writeTextFile(tempEnvFile, envFileContent)
      // 使用env-file参数替代多个-e参数
      e = `--env-file=${tempEnvFile} `
    } catch (error) {
      console.error('创建环境变量文件失败:', error)
      message.error('创建环境变量文件失败，将使用-e参数')
      
      // 如果创建文件失败，回退到使用-e参数
      e = ''
      for (let i = 0; i < envSettings.length; i++) {
        if (envSettings[i].key !== '' && envSettings[i].value !== '') {
          e += `-e ${envSettings[i].key}=${envSettings[i].value} `
        }
      }
    }
  }
  
  return `docker run ${d} --restart=${docker.value.restart} ${e} ${p} ${v} --name=${docker.value.name} --net=${docker.value.network} ${docker.value.image} ${docker.value.command}`
}

const networkState: Ref<{
  data: SelectProps['options']
  value: string
  fetching: boolean
}> = ref({
  data: [],
  value: 'bridge',
  fetching: false
})

async function getDockerNetworkList() {
  networkState.value.fetching = true
  let command = new Command('ps', ['docker', 'network', 'ls'])
  let result = await command.execute()
  let networks = result.stdout
  let lines = networks
    .trim()
    .split('\n')
    .filter((line) => line !== '')
  lines.shift()
  let vec: SelectProps['options'] = []
  lines.map((line) => {
    let item = line
      .trim()
      .split(' ')
      .filter((item) => item !== '')
    item = item.splice(0, 2)
    vec.push({
      value: `${item[1]}`,
      label: `${item[1]}`
    })
  })
  networkState.value.data = vec
  networkState.value.fetching = false
}

const imagesState: Ref<{
  data: SelectProps['options']
  value: string | undefined
  fetching: boolean
}> = ref({
  data: [],
  value: undefined,
  fetching: false
})

const docker: Ref<DockerConfig> = ref({
  envSettings: [],
  portMapping: [],
  containerPath: [],
  localPath: [],
  name: '',
  image: '',
  network: networkState.value.value,
  runBackGround: true,
  command: '',
  restart: 'unless-stopped'
})

watch(imagesState.value, () => {
  docker.value.image = imagesState.value.value
})
watch(networkState.value, () => {
  docker.value.network = networkState.value.value
})
watch(commandText, () => {
  docker.value.command = commandText.value
})

async function getDockerImageList() {
  console.log('getDockerImageList')
  // 设置获取状态为正在获取
  imagesState.value.fetching = true
  // 创建一个新的命令，用于获取Docker镜像列表
  let command = new Command('ps', 'docker images | Where-Object { $_ -notmatch "<none>" }')
  // 执行命令并等待结果
  let result = await command.execute()
  // 获取命令的标准输出，即Docker镜像列表
  let images = result.stdout
  // 将输出的镜像列表按行分割，并过滤掉空行
  let lines = images
    .trim()
    .split('\n')
    .filter((line) => line !== '')
  // 删除第一行，因为它是表头，不包含实际的镜像信息
  lines.shift()
  // 创建一个空的选项数组，用于存储解析后的镜像信息
  let vec: SelectProps['options'] = []
  // 遍历每一行，解析镜像信息
  lines.map((line) => {
    // 将每一行按空格分割，并过滤掉空元素
    let item = line
      .trim()
      .split(' ')
      .filter((item) => item !== '')
    // 只保留前两个元素，即镜像的仓库名和标签
    item = item.splice(0, 2)
    // 将解析后的镜像信息添加到选项数组中
    vec.push({
      value: `${item[0]}:${item[1]}`,
      label: `${item[0]}:${item[1]}`
    })
  })
  // 将解析后的选项数组赋值给state的data属性
  imagesState.value.data = vec
  // 设置获取状态为已完成获取
  imagesState.value.fetching = false
}
</script>
