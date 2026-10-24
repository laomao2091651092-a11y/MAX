// ============================================================
// 统一接口配置（api.js）
// 生产环境：网站和后端同一域名，由宝塔反向代理把 /api 转到 8080
// 本地开发：vite 已配置 dev 代理，把 /api 转到 http://81.71.99.210:8080
// ============================================================

// 接口统一前缀（相对路径，配合代理；不要写死 IP/端口）
export const API_BASE = '/api'

// 取登录 token
export function getToken() {
  return localStorage.getItem('max_token')
}

// 存 / 清 登录信息（token + 用户名）
export function setAuth(token, username) {
  localStorage.setItem('max_token', token)
  if (username) localStorage.setItem('max_user', username)
}
export function clearAuth() {
  localStorage.removeItem('max_token')
  localStorage.removeItem('max_user')
}
export function getUsername() {
  return localStorage.getItem('max_user') || ''
}
export function isLoggedIn() {
  return !!localStorage.getItem('max_token')
}

// 带登录信息的请求头（没有 token 就返回空对象）
export function authHeader() {
  const t = getToken()
  return t ? { Authorization: 'Bearer ' + t } : {}
}

// ============================================================
// 统一请求 helper：自动带 token，返回解析后的 JSON
// ============================================================
async function authed(method, path, body) {
  const headers = { ...authHeader() }
  let payload
  if (body instanceof FormData) {
    payload = body
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  const res = await fetch(API_BASE + path, { method, headers, body: payload })
  try {
    return await res.json()
  } catch (e) {
    return { code: 1, message: '服务器返回异常' }
  }
}

// ---------- 用户资料 / 密码 ----------
export function getMe() {
  return authed('GET', '/user/me')
}
export function updateProfile(payload) {
  return authed('PUT', '/user/profile', payload)
}
export function changePassword(oldPassword, newPassword) {
  return authed('POST', '/auth/change-password', { oldPassword, newPassword })
}
export function uploadAvatar(file) {
  const fd = new FormData()
  fd.append('file', file)
  return authed('POST', '/user/avatar', fd)
}

// ---------- 好友 ----------
export function listFriends() {
  return authed('GET', '/friends')
}
export function friendRequests() {
  return authed('GET', '/friends/requests')
}
export function sendFriendRequest(target) {
  return authed('POST', '/friends/request', { target })
}
export function acceptFriend(requester) {
  return authed('POST', '/friends/accept', { requester })
}
export function declineFriend(requester) {
  return authed('POST', '/friends/decline', { requester })
}
export function removeFriend(friend) {
  return authed('POST', '/friends/remove', { friend })
}

// ---------- 管理员 ----------
export function adminListUsers() {
  return authed('GET', '/admin/users')
}
export function adminSetEnabled(username, enabled) {
  return authed('POST', `/admin/users/${encodeURIComponent(username)}/enabled`, { enabled })
}
export function adminDeleteUser(username) {
  return authed('DELETE', `/admin/users/${encodeURIComponent(username)}`)
}

// ---------- 房间（好友对战，P5 用，先备好接口） ----------
export function listRooms() {
  return authed('GET', '/rooms')
}
export function createRoom(name) {
  return authed('POST', '/rooms', name ? { name } : {})
}
export function joinRoom(roomId) {
  return authed('POST', '/rooms/join', { roomId })
}
export function leaveRoom(roomId) {
  return authed('POST', '/rooms/leave', { roomId })
}
export function roomDetail(roomId) {
  return authed('GET', `/rooms/${encodeURIComponent(roomId)}`)
}
export function seatRoom(roomId, seat) {
  return authed('POST', '/rooms/seat', { roomId, seat })
}
export function startRoom(roomId) {
  return authed('POST', '/rooms/start', { roomId })
}
// 换座（已通过 WebSocket 取得对方同意后落库）：a / b 为 0=北 1=东 2=南 3=西
export function swapRoom(roomId, a, b) {
  return authed('POST', '/rooms/swap', { roomId, a, b })
}
