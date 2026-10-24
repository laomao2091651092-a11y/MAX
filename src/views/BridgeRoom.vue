<template>
  <div class="page">
    <div class="rm-card">
      <!-- ========== 还没进房间：房间列表 ========== -->
      <template v-if="!current">
        <h1 class="rm-title">🧑‍🤝‍🧑 好友对战</h1>
        <p class="rm-sub">选一个房间加入，或者自己开一桌</p>

        <div class="rm-create">
          <input v-model="newName" class="rm-input" placeholder="房间名（可留空）" />
          <button class="rm-btn" :disabled="busy" @click="create">＋ 创建房间</button>
        </div>

        <div class="rm-list">
          <h2 class="rm-h2">房间列表（{{ rooms.length }}）</h2>
          <div v-if="!rooms.length" class="rm-empty">还没有房间，点上面「创建房间」开一桌吧～</div>
          <div v-for="r in rooms" :key="r.id" class="rm-row">
            <div class="rm-room-info">
              <div class="rm-room-name">{{ r.name }}</div>
              <div class="rm-room-meta">
                房号 {{ r.id }} · 房主 {{ r.host }} · {{ r.status === 'PLAYING' ? '进行中' : '等待中' }}
              </div>
              <div class="rm-seats-mini">
                <span v-for="(s, i) in r.seats" :key="i" :class="['rm-seat-mini', s ? 'taken' : '']">
                  {{ SEAT_CN[i] }}{{ s ? '·有人' : '·空' }}
                </span>
              </div>
            </div>
            <button class="rm-btn small" :disabled="busy" @click="join(r.id)">加入</button>
          </div>
        </div>

        <router-link to="/bridge" class="rm-back">← 返回模式选择</router-link>
      </template>

      <!-- ========== 已经进房间：牌桌座位 ========== -->
      <template v-else>
        <h1 class="rm-title">{{ current.name }}</h1>
        <p class="rm-sub">
          房号 <b>{{ current.id }}</b> · 房主 {{ current.host }} ·
          {{ current.status === 'PLAYING' ? '进行中' : '等待开始' }}
        </p>

        <!-- 四个座位：北(0) 东(1) 南(2) 西(3) -->
        <div class="rm-table">
          <div class="rm-row-seat">
            <div :class="seatClass(0)" @click="sit(0)">
              <div class="sb-dir">北</div>
              <div v-if="current.seats[0]" class="sb-who">
                {{ current.seats[0] === myName ? '我' : current.seats[0] }}
              </div>
              <div v-else class="sb-empty">空位</div>
              <div v-if="!current.seats[0]" class="sb-act">坐下</div>
            </div>
          </div>

          <div class="rm-row-seat mid">
            <div :class="seatClass(3)" @click="sit(3)">
              <div class="sb-dir">西</div>
              <div v-if="current.seats[3]" class="sb-who">
                {{ current.seats[3] === myName ? '我' : current.seats[3] }}
              </div>
              <div v-else class="sb-empty">空位</div>
              <div v-if="!current.seats[3]" class="sb-act">坐下</div>
            </div>

            <div class="rm-center">
              <div class="rm-center-label">牌桌</div>
              <div v-if="current.status !== 'PLAYING'" class="rm-center-hint">坐好后点开始</div>
              <div v-else class="rm-center-hint on">进行中</div>
            </div>

            <div :class="seatClass(1)" @click="sit(1)">
              <div class="sb-dir">东</div>
              <div v-if="current.seats[1]" class="sb-who">
                {{ current.seats[1] === myName ? '我' : current.seats[1] }}
              </div>
              <div v-else class="sb-empty">空位</div>
              <div v-if="!current.seats[1]" class="sb-act">坐下</div>
            </div>
          </div>

          <div class="rm-row-seat">
            <div :class="seatClass(2)" @click="sit(2)">
              <div class="sb-dir">南</div>
              <div v-if="current.seats[2]" class="sb-who">
                {{ current.seats[2] === myName ? '我' : current.seats[2] }}
              </div>
              <div v-else class="sb-empty">空位</div>
              <div v-if="!current.seats[2]" class="sb-act">坐下</div>
            </div>
          </div>
        </div>

        <p class="rm-tip">空位在开局后由电脑替补；点空座位即可坐下，点已占用的座位会发换座请求，对方同意后才换</p>

        <div v-if="incoming" class="rm-ask">
          <span><b>{{ incoming.by }}</b> 想和你换位置（{{ SEAT_CN[incoming.from] }} ↔ {{ SEAT_CN[incoming.to] }}），同意吗？</span>
          <button class="rm-btn ok" @click="acceptSwap">同意</button>
          <button class="rm-btn ghost" @click="declineSwap">拒绝</button>
        </div>

        <div class="rm-ops">
          <button class="rm-btn" :disabled="busy" @click="start">
            {{ current.status === 'PLAYING' ? '重新开始' : '开始玩' }}
          </button>
          <button class="rm-btn ghost" :disabled="busy" @click="leave">离开房间</button>
          <router-link to="/bridge" class="rm-btn ghost link">返回模式</router-link>
        </div>

        <p v-if="msg" :class="['rm-msg', okFlag ? 'ok' : 'err']">{{ msg }}</p>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { listRooms, createRoom, joinRoom, leaveRoom, roomDetail, seatRoom, swapRoom, startRoom, getToken, getUsername } from '../api.js'
import { useAuth } from '../composables/useAuth.js'
import { createRoomSocket } from '../composables/useRoomSocket.js'

const SEAT_CN = ['北', '东', '南', '西']

const router = useRouter()
const { state } = useAuth()
const myName = computed(() => (state.user && state.user.username) || getUsername())

const rooms = ref([])
const current = ref(null)
const newName = ref('')
const busy = ref(false)
const msg = ref('')
const okFlag = ref(false)
const incoming = ref(null) // 收到的换座请求
let timer = null
let sock = null
let inTable = false

// 座位样式：有人 / 空位 / 是我
function seatClass(i) {
  const who = current.value && current.value.seats[i]
  return ['sb', who ? 'taken' : 'free', who && who === myName.value ? 'mine' : '']
}
function mySeatIdx() {
  const s = current.value && current.value.seats
  return s ? s.indexOf(myName.value) : -1
}

async function loadRooms() {
  const d = await listRooms()
  if (d.code === 0) rooms.value = d.rooms || []
}

async function refreshCurrent() {
  if (!current.value) return
  const d = await roomDetail(current.value.id)
  if (d.code !== 0) return
  current.value = d.room
  // 房间里有人开了局，大家自动一起进牌桌
  if (d.room.status === 'PLAYING' && !inTable) {
    inTable = true
    stopPolling()
    router.push('/bridge/table/' + d.room.id)
  }
}

/* ---------- 实时通道：座位同步 + 换座请求 ---------- */
function onMsg(m) {
  if (!m || m.sender === myName.value) return
  if (m.t === 'seats') refreshCurrent()
  else if (m.t === 'swapReq' && m.to === mySeatIdx()) incoming.value = { by: m.by, from: m.from, to: m.to }
  else if (m.t === 'swapDecline' && m.to === mySeatIdx()) { msg.value = '对方拒绝了换座请求'; okFlag.value = false }
}
function openSocket(id) {
  closeSocket()
  sock = createRoomSocket({ roomId: id, token: getToken(), onMessage: onMsg, onStatus: () => {} })
}
function closeSocket() { if (sock) { sock.close(); sock = null } }

async function create() {
  busy.value = true
  const d = await createRoom(newName.value.trim())
  busy.value = false
  if (d.code === 0) {
    current.value = d.room
    newName.value = ''
    openSocket(d.room.id)
    startPolling()
  } else {
    msg.value = d.message || '创建失败'
    okFlag.value = false
  }
}

async function join(id) {
  busy.value = true
  const d = await joinRoom(id)
  busy.value = false
  if (d.code === 0) {
    current.value = d.room
    openSocket(d.room.id)
    startPolling()
  } else {
    msg.value = d.message || '加入失败'
    okFlag.value = false
  }
}

async function sit(seatIdx) {
  if (!current.value) return
  const occupant = current.value.seats[seatIdx]
  if (occupant === myName.value) return
  if (occupant) {
    const from = mySeatIdx()
    if (from < 0) { msg.value = '先找个空位坐下，才能发起换座'; okFlag.value = false; return }
    if (sock) sock.send({ t: 'swapReq', from, to: seatIdx, by: myName.value })
    msg.value = `已向 ${occupant} 发出换座请求，等对方同意…`
    okFlag.value = true
    return
  }
  busy.value = true
  const d = await seatRoom(current.value.id, seatIdx)
  busy.value = false
  if (d.code === 0) {
    current.value = d.room
    if (sock) sock.send({ t: 'seats' })
    msg.value = ''
  } else {
    msg.value = d.message || '入座失败'
    okFlag.value = false
  }
}

async function acceptSwap() {
  const r = incoming.value
  if (!r) return
  incoming.value = null
  busy.value = true
  const d = await swapRoom(current.value.id, r.from, r.to)
  busy.value = false
  await refreshCurrent()
  if (sock) sock.send({ t: 'seats' })
  msg.value = d.code === 0 ? '换座成功' : (d.message || '换座失败')
  okFlag.value = d.code === 0
}

function declineSwap() {
  const r = incoming.value
  if (!r) return
  incoming.value = null
  if (sock) sock.send({ t: 'swapDecline', to: r.from, by: myName.value })
}

async function start() {
  busy.value = true
  const d = await startRoom(current.value.id)
  busy.value = false
  if (d.code === 0) {
    current.value = d.room
    msg.value = ''
    inTable = true
    stopPolling()
    router.push('/bridge/table/' + d.room.id)
  } else {
    msg.value = d.message || '开始失败'
    okFlag.value = false
  }
}

async function leave() {
  busy.value = true
  await leaveRoom(current.value.id)
  busy.value = false
  closeSocket()
  current.value = null
  stopPolling()
  loadRooms()
}

function startPolling() {
  stopPolling()
  timer = setInterval(refreshCurrent, 3000)
}
function stopPolling() {
  if (timer) { clearInterval(timer); timer = null }
}

onMounted(loadRooms)
onBeforeUnmount(() => { stopPolling(); closeSocket() })
</script>

<style scoped>
.rm-card {
  max-width: 700px;
  margin: 0 auto;
  padding: 34px 30px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
  box-shadow: 0 24px 56px rgba(120, 90, 50, 0.16);
}
.rm-title {
  font-size: 25px;
  font-weight: 800;
  color: #141416;
  margin-bottom: 6px;
}
.rm-sub {
  font-size: 13px;
  color: #7d766c;
  margin-bottom: 22px;
}
.rm-create {
  display: flex;
  gap: 10px;
  margin-bottom: 26px;
}
.rm-input {
  flex: 1;
  padding: 11px 15px;
  font-size: 14px;
  font-family: inherit;
  border: 1.5px solid rgba(217, 53, 31, 0.22);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.86);
  outline: none;
}
.rm-input:focus {
  border-color: #d9351f;
  box-shadow: 0 0 0 4px rgba(217, 53, 31, 0.12);
}
.rm-btn {
  padding: 11px 20px;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  color: #fff;
  border: 0;
  cursor: pointer;
  border-radius: 12px;
  background: linear-gradient(135deg, #d9351f, #f58b4e);
  box-shadow: 0 8px 18px -6px rgba(217, 53, 31, 0.45);
}
.rm-btn:disabled { opacity: 0.6; cursor: default; }
.rm-btn.small { padding: 8px 14px; font-size: 13px; }
.rm-btn.ghost {
  background: rgba(0, 0, 0, 0.06);
  color: #4a443c;
  box-shadow: none;
}
.rm-btn.ok { background: linear-gradient(135deg, #2e7d32, #66bb6a); }
.rm-ask {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 12px 14px; border-radius: 14px; margin-bottom: 14px;
  background: rgba(255, 255, 255, 0.8); border: 1px solid rgba(217, 53, 31, 0.3);
  font-size: 13px; color: #4a443c;
}
.rm-btn.link { text-decoration: none; display: inline-flex; align-items: center; }
.rm-h2 {
  font-size: 15px;
  font-weight: 700;
  color: #4a443c;
  margin-bottom: 12px;
}
.rm-list { margin-top: 8px; }
.rm-empty { font-size: 13px; color: #9a938a; }
.rm-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 4px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
.rm-room-info { flex: 1; min-width: 0; }
.rm-room-name { font-size: 15px; font-weight: 700; color: #141416; }
.rm-room-meta { font-size: 12px; color: #8b847a; margin-top: 2px; }
.rm-seats-mini { display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap; }
.rm-seat-mini {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.05);
  color: #8b847a;
}
.rm-seat-mini.taken { background: rgba(217, 53, 31, 0.1); color: #d9351f; }

/* 牌桌座位 */
.rm-table {
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
  margin: 8px 0 18px;
}
.rm-row-seat { display: flex; justify-content: center; }
.rm-row-seat.mid {
  display: flex;
  align-items: center;
  gap: 18px;
  width: 100%;
  justify-content: center;
}
.rm-center {
  width: 130px;
  height: 90px;
  border-radius: 16px;
  background: radial-gradient(120% 90% at 50% 0%, #2f6b4f, #1d4433);
  color: #eaf5ee;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.35);
}
.rm-center-label { font-size: 13px; font-weight: 700; opacity: 0.9; }
.rm-center-hint { font-size: 11px; opacity: 0.75; }
.rm-center-hint.on { color: #9ff0b8; }

/* 座位盒子 */
.sb {
  width: 92px;
  padding: 10px 8px;
  border-radius: 14px;
  text-align: center;
  cursor: pointer;
  border: 1.5px dashed rgba(0, 0, 0, 0.18);
  background: rgba(255, 255, 255, 0.7);
  transition: all 0.2s;
}
.sb:hover { border-color: #d9351f; }
.sb.taken { border-style: solid; border-color: rgba(0, 0, 0, 0.12); }
.sb.mine { border-color: #d9351f; background: rgba(217, 53, 31, 0.08); }
.sb-dir { font-size: 12px; font-weight: 700; color: #8a7a5c; }
.sb-who { font-size: 13px; font-weight: 700; color: #141416; margin-top: 2px; }
.sb-empty { font-size: 13px; color: #9a938a; margin-top: 2px; }
.sb-act { font-size: 11px; color: #d9351f; margin-top: 4px; }

.rm-tip {
  font-size: 12px;
  color: #9a938a;
  margin-bottom: 18px;
  line-height: 1.6;
}
.rm-ops { display: flex; gap: 10px; flex-wrap: wrap; }
.rm-back {
  display: inline-block;
  margin-top: 22px;
  font-size: 13px;
  color: #8a7a5c;
  text-decoration: none;
}
.rm-back:hover { color: #d9351f; }
.rm-msg { margin-top: 14px; font-size: 13px; font-weight: 600; }
.rm-msg.ok { color: #2e7d32; }
.rm-msg.err { color: #d9351f; }

@media (max-width: 600px) {
  .rm-card { padding: 24px 16px; border-radius: 20px; }
  .rm-create { flex-direction: column; }
  .sb { width: 78px; }
}
</style>
