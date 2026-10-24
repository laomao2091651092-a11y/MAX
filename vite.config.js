import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    // 本地开发时代理 /api 到后端（8080 端口）
    // 本地跑后端时就是 http://localhost:8080（已默认）
    // 部署到服务器后，由宝塔反向代理把 /api 转到 127.0.0.1:8080
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      // 好友对战的实时通道（WebSocket 必须开 ws: true）
      '/ws': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true
      }
    }
  }
})
