<script setup>
// 桥牌社页面：把独立的桥牌游戏组件嵌进情侣网站
// 卡牌图片放在 /public/poker，组件通过 poker-base-path 指向它
// 电脑端左右两侧放照片（宽度实时量出手牌边界，正好贴在手牌旁边）
// 手机端牌桌下面放一张横屏照片
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import BridgeGame from '../components/BridgeGame.vue'
import PhotoRail from '../components/PhotoRail.vue'

// ===== 人机难度：简单 / 中等 / 困难（记住上次选择） =====
const DIFFS = [
  { key: 'easy', label: '简单' },
  { key: 'normal', label: '中等' },
  { key: 'hard', label: '困难' }
]
const DIFF_KEY = 'max_bridge_diff'
const difficulty = ref(
  (typeof localStorage !== 'undefined' && localStorage.getItem(DIFF_KEY)) || 'normal'
)
function setDifficulty(key) {
  difficulty.value = key
  try { localStorage.setItem(DIFF_KEY, key) } catch (e) { /* 忽略隐私模式报错 */ }
}

const stageEl = ref(null)
const gameWrapEl = ref(null)

const railL = ref(0)   // 左侧照片栏宽度（px）
const railR = ref(0)   // 右侧照片栏宽度（px）
const railTop = ref(150)
const railH = ref(0)
const vw = ref(typeof window !== 'undefined' ? window.innerWidth : 1440)

// 太窄放不下就不显示两侧照片栏（改由底部单张照片顶上）
const showRails = computed(() => vw.value >= 1180 && railL.value >= 150 && railR.value >= 150)
const railLStyle = computed(() => ({
  top: railTop.value + 'px',
  height: Math.max(0, railH.value) + 'px',
  width: railL.value + 'px'
}))
const railRStyle = computed(() => ({
  top: railTop.value + 'px',
  height: Math.max(0, railH.value) + 'px',
  width: railR.value + 'px'
}))

const MAX_RAIL = 300 // 照片栏最大宽度（4:3 卡片下单张约 225 高，300 宽两列刚好）

// 量出「东西两家手牌」的实际边界 → 照片栏正好延伸到牌旁边
function measure() {
  const stage = stageEl.value
  const wrap = gameWrapEl.value
  if (!stage || !wrap) return

  const sr = stage.getBoundingClientRect()
  const gr = wrap.getBoundingClientRect()
  if (!sr.width || !gr.height) return

  const west = wrap.querySelector('.bb-seat.bb-west')
  const east = wrap.querySelector('.bb-seat.bb-east')
  const bar = wrap.querySelector('.bridge-topbar')

  const leftEdge = west ? west.getBoundingClientRect().left - sr.left : sr.width * 0.3
  const rightEdge = east ? sr.right - east.getBoundingClientRect().right : sr.width * 0.3

  const nextL = Math.max(0, Math.min(MAX_RAIL, Math.round(leftEdge - 24)))
  const nextR = Math.max(0, Math.min(MAX_RAIL, Math.round(rightEdge - 24)))
  const nextTop = Math.round(((bar ? bar.getBoundingClientRect().bottom : gr.top) - sr.top) + 10)
  const nextH = Math.round(gr.bottom - sr.top - nextTop - 6)

  // 变化很小就不动，避免 ResizeObserver 抖动
  if (Math.abs(nextL - railL.value) > 1) railL.value = nextL
  if (Math.abs(nextR - railR.value) > 1) railR.value = nextR
  if (Math.abs(nextTop - railTop.value) > 1) railTop.value = nextTop
  if (Math.abs(nextH - railH.value) > 1) railH.value = nextH
}

function onResize() {
  vw.value = window.innerWidth
  measure()
}

let ro = null
let timers = []
onMounted(() => {
  // 牌桌要等卡牌/字体渲染完才有正确尺寸，多量几次兜底
  nextTick(measure)
  timers = [120, 400, 1000].map(ms => setTimeout(measure, ms))

  ro = new ResizeObserver(() => measure())
  if (gameWrapEl.value) ro.observe(gameWrapEl.value)
  if (stageEl.value) ro.observe(stageEl.value)
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => {
  if (ro) ro.disconnect()
  timers.forEach(t => clearTimeout(t))
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div class="page bridge-page">
    <!-- 牌桌 + 两侧照片墙放在同一个相对定位容器里，照片浮在牌桌左右的空白处 -->
    <div class="bridge-stage" ref="stageEl">
      <header class="bridge-head">
        <h1>♠️ 桥牌社 🃏</h1>
        <p>两个人也能玩 —— 来一局定约桥牌吧</p>

        <!-- 难度选择（简单 / 中等 / 困难），即时生效并记住选择 -->
        <div class="diff-bar">
          <span class="diff-label">难度</span>
          <button
            v-for="d in DIFFS"
            :key="d.key"
            type="button"
            class="diff-btn"
            :class="{ on: difficulty === d.key }"
            @click="setDifficulty(d.key)"
          >{{ d.label }}</button>
          <router-link to="/bridge" class="diff-back">← 返回模式选择</router-link>
        </div>
      </header>

      <div class="game-wrap" ref="gameWrapEl">
        <BridgeGame :initial-board="1" :ai-difficulty="difficulty" poker-base-path="/poker" :show-settings="true" />
      </div>

      <!-- 电脑端：左右照片墙（宽度按手牌边界算，正好贴到牌旁边） -->
      <aside v-if="showRails" class="rail-slot rail-slot-l" :style="railLStyle">
        <PhotoRail layout="side" kind="horizontal" />
      </aside>
      <aside v-if="showRails" class="rail-slot rail-slot-r" :style="railRStyle">
        <PhotoRail layout="side" kind="vertical" />
      </aside>
    </div>

    <!-- 手机端：牌桌下面一张横屏照片（宽屏自动隐藏） -->
    <div class="rail-strip">
      <PhotoRail layout="single" />
    </div>
  </div>
</template>

<style scoped>
/* 桥牌页左右留白收窄一点，给照片墙腾位置 */
.bridge-page {
  padding: 132px 20px 70px;
}

.bridge-stage {
  position: relative;
  max-width: 1660px;
  margin: 0 auto;
}

.bridge-head {
  text-align: center;
  margin-bottom: 18px;
}
.bridge-head h1 {
  font-family: "DM Sans", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 30px;
  color: #d9351f;
  margin: 0 0 8px;
  letter-spacing: 0.02em;
}
.bridge-head p {
  margin: 0;
  color: #8a7a5c;
  font-size: 14px;
}

/* ===== 难度选择栏 ===== */
.diff-bar {
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}
.diff-label {
  font-size: 13px;
  font-weight: 700;
  color: #8a7a5c;
  margin-right: 2px;
}
.diff-btn {
  padding: 7px 16px;
  border-radius: 999px;
  border: 1.5px solid rgba(217, 53, 31, 0.28);
  background: rgba(255, 255, 255, 0.75);
  color: #8a5a2b;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.diff-btn:hover {
  border-color: #d9351f;
  color: #d9351f;
}
.diff-btn.on {
  background: linear-gradient(135deg, #d9351f, #f58b4e);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 6px 16px -6px rgba(217, 53, 31, 0.6);
}
.diff-back {
  margin-left: 10px;
  font-size: 12px;
  color: #8a7a5c;
  text-decoration: none;
}
.diff-back:hover {
  color: #d9351f;
  text-decoration: underline;
}

/* ===== 电脑端左右照片墙：浮在牌桌两侧的深色空白处 ===== */
.rail-slot {
  position: absolute;
  /* top / height / width 由脚本按手牌边界实时算；左右分别贴边 */
}
.rail-slot-l { left: 8px; }
.rail-slot-r { right: 8px; }

/* ===== 手机端照片 ===== */
.rail-strip {
  max-width: 1660px;
  margin: 14px auto 0;
  padding: 0 2px;
}
@media (min-width: 1180px) {
  .rail-strip { display: none; }
}

/* ===== 手机端：标题和边距收紧 ===== */
@media (max-width: 750px) {
  .bridge-page { padding: 104px 10px 48px; }
  .bridge-head { margin-bottom: 12px; }
  .bridge-head h1 { font-size: 24px; margin-bottom: 4px; }
  .bridge-head p { font-size: 12px; }
  .rail-strip { margin-top: 10px; }
}
</style>
