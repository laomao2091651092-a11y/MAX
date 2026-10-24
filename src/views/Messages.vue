<template>
  <div class="page msg-page">
    <div class="msg-head">
      <div class="eyebrow">Whisper</div>
      <h2>💬 我们的悄悄话</h2>
      <p>只有我们两个人能看到的留言板</p>
    </div>

    <!-- 留言列表 -->
    <div class="msg-list" ref="listRef">
      <div v-for="m in messages" :key="m.id" class="msg-row" :class="{ me: m.sender === me }">
        <div class="bubble">
          <div class="msg-meta">{{ m.sender === me ? '我' : m.sender }} · {{ m.createdAt }}</div>
          <div class="msg-text">{{ m.content }}</div>
        </div>
      </div>
      <div v-if="!messages.length" class="empty">还没有留言，说点什么吧～</div>
    </div>

    <!-- 输入框 -->
    <div class="msg-input">
      <textarea
        v-model="text"
        rows="1"
        placeholder="写点悄悄话…（回车发送）"
        @keyup.enter.exact="send"
      ></textarea>
      <button class="send-btn" :disabled="sending || !text.trim()" @click="send">发送 💌</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { API_BASE, authHeader, getUsername } from '../api.js'

const messages = ref([])
const text = ref('')
const sending = ref(false)
const me = ref(getUsername())
const listRef = ref(null)

async function load() {
  try {
    const res = await fetch(`${API_BASE}/messages`, { headers: authHeader() })
    messages.value = await res.json()
    scrollBottom()
  } catch (e) {
    console.warn('加载留言失败', e)
  }
}

async function send() {
  const content = text.value.trim()
  if (!content) return
  sending.value = true
  try {
    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ content })
    })
    const data = await res.json()
    if (data.code === 0) {
      messages.value.push(data.data)
      text.value = ''
      await nextTick()
      scrollBottom()
    } else {
      alert('❌ ' + (data.message || '发送失败'))
    }
  } catch (e) {
    alert('❌ 网络错误，后端连不上？')
  } finally {
    sending.value = false
  }
}

function scrollBottom() {
  nextTick(() => {
    if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight
  })
}

onMounted(load)
</script>

<style scoped>
.msg-page {
  display: flex;
  flex-direction: column;
  max-width: 720px;
  margin: 0 auto;
  min-height: 100vh;
}
.msg-head {
  text-align: center;
  margin-bottom: 18px;
}
.eyebrow {
  font-size: 11px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: #8b847a;
  margin-bottom: 10px;
}
.msg-head h2 {
  font-size: clamp(26px, 4vw, 38px);
  font-weight: 800;
  margin-bottom: 6px;
}
.msg-head p {
  color: #6b6560;
  font-size: 14px;
}

.msg-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  padding: 6px 4px;
  max-height: calc(100vh - 320px);
}
.msg-row {
  display: flex;
}
.msg-row.me {
  justify-content: flex-end;
}
.bubble {
  max-width: 75%;
  padding: 10px 14px;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.msg-row.me .bubble {
  background: linear-gradient(135deg, #d9351f, #f58b4e);
  color: #fff;
}
.msg-meta {
  font-size: 11px;
  opacity: 0.7;
  margin-bottom: 4px;
}
.msg-text {
  font-size: 15px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
.empty {
  text-align: center;
  color: #8b847a;
  padding: 40px 0;
  font-size: 15px;
}

.msg-input {
  display: flex;
  gap: 10px;
  padding: 14px 0 4px;
  position: sticky;
  bottom: 0;
}
.msg-input textarea {
  flex: 1;
  resize: none;
  border: 1.5px solid rgba(217, 53, 31, 0.25);
  border-radius: 14px;
  padding: 12px 14px;
  font-family: inherit;
  font-size: 15px;
  outline: none;
  background: rgba(255, 255, 255, 0.85);
}
.msg-input textarea:focus {
  border-color: #d9351f;
  box-shadow: 0 0 0 4px rgba(217, 53, 31, 0.12);
}
.send-btn {
  border: 0;
  background: linear-gradient(135deg, #d9351f, #f58b4e);
  color: #fff;
  border-radius: 14px;
  padding: 0 20px;
  font-weight: 700;
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 8px 18px rgba(217, 53, 31, 0.28);
}
.send-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

@media (max-width: 600px) {
  .msg-list {
    max-height: calc(100vh - 300px);
  }
  .msg-input textarea {
    font-size: 16px;
  }
}
</style>
