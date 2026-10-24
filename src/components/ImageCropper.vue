<script setup>
// ============================================================
// 图片裁剪弹窗（纯前端 canvas，不依赖任何库）
// 用法：<ImageCropper :file="file" :default-ratio="16/9" @confirm="blob => ..." @cancel="..." />
// 功能：选比例 → 拖动图片调位置 → 滑杆放大缩小 → 确定导出 jpg
// ============================================================
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  file: { type: Object, default: null },
  defaultRatio: { type: Number, default: 16 / 9 },
  title: { type: String, default: '裁剪照片' }
})
const emit = defineEmits(['confirm', 'cancel'])

const RATIOS = [
  { label: '横屏 16:9', value: 16 / 9 },
  { label: '横屏 4:3', value: 4 / 3 },
  { label: '横屏 3:2', value: 3 / 2 },
  { label: '方形 1:1', value: 1 },
  { label: '原图比例', value: 0 }
]

const frameEl = ref(null)
const imgEl = ref(null)

const imgUrl = ref('')
const imgW = ref(0)
const imgH = ref(0)
const imgErr = ref('')
const ratio = ref(props.defaultRatio)
const zoom = ref(1)
const dx = ref(0)
const dy = ref(0)
const frameW = ref(0)
const frameH = ref(0)
const ready = ref(false)
const busy = ref(false)

// 裁剪框比例（选“原图”时用图片自身比例）
const ratioValue = computed(() => {
  if (ratio.value > 0) return ratio.value
  if (imgW.value && imgH.value) return imgW.value / imgH.value
  return 16 / 9
})

// 图片铺满裁剪框所需的最小缩放
function baseScale() {
  if (!frameW.value || !frameH.value || !imgW.value || !imgH.value) return 1
  return Math.max(frameW.value / imgW.value, frameH.value / imgH.value)
}
function dispScale() {
  return baseScale() * zoom.value
}

const imgStyle = computed(() => {
  const s = dispScale()
  return {
    width: Math.round(imgW.value * s) + 'px',
    height: Math.round(imgH.value * s) + 'px',
    transform: `translate3d(${Math.round(dx.value)}px, ${Math.round(dy.value)}px, 0)`
  }
})

function measure() {
  const el = frameEl.value
  if (!el) return
  const r = el.getBoundingClientRect()
  if (r.width) frameW.value = r.width
  if (r.height) frameH.value = r.height
}

// 把图片位移限制在裁剪框内（图片永远盖满框）
function clamp() {
  const s = dispScale()
  const dw = imgW.value * s
  const dh = imgH.value * s
  dx.value = Math.min(0, Math.max(frameW.value - dw, dx.value))
  dy.value = Math.min(0, Math.max(frameH.value - dh, dy.value))
}

function center() {
  const s = dispScale()
  dx.value = (frameW.value - imgW.value * s) / 2
  dy.value = (frameH.value - imgH.value * s) / 2
  clamp()
}

function onImgLoad() {
  const el = imgEl.value
  if (!el) return
  imgErr.value = ''
  imgW.value = el.naturalWidth || 1
  imgH.value = el.naturalHeight || 1
  requestAnimationFrame(() => {
    measure()
    zoom.value = 1
    center()
    ready.value = true
  })
}

function onImgError() {
  imgErr.value = '这张图打不开（iPhone 的 HEIC 不行），换成 jpg / png 试试'
  ready.value = false
}

// 换比例：重置缩放并重新居中
function pickRatio(v) {
  if (v === ratio.value) return
  ratio.value = v
  nextTick(() => {
    requestAnimationFrame(() => {
      measure()
      zoom.value = 1
      center()
    })
  })
}

// 缩放：以裁剪框中心为锚点，缩放时画面不跑偏
function setZoom(v) {
  const oldS = dispScale()
  const cx = (frameW.value / 2 - dx.value) / oldS
  const cy = (frameH.value / 2 - dy.value) / oldS
  zoom.value = Number(v)
  const s = dispScale()
  dx.value = frameW.value / 2 - cx * s
  dy.value = frameH.value / 2 - cy * s
  clamp()
}

// ===== 拖动（鼠标 + 触摸统一用 pointer 事件） =====
let dragging = false
let lastX = 0
let lastY = 0

function onDown(e) {
  if (!ready.value) return
  dragging = true
  lastX = e.clientX
  lastY = e.clientY
  try { e.currentTarget.setPointerCapture(e.pointerId) } catch (_) { /* 忽略 */ }
}
function onMove(e) {
  if (!dragging) return
  dx.value += e.clientX - lastX
  dy.value += e.clientY - lastY
  lastX = e.clientX
  lastY = e.clientY
  clamp()
}
function onUp(e) {
  if (!dragging) return
  dragging = false
  try { e.currentTarget.releasePointerCapture(e.pointerId) } catch (_) { /* 忽略 */ }
}

// ===== 导出裁剪结果（jpg Blob） =====
function confirm() {
  if (!ready.value || busy.value) return
  busy.value = true
  const s = dispScale()
  const sx = -dx.value / s
  const sy = -dy.value / s
  const sw = Math.min(frameW.value / s, imgW.value - sx)
  const sh = Math.min(frameH.value / s, imgH.value - sy)
  // 输出分辨率：原图多大就取多大，但限制在 320~1400 之间
  const outW = Math.max(320, Math.min(1400, Math.round(sw)))
  const outH = Math.max(1, Math.round(outW * (sh / sw)))
  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, outW, outH)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(imgEl.value, sx, sy, sw, sh, 0, 0, outW, outH)
  canvas.toBlob(
    b => {
      busy.value = false
      if (b) emit('confirm', b)
    },
    'image/jpeg',
    0.86
  )
}

// ===== 文件 → 预览地址 =====
let objUrl = ''
watch(
  () => props.file,
  f => {
    if (objUrl) {
      URL.revokeObjectURL(objUrl)
      objUrl = ''
    }
    ready.value = false
    imgErr.value = ''
    if (!f) {
      imgUrl.value = ''
      return
    }
    objUrl = URL.createObjectURL(f)
    imgUrl.value = objUrl
    ratio.value = props.defaultRatio
    zoom.value = 1
    imgW.value = 0
    imgH.value = 0
  },
  { immediate: true }
)

let ro = null
onMounted(() => {
  document.body.style.overflow = 'hidden'
  ro = new ResizeObserver(() => {
    measure()
    if (ready.value) clamp()
  })
  if (frameEl.value) ro.observe(frameEl.value)
})
onBeforeUnmount(() => {
  document.body.style.overflow = ''
  if (ro) ro.disconnect()
  if (objUrl) URL.revokeObjectURL(objUrl)
})
</script>

<template>
  <div class="crop-mask" @click.self="emit('cancel')">
    <div class="crop-panel">
      <div class="crop-head">
        <h3>{{ title }}</h3>
        <button class="crop-x" type="button" @click="emit('cancel')">×</button>
      </div>

      <div class="crop-ratios">
        <button
          v-for="r in RATIOS"
          :key="r.label"
          type="button"
          class="crop-chip"
          :class="{ on: ratio === r.value }"
          @click="pickRatio(r.value)"
        >
          {{ r.label }}
        </button>
      </div>

      <div class="crop-stage">
        <div
          ref="frameEl"
          class="crop-frame"
          :style="{ '--r': ratioValue }"
          @pointerdown="onDown"
          @pointermove="onMove"
          @pointerup="onUp"
          @pointercancel="onUp"
        >
          <img
            v-if="imgUrl"
            ref="imgEl"
            :src="imgUrl"
            :style="imgStyle"
            alt="待裁剪的图片"
            draggable="false"
            @load="onImgLoad"
            @error="onImgError"
          />
          <div class="crop-grid"></div>
          <span v-if="!ready && !imgErr" class="crop-loading">读取中…</span>
          <span v-if="imgErr" class="crop-loading crop-loading-err">{{ imgErr }}</span>
        </div>
      </div>

      <div class="crop-zoom">
        <span class="crop-zoom-label">缩放</span>
        <input
          type="range"
          min="1"
          max="3"
          step="0.01"
          :value="zoom"
          :disabled="!ready"
          @input="setZoom($event.target.value)"
        />
        <span class="crop-zoom-val">{{ zoom.toFixed(1) }}×</span>
      </div>

      <p class="crop-tip">拖动图片调整位置，滑杆放大缩小</p>

      <div class="crop-foot">
        <button class="crop-btn ghost" type="button" @click="emit('cancel')">取消</button>
        <button class="crop-btn main" type="button" :disabled="!ready || busy" @click="confirm">
          {{ busy ? '处理中…' : '就用这张' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.crop-mask {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: rgba(28, 20, 12, .62);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.crop-panel {
  width: min(560px, 100%);
  max-height: 94vh;
  overflow: auto;
  background: linear-gradient(180deg, #fffdf7, #f6ecd8);
  border-radius: 18px;
  padding: 16px 16px 14px;
  box-shadow: 0 26px 60px -20px rgba(50, 30, 10, .8);
  font-family: "DM Sans", "PingFang SC", "Microsoft YaHei", sans-serif;
  color: #4a3a26;
}

.crop-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.crop-head h3 {
  margin: 0;
  font-size: 16px;
  color: #d9351f;
  letter-spacing: .02em;
}
.crop-x {
  border: none;
  background: rgba(120, 96, 60, .1);
  color: #6b573a;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}
.crop-x:hover { background: rgba(120, 96, 60, .2); }

.crop-ratios {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 6px;
  -webkit-overflow-scrolling: touch;
}
.crop-chip {
  flex: 0 0 auto;
  border: 1px solid rgba(160, 130, 90, .4);
  background: rgba(255, 255, 255, .6);
  color: #6b573a;
  border-radius: 999px;
  padding: 5px 12px;
  font-size: 12.5px;
  font-family: inherit;
  cursor: pointer;
  transition: all .2s;
}
.crop-chip.on {
  background: #d9351f;
  border-color: #d9351f;
  color: #fff8f0;
}

.crop-stage {
  display: flex;
  justify-content: center;
  background: rgba(40, 30, 16, .06);
  border-radius: 12px;
  padding: 8px;
}
.crop-frame {
  position: relative;
  overflow: hidden;
  touch-action: none;
  cursor: grab;
  width: min(100%, calc(52vh * var(--r, 1.78)));
  aspect-ratio: var(--r, 1.78);
  background: #1c231d;
  border-radius: 10px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .14);
}
.crop-frame:active { cursor: grabbing; }
.crop-frame img {
  position: absolute;
  top: 0;
  left: 0;
  max-width: none;
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
}
.crop-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: linear-gradient(to right, rgba(255, 255, 255, .22) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, .22) 1px, transparent 1px);
  background-size: 33.33% 33.33%;
  background-position: -1px -1px;
}
.crop-loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #e8f0ea;
  font-size: 13px;
}
.crop-loading-err {
  padding: 0 18px;
  text-align: center;
  line-height: 1.6;
  color: #ffc9bb;
}

.crop-zoom {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}
.crop-zoom-label {
  font-size: 12.5px;
  color: #8a7a5c;
  flex: 0 0 auto;
}
.crop-zoom input[type='range'] {
  flex: 1;
  accent-color: #d9351f;
  height: 22px;
}
.crop-zoom-val {
  flex: 0 0 42px;
  text-align: right;
  font-size: 12.5px;
  color: #8a7a5c;
  font-variant-numeric: tabular-nums;
}

.crop-tip {
  margin: 6px 0 0;
  font-size: 12px;
  color: #a4937a;
}

.crop-foot {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}
.crop-btn {
  flex: 1;
  border-radius: 10px;
  padding: 10px 0;
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all .2s;
}
.crop-btn.ghost {
  background: rgba(255, 255, 255, .7);
  border-color: rgba(160, 130, 90, .35);
  color: #6b573a;
}
.crop-btn.main {
  background: #d9351f;
  color: #fff8f0;
}
.crop-btn.main:disabled { opacity: .55; cursor: default; }
.crop-btn.main:hover:not(:disabled) { background: #c02c18; }

@media (max-width: 480px) {
  .crop-panel { padding: 12px 12px 10px; border-radius: 16px; }
  .crop-head h3 { font-size: 15px; }
  .crop-frame { width: min(100%, calc(44vh * var(--r, 1.78))); }
}
</style>
