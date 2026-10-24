import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Gallery from '../views/Gallery.vue'
import Menu from '../views/Menu.vue'
import PhotoDetail from '../views/PhotoDetail.vue'
import ZoomGallery from '../views/ZoomGallery.vue'
import Cloud from '../views/Cloud.vue'
import Tarot from '../views/Tarot.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Messages from '../views/Messages.vue'
import Bridge from '../views/Bridge.vue'
import BridgeHub from '../views/BridgeHub.vue'
import BridgeRoom from '../views/BridgeRoom.vue'
import BridgeTable from '../views/BridgeTable.vue'
import Profile from '../views/Profile.vue'
import ChangePassword from '../views/ChangePassword.vue'
import Friends from '../views/Friends.vue'
import Admin from '../views/Admin.vue'
import { isLoggedIn } from '../api.js'

// 路由表：每个路由对应一个页面
// meta.requiresAuth = true 表示「必须登录才能看」
const routes = [
  // 登录 / 注册：不需要登录
  { path: '/login', name: 'Login', component: Login, meta: { requiresAuth: false } },
  { path: '/register', name: 'Register', component: Register, meta: { requiresAuth: false } },

  // 公开页：封面 + 画廊（没登录也能看）
  { path: '/', name: 'Home', component: Home, meta: { requiresAuth: false } },
  { path: '/gallery', name: 'Gallery', component: Gallery, meta: { requiresAuth: false } },

  // 以下都需要登录
  { path: '/cloud', name: 'Cloud', component: Cloud, meta: { requiresAuth: true } },
  { path: '/tarot', name: 'Tarot', component: Tarot, meta: { requiresAuth: true } },
  { path: '/menu', name: 'Menu', component: Menu, meta: { requiresAuth: true } },
  { path: '/messages', name: 'Messages', component: Messages, meta: { requiresAuth: true } },
  { path: '/bridge', name: 'BridgeHub', component: BridgeHub, meta: { requiresAuth: true } },
  { path: '/bridge/solo', name: 'Bridge', component: Bridge, meta: { requiresAuth: true } },
  { path: '/bridge/room', name: 'BridgeRoom', component: BridgeRoom, meta: { requiresAuth: true } },
  { path: '/bridge/table/:id', name: 'BridgeTable', component: BridgeTable, meta: { requiresAuth: true } },
  { path: '/profile', name: 'Profile', component: Profile, meta: { requiresAuth: true } },
  { path: '/password', name: 'ChangePassword', component: ChangePassword, meta: { requiresAuth: true } },
  { path: '/friends', name: 'Friends', component: Friends, meta: { requiresAuth: true } },
  { path: '/admin', name: 'Admin', component: Admin, meta: { requiresAuth: true } },
  { path: '/photo/:id', name: 'PhotoDetail', component: PhotoDetail, meta: { requiresAuth: true } },
  { path: '/zoom/:id', name: 'ZoomGallery', component: ZoomGallery, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// ============================================================
// 登录守卫：
// - 需要登录的页面，没登录就跳到 /login（记下想去的地址，登录完跳回去）
// - 已登录还去登录/注册页，直接回首页
// ============================================================
router.beforeEach((to, from, next) => {
  const authed = isLoggedIn()

  if (to.meta.requiresAuth && !authed) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else if ((to.name === 'Login' || to.name === 'Register') && authed) {
    next('/')
  } else {
    next()
  }
})

export default router
