<template>
  <div class="page">
    <div class="ad-card">
      <h1 class="ad-title">🛡️ 管理后台</h1>
      <p class="ad-sub">查看所有注册账号，可以禁用 / 启用 / 删除</p>

      <p v-if="denied" class="ad-denied">🚫 只有超级管理员可以进入这里</p>

      <template v-else>
        <div v-if="loading" class="ad-tip">加载中…</div>

        <div v-else class="ad-table">
          <div class="ad-th">
            <span>账号</span><span>昵称</span><span>角色</span><span>状态</span><span>操作</span>
          </div>
          <div v-for="u in users" :key="u.id" class="ad-tr">
            <span class="ad-u">@{{ u.username }}</span>
            <span>{{ u.nickname || '-' }}</span>
            <span>
              <i :class="['ad-role', u.role === 'ADMIN' ? 'admin' : 'user']">
                {{ u.role === 'ADMIN' ? '管理员' : '普通' }}
              </i>
            </span>
            <span>
              <i :class="['ad-state', u.enabled ? 'on' : 'off']">
                {{ u.enabled ? '正常' : '已禁用' }}
              </i>
            </span>
            <span class="ad-ops">
              <button v-if="u.role !== 'ADMIN'" class="ad-btn" @click="toggle(u)">
                {{ u.enabled ? '禁用' : '启用' }}
              </button>
              <button v-if="u.role !== 'ADMIN'" class="ad-btn danger" @click="remove(u)">
                删除
              </button>
              <span v-if="u.role === 'ADMIN'" class="ad-tip">不可操作</span>
            </span>
          </div>
        </div>
      </template>

      <p v-if="msg" :class="['ad-msg', okFlag ? 'ok' : 'err']">{{ msg }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { adminListUsers, adminSetEnabled, adminDeleteUser } from '../api.js'
import { useAuth } from '../composables/useAuth.js'

const { state } = useAuth()
const me = computed(() => state.user)
const denied = computed(() => !me.value || me.value.role !== 'ADMIN')

const users = ref([])
const loading = ref(true)
const msg = ref('')
const okFlag = ref(false)

async function load() {
  loading.value = true
  const d = await adminListUsers()
  if (d.code === 0) users.value = d.users || []
  else { msg.value = d.message || '加载失败'; okFlag.value = false }
  loading.value = false
}

onMounted(() => {
  if (!denied.value) load()
  else loading.value = false
})

async function toggle(u) {
  const d = await adminSetEnabled(u.username, !u.enabled)
  okFlag.value = d.code === 0
  msg.value = d.code === 0 ? (u.enabled ? '已禁用' : '已启用') : (d.message || '操作失败')
  load()
}

async function remove(u) {
  if (!window.confirm(`确定删除账号「${u.username}」吗？此操作不可恢复。`)) return
  const d = await adminDeleteUser(u.username)
  okFlag.value = d.code === 0
  msg.value = d.code === 0 ? '已删除' : (d.message || '操作失败')
  load()
}
</script>

<style scoped>
.ad-card {
  max-width: 820px;
  margin: 0 auto;
  padding: 34px 30px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
  box-shadow: 0 24px 56px rgba(120, 90, 50, 0.16);
}
.ad-title {
  font-size: 25px;
  font-weight: 800;
  color: #141416;
  margin-bottom: 6px;
}
.ad-sub {
  font-size: 13px;
  color: #7d766c;
  margin-bottom: 22px;
}
.ad-denied {
  font-size: 14px;
  color: #d9351f;
  font-weight: 700;
}
.ad-tip {
  font-size: 13px;
  color: #9a938a;
}
.ad-table {
  border: 1px solid rgba(0, 0, 0, 0.07);
  border-radius: 14px;
  overflow: hidden;
}
.ad-th, .ad-tr {
  display: grid;
  grid-template-columns: 1.4fr 1fr 0.8fr 0.8fr 1.4fr;
  gap: 8px;
  padding: 12px 14px;
  align-items: center;
  font-size: 13px;
}
.ad-th {
  background: rgba(217, 53, 31, 0.07);
  font-weight: 700;
  color: #4a443c;
}
.ad-tr {
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  color: #2b2b30;
}
.ad-u { font-weight: 700; }
.ad-role, .ad-state {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}
.ad-role.admin { background: rgba(217, 53, 31, 0.12); color: #d9351f; }
.ad-role.user { background: rgba(0, 0, 0, 0.06); color: #6b6560; }
.ad-state.on { background: rgba(63, 191, 95, 0.14); color: #2e7d32; }
.ad-state.off { background: rgba(217, 53, 31, 0.12); color: #d9351f; }
.ad-ops { display: flex; gap: 8px; }
.ad-btn {
  padding: 6px 12px;
  border-radius: 9px;
  border: none;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.07);
  color: #4a443c;
}
.ad-btn.danger { background: rgba(217, 53, 31, 0.12); color: #d9351f; }
.ad-msg {
  margin-top: 16px;
  font-size: 13px;
  font-weight: 600;
}
.ad-msg.ok { color: #2e7d32; }
.ad-msg.err { color: #d9351f; }

@media (max-width: 700px) {
  .ad-card { padding: 24px 16px; border-radius: 20px; }
  .ad-th, .ad-tr {
    grid-template-columns: 1fr 1fr;
    row-gap: 6px;
  }
  .ad-th { display: none; }
}
</style>
