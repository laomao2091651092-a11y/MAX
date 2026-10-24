<template>
  <div class="login-wrap">
    <div class="grain"></div>

    <div class="login-card">
      <div class="login-logo">
        <span class="logo-dot"></span>
        <span class="logo-name">{{ site.name }}</span>
      </div>

      <h1 class="login-title">✨ 注册账号</h1>
      <p class="login-sub">需要邀请码才能注册</p>

      <input v-model="username" class="login-input" placeholder="用户名（至少 2 个字）" />
      <input v-model="password" type="password" class="login-input" placeholder="密码（至少 4 位）" />
      <input v-model="inviteCode" class="login-input" placeholder="邀请码" />

      <p v-if="error" class="login-error">❌ {{ error }}</p>
      <p v-if="ok" class="login-ok">✅ {{ ok }}</p>

      <button class="login-btn" :disabled="loading" @click="submit">
        {{ loading ? '注册中…' : '注册' }}
      </button>

      <p class="login-tip">
        已有账号？<router-link to="/login" class="link">去登录</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { site } from '../data/site.js'
import { API_BASE, setAuth } from '../api.js'
import { useAuth } from '../composables/useAuth.js'

const username = ref('')
const password = ref('')
const inviteCode = ref('')
const error = ref('')
const ok = ref('')
const loading = ref(false)
const router = useRouter()
const { fetchMe } = useAuth()

async function submit() {
  error.value = ''
  ok.value = ''
  if (!username.value || !password.value || !inviteCode.value) {
    error.value = '请填完整哦'
    return
  }
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.value,
        password: password.value,
        inviteCode: inviteCode.value
      })
    })
    const data = await res.json()
    if (data.code === 0) {
      ok.value = '注册成功！正在自动登录…'
      // 注册完自动登录，直接进首页
      const lr = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.value, password: password.value })
      })
      const ld = await lr.json()
      if (ld.code === 0) {
        setAuth(ld.token, ld.username)
        await fetchMe()
        setTimeout(() => router.push('/'), 600)
      } else {
        setTimeout(() => router.push('/login'), 800)
      }
    } else {
      error.value = data.message || '注册失败'
    }
  } catch (e) {
    error.value = '网络错误，后端连不上？'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrap {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: radial-gradient(
    120% 70% at 50% 0%,
    #f8f3e7 0%,
    #f2ead6 60%,
    #e9dec3 100%
  );
  font-family: "DM Sans", system-ui, -apple-system, sans-serif;
}
.grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.04;
  background-image: radial-gradient(rgba(0, 0, 0, 0.8) 1px, transparent 1px);
  background-size: 4px 4px;
}
.login-card {
  position: relative;
  width: 100%;
  max-width: 420px;
  padding: 44px 36px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  box-shadow: 0 24px 60px rgba(120, 90, 50, 0.18);
  text-align: center;
}
.login-logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 16px;
  color: #141416;
  margin-bottom: 22px;
}
.logo-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(180deg, #d9351f, #fdc68a);
  box-shadow: 0 4px 8px -2px rgba(220, 60, 30, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    inset 0 -2px 3px rgba(120, 20, 0, 0.3);
}
.login-title {
  font-size: 26px;
  font-weight: 800;
  color: #141416;
  margin-bottom: 8px;
}
.login-sub {
  font-size: 14px;
  color: #6b6560;
  margin-bottom: 24px;
}
.login-input {
  width: 100%;
  padding: 14px 18px;
  margin-bottom: 12px;
  font-size: 16px;
  font-family: inherit;
  color: #141416;
  border: 1.5px solid rgba(217, 53, 31, 0.25);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.8);
  outline: none;
  transition: border-color 0.25s, box-shadow 0.25s;
}
.login-input:focus {
  border-color: #d9351f;
  box-shadow: 0 0 0 4px rgba(217, 53, 31, 0.12);
}
.login-error {
  margin-top: 4px;
  font-size: 13px;
  color: #d9351f;
  font-weight: 600;
}
.login-ok {
  margin-top: 4px;
  font-size: 13px;
  color: #2e7d32;
  font-weight: 600;
}
.login-btn {
  width: 100%;
  margin-top: 14px;
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
  transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
}
.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px rgba(217, 53, 31, 0.38);
}
.login-btn:disabled {
  opacity: 0.6;
  cursor: default;
  transform: none;
}
.login-tip {
  margin-top: 18px;
  font-size: 13px;
  color: #8b847a;
}
.link {
  color: #d9351f;
  font-weight: 600;
  text-decoration: none;
}
.link:hover {
  text-decoration: underline;
}
@media (max-width: 600px) {
  .login-card {
    padding: 36px 24px;
    border-radius: 22px;
  }
  .login-title {
    font-size: 22px;
  }
}
</style>
