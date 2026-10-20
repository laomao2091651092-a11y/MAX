import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Gallery from '../views/Gallery.vue'
import Menu from '../views/Menu.vue'
import PhotoDetail from '../views/PhotoDetail.vue'
import ZoomGallery from '../views/ZoomGallery.vue'

// 路由表：每个路由对应一个页面
const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/gallery',
    name: 'Gallery',
    component: Gallery
  },
  {
    path: '/menu',
    name: 'Menu',
    component: Menu
  },
  {
    // 照片详细页：:id 是照片编号（对应 gallery.js 里的 id）
    path: '/photo/:id',
    name: 'PhotoDetail',
    component: PhotoDetail
  },
  {
    // 全屏放大画廊：:id 是从哪张照片进入（对应 gallery.js 里的 id）
    path: '/zoom/:id',
    name: 'ZoomGallery',
    component: ZoomGallery
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
