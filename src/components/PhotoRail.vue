<script setup>
// ============================================================
// 桥牌页照片区（电脑左右两侧 / 手机单张横屏）
// - 数据来自 useBridgePhotos()（全局共用一份，删除后各处同步）
// - 选好图后先弹裁剪窗：可换比例、拖动、缩放，再上传
// ============================================================
import { ref, computed, watch, onMounted } from 'vue'
import { API_BASE } from '../api.js'
import { useBridgePhotos } from '../composables/useBridgePhotos.js'
import { useAuth } from '../composables/useAuth.js'
import ImageCropper from './ImageCropper.vue'

const props = defineProps({
  layout: { type: String, default: 'side' },   // side=电脑左右竖列 / single=手机单张横屏
  kind: { type: String, default: 'horizontal' } // horizontal=横图（大家都能传）/ vertical=竖图（仅管理员）
})

const { photos, verticalPhotos, uploading, load, upload, remove } = useBridgePhotos()
const { state } = useAuth()

// 竖图是管理员专属位：只有超级管理员能换 / 能删
const isAdmin = computed(() => !!(state.user && state.user.role === 'ADMIN'))
const isVertical = computed(() => props.kind === 'vertical')

const fileInput = ref(null)
const cropFile = ref(null)
const errMsg = ref('')
// 裁剪比例跟展示位一致：手机横屏 16:9、电脑横图 3:2、右侧竖图 3:4（裁什么样显示什么样）
const cropRatio = ref(
  props.layout === 'single' ? 16 / 9 : (props.kind === 'vertical' ? 3 / 4 : 3 / 2)
)

// 电脑端：横图栏取最新 4 张横图；竖图栏只取最新 1 张竖图
const myPhotos = computed(() => {
  if (props.layout !== 'side') return []
  if (props.kind === 'vertical') return verticalPhotos.value.slice(0, 1)
  return photos.value.slice(0, 4)
})
// 照片不够时用虚线占位补上，避免出现大片空黑（竖图栏只补 1 格）
const cells = computed(() => {
  const arr = myPhotos.value.map(p => ({ p, ph: false }))
  const min = props.kind === 'vertical' ? 1 : 2
  while (arr.length < min) arr.push({ p: null, ph: true })
  return arr
})

// 手机端：当前看到第几张（0 = 最新一张）
const index = ref(0)
const hero = computed(() => photos.value[index.value] || null)

// 左右切换（到头了绕回另一头）
function go(step) {
  const n = photos.value.length
  if (n < 2) return
  index.value = (index.value + step + n) % n
}
function prev() { go(-1) }
function next() { go(1) }

// 照片被删掉/列表变短时，把序号收回到有效范围
watch(() => photos.value.length, (n) => {
  if (!n) index.value = 0
  else if (index.value > n - 1) index.value = n - 1
})

// 手指左右滑：横向位移够大才切图，竖向滑动不拦（不影响页面滚动）
let touchX = 0
let touchY = 0
function onTouchStart(e) {
  const t = e.touches && e.touches[0]
  if (!t) return
  touchX = t.clientX
  touchY = t.clientY
}
function onTouchEnd(e) {
  if (photos.value.length < 2) return
  const t = e.changedTouches && e.changedTouches[0]
  if (!t) return
  const dx = t.clientX - touchX
  const dy = t.clientY - touchY
  if (Math.abs(dx) < 36) return
  if (Math.abs(dx) < Math.abs(dy) * 1.3) return
  go(dx < 0 ? 1 : -1)
}

function imgUrl(p) {
  return `${API_BASE}/uploads/${p.filename}`
}

function triggerUpload() {
  if (uploading.value) return
  // 竖图是管理员专属位，其他人点了给提示而不是打开文件框
  if (isVertical.value && !isAdmin.value) {
    errMsg.value = '右边这张竖图只有管理员可以更换'
    return
  }
  if (fileInput.value) fileInput.value.click()
}

// 选文件 → 打开裁剪窗（不直接上传）
function onFiles(e) {
  const f = (e.target.files || [])[0]
  e.target.value = ''
  if (!f) return
  if (!f.type.startsWith('image/')) {
    errMsg.value = '选一张图片吧（jpg / png）'
    return
  }
  errMsg.value = ''
  cropFile.value = f
}

async function onCropped(blob) {
  cropFile.value = null
  if (isVertical.value && !isAdmin.value) {
    errMsg.value = '只有管理员可以更换这张竖图'
    return
  }
  // 竖图存到管理员专属分类，横图存普通分类
  const r = await upload(blob, isVertical.value ? 'bridge_vertical' : 'bridge')
  if (!r.ok) errMsg.value = '上传失败：' + r.message
  else if (props.layout === 'single') index.value = 0 // 新图排在最前，顺手翻到它
}

async function askRemove(p) {
  if (!p) return
  if (isVertical.value && !isAdmin.value) {
    errMsg.value = '右边这张竖图只有管理员可以更换'
    return
  }
  if (!confirm('把这张照片拿掉吗？（手机上就不会显示了）')) return
  errMsg.value = ''
  const r = await remove(p)
  if (!r.ok) errMsg.value = '删除失败：' + r.message
}

onMounted(() => load())
defineExpose({ load })
</script>

<template>
  <div class="p-rail" :class="['p-rail-' + layout, 'kind-' + kind]">
    <input ref="fileInput" type="file" accept="image/*" hidden @change="onFiles" />

    <!-- ============ 电脑端：竖排照片（固定 4:3 格子，两侧交替分配） ============ -->
    <template v-if="layout === 'side'">
      <template v-for="(c, idx) in cells" :key="c.ph ? 'ph' + idx : 'p' + c.p.id">
        <div v-if="!c.ph" class="p-item" :class="idx % 2 ? 'sk-even' : 'sk-odd'">
          <img :src="imgUrl(c.p)" alt="我们的照片" loading="lazy" />
          <button class="p-del" type="button" title="拿掉这张" @click.stop="askRemove(c.p)">×</button>
        </div>
        <div v-else class="p-ph" aria-hidden="true">
          <span class="p-ph-txt">照片位</span>
        </div>
      </template>

      <!-- 横图人人可加；竖图只有管理员能换 -->
      <button
        v-if="!isVertical || isAdmin"
        class="p-add"
        :class="{ busy: uploading }"
        type="button"
        @click="triggerUpload"
      >
        <span class="p-add-ico">{{ uploading ? '⏳' : '＋' }}</span>
        <span class="p-add-txt">{{ uploading ? '上传中' : (isVertical ? '换竖图' : '加照片') }}</span>
      </button>
      <p v-if="isVertical && !isAdmin" class="p-note">🔒 管理员专属位</p>

      <p v-if="errMsg" class="p-err">{{ errMsg }}</p>
    </template>

    <!-- ============ 手机端：一张横屏，可左右翻 ============ -->
    <template v-else>
      <div v-if="hero" class="p-hero">
        <div
          class="p-hero-card"
          @touchstart.passive="onTouchStart"
          @touchend.passive="onTouchEnd"
        >
          <img :key="hero.id" :src="imgUrl(hero)" alt="我们的照片" />
          <button class="p-del p-del-solid" type="button" title="拿掉这张" @click.stop="askRemove(hero)">×</button>

          <template v-if="photos.length > 1">
            <button class="p-nav p-nav-prev" type="button" aria-label="上一张" @click.stop="prev">‹</button>
            <button class="p-nav p-nav-next" type="button" aria-label="下一张" @click.stop="next">›</button>
            <span class="p-counter">{{ index + 1 }} / {{ photos.length }}</span>
          </template>
        </div>

        <div class="p-hero-bar">
          <span class="p-hero-tip">
            {{ photos.length > 1 ? `共 ${photos.length} 张 · 左右滑动切换` : '横屏 16:9' }}
          </span>
          <button class="p-hero-btn" type="button" :disabled="uploading" @click="triggerUpload">
            {{ uploading ? '上传中…' : '＋ 加照片' }}
          </button>
        </div>
      </div>

      <button v-else class="p-hero-empty" :class="{ busy: uploading }" type="button" @click="triggerUpload">
        <span class="p-add-ico">{{ uploading ? '⏳' : '＋' }}</span>
        <span class="p-hero-empty-txt">{{ uploading ? '上传中…' : '放一张横屏照片（可裁剪）' }}</span>
      </button>

      <p v-if="errMsg" class="p-err">{{ errMsg }}</p>
    </template>

    <!-- 裁剪窗 -->
    <ImageCropper
      v-if="cropFile"
      :file="cropFile"
      :default-ratio="cropRatio"
      :title="layout === 'single' ? '裁成横屏' : '裁剪照片'"
      @confirm="onCropped"
      @cancel="cropFile = null"
    />
  </div>
</template>

<style scoped>
.p-rail { color: #8a7a5c; }

/* ===== 电脑端：左右竖排，固定 4:3 格子 ===== */
.p-rail-side {
  display: flex;
  flex-direction: column;
  justify-content: center; /* 照片少时整组居中，不贴顶也不空一半 */
  align-items: stretch;
  gap: 12px;
  height: 100%;
  min-height: 0;
  overflow-y: auto;        /* 照片多了可滚动，不再拉伸每一张 */
  padding: 2px 4px 2px 0;
}
.p-rail-side .p-item {
  flex: 0 0 auto;          /* 不被拉伸，高度由比例决定 */
  aspect-ratio: 3 / 2;     /* 默认按横图 */
}
/* 横图栏固定 3:2、竖图栏固定 3:4：比例不随栏高/张数变化，照片不会被压扁或拉长 */
.p-rail-side.kind-horizontal .p-item { aspect-ratio: 3 / 2; }
.p-rail-side.kind-vertical .p-item { aspect-ratio: 3 / 4; }
.p-rail-side.kind-horizontal .p-ph { aspect-ratio: 3 / 2; }
.p-rail-side.kind-vertical .p-ph { aspect-ratio: 3 / 4; }
/* 竖图栏：非管理员看到的“管理员专属位”小字 */
.p-note {
  flex: 0 0 auto;
  margin: 0;
  text-align: center;
  font-size: 11px;
  color: rgba(255, 255, 255, .55);
}
.p-rail-side .p-add {
  flex: 0 0 auto;
  height: 58px;
}
/* 空位虚线占位 */
.p-ph {
  flex: 0 0 auto;
  aspect-ratio: 4 / 3;
  border: 1.5px dashed rgba(255, 255, 255, .3);
  border-radius: 12px;
  background: rgba(255, 255, 255, .05);
  display: flex;
  align-items: center;
  justify-content: center;
}
.p-ph-txt {
  color: rgba(255, 255, 255, .5);
  font-size: 12px;
  letter-spacing: .04em;
}

/* ===== 手机端：一张横屏大图 ===== */
.p-rail-single {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
}
.p-hero-card {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  padding: 6px;
  border-radius: 14px;
  background: linear-gradient(180deg, #fffdf7, #f6ecd8);
  box-shadow: 0 14px 30px -16px rgba(60, 40, 20, .6), 0 2px 6px rgba(0, 0, 0, .12);
  /* 横向滑动自己接管，纵向仍交给页面滚动 */
  touch-action: pan-y;
  user-select: none;
}
.p-hero-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 34%;
  border-radius: 10px;
  display: block;
  background: #e8dfcc;
  animation: heroIn .26s ease-out;
  -webkit-user-drag: none;
}
@keyframes heroIn {
  from { opacity: .28; }
  to { opacity: 1; }
}

/* 左右切换箭头 */
.p-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0 4px;
  border: none;
  border-radius: 50%;
  background: rgba(20, 20, 16, .42);
  color: #fff;
  font-size: 22px;
  line-height: 1;
  font-family: inherit;
  cursor: pointer;
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  transition: background .2s, transform .2s;
  z-index: 2;
}
.p-nav:active { background: rgba(217, 53, 31, .85); transform: translateY(-50%) scale(.92); }
.p-nav-prev { left: 12px; }
.p-nav-next { right: 12px; }

/* 右下角序号 */
.p-counter {
  position: absolute;
  right: 14px;
  bottom: 14px;
  padding: 2px 9px;
  border-radius: 999px;
  background: rgba(20, 20, 16, .45);
  color: #fff;
  font-size: 11.5px;
  letter-spacing: .04em;
  pointer-events: none;
}
.p-hero-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 8px;
}
.p-hero-tip {
  font-size: 12px;
  color: #a4937a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.p-hero-btn {
  flex: 0 0 auto;
  border: 1px solid rgba(160, 130, 90, .38);
  background: rgba(255, 255, 255, .66);
  color: #8a6a3c;
  border-radius: 999px;
  padding: 5px 14px;
  font-size: 12.5px;
  font-family: inherit;
  cursor: pointer;
}
.p-hero-btn:disabled { opacity: .6; cursor: default; }
.p-hero-btn:hover:not(:disabled) { background: #fff; border-color: #d9351f; color: #d9351f; }

.p-hero-empty {
  width: 100%;
  aspect-ratio: 16 / 9;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1.5px dashed rgba(160, 130, 90, .5);
  border-radius: 14px;
  background: rgba(255, 255, 255, .42);
  color: #9c8a6c;
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: all .25s;
}
.p-hero-empty:hover { border-color: #d9351f; color: #d9351f; background: rgba(255, 255, 255, .75); }
.p-hero-empty.busy { cursor: default; opacity: .75; }
.p-hero-empty-txt { letter-spacing: .02em; }

/* ===== 照片卡片（奶油相框） ===== */
.p-item {
  position: relative;
  border-radius: 12px;
  padding: 6px;
  background: linear-gradient(180deg, #fffdf7, #f6ecd8);
  box-shadow: 0 10px 22px -12px rgba(60, 40, 20, .55), 0 2px 6px rgba(0, 0, 0, .18);
  overflow: hidden;
}
.p-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 32%;
  border-radius: 8px;
  display: block;
  background: #e8dfcc;
}
.p-item.sk-odd { transform: rotate(-1.1deg); }
.p-item.sk-even { transform: rotate(1.1deg); }

.p-del {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: rgba(20, 20, 16, .62);
  color: #fff;
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: opacity .2s;
}
.p-item:hover .p-del { opacity: 1; }
.p-del-solid { opacity: .82; }
.p-hero-card:hover .p-del-solid { opacity: 1; }

/* ===== 加照片按钮（电脑端） ===== */
.p-add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border: 1.5px dashed rgba(255, 255, 255, .38);
  border-radius: 12px;
  background: rgba(255, 255, 255, .07);
  color: #e6efe9;
  cursor: pointer;
  font-family: inherit;
  transition: background .25s, border-color .25s, transform .25s;
}
.p-add:hover { background: rgba(255, 255, 255, .16); border-color: rgba(255, 255, 255, .7); }
.p-add.busy { cursor: default; opacity: .8; }
.p-add-ico { font-size: 20px; line-height: 1; }
.p-add-txt { font-size: 12px; letter-spacing: .04em; }

.p-err {
  margin: 6px 0 0;
  font-size: 11.5px;
  line-height: 1.4;
  color: #ffb4a4;
  text-align: center;
}
.p-rail-single .p-err { color: #c9563f; }
</style>
