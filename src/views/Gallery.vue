<template>
  <div class="page gallery-page">
    <!-- ============ 页面标题（封面风格：大标题 + 背景装饰大字） ============ -->
    <div class="gallery-hero" ref="heroRef">
      <div class="hero-bg-text" ref="bgTextRef">
        <span class="letter">两</span><span class="letter">星</span><span class="letter">一</span><span class="letter">妍</span>
      </div>
      <div class="gallery-head">
        <div class="eyebrow">Gallery</div>
        <h2 class="hero-title">
          <span class="char" style="--d:0s">我</span><span class="char" style="--d:0.06s">们</span><span class="char" style="--d:0.12s">的</span><span class="char grad" style="--d:0.18s">照</span><span class="char grad" style="--d:0.24s">片</span><span class="char grad" style="--d:0.30s">墙</span>
        </h2>
        <p class="hero-sub">每一张都是甜甜的回忆，点击照片可以放大看 💕</p>
      </div>
    </div>

    <!-- ============ 横竖屏切换 + 上传按钮（同一行） ============ -->
    <div class="tabs-row">
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
      <button class="tabs-upload" :disabled="uploading" @click="triggerUpload">
        {{ uploading ? '上传中...' : '📤 上传' }}
      </button>
    </div>

    <!-- ============ 隐藏文件选择器 ============ -->
    <input ref="fileInput" type="file" accept="image/*" hidden @change="onFileChange" />

    <!-- ============ 云端精选照片区（从相册页 ⭐ 标记的） ============ -->
    <section v-if="featuredPhotos.length" class="cloud-sec">
      <div class="sec-head">
        <div class="sec-eyebrow"><span></span>FEATURED</div>
        <h3 class="sec-title">⭐ 云端精选（{{ featuredPhotos.length }} 张）</h3>
        <p class="sec-sub">
          从 <router-link to="/cloud" class="manage-link">☁️ 云端相册</router-link>
          点 ⭐ 加入展示，最多 16 张
        </p>
      </div>
      <div class="photo-grid photo-grid--portrait">
        <div
          v-for="p in featuredPhotos"
          :key="p.id"
          class="photo-card"
          @click="openCloudPhoto(p)"
        >
          <img :src="`${API_BASE}/uploads/${p.filename}`" :alt="p.title" class="photo-img" />
          <div class="photo-title">{{ p.title }}</div>
        </div>
      </div>
    </section>

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

// ===== 云端精选照片（画廊展示位） =====
const API_BASE = 'http://81.71.99.210'
const featuredPhotos = ref([])      // 后端精选的照片
const uploading = ref(false)      // 上传中状态
const fileInput = ref(null)         // 隐藏的文件选择器

// 从后端拉精选照片
async function loadFeaturedPhotos() {
  try {
    const res = await fetch(`${API_BASE}/api/photos`)
    const all = await res.json()
    featuredPhotos.value = all.filter(p => p.isFeatured).slice(0, 16)
  } catch (e) {
    console.warn('后端未启动，云端精选为空', e)
  }
}

// 点"上传照片"按钮 → 打开文件选择
function triggerUpload() {
  fileInput.value.click()
}

// 选完文件后上传
async function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return

  // 弹出密码输入框（上传前验证身份）
  const token = prompt('请输入上传密码：')
  if (!token) { e.target.value = ''; return }  // 取消就不传

  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', file.name.replace(/\.[^.]+$/, '').slice(0, 30))
    fd.append('category', activeTab.value === 'portrait' ? 'portrait' : 'landscape')
    const res = await fetch(`${API_BASE}/api/photos/upload`, {
      method: 'POST',
      headers: { 'X-Upload-Token': token },   // 密码放在请求头
      body: fd,
    })
    const data = await res.json()
    if (data.code === 0) {
      alert('✅ 上传成功！去 ☁️ 相册 点 ⭐ 加入展示')
      loadFeaturedPhotos()
    } else {
      alert('❌ ' + data.message)
    }
  } catch (err) {
    alert('❌ 上传失败，请确认后端已启动（IDEA 在跑）')
  } finally {
    uploading.value = false
    e.target.value = ''
  }
}

// 点击云端照片 → 新窗口看大图
function openCloudPhoto(p) {
  window.open(`${API_BASE}/uploads/${p.filename}`, '_blank')
}

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

// ===== 鼠标视差：背景大字"两星一妍"跟着鼠标轻微移动 =====
const heroRef = ref(null)
const bgTextRef = ref(null)
let rafId = null

function onHeroMouse(e) {
  if (!heroRef.value || !bgTextRef.value) return
  const rect = heroRef.value.getBoundingClientRect()
  // 鼠标在 hero 区域内的相对位置 -0.5 ~ 0.5
  const x = (e.clientX - rect.left) / rect.width - 0.5
  const y = (e.clientY - rect.top) / rect.height - 0.5
  // 目标位移（轻微，不晃眼）
  const tx = x * 30   // 左右偏移 ±15px
  const ty = y * 20   // 上下偏移 ±10px
  if (rafId) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(() => {
    bgTextRef.value.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`
  })
}

// 页面加载时绑定键盘监听，卸载时移除（避免内存泄漏）
onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  loadFeaturedPhotos()   // 拉取后端精选照片
  if (heroRef.value) heroRef.value.addEventListener('mousemove', onHeroMouse)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  if (heroRef.value) heroRef.value.removeEventListener('mousemove', onHeroMouse)
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<style scoped>
/* ============ 封面风格标题区 ============ */
.gallery-hero {
  position: relative;
  max-width: 1280px;
  margin: 0 auto 40px;
  padding: 80px 60px 120px;   /* 左右边距加大到 60px */
  overflow: hidden;
}
/* 背景巨大装饰字（两星一妍）—— 实心浅灰，和封面一致 */
.hero-bg-text {
  position: absolute;
  left: 50%;
  top: 58%;
  transform: translate(-50%, -50%);
  font-size: clamp(90px, 20vw, 260px);
  font-weight: 900;
  letter-spacing: 0.02em;
  color: #c9b89a;              /* 实心浅灰，和封面 big results 一致 */
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
  transition: transform 0.3s ease-out;   /* 鼠标跟随平滑 */
  animation: bg-in 1s ease 0.2s backwards;
}
.hero-bg-text .letter {
  display: inline-block;
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
.hero-bg-text:hover .letter {
  transform: translateY(-6px);
}
@keyframes bg-in {
  from { opacity: 0; transform: translate(-50%, -30%); }
}
.gallery-head {
  position: relative;
  z-index: 1;
  text-align: center;
}
.hero-title {
  font-weight: 900;
  font-size: clamp(90px, 20vw, 260px);
  line-height: 1.05;
  letter-spacing: 0.15em;
  margin: 20px 0;
  white-space: nowrap;
}
.hero-sub {
  font-size: 16px;
  color: #6b6560;
}
/* 每个字入场跳动（staggered） */
.char {
  display: inline-block;
  animation: char-pop 0.7s cubic-bezier(0.22, 1, 0.36, 1) var(--d) backwards;
}
@keyframes char-pop {
  from {
    opacity: 0;
    transform: translateY(50px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
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
  font-weight: 900;
  font-size: clamp(90px, 20vw, 26px);
  line-height: 1.05;
  letter-spacing: 0.15em;
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

/* ============ 切换 + 上传按钮同一行 ============ */
.tabs-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
  width: fit-content;
  margin: 0 auto 40px;
}
.tabs-upload {
  appearance: none;
  border: 0;
  cursor: pointer;
  padding: 12px 22px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #d9351f, #f58b4e);
  box-shadow: 0 6px 18px rgba(217, 53, 31, 0.3);
  transition: transform 0.2s, box-shadow 0.2s;
}
.tabs-upload:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(217, 53, 31, 0.4);
}
.tabs-upload:disabled {
  opacity: 0.6;
  cursor: default;
}

/* 管理相册链接 */
.manage-link {
  color: #d9351f;
  text-decoration: none;
  font-weight: 600;
}
.manage-link:hover { text-decoration: underline; }

/* ============ 云端照片删除按钮 ============ */
.photo-del {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 0;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  opacity: 0;
  transition: opacity 0.2s, background 0.2s;
}
.photo-card:hover .photo-del {
  opacity: 1;
}
.photo-del:hover {
  background: #d9351f;
}

/* ============ 横竖屏切换按钮组 ============ */
.gallery-tabs {
  display: flex;
  gap: 4px;
  width: fit-content;
  margin: 0;
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
  /* ===== 手机端补充适配 ===== */
  .gallery-hero {
    padding: 50px 20px 70px;
  }
  .hero-title {
    font-size: clamp(60px, 18vw, 120px);
  }
  .hero-bg-text {
    font-size: clamp(60px, 18vw, 120px);
  }
  .tabs-row {
    flex-direction: column;
    gap: 10px;
  }
  .tabs-upload {
    width: 100%;
    max-width: 260px;
  }
  .gallery-tabs {
    width: 100%;
    max-width: 320px;
  }
  .gallery-head h2 {
    font-size: 36px;
  }
}
</style>
