import { reactive } from 'vue'
import { getMe, clearAuth, getUsername } from '../api.js'

// 全局单例：当前登录用户资料（昵称/头像/角色等）
const state = reactive({
  user: null,   // /api/user/me 返回的对象
  loaded: false
})

export function useAuth() {
  // 拉取“我”的资料；未登录则清空
  async function fetchMe() {
    if (!getUsername()) {
      state.user = null
      state.loaded = true
      return
    }
    const data = await getMe()
    if (data && data.code === 0) {
      state.user = data
    } else {
      state.user = null
    }
    state.loaded = true
  }

  function logout() {
    clearAuth()
    state.user = null
    state.loaded = false
  }

  return { state, fetchMe, logout }
}
