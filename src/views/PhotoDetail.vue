<template>
  <div class="pd-page">
    <!-- 顶部返回栏 -->
    <header class="pd-header">
      <router-link to="/gallery" class="pd-back">← 返回画廊</router-link>
      <span class="pd-index">{{ index + 1 }} / {{ photos.length }}</span>
    </header>

    <!-- 没找到照片时的提示 -->
    <div v-if="!photo" class="pd-missing">
      <p>😢 没找到这张照片，回画廊看看吧</p>
      <router-link to="/gallery" class="pd-back-btn">返回画廊</router-link>
    </div>

    <!-- 找到照片：液体气泡详细页 -->
    <main v-else class="pd-body">
      <!-- ============ 左侧：照片信息 ============ -->
      <section class="pd-content">
        <div class="pd-eyebrow"><span></span>OUR MEMORY</div>
        <h1>{{ photo.title }}</h1>
        <p class="pd-desc">{{ photo.desc || '每一张照片，都是我们一起走过的证据。' }}</p>

        <!-- 附加信息 -->
        <div class="pd-meta">
          <div class="pd-meta-item">
            <small>DATE</small>
            <strong>{{ photo.date || '2026.10.20' }}</strong>
          </div>
          <div class="pd-meta-item">
            <small>MEMORY</small>
            <strong>❤ 甜甜的回忆</strong>
          </div>
        </div>

        <!-- 上一张 / 下一张 -->
        <div class="pd-nav">
          <button class="pd-btn" @click="prevPhoto" :disabled="index === 0">← 上一张</button>
          <button class="pd-btn" @click="nextPhoto" :disabled="index === photos.length - 1">下一张 →</button>
          <!-- 下载原图（有原图才显示） -->
          <button v-if="photo.original" class="pd-btn pd-btn-dl" @click="downloadOriginal(photo)">⬇ 下载原图</button>
        </div>
      </section>

      <!-- ============ 右侧：液体气泡 ============ -->
      <section class="pd-visual">
        <!-- 背景光晕层 -->
        <div class="pd-lighting" aria-hidden="true">
          <span class="pd-glow pd-glow--ambient"></span>
          <span class="pd-glow pd-glow--core"></span>
          <span class="pd-glow pd-glow--sun"></span>
        </div>

        <!-- 液体气泡 SVG -->
        <svg class="pd-svg" viewBox="0 0 1100 850" preserveAspectRatio="xMidYMid meet">
          <defs>
            <!-- 占位渐变：每张照片一组渐变色（没有真实照片时气泡内显示渐变+表情） -->
            <linearGradient v-for="p in photos" :key="'g' + p.id" :id="'pdPh' + p.id" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" :stop-color="p.color[0]" />
              <stop offset="100%" :stop-color="p.color[1]" />
            </linearGradient>

            <!-- 主气泡路径（带流动变形动画） -->
            <path id="pdMainPath" d="
              M 305 154
              C 430 88 638 77 781 126
              C 906 169 978 281 961 405
              C 945 524 858 620 735 651
              C 631 678 558 647 494 620
              C 434 595 380 592 322 552
              C 247 501 204 426 218 345
              C 231 267 258 196 305 154
              Z">
              <animate attributeName="d" dur="14s" repeatCount="indefinite" calcMode="spline"
                keyTimes="0; .34; .68; 1" keySplines=".42 0 .58 1; .42 0 .58 1; .42 0 .58 1"
                values="
                  M 305 154 C 430 88 638 77 781 126 C 906 169 978 281 961 405 C 945 524 858 620 735 651 C 631 678 558 647 494 620 C 434 595 380 592 322 552 C 247 501 204 426 218 345 C 231 267 258 196 305 154 Z;
                  M 286 171 C 411 91 626 68 792 135 C 922 187 966 296 949 420 C 929 552 829 622 722 649 C 614 677 541 627 478 617 C 405 605 345 612 297 553 C 242 486 192 415 218 324 C 241 244 244 207 286 171 Z;
                  M 321 142 C 468 78 651 91 801 145 C 916 186 988 301 955 430 C 923 551 844 634 712 656 C 600 674 540 650 468 611 C 403 575 345 592 293 533 C 230 462 216 380 234 309 C 251 240 279 170 321 142 Z;
                  M 305 154 C 430 88 638 77 781 126 C 906 169 978 281 961 405 C 945 524 858 620 735 651 C 631 678 558 647 494 620 C 434 595 380 592 322 552 C 247 501 204 426 218 345 C 231 267 258 196 305 154 Z" />
            </path>
            <!-- 次级装饰气泡路径 -->
            <path id="pdSmallPath" d="
              M 224 530
              C 291 486 386 489 449 543
              C 508 594 500 683 441 731
              C 383 779 279 771 223 714
              C 168 657 168 568 224 530
              Z">
              <animate attributeName="d" dur="11s" begin="-3s" repeatCount="indefinite" calcMode="spline"
                keyTimes="0; .5; 1" keySplines=".42 0 .58 1; .42 0 .58 1"
                values="
                  M 224 530 C 291 486 386 489 449 543 C 508 594 500 683 441 731 C 383 779 279 771 223 714 C 168 657 168 568 224 530 Z;
                  M 207 545 C 272 483 390 493 458 557 C 507 605 483 695 425 737 C 361 783 262 757 211 699 C 165 646 160 588 207 545 Z;
                  M 224 530 C 291 486 386 489 449 543 C 508 594 500 683 441 731 C 383 779 279 771 223 714 C 168 657 168 568 224 530 Z" />
            </path>

            <!-- 裁剪区域 -->
            <clipPath id="pdMainClip"><use href="#pdMainPath" /></clipPath>
            <clipPath id="pdSmallClip"><use href="#pdSmallPath" /></clipPath>

            <!-- 液体流动滤镜（让气泡边缘像液体一样蠕动） -->
            <filter id="pdLiquid" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency=".008 .010" numOctaves="2" seed="92" result="noise">
                <animate attributeName="baseFrequency" dur="10s" repeatCount="indefinite"
                  values=".008 .010; .010 .008; .007 .012; .008 .010" />
              </feTurbulence>
              <feGaussianBlur in="noise" stdDeviation="1.35" result="blurredNoise" />
              <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="86" xChannelSelector="R" yChannelSelector="G">
                <animate attributeName="scale" dur="8s" repeatCount="indefinite" values="78; 94; 84; 90; 78" />
              </feDisplacementMap>
            </filter>

            <!-- 玻璃边缘渐变 -->
            <linearGradient id="pdGlass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="1" />
              <stop offset="28%" stop-color="#dff6ff" stop-opacity=".55" />
              <stop offset="60%" stop-color="#ffdff2" stop-opacity=".34" />
              <stop offset="90%" stop-color="#fff7ef" stop-opacity=".70" />
              <stop offset="100%" stop-color="#ffffff" stop-opacity=".96" />
            </linearGradient>
          </defs>

          <!-- 主气泡（照片嵌入 + 液体滤镜） -->
          <g id="pdMain">
            <g clip-path="url(#pdMainClip)">
              <!-- 有真实照片：显示照片 -->
              <image v-if="photo.img" :href="requireImg(photo.img)" x="125" y="40" width="930" height="720" preserveAspectRatio="xMidYMid slice" />
              <!-- 没有照片：用渐变 + 大表情占位 -->
              <rect v-else x="125" y="40" width="930" height="720" :fill="`url(#pdPh${photo.id})`" />
              <text v-if="!photo.img" x="590" y="430" font-size="180" text-anchor="middle" dominant-baseline="middle">{{ photo.emoji }}</text>
            </g>
            <!-- 液体蠕动层（中心区域轻微扭曲，更接近液体） -->
            <g clip-path="url(#pdMainClip)" filter="url(#pdLiquid)" opacity=".9">
              <image v-if="photo.img" :href="requireImg(photo.img)" x="125" y="40" width="930" height="720" preserveAspectRatio="xMidYMid slice" />
              <rect v-else x="125" y="40" width="930" height="720" :fill="`url(#pdPh${photo.id})`" />
              <text v-if="!photo.img" x="590" y="430" font-size="180" text-anchor="middle" dominant-baseline="middle">{{ photo.emoji }}</text>
            </g>
            <!-- 玻璃边缘 -->
            <use href="#pdMainPath" class="pd-edge pd-edge--main" />
          </g>

          <!-- 次级装饰气泡 -->
          <g id="pdSmall">
            <g clip-path="url(#pdSmallClip)">
              <rect x="60" y="230" width="720" height="650" fill="#efad69" opacity=".35" />
              <rect x="0" y="0" width="1100" height="850" fill="#fff3e6" opacity=".5" />
            </g>
            <use href="#pdSmallPath" class="pd-edge" />
          </g>
        </svg>

        <!-- 环绕文字（SVG 里的文字跑在气泡边上） -->
        <svg class="pd-marquee" viewBox="0 0 1100 850" preserveAspectRatio="xMidYMid meet">
          <defs>
            <path id="pdMarqPath" d="
              M 305 154
              C 430 88 638 77 781 126
              C 906 169 978 281 961 405
              C 945 524 858 620 735 651
              C 631 678 558 647 494 620
              C 434 595 380 592 322 552
              C 247 501 204 426 218 345
              C 231 267 258 196 305 154
              Z" />
          </defs>
          <text class="pd-marquee-text" dy="-14">
            <textPath href="#pdMarqPath" startOffset="0%">
              {{ marqueeText }}
              <animate attributeName="startOffset" from="0%" to="100%" dur="22s" repeatCount="indefinite" />
            </textPath>
          </text>
        </svg>
      </section>
    </main>
  </div>
</template>

<script setup>
// 引入 Vue 的响应式 API
import { ref, computed, onMounted, onUnmounted } from 'vue'
// 引入路由：useRoute 读取地址栏参数，useRouter 做跳转
import { useRoute, useRouter } from 'vue-router'
// 引入照片数据（改照片去 src/data/gallery.js）
import { photos } from '../data/gallery.js'

// 获取当前路由（/photo/:id）
const route = useRoute()
const router = useRouter()

// 当前照片 id（字符串 → 数字）
const photoId = computed(() => Number(route.params.id))

// 当前照片（找不到就是 undefined）
const photo = computed(() => photos.find((p) => p.id === photoId.value))

// 当前照片在列表里的下标（用于上一张/下一张）
const index = computed(() => {
  const i = photos.findIndex((p) => p.id === photoId.value)
  return i === -1 ? 0 : i
})

// 照片图片路径（图片放在 src/assets/images/gallery/ 下）
function requireImg(name) {
  return new URL(`../assets/images/gallery/${name}`, import.meta.url).href
}

// 环绕文字：照片标题 + 甜蜜短语循环
const marqueeText = computed(() => {
  const t = photo.value ? photo.value.title : 'OUR MEMORY'
  return `${t} ✦ 我爱你 ✦ 我们的回忆 ✦ LOVE ✦ ${t} ✦ 甜甜甜 ✦ `
})

// ----- 上一张 / 下一张 -----
function prevPhoto() {
  const prev = photos[index.value - 1]
  if (prev) router.push(`/photo/${prev.id}`)
}
function nextPhoto() {
  const next = photos[index.value + 1]
  if (next) router.push(`/photo/${next.id}`)
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

// ============================================================
// 鼠标视差：气泡跟随鼠标缓慢移动（三个层级不同速度）
// ============================================================
const PARALLAX_INTENSITY = 0.5   // 视差强度（越大动得越明显）
const PARALLAX_SMOOTHNESS = 0.025 // 平滑度（越小越慢越柔）

let targetX = 0
let targetY = 0
let currentX = 0
let currentY = 0
let rafId = null

// 监听鼠标移动：计算归一化位置
function onPointerMove(e) {
  targetX = (e.clientX / window.innerWidth - 0.5) * 180 * PARALLAX_INTENSITY
  targetY = (e.clientY / window.innerHeight - 0.5) * 130 * PARALLAX_INTENSITY
}
// 鼠标离开页面：归零
function onMouseLeave() {
  targetX = 0
  targetY = 0
}

// 动画循环：平滑插值 + 位移气泡
function render() {
  currentX += (targetX - currentX) * PARALLAX_SMOOTHNESS
  currentY += (targetY - currentY) * PARALLAX_SMOOTHNESS
  const main = document.getElementById('pdMain')
  const small = document.getElementById('pdSmall')
  if (main) main.style.transform = `translate(${currentX}px, ${currentY}px)`
  if (small) small.style.transform = `translate(${currentX * 1.55}px, ${currentY * 1.55}px)`
  rafId = requestAnimationFrame(render)
}

onMounted(() => {
  window.addEventListener('pointermove', onPointerMove)
  document.documentElement.addEventListener('mouseleave', onMouseLeave)
  render()
})

// 卸载时清理监听器和动画（避免内存泄漏）
onUnmounted(() => {
  window.removeEventListener('pointermove', onPointerMove)
  document.documentElement.removeEventListener('mouseleave', onMouseLeave)
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<style scoped>
/* ============ 页面容器：暖色渐变背景 ============ */
.pd-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  isolation: isolate;
  background:
    radial-gradient(ellipse 28% 32% at 68% 35%, rgba(255, 251, 221, 0.92) 0%, rgba(255, 239, 190, 0.58) 23%, rgba(255, 219, 165, 0.25) 48%, rgba(255, 199, 139, 0) 74%),
    radial-gradient(ellipse 51% 62% at 73% 48%, rgba(255, 224, 175, 0.46) 0%, rgba(255, 210, 158, 0.28) 31%, rgba(248, 186, 128, 0.12) 59%, transparent 79%),
    linear-gradient(116deg, #f8f4ee 0%, #f7efe6 37%, #f7eadc 59%, #f6dfca 78%, #f0cfae 100%);
  font-family: "DM Sans", system-ui, -apple-system, sans-serif;
  color: #211914;
}
/* 页面大光晕 */
.pd-page::before {
  content: "";
  position: absolute;
  z-index: -2;
  width: 52vw;
  height: 52vw;
  min-width: 700px;
  min-height: 700px;
  top: 10%;
  right: -8%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 213, 159, 0.28), rgba(245, 180, 124, 0.12) 43%, transparent 73%);
  filter: blur(75px);
  pointer-events: none;
}

/* ============ 顶部返回栏 ============ */
.pd-header {
  position: relative;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px clamp(28px, 3vw, 64px);
}
.pd-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: inherit;
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 10px 18px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.45);
  border: 1px solid rgba(106, 72, 49, 0.15);
  transition: background 0.3s, transform 0.3s;
}
.pd-back:hover {
  background: rgba(255, 255, 255, 0.7);
  transform: translateX(-3px);
}
.pd-index {
  font-size: 12px;
  color: rgba(84, 58, 42, 0.6);
  font-weight: 600;
  letter-spacing: 0.1em;
}
/* 找不到照片 */
.pd-missing {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  font-size: 18px;
  color: rgba(84, 58, 42, 0.8);
}
.pd-back-btn {
  padding: 12px 26px;
  border-radius: 999px;
  background: #211813;
  color: #fffaf4;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
}

/* ============ 主体：左右布局 ============ */
.pd-body {
  position: relative;
  display: flex;
  align-items: center;
  min-height: calc(100vh - 80px);
  padding: 10px clamp(28px, 3vw, 64px) 30px;
}

/* 左侧：照片信息 */
.pd-content {
  position: relative;
  z-index: 50;
  width: min(46vw, 560px);
}
.pd-eyebrow {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.055em;
  color: rgba(84, 58, 42, 0.7);
}
.pd-eyebrow span {
  width: 24px;
  height: 1px;
  background: rgba(45, 31, 23, 0.82);
}
.pd-content h1 {
  margin: 0;
  font-size: clamp(48px, 5vw, 88px);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.05em;
}
.pd-desc {
  max-width: 400px;
  margin: 28px 0 0;
  font-size: clamp(14px, 1.1vw, 17px);
  line-height: 1.6;
  color: rgba(35, 26, 20, 0.88);
}
.pd-meta {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  width: min(480px, 100%);
  margin-top: 40px;
  border-top: 1px solid rgba(106, 72, 49, 0.13);
}
.pd-meta-item {
  position: relative;
  min-height: 70px;
  padding: 16px 20px 0 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pd-meta-item:not(:last-child)::after {
  content: "";
  position: absolute;
  top: 0;
  right: 15px;
  width: 1px;
  height: 100%;
  background: rgba(106, 72, 49, 0.12);
}
.pd-meta small {
  font-size: 10px;
  color: rgba(84, 58, 42, 0.5);
  letter-spacing: 0.08em;
}
.pd-meta strong {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
}
/* 上/下一张按钮 */
.pd-nav {
  display: flex;
  gap: 14px;
  margin-top: 30px;
}
.pd-btn {
  padding: 13px 22px;
  border-radius: 999px;
  border: 1px solid rgba(106, 72, 49, 0.25);
  background: rgba(255, 255, 255, 0.4);
  color: #211914;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: background 0.3s, transform 0.3s;
}
.pd-btn:hover {
  background: rgba(255, 255, 255, 0.7);
  transform: translateY(-2px);
}
.pd-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}
/* 下载原图按钮：橙色渐变强调 */
.pd-btn-dl {
  border: none;
  background: linear-gradient(135deg, #d9351f 0%, #e85a2b 55%, #f58b4e 100%);
  color: #fff;
  box-shadow: 0 12px 22px -8px rgba(217, 53, 31, 0.5);
}
.pd-btn-dl:hover {
  background: linear-gradient(135deg, #c22c17 0%, #d9351f 55%, #e85a2b 100%);
}

/* ============ 右侧：液体气泡 ============ */
.pd-visual {
  position: absolute;
  z-index: 10;
  top: 51%;
  right: -1vw;
  width: min(63vw, 1160px);
  aspect-ratio: 1.29;
  transform: translateY(-48%);
  pointer-events: none;
  isolation: isolate;
}
/* 光晕层 */
.pd-lighting {
  position: absolute;
  z-index: -10;
  inset: -14% -16% -17% -15%;
  pointer-events: none;
}
.pd-glow {
  position: absolute;
  display: block;
  border-radius: 50%;
  pointer-events: none;
}
.pd-glow--ambient {
  left: 17%; top: -1%;
  width: 78%; height: 82%;
  background: radial-gradient(ellipse at 58% 44%, rgba(255, 255, 247, 0.52) 0%, rgba(255, 249, 235, 0.34) 24%, rgba(255, 241, 221, 0.18) 44%, rgba(255, 232, 214, 0.08) 60%, transparent 80%);
  filter: blur(70px);
}
.pd-glow--core {
  left: 33%; top: 4%;
  width: 54%; height: 58%;
  background: radial-gradient(ellipse at 51% 42%, rgba(255, 255, 250, 0.98) 0%, rgba(255, 255, 244, 0.88) 15%, rgba(255, 248, 232, 0.6) 34%, rgba(255, 239, 222, 0.3) 54%, rgba(255, 231, 220, 0.1) 70%, transparent 84%);
  filter: blur(42px);
}
.pd-glow--sun {
  left: 45%; top: 5%;
  width: 31%; height: 34%;
  background: radial-gradient(ellipse at center, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 249, 0.92) 18%, rgba(255, 250, 237, 0.56) 44%, rgba(255, 241, 228, 0.18) 66%, transparent 84%);
  filter: blur(28px);
}

/* SVG 气泡 */
.pd-svg {
  position: relative;
  z-index: 10;
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}
/* 玻璃边缘 */
.pd-edge {
  fill: rgba(255, 255, 255, 0.02);
  stroke: url(#pdGlass);
  stroke-width: 4;
  vector-effect: non-scaling-stroke;
  filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.98))
    drop-shadow(0 0 7px rgba(236, 245, 255, 0.42))
    drop-shadow(0 0 10px rgba(255, 224, 241, 0.28))
    drop-shadow(0 14px 24px rgba(86, 70, 63, 0.08));
}
.pd-edge--main {
  stroke-width: 4.7;
  filter: drop-shadow(0 0 2px rgba(255, 255, 255, 1))
    drop-shadow(0 0 8px rgba(236, 245, 255, 0.48))
    drop-shadow(0 0 13px rgba(255, 226, 242, 0.3))
    drop-shadow(0 16px 30px rgba(86, 70, 63, 0.09));
}
/* 环绕文字 */
.pd-marquee {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}
.pd-marquee-text {
  fill: #2b1c14;
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 18px;
  font-weight: 500;
  letter-spacing: 6px;
  text-transform: uppercase;
  paint-order: stroke fill;
  stroke: rgba(255, 247, 235, 0.25);
  stroke-width: 0.4px;
}

/* ============ 响应式 ============ */
@media (max-width: 900px) {
  .pd-body {
    align-items: center;
    flex-direction: column;
    padding-top: 10px;
    min-height: 80vh;
    gap: 10px;
  }
  .pd-visual {
    position: relative;
    width: 100%;
    right: auto;
    top: auto;
    height: 55vh;
    order: 1;
    opacity: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: none;
  }
  .pd-content {
    width: 100%;
    padding-top: 10px;
    order: 2;
    text-align: center;
    max-width: 500px;
  }
  .pd-content h1 {
    font-size: clamp(32px, 8vw, 48px);
    margin-bottom: 16px;
  }
  .pd-desc {
    font-size: 14px;
    margin: 0 auto 20px;
  }
  .pd-nav {
    justify-content: center;
    flex-wrap: wrap;
    gap: 10px;
  }
  .pd-btn {
    padding: 10px 18px;
    font-size: 12px;
  }
}
@media (max-width: 650px) {
  .pd-header {
    padding: 16px 16px;
  }
  .pd-back {
    padding: 8px 14px;
    font-size: 12px;
  }
  .pd-visual {
    height: 40vh;
    width: 95%;
  }
  .pd-meta {
    display: none;
  }
  .pd-content h1 {
    font-size: 28px;
  }
}
</style>
