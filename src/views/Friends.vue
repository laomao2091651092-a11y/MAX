<template>
  <div class="page">
    <div class="fr-card">
      <h1 class="fr-title">🤝 好友</h1>
      <p class="fr-sub">绿点表示对方在线（已连接实时通道）</p>

      <!-- 添加好友 -->
      <div class="fr-add">
        <input
          v-model="target"
          class="fr-input"
          placeholder="输入对方账号名"
          @keyup.enter="sendRequest"
        />
        <button class="fr-btn" :disabled="sending" @click="sendRequest">
          {{ sending ? '发送中…' : '加好友' }}
        </button>
      </div>
      <p v-if="msg" :class="['fr-msg', okFlag ? 'ok' : 'err']">{{ msg }}</p>

      <!-- 收到的申请 -->
      <div v-if="received.length" class="fr-section">
        <h2 class="fr-h2">📥 收到的申请</h2>
        <div v-for="r in received" :key="'r' + r.username" class="fr-row">
          <div class="fr-av">
            <img v-if="r.avatar" :src="r.avatar" alt="" />
            <span v-else>{{ firstLetter(r) }}</span>
          </div>
          <div class="fr-info">
            <div class="fr-name">{{ r.nickname || r.username }}</div>
            <div class="fr-uname">@{{ r.username }}</div>
          </div>
          <div class="fr-ops">
            <button class="fr-mini ok" @click="handleAccept(r.username)">同意</button>
            <button class="fr-mini no" @click="handleDecline(r.username)">拒绝</button>
          </div>
        </div>
      </div>

      <!-- 发出的申请 -->
      <div v-if="sent.length" class="fr-section">
        <h2 class="fr-h2">📤 发出的申请</h2>
        <div v-for="s in sent" :key="'s' + s.username" class="fr-row">
          <div class="fr-av">
            <img v-if="s.avatar" :src="s.avatar" alt="" />
            <span v-else>{{ firstLetter(s) }}</span>
          </div>
          <div class="fr-info">
            <div class="fr-name">{{ s.nickname || s.username }}</div>
            <div class="fr-uname">@{{ s.username }}</div>
          </div>
          <div class="fr-wait">等待对方同意…</div>
        </div>
      </div>

      <!-- 好友列表 -->
      <div class="fr-section">
        <h2 class="fr-h2">👥 我的好友（{{ friends.length }}）</h2>
        <div v-if="!friends.length" class="fr-empty">还没有好友，用上面的输入框加一个吧～</div>
        <div v-for="f in friends" :key="'f' + f.username" class="fr-row">
          <div class="fr-av">
            <img v-if="f.avatar" :src="f.avatar" alt="" />
            <span v-else>{{ firstLetter(f) }}</span>
            <i v-if="f.online" class="fr-dot" title="在线"></i>
          </div>
          <div class="fr-info">
            <div class="fr-name">{{ f.nickname || f.username }}</div>
            <div class="fr-uname">@{{ f.username }} · {{ f.online ? '在线' : '离线' }}</div>
          </div>
          <div class="fr-ops">
            <button class="fr-mini no" @click="handleRemove(f.username)">删除</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  listFriends, friendRequests, sendFriendRequest,
  acceptFriend, declineFriend, removeFriend
} from '../api.js'

const friends = ref([])
const sent = ref([])
const received = ref([])
const target = ref('')
const sending = ref(false)
const msg = ref('')
const okFlag = ref(false)

function firstLetter(u) {
  const n = (u && (u.nickname || u.username)) || '?'
  return String(n).charAt(0).toUpperCase()
}

async function load() {
  const [fr, rq] = await Promise.all([listFriends(), friendRequests()])
  if (fr.code === 0) friends.value = fr.friends || []
  if (rq.code === 0) {
    sent.value = rq.sent || []
    received.value = rq.received || []
  }
}

onMounted(load)

async function sendRequest() {
  msg.value = ''
  if (!target.value.trim()) return
  sending.value = true
  const d = await sendFriendRequest(target.value.trim())
  sending.value = false
  okFlag.value = d.code === 0
  msg.value = d.code === 0 ? '申请已发送' : (d.message || '发送失败')
  if (d.code === 0) { target.value = ''; load() }
}

async function handleAccept(u) {
  const d = await acceptFriend(u)
  okFlag.value = d.code === 0
  msg.value = d.code === 0 ? '已添加为好友' : (d.message || '操作失败')
  load()
}
async function handleDecline(u) {
  const d = await declineFriend(u)
  okFlag.value = d.code === 0
  msg.value = d.code === 0 ? '已拒绝' : (d.message || '操作失败')
  load()
}
async function handleRemove(u) {
  const d = await removeFriend(u)
  okFlag.value = d.code === 0
  msg.value = d.code === 0 ? '已删除好友' : (d.message || '操作失败')
  load()
}
</script>

<style scoped>
.fr-card {
  max-width: 620px;
  margin: 0 auto;
  padding: 34px 30px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
  box-shadow: 0 24px 56px rgba(120, 90, 50, 0.16);
}
.fr-title {
  font-size: 25px;
  font-weight: 800;
  color: #141416;
  margin-bottom: 6px;
}
.fr-sub {
  font-size: 13px;
  color: #7d766c;
  margin-bottom: 22px;
}
.fr-add {
  display: flex;
  gap: 10px;
}
.fr-input {
  flex: 1;
  padding: 11px 15px;
  font-size: 14px;
  font-family: inherit;
  color: #141416;
  border: 1.5px solid rgba(217, 53, 31, 0.22);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.86);
  outline: none;
}
.fr-input:focus {
  border-color: #d9351f;
  box-shadow: 0 0 0 4px rgba(217, 53, 31, 0.12);
}
.fr-btn {
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
.fr-btn:disabled { opacity: 0.6; cursor: default; }

.fr-msg {
  margin-top: 12px;
  font-size: 13px;
  font-weight: 600;
}
.fr-msg.ok { color: #2e7d32; }
.fr-msg.err { color: #d9351f; }

.fr-section {
  margin-top: 28px;
}
.fr-h2 {
  font-size: 15px;
  font-weight: 700;
  color: #4a443c;
  margin-bottom: 12px;
}
.fr-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
.fr-av {
  position: relative;
  width: 46px;
  height: 46px;
  border-radius: 13px;
  overflow: visible;
  background: linear-gradient(180deg, #fbe7c6, #f3d29a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: #7a4a16;
  flex: 0 0 auto;
}
.fr-av img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 13px;
}
.fr-dot {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #3fbf5f;
  border: 2px solid #fff;
}
.fr-info { flex: 1; min-width: 0; }
.fr-name {
  font-size: 15px;
  font-weight: 700;
  color: #141416;
}
.fr-uname {
  font-size: 12px;
  color: #8b847a;
}
.fr-ops { display: flex; gap: 8px; }
.fr-mini {
  padding: 7px 13px;
  border-radius: 10px;
  border: none;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.fr-mini.ok { background: #3fbf5f; color: #fff; }
.fr-mini.no { background: rgba(0, 0, 0, 0.07); color: #6b6560; }
.fr-wait {
  font-size: 12px;
  color: #9a938a;
}
.fr-empty {
  font-size: 13px;
  color: #9a938a;
  padding: 10px 2px;
}

@media (max-width: 600px) {
  .fr-card { padding: 24px 16px; border-radius: 20px; }
  .fr-add { flex-direction: column; }
}
</style>
