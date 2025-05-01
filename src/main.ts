import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Antd from 'ant-design-vue'
import 'virtual:uno.css'
const pinia = createPinia()
import { createPinia } from 'pinia'
const app = createApp(App)
app.use(router)
app.use(Antd)
app.use(pinia)
app.mount('#app')
