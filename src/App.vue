<template>
  <div class="app-shell">
    <!-- ============ 全局导航（DERMEXCEL 风格，所有页面共用） ============ -->
    <nav class="nav">
      <!-- Logo：渐变圆点 + 站名（改 src/data/site.js 里的 name） -->
      <router-link to="/" class="logo">
        <span class="logo-dot"></span>
        <span class="logo-name">{{ site.name }}</span>
      </router-link>

      <!-- 功能菜单：画廊 / 相册 / 点菜 -->
      <ul class="nav-links">
        <li><router-link to="/">封面</router-link></li>
        <li><router-link to="/gallery">画廊</router-link></li>
        <li><router-link to="/cloud">相册</router-link></li>
        <li><router-link to="/menu">点菜</router-link></li>
        <li><a href="/haunt.html">幽灵控制台 👻</a></li>
        <li><a href="/wan-sheng.html">万圣来啦 🎃</a></li>
      </ul>

      <!-- 右侧按钮 -->
      <router-link to="/menu" class="nav-cta">今天想吃 🍽️</router-link>
    </nav>

    <!-- 路由出口：各页面在这里渲染 -->
    <router-view />
  </div>
</template>

<script setup>
// 引入网站配置（站名等）
import { site } from './data/site.js'
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

/* ============ 响应式：手机端 ============ */
@media (max-width: 750px) {
  .nav {
    padding: 14px 16px;
    flex-wrap: wrap;          /* 允许换行 */
    gap: 10px;
  }
  .nav-links {
    order: 3;                 /* 导航链接换到第二行 */
    width: 100%;
    justify-content: center;
    gap: 20px;
  }
  .nav-links a {
    font-size: 13px;
  }
  .nav-cta {
    padding: 8px 16px;
    font-size: 12px;
  }
  .page {
    padding: 140px 16px 60px;
  }
}
</style>
