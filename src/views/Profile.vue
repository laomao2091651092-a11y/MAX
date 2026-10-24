<template>
  <div class="page">
    <div class="pf-card">
      <h1 class="pf-title">👤 个人资料</h1>
      <p class="pf-sub">编辑昵称、生日和头像；账号（用户名）注册后不可修改</p>

      <!-- 头像区 -->
      <div class="pf-avatar-row">
        <div class="pf-avatar-box">
          <img v-if="form.avatar" :src="form.avatar" alt="我的头像" />
          <span v-else class="pf-avatar-letter">{{ letter }}</span>
        </div>
        <div class="pf-avatar-actions">
          <label class="pf-file-btn">
            {{ uploading ? '上传中…' : '选择 jpg 头像' }}
            <input type="file" accept="image/jpeg,image/jpg" @change="onPickAvatar" />
          </label>
          <button v-if="form.avatar" class="pf-file-clear" type="button" @click="clearAvatar">
            移除头像
          </button>
          <p class="pf-hint">只支持 jpg，建议正方形，不超过 8MB</p>
        </div>
      </div>

      <!-- 资料表单 -->
      <label class="pf-label">昵称（显示名）</label>
      <input v-model="form.nickname" class="pf-input" placeholder="默认就是账号名" />

      <label class="pf-label">生日</label>
      <input v-model="form.birthday" type="date" class="pf-input" />

      <label class="pf-label">账号（不可修改）</label>
      <input :value="form.username" class="pf-input" disabled />

      <div v-if="me && me.role === 'ADMIN'" class="pf-badge">🛡️ 超级管理员</div>

      <p v-if="msg" :class="['pf-msg', okFlag ? 'ok' : 'err']">{{ msg }}</p>

      <button class="pf-save" :disabled="saving" @click="save">
        {{ saving ? '保存中…' : '保存资料' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { updateProfile, uploadAvatar } from '../api.js'

const { state, fetchMe } = useAuth()
const me = computed(() => state.user)

const form = reactive({
  username: '',
  nickname: '',
  birthday: '',
  avatar: ''
})
const saving = ref(false)
const uploading = ref(false)
const msg = ref('')
const okFlag = ref(false)

const letter = computed(() => {
  const n = form.nickname || form.username || '?'
  return String(n).charAt(0).toUpperCase()
})

onMounted(async () => {
  if (!state.user) await fetchMe()
  if (state.user) {
    form.username = state.user.username || ''
    form.nickname = state.user.nickname || ''
    form.birthday = state.user.birthday || ''
    form.avatar = state.user.avatar || ''
  }
})

// 选了头像就立刻上传，成功后回填地址
async function onPickAvatar(e) {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  msg.value = ''
  uploading.value = true
  const data = await uploadAvatar(file)
  uploading.value = false
  if (data.code === 0) {
    form.avatar = data.url
    await fetchMe()
    msg.value = '头像已更新，记得点「保存资料」'
    okFlag.value = true
  } else {
    msg.value = data.message || '头像上传失败'
    okFlag.value = false
  }
  e.target.value = ''
}

function clearAvatar() {
  form.avatar = ''
}

async function save() {
  msg.value = ''
  saving.value = true
  const data = await updateProfile({
    nickname: form.nickname,
    birthday: form.birthday,
    avatar: form.avatar
  })
  saving.value = false
  if (data.code === 0) {
    msg.value = '资料已保存～'
    okFlag.value = true
    await fetchMe()
  } else {
    msg.value = data.message || '保存失败'
    okFlag.value = false
  }
}
</script>

<style scoped>
.pf-card {
  max-width: 560px;
  margin: 0 auto;
  padding: 36px 32px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
  box-shadow: 0 24px 56px rgba(120, 90, 50, 0.16);
}
.pf-title {
  font-size: 26px;
  font-weight: 800;
  color: #141416;
  margin-bottom: 6px;
}
.pf-sub {
  font-size: 13px;
  color: #7d766c;
  margin-bottom: 26px;
}

/* 头像 */
.pf-avatar-row {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 26px;
}
.pf-avatar-box {
  width: 88px;
  height: 88px;
  border-radius: 20px;
  overflow: hidden;
  background: linear-gradient(180deg, #fbe7c6, #f3d29a);
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 10px 22px -10px rgba(180, 130, 60, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}
.pf-avatar-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.pf-avatar-letter {
  font-size: 34px;
  font-weight: 800;
  color: #7a4a16;
}
.pf-avatar-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.pf-file-btn {
  display: inline-block;
  padding: 10px 18px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f0c274, #e2a95c);
  color: #4a2f0d;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 18px -8px rgba(180, 130, 60, 0.7);
}
.pf-file-btn input {
  display: none;
}
.pf-file-clear {
  background: none;
  border: none;
  color: #a8632f;
  font-size: 12px;
  cursor: pointer;
  text-align: left;
  padding: 0;
  font-family: inherit;
}
.pf-hint {
  font-size: 12px;
  color: #9a938a;
}

/* 表单 */
.pf-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #4a443c;
  margin: 16px 0 6px;
}
.pf-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 15px;
  font-family: inherit;
  color: #141416;
  border: 1.5px solid rgba(217, 53, 31, 0.22);
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.86);
  outline: none;
  transition: border-color 0.25s, box-shadow 0.25s;
}
.pf-input:focus {
  border-color: #d9351f;
  box-shadow: 0 0 0 4px rgba(217, 53, 31, 0.12);
}
.pf-input:disabled {
  background: rgba(0, 0, 0, 0.04);
  color: #8b847a;
}

.pf-badge {
  margin-top: 18px;
  display: inline-block;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(217, 53, 31, 0.1);
  color: #d9351f;
  font-size: 13px;
  font-weight: 700;
}

.pf-msg {
  margin-top: 16px;
  font-size: 13px;
  font-weight: 600;
}
.pf-msg.ok { color: #2e7d32; }
.pf-msg.err { color: #d9351f; }

.pf-save {
  width: 100%;
  margin-top: 22px;
  padding: 14px;
  font-size: 15px;
  font-weight: 700;
  font-family: inherit;
  color: #fff;
  border: 0;
  cursor: pointer;
  border-radius: 14px;
  background: linear-gradient(135deg, #d9351f, #f58b4e);
  box-shadow: 0 10px 24px rgba(217, 53, 31, 0.3);
  transition: transform 0.2s;
}
.pf-save:hover { transform: translateY(-2px); }
.pf-save:disabled { opacity: 0.6; cursor: default; transform: none; }

@media (max-width: 600px) {
  .pf-card { padding: 26px 18px; border-radius: 20px; }
  .pf-avatar-row { flex-direction: column; align-items: flex-start; }
}
</style>
