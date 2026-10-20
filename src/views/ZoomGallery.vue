<template>
  <div class="zg-root">
    <!-- 顶部返回栏 -->
    <header class="zg-header">
      <router-link to="/gallery" class="zg-back">← 返回画廊</router-link>
      <span class="zg-count">{{ pad(activeIndex + 1) }} / {{ pad(zoomList.length) }}</span>
    </header>

    <!-- 没有 zoom 照片时的提示 -->
    <div v-if="zoomList.length === 0" class="zg-empty">
      <p>😢 还没有设置"放大画廊"效果的照片</p>
      <p class="zg-empty-tip">在 src/data/gallery.js 里把照片的 detail 改成 'zoom' 即可</p>
    </div>

    <!-- 放大画廊主体 -->
    <div v-else class="zg-gallery">
      <!-- ============ 背景打底：同一张照片放大模糊（随照片切换） ============ -->
      <div class="zg-bg" :key="'bg-' + active.id" aria-hidden="true">
        <img v-if="active.img" :src="requireImg(active.img)" class="zg-bg-img" alt="" />
        <div class="zg-bg-overlay"></div>
      </div>
      <!-- ============ 每张照片一层 ============
           激活的照片全屏大图；没激活的缩小成底部缩略图 -->
      <div
        v-for="(photo, i) in zoomList"
        :key="photo.id"
        class="zg-item"
        :data-active="String(i === activeIndex)"
      >
        <div class="zg-slide" :style="slideStyle(i)">
          <!-- 有照片：显示图片 -->
          <img v-if="photo.img" :src="requireImg(photo.img)" :alt="photo.title" class="zg-image" />
          <!-- 没照片：渐变 + 表情占位 -->
          <div
            v-else
            class="zg-ph"
            :style="{ background: `linear-gradient(135deg, ${photo.color[0]}, ${photo.color[1]})` }"
          >
            <span class="zg-emoji">{{ photo.emoji }}</span>
          </div>
          <!-- 非激活状态：整张图变成缩略图按钮，点击切换 -->
          <button
            v-if="i !== activeIndex"
            type="button"
            class="zg-thumbBtn"
            :aria-label="'显示 ' + photo.title"
            @click="goTo(i)"
          ></button>
        </div>
      </div>

      <!-- ============ 底部渐变模糊层（照片底部自然渐隐，不突兀） ============ -->
      <div class="zg-fade" aria-hidden="true"></div>

      <!-- ============ 左侧信息栏 ============ -->
      <aside class="zg-rail">
        <div class="zg-content" :key="active.id">
          <p class="zg-kicker">{{ pad(activeIndex + 1) }} / {{ pad(zoomList.length) }}</p>
          <h2 class="zg-title">{{ active.title }}</h2>
          <p class="zg-desc">{{ active.desc || '每一张照片，都是我们一起走过的证据。' }}</p>
        </div>
        <!-- 左右切换 + 下载 -->
        <div class="zg-controls">
          <button type="button" class="zg-navBtn" @click="prev" :disabled="zoomList.length <= 1" aria-label="上一张">
            ‹
          </button>
          <button type="button" class="zg-navBtn" @click="next" :disabled="zoomList.length <= 1" aria-label="下一张">
            ›
          </button>
          <button v-if="active.original" type="button" class="zg-dlBtn" @click="downloadOriginal(active)">
            ⬇ 下载原图
          </button>
        </div>
      </aside>

      <!-- ============ 底部情话文案（跟随照片切换） ============ -->
      <div v-if="active.quote" class="zg-quote" :key="active.id">
        <p class="zg-quote-cn">{{ active.quote }}</p>
        <p v-if="active.quoteEn" class="zg-quote-en">{{ active.quoteEn }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
// 引入 Vue 的响应式 API
import { ref, computed, onMounted, onUnmounted } from 'vue'
// 引入路由：useRoute 读取地址栏参数
import { useRoute } from 'vue-router'
// 引入照片数据（改照片去 src/data/gallery.js）
import { photos } from '../data/gallery.js'

// 获取当前路由（/zoom/:id）
const route = useRoute()

// 当前照片 id（字符串 → 数字）
const photoId = computed(() => Number(route.params.id))

// "放大画廊"组的照片：筛选所有 detail === 'zoom' 的照片
const zoomList = computed(() => photos.filter((p) => p.detail === 'zoom'))

// 当前激活的照片下标（从 URL 进入的那张开始）
const activeIndex = ref(0)

// 当前激活的照片数据（计算属性）
const active = computed(() => zoomList.value[activeIndex.value] || zoomList.value[0])

// 照片图片路径（图片放在 src/assets/images/gallery/ 下）
function requireImg(name) {
  return new URL(`../assets/images/gallery/${name}`, import.meta.url).href
}

// 序号补零：1 → "01"
function pad(n) {
  return String(n).padStart(2, '0')
}

// 计算每张照片的缩略图偏移量（--offset）：
// 非激活照片按顺序排成一排，中心位置偏移 0，向两边 ±1、±2…
function slideStyle(i) {
  // 非激活照片列表（去掉当前激活的那张）
  const nonActive = zoomList.value.filter((_, idx) => idx !== activeIndex.value)
  // 这张照片在非激活列表里的位置，减去中心位置 = 偏移量
  const offset = nonActive.indexOf(zoomList.value[i]) - (nonActive.length - 1) / 2
  return { '--offset': offset }
}

// 点击缩略图：切换到对应照片
function goTo(i) {
  activeIndex.value = i
}
// 上一张（到边界就停止）
function prev() {
  if (activeIndex.value > 0) activeIndex.value--
}
// 下一张（到边界就停止）
function next() {
  if (activeIndex.value < zoomList.value.length - 1) activeIndex.value++
}

// 下载原图：浏览器直接保存原图文件
function downloadOriginal(photo) {
  const a = document.createElement('a')   // 创建临时链接
  a.href = requireImg(photo.original)      // 指向原图文件
  a.download = photo.original              // 下载文件名 = 原图文件名
  document.body.appendChild(a)             // 加入页面
  a.click()                                // 触发下载
  document.body.removeChild(a)             // 用完移除
}

// 键盘左右键切换（体验更好）
function onKeydown(e) {
  if (e.key === 'ArrowLeft') prev()
  else if (e.key === 'ArrowRight') next()
}

onMounted(() => {
  // 进入页面时：定位到 URL 指定的那张照片
  const start = zoomList.value.findIndex((p) => p.id === photoId.value)
  if (start !== -1) activeIndex.value = start
  window.addEventListener('keydown', onKeydown)
})

// 卸载时移除键盘监听（避免影响其他页面）
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
/* ============ 根容器：深色全屏 ============ */
.zg-root {
  /* 缩略图参数：大小比例、间距、底部距离、动画时长/缓动 */
  --thumb-scale: 0.11;
  --thumb-gap: 14px;
  --thumb-bottom: 28px;
  --zoom-duration: 0.8s;
  --zoom-ease: cubic-bezier(0.22, 1, 0.36, 1);
  background: #0b0b0f;
  color: #fff;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  position: relative;
  font-family: "DM Sans", system-ui, sans-serif;
}
/* 手机：缩略图放大一点 */
@media (max-width: 640px) {
  .zg-root {
    --thumb-scale: 0.16;
    --thumb-gap: 10px;
    --thumb-bottom: 20px;
  }
}

/* ============ 顶部返回栏 ============ */
.zg-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px;
}
.zg-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  padding: 10px 18px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(8px);
  transition: background 0.3s, transform 0.3s;
}
.zg-back:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateX(-3px);
}
.zg-count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
  letter-spacing: 0.1em;
}
.zg-empty {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 18px;
}
.zg-empty-tip {
  font-size: 13px;
  opacity: 0.6;
}

/* ============ 背景打底：照片放大模糊晕染 ============ */
.zg-bg {
  position: absolute;
  inset: 0;
  z-index: 0;                          /* 最底层：在激活大图(z1)之下 */
  overflow: hidden;
  animation: zg-bg-in 0.8s ease;
}
@keyframes zg-bg-in {
  from { opacity: 0; }
}
.zg-bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.12);              /* 放大一点，避免模糊边缘露白 */
  filter: blur(48px) brightness(0.72) saturate(1.2);
}
/* 覆盖一层暗色，让前景清晰照片更突出（调淡，保留照片晕染色） */
.zg-bg-overlay {
  position: absolute;
  inset: 0;
  background: rgba(11, 11, 15, 0.25);
}

/* ============ 照片层 ============ */
.zg-gallery {
  height: 100%;
}
.zg-item {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
/* 激活的照片在最下层；非激活缩略图在上层（可点击） */
.zg-item[data-active="true"] {
  z-index: 1;
}
.zg-item[data-active="false"] {
  z-index: 10;
}
.zg-slide {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: auto;
  transform: translate(0, 0) scale(1);
  /* 关键动画：全屏 ↔ 缩略图 之间的平滑过渡 */
  transition:
    transform var(--zoom-duration) var(--zoom-ease),
    border-radius var(--zoom-duration) var(--zoom-ease),
    filter 0.25s ease;
  will-change: transform;
}
/* 非激活：缩小成底部缩略图（用 --offset 横向排开） */
.zg-item[data-active="false"] .zg-slide {
  border-radius: 48px;
  filter: brightness(0.7);
  transform: translate(
      calc(var(--offset) * (var(--thumb-scale) * 100vw + var(--thumb-gap))),
      calc((50vh - var(--thumb-scale) * 50vh) - var(--thumb-bottom))
    )
    scale(var(--thumb-scale));
}
/* 缩略图悬停：变亮 */
.zg-item[data-active="false"] .zg-slide:hover {
  filter: brightness(1);
}
.zg-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
/* 激活的大图：照片完整展示（contain），多余区域是黑色背景 */
.zg-item[data-active="true"] .zg-image {
  object-fit: contain;
  /* 边缘羽化：左右 + 底部自然渐隐融入模糊背景，没有硬切边 */
  -webkit-mask-image:
    linear-gradient(to right, transparent 0, black 7%, black 93%, transparent 100%),
    linear-gradient(to bottom, black 78%, transparent 100%);
  mask-image:
    linear-gradient(to right, transparent 0, black 7%, black 93%, transparent 100%),
    linear-gradient(to bottom, black 78%, transparent 100%);
  -webkit-mask-composite: source-in;
  mask-composite: intersect;
}
/* 占位：渐变 + 表情 */
.zg-ph {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.zg-emoji {
  font-size: clamp(60px, 10vw, 120px);
}
/* 缩略图点击按钮（盖在整张图上） */
.zg-thumbBtn {
  appearance: none;
  background: none;
  border: 0;
  cursor: pointer;
  position: absolute;
  inset: 0;
  padding: 0;
}

/* ============ 左侧信息栏 ============ */
.zg-rail {
  position: absolute;
  inset: 0 auto 0 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2rem;
  max-width: min(520px, 70%);
  padding: 0 3.5rem 0 3rem;
  pointer-events: none;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.6), transparent);
}
@media (max-width: 640px) {
  .zg-rail {
    max-width: 90%;
    padding: 0 1.5rem;
  }
}
/* 内容切换时重新播放渐入动画 */
.zg-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  animation: zg-content-in 0.6s var(--zoom-ease) calc(var(--zoom-duration) * 0.4) backwards;
}
@keyframes zg-content-in {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
}
.zg-kicker {
  font-size: 0.8rem;
  margin: 0;
  opacity: 0.7;
  letter-spacing: 0.12em;
}
.zg-title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1.05;
  margin: 0;
}
.zg-desc {
  color: rgba(255, 255, 255, 0.85);
  font-size: clamp(0.9rem, 1.4vw, 1.05rem);
  line-height: 1.6;
  margin: 0;
}

/* ============ 底部控制按钮 ============ */
.zg-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  pointer-events: auto;
}
.zg-navBtn {
  appearance: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  color: #fff;
  font-size: 22px;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, opacity 0.2s;
}
.zg-navBtn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.4);
}
.zg-navBtn:disabled {
  cursor: default;
  opacity: 0.35;
}
/* 下载原图按钮 */
.zg-dlBtn {
  appearance: none;
  padding: 12px 22px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #d9351f 0%, #e85a2b 55%, #f58b4e 100%);
  color: #fff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 12px 22px -8px rgba(217, 53, 31, 0.5);
  transition: transform 0.3s;
}
.zg-dlBtn:hover {
  transform: translateY(-2px);
}

/* ============ 底部渐变模糊层 ============ */
.zg-fade {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 32vh;
  z-index: 4;                          /* 在大图(z1)之上、信息栏/缩略图之下 */
  pointer-events: none;                /* 不挡任何点击 */
  /* 纯颜色渐变压暗底部（不模糊前景照片，前景保持完全清晰） */
  background: linear-gradient(
    to top,
    rgba(11, 11, 15, 0.75) 0%,
    rgba(11, 11, 15, 0.3) 45%,
    transparent 100%
  );
}

/* ============ 底部情话文案 ============ */
.zg-quote {
  position: absolute;
  left: 50%;
  /* 放在缩略图轨道上方，避免重叠 */
  bottom: calc(var(--thumb-bottom) + var(--thumb-scale) * 50vh + 34px);
  transform: translateX(-50%);
  z-index: 15;
  text-align: center;
  pointer-events: none;
  /* 切换照片时重新播放渐入动画 */
  animation: zg-quote-in 0.6s var(--zoom-ease) calc(var(--zoom-duration) * 0.4) backwards;
}
@keyframes zg-quote-in {
  from {
    opacity: 0;
    transform: translate(-50%, 14px);
  }
}
.zg-quote-cn {
  font-size: clamp(14px, 1.6vw, 19px);
  font-weight: 600;
  letter-spacing: 0.18em;
  color: rgba(255, 255, 255, 0.92);
  margin: 0;
}
.zg-quote-en {
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  margin: 7px 0 0;
}
</style>
