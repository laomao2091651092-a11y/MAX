<template>
  <div class="app-shell">
    <!-- ============ 全局导航 ============ -->
    <!-- 登录/注册页不显示导航栏 -->
    <nav class="nav" v-if="route.name !== 'Login' && route.name !== 'Register'">
      <!-- Logo -->
      <router-link to="/" class="logo">
        <span class="logo-dot"></span>
        <span class="logo-name">{{ site.name }}</span>
      </router-link>

      <!-- 汉堡菜单按钮（手机端显示） -->
      <button class="hamburger" @click="menuOpen = !menuOpen" aria-label="菜单">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <!-- 功能菜单 -->
      <ul class="nav-links" :class="{ open: menuOpen }">
        <li><router-link to="/" @click="menuOpen = false">封面</router-link></li>
        <li><router-link to="/gallery" @click="menuOpen = false">画廊</router-link></li>
        <li><router-link to="/cloud" @click="menuOpen = false">相册</router-link></li>
        <li><router-link to="/tarot" @click="menuOpen = false">塔罗占卜 🔮</router-link></li>
        <li><router-link to="/menu" @click="menuOpen = false">点菜</router-link></li>
        <li><router-link to="/bridge" @click="menuOpen = false">桥牌社 🃏</router-link></li>
        <li><router-link to="/messages" @click="menuOpen = false">悄悄话 💬</router-link></li>
        <li><a href="#" @click.prevent="logout">退出 🚪</a></li>
        <li><a href="/wan-sheng.html">万圣来啦 🎃</a></li>
      </ul>

      <!-- 右侧按钮 -->
      <router-link to="/menu" class="nav-cta">今天想吃 🍽️</router-link>

      <!-- 右上角方块头像（奶油风格，点开是个人菜单） -->
      <div class="nav-user" v-if="me" @click="userMenuOpen = !userMenuOpen">
        <div class="nav-avatar">{{ avatarLetter }}</div>
        <div v-if="userMenuOpen" class="user-menu" @click.stop>
          <div class="um-head">
            <div class="um-avatar">{{ avatarLetter }}</div>
            <div class="um-meta">
              <div class="um-name">{{ me.nickname || me.username }}</div>
              <div class="um-uname">@{{ me.username }}</div>
            </div>
          </div>
          <router-link to="/profile" @click="userMenuOpen = false">👤 个人资料</router-link>
          <router-link to="/password" @click="userMenuOpen = false">🔑 修改密码</router-link>
          <router-link to="/friends" @click="userMenuOpen = false">🤝 好友</router-link>
          <router-link v-if="me.role === 'ADMIN'" to="/admin" @click="userMenuOpen = false">🛡️ 管理后台</router-link>
          <a href="#" class="um-logout" @click.prevent="doLogout">🚪 退出登录</a>
        </div>
      </div>
    </nav>

    <!-- 头像菜单点击空白处关闭 -->
    <div v-if="userMenuOpen" class="menu-backdrop" @click="userMenuOpen = false"></div>

    <!-- 路由出口 -->
    <router-view />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { site } from './data/site.js'
import { useAuth } from './composables/useAuth.js'
const menuOpen = ref(false)
const userMenuOpen = ref(false)
const route = useRoute()
const router = useRouter()

// 全局登录用户状态
const { state, fetchMe, logout } = useAuth()
const me = computed(() => state.user)
const avatarLetter = computed(() => {
  const n = (me.value && (me.value.nickname || me.value.username)) || '?'
  return String(n).charAt(0).toUpperCase()
})

// 进入页面（含刷新）时拉取一次“我”的资料，让头像正确显示
onMounted(() => { fetchMe() })

// 退出登录：清掉本地登录信息，回到登录页
function doLogout() {
  logout()
  userMenuOpen.value = false
  menuOpen.value = false
  router.push('/login')
}
</script>

<style>
/* ============ 全局基础 ============ */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
html, body {
  background: #f5efe2;
  overflow-x: hidden;
}
body {
  font-family: "DM Sans", system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* ============ 导航（DERMEXCEL 风格） ============ */
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  padding: 28px 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* 半透明背景，滚动时页面内容不会透过文字显得杂乱 */
  background: rgba(245, 239, 226, 0.75);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-size: 16px;
  text-decoration: none;
  color: #141416;
}
.logo-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(180deg, #d9351f, #fdc68a);
  box-shadow: 0 4px 8px -2px rgba(220, 60, 30, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    inset 0 -2px 3px rgba(120, 20, 0, 0.3);
}
.nav-links {
  list-style: none;
  display: flex;
  gap: 30px;
}
.nav-links a {
  color: #2b2b30;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  position: relative;
  transition: color 0.3s;
}
.nav-links a:hover {
  color: #141416;
}
/* 菜单下划线动画：从左到右生长 */
.nav-links a::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -3px;
  width: 0;
  height: 1.5px;
  background: currentColor;
  border-radius: 2px;
  transition: width 0.4s cubic-bezier(0.7, 0, 0.2, 1);
}
.nav-links a:hover::after {
  width: 100%;
}
/* 当前所在页面的菜单高亮 */
.nav-links a.router-link-active {
  color: #d9351f;
  font-weight: 600;
}
.nav-cta {
  background: #141416;
  color: #fafaf7;
  border: none;
  padding: 12px 22px;
  border-radius: 999px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  box-shadow: 0 12px 20px -8px rgba(0, 0, 0, 0.4),
    0 4px 8px -2px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    inset 0 -2px 4px rgba(0, 0, 0, 0.4);
  transition: transform 0.4s cubic-bezier(0.6, 0, 0.2, 1);
}
.nav-cta:hover {
  transform: translateY(-2px);
}

/* ============ 右上角方块头像 ============ */
.nav-user {
  position: relative;
  margin-left: 14px;
  cursor: pointer;
}
.nav-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px; /* 方块（圆角）奶油风 */
  background: linear-gradient(180deg, #fbe7c6, #f3d29a);
  border: 1.5px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 6px 14px -6px rgba(180, 130, 60, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 17px;
  color: #7a4a16;
  transition: transform 0.2s;
}
.nav-user:hover .nav-avatar {
  transform: translateY(-1px);
}
/* 下拉菜单 */
.user-menu {
  position: absolute;
  top: 52px;
  right: 0;
  width: 220px;
  padding: 10px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 20px 44px rgba(120, 90, 50, 0.22);
  z-index: 60;
}
.um-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 8px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 8px;
}
.um-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(180deg, #fbe7c6, #f3d29a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 19px;
  color: #7a4a16;
}
.um-name {
  font-weight: 700;
  font-size: 15px;
  color: #141416;
}
.um-uname {
  font-size: 12px;
  color: #8b847a;
}
.user-menu a {
  display: block;
  padding: 10px 12px;
  border-radius: 12px;
  text-decoration: none;
  color: #2b2b30;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
}
.user-menu a:hover {
  background: rgba(217, 53, 31, 0.08);
  color: #d9351f;
}
.um-logout {
  color: #b23b2a !important;
}
/* 点击空白关闭菜单的蒙层 */
.menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 55;
}

/* 页面内容区域：留出导航高度，并统一奶油渐变背景 */
.page {
  min-height: 100vh;
  padding: 140px 40px 80px;
  background: radial-gradient(
    120% 70% at 50% 0%,
    #f8f3e7 0%,
    #f2ead6 60%,
    #e9dec3 100%
  );
}

/* ============ 汉堡菜单按钮 ============ */
.hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
}
.hamburger span {
  width: 24px;
  height: 2.5px;
  background: #141416;
  border-radius: 2px;
  transition: 0.3s;
}

/* ============ 响应式：手机端 ============ */
@media (max-width: 750px) {
  .nav {
    padding: 14px 16px;
    flex-wrap: wrap;
    gap: 10px;
  }
  .hamburger {
    display: flex;
    order: 2;
  }
  .nav-links {
    display: none;
    order: 3;
    width: 100%;
    flex-direction: column;
    gap: 16px;
    padding: 16px 0;
    text-align: center;
  }
  .nav-links.open {
    display: flex;
  }
  .nav-links a {
    font-size: 15px;
  }
  .nav-cta {
    padding: 8px 16px;
    font-size: 12px;
    order: 1;
  }
  .nav-user {
    order: 1;
    margin-left: 8px;
  }
  .page {
    padding: 120px 16px 60px;
  }
}
</style>
