import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router) // 这一行不能丢！！挂载路由插件
app.mount('#app')
