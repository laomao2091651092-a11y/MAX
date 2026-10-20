<template>
  <div class="page gallery-page">
    <!-- ============ 页面标题 ============ -->
    <div class="gallery-head">
      <div class="eyebrow">Gallery</div>
      <h2>我们的<span class="grad">照片墙</span></h2>
      <p>每一张都是甜甜的回忆，点击照片可以放大看 💕</p>
    </div>

    <!-- ============ 横竖屏切换按钮 ============ -->
    <div class="gallery-tabs" role="tablist">
      <button
        type="button"
        role="tab"
        :class="{ active: activeTab === 'portrait' }"
        @click="activeTab = 'portrait'"
      >
        📱 竖屏回忆
      </button>
      <button
        type="button"
        role="tab"
        :class="{ active: activeTab === 'landscape' }"
        @click="activeTab = 'landscape'"
      >
        🖼️ 横屏大片
      </button>
    </div>

    <!-- ============ 竖屏回忆区（9:16 卡片，默认显示） ============ -->
    <section v-if="activeTab === 'portrait'" class="gallery-sec">
      <div class="sec-head">
        <div class="sec-eyebrow"><span></span>PORTRAIT</div>
        <h3 class="sec-title">📱 竖屏回忆</h3>
        <p class="sec-sub">点击照片 → 液体气泡详情 / 大图预览</p>
      </div>
      <!-- v-for 循环渲染竖屏照片（数据在 src/data/gallery.js） -->
      <div class="photo-grid photo-grid--portrait">
        <div
          v-for="photo in portraitPhotos"
          :key="photo.id"
          class="photo-card"
          @click="openPhoto(photo)"
        >
          <!-- 有照片就显示图片，没有就用渐变 + emoji 占位 -->
          <img v-if="photo.img" :src="requireImg(photo.img)" :alt="photo.title" class="photo-img" />
          <div v-else class="photo-ph" :style="{ background: `linear-gradient(180deg, ${photo.color[0]}, ${photo.color[1]})` }">
            <span class="photo-emoji">{{ photo.emoji }}</span>
          </div>
          <!-- 悬停显示照片标题 -->
          <div class="photo-title">{{ photo.title }}</div>
        </div>
      </div>
    </section>

    <!-- ============ 横屏大片区（16:9 卡片，点击进放大画廊） ============ -->
    <section v-if="activeTab === 'landscape'" class="gallery-sec">
      <div class="sec-head">
        <div class="sec-eyebrow"><span></span>LANDSCAPE</div>
        <h3 class="sec-title">🖼️ 横屏大片</h3>
        <p class="sec-sub">点击照片 → 全屏放大画廊效果</p>
      </div>
      <div class="photo-grid photo-grid--landscape">
        <div
          v-for="photo in landscapePhotos"
          :key="photo.id"
          class="photo-card"
          @click="openPhoto(photo)"
        >
          <img v-if="photo.img" :src="requireImg(photo.img)" :alt="photo.title" class="photo-img" />
          <div v-else class="photo-ph" :style="{ background: `linear-gradient(180deg, ${photo.color[0]}, ${photo.color[1]})` }">
            <span class="photo-emoji">{{ photo.emoji }}</span>
          </div>
          <div class="photo-title">{{ photo.title }}</div>
        </div>
      </div>
    </section>

    <!-- ============ Lightbox 大图预览 ============ -->
    <!-- v-if="lightboxIndex !== null"：只有点击照片时才显示 -->
    <div v-if="lightboxIndex !== null" class="lightbox" @click.self="closeLightbox">
      <button class="lb-close" @click="closeLightbox">✕</button>
      <!-- 上一张 -->
      <button class="lb-prev" @click.stop="prevPhoto">‹</button>
      <!-- 大图内容：有图显示图片，无图显示渐变占位 -->
      <div class="lb-content">
        <img v-if="currentPhoto.img" :src="requireImg(currentPhoto.img)" :alt="currentPhoto.title" class="lb-img" />
        <div
          v-else
          class="lb-ph"
          :style="{ background: `linear-gradient(180deg, ${currentPhoto.color[0]}, ${currentPhoto.color[1]})` }"
        >
          <span class="lb-emoji">{{ currentPhoto.emoji }}</span>
        </div>
        <div class="lb-caption">{{ currentPhoto.title }}</div>
        <!-- 下载原图按钮（有原图才显示） -->
        <button v-if="currentPhoto.original" class="lb-download" @click.stop="downloadOriginal(currentPhoto)">
          ⬇ 下载原图
        </button>
      </div>
      <!-- 下一张 -->
      <button class="lb-next" @click.stop="nextPhoto">›</button>
    </div>
  </div>
</template>

<script setup>
// 引入 Vue 的响应式 API
import { ref, computed, onMounted, onUnmounted } from 'vue'
// 引入路由（用于跳转到照片详细页）
import { useRouter } from 'vue-router'
// 引入画廊照片数据（改照片去 src/data/gallery.js）
import { photos } from '../data/gallery.js'

// 获取路由实例
const router = useRouter()

// 当前打开的大图下标（null = 没打开）
const lightboxIndex = ref(null)

// 当前显示的区：'portrait' = 竖屏回忆（默认） / 'landscape' = 横屏大片
const activeTab = ref('portrait')

// 根据文件名拼出图片路径（图片放在 src/assets/images/gallery/ 下）
function requireImg(name) {
  return new URL(`../assets/images/gallery/${name}`, import.meta.url).href
}

// 当前显示的大图数据（计算属性）
const currentPhoto = computed(() =>
  lightboxIndex.value === null ? null : photos[lightboxIndex.value]
)

// ----- 分组：竖屏照片 / 横屏照片 -----
// 竖屏组：detail 不是 'zoom' 的（气泡详细页 / 大图预览）
const portraitPhotos = computed(() => photos.filter((p) => p.detail !== 'zoom'))
// 横屏组：detail 是 'zoom' 的（全屏放大画廊）
const landscapePhotos = computed(() => photos.filter((p) => p.detail === 'zoom'))

// ----- 照片点击操作 -----
// 点击某张照片，按 detail 类型分流到不同效果：
//   'zoom'   → 全屏放大画廊（/zoom/:id）
//   'bubble' → 液体气泡详细页（/photo/:id）
//   false    → 普通大图预览（Lightbox）
function openPhoto(photo) {
  // 找到这张照片在全部照片里的下标（Lightbox 上一张/下一张要用）
  const index = photos.findIndex((p) => p.id === photo.id)
  if (photo.detail === 'zoom') {
    // 全屏放大画廊效果
    router.push(`/zoom/${photo.id}`)
  } else if (photo.detail === 'bubble' || photo.detail === true) {
    // 液体气泡详细页
    router.push(`/photo/${photo.id}`)
  } else {
    // 普通大图预览
    lightboxIndex.value = index
  }
}
// 关闭大图
function closeLightbox() {
  lightboxIndex.value = null
}

// 下载原图：点击后浏览器直接保存原图文件
function downloadOriginal(photo) {
  const a = document.createElement('a')   // 创建临时链接
  a.href = requireImg(photo.original)      // 指向原图文件
  a.download = photo.original              // 下载文件名 = 原图文件名
  document.body.appendChild(a)             // 加入页面
  a.click()                                // 触发下载
  document.body.removeChild(a)             // 用完移除
}
// 切换上一张（循环）
function prevPhoto() {
  lightboxIndex.value =
    (lightboxIndex.value - 1 + photos.length) % photos.length
}
// 切换下一张（循环）
function nextPhoto() {
  lightboxIndex.value = (lightboxIndex.value + 1) % photos.length
}

// 键盘操作：左右方向键切换，Esc 关闭
function onKeydown(e) {
  if (lightboxIndex.value === null) return // 大图没打开时忽略按键
  if (e.key === 'ArrowLeft') prevPhoto()
  else if (e.key === 'ArrowRight') nextPhoto()
  else if (e.key === 'Escape') closeLightbox()
}

// 页面加载时绑定键盘监听，卸载时移除（避免内存泄漏）
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
/* ============ 页面标题 ============ */
.gallery-head {
  max-width: 1280px;
  margin: 0 auto 50px;
}
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: #8b847a;
  font-weight: 500;
  margin-bottom: 16px;
}
.eyebrow::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #d9351f;
  box-shadow: 0 0 0 3px rgba(217, 53, 31, 0.2);
}
.gallery-head h2 {
  font-weight: 700;
  font-size: clamp(34px, 4.4vw, 60px);
  line-height: 1;
  letter-spacing: -0.03em;
}
.gallery-head .grad {
  font-style: italic;
  font-weight: 800;
  background: linear-gradient(135deg, #d9351f, #f58b4e);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.gallery-head p {
  margin-top: 16px;
  font-size: 15px;
  color: #2b2b30;
}

/* ============ 横竖屏切换按钮组 ============ */
.gallery-tabs {
  display: flex;
  gap: 4px;
  width: fit-content;
  margin: 0 auto 40px;
  padding: 5px;
  background: #ede6d6;
  border: 1px solid rgba(106, 72, 49, 0.12);
  border-radius: 999px;
  box-shadow: inset 0 2px 4px rgba(180, 50, 20, 0.06);
}
.gallery-tabs button {
  padding: 11px 26px;
  border-radius: 999px;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  color: #2b2b30;
  cursor: pointer;
  transition: background 0.3s, color 0.3s, box-shadow 0.3s, transform 0.3s;
}
.gallery-tabs button:hover {
  color: #141416;
}
/* 选中的按钮：黑色胶囊 + 白字（DERMEXCEL 风格） */
.gallery-tabs button.active {
  background: #141416;
  color: #fafaf7;
  box-shadow: 0 10px 18px -8px rgba(0, 0, 0, 0.45);
  transform: translateY(-1px);
}

/* ============ 分区（竖屏区 / 横屏区） ============ */
.gallery-sec {
  max-width: 1280px;
  margin: 0 auto 70px;
}
.gallery-sec + .gallery-sec {
  margin-top: 40px;
  padding-top: 50px;
  border-top: 1px solid rgba(106, 72, 49, 0.15);
}
.sec-head {
  margin-bottom: 30px;
  display: flex;
  align-items: baseline;
  gap: 18px;
  flex-wrap: wrap;
}
.sec-eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: #8b847a;
  font-weight: 500;
}
.sec-eyebrow span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #d9351f;
  box-shadow: 0 0 0 3px rgba(217, 53, 31, 0.2);
}
.sec-title {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0;
}
.sec-sub {
  font-size: 13px;
  color: #8b847a;
  margin: 0;
}

/* ============ 照片墙网格 ============ */
.photo-grid {
  display: grid;
  gap: 24px;
}
/* 竖屏区：4 列 9:16 卡片 */
.photo-grid--portrait {
  grid-template-columns: repeat(4, 1fr);
}
.photo-grid--portrait .photo-card {
  aspect-ratio: 9 / 16;
}
/* 横屏区：3 列 16:9 卡片 */
.photo-grid--landscape {
  grid-template-columns: repeat(3, 1fr);
}
.photo-grid--landscape .photo-card {
  aspect-ratio: 16 / 9;
}
.photo-card {
  border-radius: 22px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  box-shadow: 0 24px 40px -16px rgba(180, 50, 20, 0.3),
    inset 0 2px 0 rgba(255, 220, 180, 0.4);
  transition: transform 0.5s cubic-bezier(0.6, 0, 0.2, 1),
    box-shadow 0.5s;
}
.photo-card:hover {
  transform: translateY(-8px) rotate(-1deg);
  box-shadow: 0 40px 60px -18px rgba(180, 50, 20, 0.45);
}
/* 真实照片 */
.photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s;
}
.photo-card:hover .photo-img {
  transform: scale(1.06);
}
/* 占位：渐变 + 大表情 */
.photo-ph {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.photo-emoji {
  font-size: 64px;
  filter: drop-shadow(0 8px 16px rgba(120, 20, 0, 0.25));
}
/* 悬停显示标题 */
.photo-title {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 14px;
  background: rgba(20, 10, 6, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #fafaf7;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  transform: translateY(8px);
  opacity: 0;
  transition: opacity 0.4s, transform 0.4s;
}
.photo-card:hover .photo-title {
  transform: translateY(0);
  opacity: 1;
}

/* ============ Lightbox 大图预览 ============ */
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(20, 10, 6, 0.88);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.lb-content {
  text-align: center;
  max-width: 80vw;
  max-height: 85vh;
}
.lb-img {
  max-width: 80vw;
  max-height: 75vh;
  border-radius: 18px;
  object-fit: contain;
  box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.6);
}
/* 占位大图 */
.lb-ph {
  width: 60vmin;
  height: 75vmin;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.6);
}
.lb-emoji {
  font-size: 120px;
  filter: drop-shadow(0 12px 24px rgba(120, 20, 0, 0.3));
}
.lb-caption {
  margin-top: 18px;
  color: #fafaf7;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
/* 下载原图按钮 */
.lb-download {
  margin-top: 14px;
  padding: 11px 22px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s, transform 0.3s;
}
.lb-download:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}
/* 关闭按钮 */
.lb-close {
  position: absolute;
  top: 24px;
  right: 28px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.3s;
}
.lb-close:hover {
  background: rgba(255, 255, 255, 0.25);
}
/* 左右切换按钮 */
.lb-prev,
.lb-next {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 26px;
  cursor: pointer;
  transition: background 0.3s;
}
.lb-prev:hover,
.lb-next:hover {
  background: rgba(255, 255, 255, 0.25);
}
.lb-prev {
  left: 28px;
}
.lb-next {
  right: 28px;
}

/* ============ 响应式 ============ */
@media (max-width: 1100px) {
  /* 竖屏区 4 列 → 3 列；横屏区保持 3 列 */
  .photo-grid--portrait {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 750px) {
  /* 竖屏区 3 列 → 2 列；横屏区 3 列 → 2 列 */
  .photo-grid--portrait,
  .photo-grid--landscape {
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }
  .photo-emoji {
    font-size: 44px;
  }
  .lb-prev {
    left: 12px;
  }
  .lb-next {
    right: 12px;
  }
}
</style>
