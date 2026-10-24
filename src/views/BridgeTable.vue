<template>
  <div class="page">
    <!-- 顶部房间条 -->
    <div class="tb-bar">
      <router-link to="/bridge" class="tb-btn ghost link">← 桥牌社</router-link>
      <span class="tb-name">{{ room ? room.name : '牌桌' }}</span>
      <span class="tb-chip">房号 {{ roomId }}</span>
      <span class="tb-chip">我坐 <b>{{ mySeatCn }}家</b>{{ isHost ? '（房主）' : '' }}{{ spectating ? '（旁观）' : '' }}</span>
      <span :class="['tb-conn', conn]">{{ connText }}</span>
      <button v-if="isHost" class="tb-btn" :disabled="busy" @click="hostDeal">重新发牌</button>
      <button v-if="!isHost" class="tb-btn ghost" @click="askSync">同步牌局</button>
    </div>

    <!-- 还没座位：先挑一个 -->
    <div v-if="spectating" class="tb-pick">
      <span class="tb-pick-tip">你还没坐下，先挑个位置：</span>
      <button v-for="(s, i) in SEAT_CN" :key="i" class="tb-btn" :disabled="busy"
        @click="takeSeat(i)">
        {{ s }}家{{ room && room.seats[i] ? '（' + room.seats[i] + '）' : '（空）' }}
      </button>
    </div>

    <!-- 换座位 -->
    <div class="tb-seats">
      <span class="tb-seats-label">换座位</span>
      <button v-for="(s, i) in SEAT_CN" :key="i" :class="['tb-seat', { mine: i === mySeatIdx, taken: !!(room && room.seats[i]) }]"
        :disabled="busy || i === mySeatIdx" @click="switchSeat(i)">
        {{ s }}<em>{{ room && room.seats[i] ? room.seats[i] : '空' }}</em>
      </button>
    </div>

    <!-- 换座请求：等对方点头 -->
    <div v-if="incoming" class="tb-ask">
      <span><b>{{ incoming.by }}</b> 想和你换位置（{{ SEAT_CN[incoming.from] }} ↔ {{ SEAT_CN[incoming.to] }}），同意吗？</span>
      <button class="tb-btn ok" @click="acceptSwap">同意</button>
      <button class="tb-btn ghost" @click="declineSwap">拒绝</button>
    </div>

    <p v-if="msg" :class="['tb-msg', okFlag ? 'ok' : 'err']">{{ msg }}</p>

    <div class="tb-wrap">
      <BridgeGame ref="gameRef" :initial-board="1" ai-difficulty="normal" poker-base-path="/poker"
        :show-settings="true" :net-mode="netMode" :net-seat="netSeat" @net-change="onNetChange"
        @net-act="onNetAct" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import BridgeGame from '../components/BridgeGame.vue'
import { createRoomSocket } from '../composables/useRoomSocket.js'
import { roomDetail, seatRoom, swapRoom, getToken, getUsername } from '../api.js'
import { useAuth } from '../composables/useAuth.js'

const SEAT_CN = ['北', '东', '南', '西']
const SEAT_LETTER = ['N', 'E', 'S', 'W']

const route = useRoute()
const roomId = String(route.params.id || '')
const { state } = useAuth()
const me = computed(() => (state.user && state.user.username) || getUsername())

const room = ref(null)
const busy = ref(false)
const msg = ref('')
const okFlag = ref(false)
const conn = ref('connecting')
const connText = computed(() => ({ connecting: '连接中…', open: '已连接', closed: '已断开', error: '连接异常' }[conn.value]))

const gameRef = ref(null)
let sock = null
let beatTimer = null      // 房主：定时广播快照，保证后进来的人也能拿到牌局
let roomTimer = null      // 定时拉房间信息（在线成员 → 判断谁由 AI 替补）
let dealt = false         // 房主是否已发过牌
let gotState = false      // 客人是否已收到过快照

const mySeatIdx = computed(() => {
  const s = room.value && room.value.seats
  if (!s) return -1
  return s.indexOf(me.value)
})
const spectating = computed(() => mySeatIdx.value < 0)
const isHost = computed(() => !!room.value && room.value.host === me.value)
const mySeatCn = computed(() => (mySeatIdx.value >= 0 ? SEAT_CN[mySeatIdx.value] : '—'))
// 本地永远是南家，所以告诉引擎"我在真实牌桌上的哪个座位"，由它自动旋转视角
const netSeat = computed(() => (mySeatIdx.value >= 0 ? SEAT_LETTER[mySeatIdx.value] : 'S'))
const netMode = computed(() => (isHost.value ? 'host' : (spectating.value ? 'spectate' : 'guest')))

const incoming = ref(null)

function toast(t, ok) { msg.value = t; okFlag.value = !!ok; setTimeout(() => { if (msg.value === t) msg.value = '' }, 2600) }

async function refreshRoom() {
  const d = await roomDetail(roomId)
  if (d.code === 0) room.value = d.room
  syncRemoteSeats()
}

/** 房主：告诉引擎哪些座位是远端真人（其余空位自动由 AI 替补） */
function syncRemoteSeats() {
  if (!isHost.value || !gameRef.value) return
  const online = (room.value && room.value.onlineMembers) || []
  const reals = []
  const seats = (room.value && room.value.seats) || []
  seats.forEach((u, i) => {
    if (!u || u === me.value) return
    // 拿不到在线名单时，就当坐着的人都在线（宁可等真人，也别让 AI 抢了他的牌）
    if (online.length === 0 || online.indexOf(u) >= 0) reals.push(SEAT_LETTER[i])
  })
  gameRef.value.setRemoteSeats(reals)
}

/* ---------- 实时通道 ---------- */
function onMsg(m) {
  if (!m || m.t === 'join') return
  if (m.sender === me.value) return // 自己发出去的广播，忽略
  if (m.t === 'state' && !isHost.value) {
    gotState = true
    if (gameRef.value) gameRef.value.applySnapshot(m)
  } else if (m.t === 'act' && isHost.value) {
    if (gameRef.value) gameRef.value.remoteAct(m.seat, m)
  } else if (m.t === 'sync' && isHost.value) {
    pushSnapshot()
  } else if (m.t === 'seats') {
    refreshRoom()
  } else if (m.t === 'swapReq' && m.to === mySeatIdx.value) {
    incoming.value = { by: m.by, from: m.from, to: m.to }
  } else if (m.t === 'swapDecline' && m.to === mySeatIdx.value) {
    toast('对方拒绝了换座请求', false)
  }
}

function pushSnapshot() {
  if (!sock || !gameRef.value || !isHost.value) return
  sock.send(gameRef.value.snapshot())
}

function onNetChange(snap) { if (sock && isHost.value) sock.send(snap) }
function onNetAct(act) {
  if (!sock) return
  sock.send({ t: 'act', seat: act.seat, kind: act.kind, action: act.action, card: act.card })
}

function askSync() { if (sock) sock.send({ t: 'sync', roomId }) }

/* ---------- 座位 ---------- */
async function takeSeat(i) {
  busy.value = true
  const d = await seatRoom(roomId, i)
  busy.value = false
  if (d.code === 0) {
    room.value = d.room
    sock && sock.send({ t: 'seats' })
    toast('')
  } else toast(d.message || '入座失败', false)
}

async function switchSeat(i) {
  if (i === mySeatIdx.value) return
  const who = room.value && room.value.seats[i]
  if (!who) { await takeSeat(i); return }
  // 有人占着：发换座请求，等对方同意
  if (sock) sock.send({ t: 'swapReq', from: mySeatIdx.value, to: i, by: me.value })
  toast(`已向 ${who} 发出换座请求，等对方同意…`, true)
}

async function acceptSwap() {
  const r = incoming.value
  if (!r) return
  incoming.value = null
  busy.value = true
  const d = await swapRoom(roomId, r.from, r.to)
  busy.value = false
  await refreshRoom()
  if (sock) sock.send({ t: 'seats' })
  toast(d.code === 0 ? '换座成功' : (d.message || '换座失败'), d.code === 0)
}

function declineSwap() {
  const r = incoming.value
  if (!r) return
  incoming.value = null
  if (sock) sock.send({ t: 'swapDecline', to: r.from, by: me.value })
}

/* ---------- 房主发牌 ---------- */
async function hostDeal() {
  if (!isHost.value || !gameRef.value) return
  gameRef.value.netDeal(1)
  dealt = true
  pushSnapshot()
}

onMounted(async () => {
  await refreshRoom()
  sock = createRoomSocket({ roomId, token: getToken(), onMessage: onMsg, onStatus: s => { conn.value = s } })

  // 房主：进桌就发一副，并定时广播（后进来 / 掉线重连的人都能拿到牌局）
  if (isHost.value) {
    setTimeout(() => {
      if (!dealt && gameRef.value) { gameRef.value.netDeal(1); dealt = true }
      pushSnapshot()
    }, 400)
    beatTimer = setInterval(pushSnapshot, 2000)
  } else {
    setTimeout(askSync, 500)
    // 没收到快照就一直要，防止房主还没发牌
    beatTimer = setInterval(() => { if (!gotState) askSync() }, 2500)
  }
  roomTimer = setInterval(refreshRoom, 5000)
})

onBeforeUnmount(() => {
  if (beatTimer) clearInterval(beatTimer)
  if (roomTimer) clearInterval(roomTimer)
  if (sock) sock.close()
})
</script>

<style scoped>
.page { padding: 18px 16px 40px; }
.tb-bar {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 10px 14px; border-radius: 16px; margin-bottom: 12px;
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(14px);
}
.tb-name { font-size: 15px; font-weight: 800; color: #141416; }
.tb-chip { font-size: 12px; color: #7d766c; }
.tb-chip b { color: #d9351f; }
.tb-conn { font-size: 12px; padding: 2px 10px; border-radius: 999px; background: rgba(0,0,0,.06); color: #7d766c; }
.tb-conn.open { background: rgba(46,125,50,.12); color: #2e7d32; }
.tb-conn.closed, .tb-conn.error { background: rgba(217,53,31,.12); color: #d9351f; }
.tb-btn {
  padding: 7px 14px; font-size: 13px; font-weight: 700; font-family: inherit;
  color: #fff; border: 0; cursor: pointer; border-radius: 10px;
  background: linear-gradient(135deg, #d9351f, #f58b4e);
}
.tb-btn:disabled { opacity: .55; cursor: default; }
.tb-btn.ghost { background: rgba(0,0,0,.06); color: #4a443c; }
.tb-btn.link { text-decoration: none; display: inline-flex; align-items: center; }
.tb-btn.ok { background: linear-gradient(135deg, #2e7d32, #66bb6a); }

.tb-pick {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 12px 14px; border-radius: 14px; margin-bottom: 12px;
  background: rgba(217,53,31,.07); border: 1px dashed rgba(217,53,31,.3);
}
.tb-pick-tip { font-size: 13px; color: #8a5a4c; font-weight: 600; }

.tb-seats {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;
}
.tb-seats-label { font-size: 12px; color: #8a7a5c; font-weight: 700; }
.tb-seat {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 11px; font-size: 12px; font-family: inherit; font-weight: 600;
  border-radius: 999px; cursor: pointer; color: #6b6357;
  border: 1.5px dashed rgba(0,0,0,.16); background: rgba(255,255,255,.7);
}
.tb-seat em { font-style: normal; font-size: 11px; opacity: .8; }
.tb-seat.taken { border-style: solid; }
.tb-seat.mine { border-color: #d9351f; color: #d9351f; background: rgba(217,53,31,.08); cursor: default; }
.tb-seat:disabled { opacity: .5; }

.tb-ask {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 12px 14px; border-radius: 14px; margin-bottom: 10px;
  background: rgba(255,255,255,.8); border: 1px solid rgba(217,53,31,.3);
  font-size: 13px; color: #4a443c;
}
.tb-msg { font-size: 13px; font-weight: 600; margin: 0 0 10px; }
.tb-msg.ok { color: #2e7d32; }
.tb-msg.err { color: #d9351f; }
.tb-wrap { margin-top: 6px; }
</style>
