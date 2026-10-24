<template>
  <div class="page">
    <div class="pw-card">
      <h1 class="pw-title">🔑 修改密码</h1>
      <p class="pw-sub">账号名不改，只改登录密码</p>

      <label class="pw-label">原密码</label>
      <input v-model="oldPwd" type="password" class="pw-input" placeholder="当前使用的密码" />

      <label class="pw-label">新密码（至少 4 位）</label>
      <input v-model="newPwd" type="password" class="pw-input" placeholder="新密码" />

      <label class="pw-label">确认新密码</label>
      <input v-model="confirmPwd" type="password" class="pw-input" placeholder="再输一次新密码" @keyup.enter="submit" />

      <p v-if="msg" :class="['pw-msg', okFlag ? 'ok' : 'err']">{{ msg }}</p>

      <button class="pw-btn" :disabled="saving" @click="submit">
        {{ saving ? '提交中…' : '确认修改' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { changePassword, clearAuth } from '../api.js'
import { useAuth } from '../composables/useAuth.js'
import { useRouter } from 'vue-router'

const oldPwd = ref('')
const newPwd = ref('')
const confirmPwd = ref('')
const saving = ref(false)
const msg = ref('')
const okFlag = ref(false)
const router = useRouter()
const { logout } = useAuth()

async function submit() {
  msg.value = ''
  if (!oldPwd.value || !newPwd.value) {
    msg.value = '请把密码填完整'
    okFlag.value = false
    return
  }
  if (newPwd.value.length < 4) {
    msg.value = '新密码至少 4 位'
    okFlag.value = false
    return
  }
  if (newPwd.value !== confirmPwd.value) {
    msg.value = '两次输入的新密码不一致'
    okFlag.value = false
    return
  }
  saving.value = true
  const data = await changePassword(oldPwd.value, newPwd.value)
  saving.value = false
  if (data.code === 0) {
    msg.value = '密码修改成功，请用新密码重新登录'
    okFlag.value = true
    // 改密后旧 token 仍然有效，这里直接清掉并回登录页，更安全
    setTimeout(() => {
      logout()
      router.push('/login')
    }, 900)
  } else {
    msg.value = data.message || '修改失败'
    okFlag.value = false
  }
}
</script>

<style scoped>
.pw-card {
  max-width: 460px;
  margin: 0 auto;
  padding: 36px 32px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
  box-shadow: 0 24px 56px rgba(120, 90, 50, 0.16);
}
.pw-title {
  font-size: 25px;
  font-weight: 800;
  color: #141416;
  margin-bottom: 6px;
}
.pw-sub {
  font-size: 13px;
  color: #7d766c;
  margin-bottom: 24px;
}
.pw-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #4a443c;
  margin: 16px 0 6px;
}
.pw-input {
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
.pw-input:focus {
  border-color: #d9351f;
  box-shadow: 0 0 0 4px rgba(217, 53, 31, 0.12);
}
.pw-msg {
  margin-top: 16px;
  font-size: 13px;
  font-weight: 600;
}
.pw-msg.ok { color: #2e7d32; }
.pw-msg.err { color: #d9351f; }
.pw-btn {
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
.pw-btn:hover { transform: translateY(-2px); }
.pw-btn:disabled { opacity: 0.6; cursor: default; transform: none; }

@media (max-width: 600px) {
  .pw-card { padding: 26px 18px; border-radius: 20px; }
}
</style>
