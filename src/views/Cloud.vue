<template>
  <div class="page cloud-page">
    <!-- 页面标题 -->
    <div class="cloud-head">
      <div class="eyebrow">Cloud Album</div>
      <h2>☁️ 云端相册</h2>
      <p>全部照片库，点 ⭐ 加入画廊展示，点 × 删除</p>
    </div>

    <!-- 上传按钮 + 文件选择 -->
    <input ref="fileInput" type="file" accept="image/*" hidden @change="onFileChange" />
    <div class="cloud-actions">
      <button class="upload-btn" :disabled="uploading" @click="triggerUpload">
        {{ uploading ? '上传中...' : '📤 上传新照片' }}
      </button>
      <span class="count">共 {{ photos.length }} 张 · 精选 {{ featuredCount }} 张</span>
    </div>

    <!-- 照片网格 -->
    <div v-if="photos.length" class="cloud-grid">
      <div v-for="p in photos" :key="p.id" class="cloud-card">
        <img :src="`${API_BASE}/uploads/${p.filename}`" :alt="p.title" class="cloud-img" @click="openPhoto(p)" />
        <div class="cloud-info">
          <div class="cloud-title">{{ p.title }}</div>
          <div class="cloud-cat">{{ p.category === 'portrait' ? '竖屏' : '横屏' }}</div>
        </div>
        <!-- 操作按钮 -->
        <div class="cloud-ops">
          <button
            class="op-btn"
            :class="{ on: p.isFeatured }"
            @click="toggleFeatured(p)"
            :title="p.isFeatured ? '移出画廊展示' : '加入画廊展示'"
          >{{ p.isFeatured ? '⭐' : '☆' }}</button>
          <button class="op-btn" @click="renamePhoto(p)" title="改名字">✏️</button>
          <button class="op-btn" @click="deletePhoto(p)" title="删除">🗑️</button>
        </div>
      </div>
    </div>
    <div v-else class="empty">还没有照片，点上面按钮上传第一张吧～</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const API_BASE = 'http://81.71.99.210'
const photos = ref([])
const uploading = ref(false)
const fileInput = ref(null)

const featuredCount = computed(() => photos.value.filter(p => p.isFeatured).length)

async function loadPhotos() {
  try {
    const res = await fetch(`${API_BASE}/api/photos`)
    photos.value = await res.json()
  } catch (e) {
    console.warn('后端未启动', e)
  }
}

function triggerUpload() { fileInput.value.click() }

async function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  const token = prompt('请输入上传密码：')
  if (!token) { e.target.value = ''; return }
  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', file.name.replace(/\.[^.]+$/, '').slice(0, 30))
    fd.append('category', prompt('分类：输 portrait=竖屏 / landscape=横屏', 'portrait'))
    const res = await fetch(`${API_BASE}/api/photos/upload`, {
      method: 'POST',
      headers: { 'X-Upload-Token': token },
      body: fd,
    })
    const data = await res.json()
    if (data.code === 0) { alert('✅ 上传成功'); loadPhotos() }
    else alert('❌ ' + data.message)
  } catch { alert('❌ 后端未启动') }
  finally { uploading.value = false; e.target.value = '' }
}

async function toggleFeatured(p) {
  const token = prompt('管理员密码：')
  if (!token) return
  try {
    const res = await fetch(`${API_BASE}/api/photos/${p.id}/featured?featured=${!p.isFeatured}`, {
      method: 'PUT',
      headers: { 'X-Upload-Token': token },
    })
    const data = await res.json()
    if (data.code === 0) loadPhotos()
    else alert('❌ ' + data.message)
  } catch { alert('❌ 失败') }
}

async function deletePhoto(p) {
  if (!confirm(`确定删除「${p.title}」吗？`)) return
  const token = prompt('管理员密码：')
  if (!token) return
  try {
    const res = await fetch(`${API_BASE}/api/photos/${p.id}`, {
      method: 'DELETE',
      headers: { 'X-Upload-Token': token },
    })
    const data = await res.json()
    if (data.code === 0) { alert('🗑️ 已删除'); loadPhotos() }
    else alert('❌ ' + data.message)
  } catch { alert('❌ 失败') }
}

async function renamePhoto(p) {
  const newName = prompt('改名字：', p.title)
  if (!newName || newName === p.title) return
  const token = prompt('管理员密码：')
  if (!token) return
  try {
    const res = await fetch(`${API_BASE}/api/photos/${p.id}/title?title=${encodeURIComponent(newName)}`, {
      method: 'PUT',
      headers: { 'X-Upload-Token': token },
    })
    const data = await res.json()
    if (data.code === 0) loadPhotos()
    else alert('❌ ' + data.message)
  } catch { alert('❌ 失败') }
}

function openPhoto(p) {
  window.open(`${API_BASE}/uploads/${p.filename}`, '_blank')
}

onMounted(loadPhotos)
</script>

<style scoped>
.cloud-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 100px 24px 80px;   /* 顶部留白，避免被导航挡住 */
}
.eyebrow {
  font-size: 11px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: #8b847a;
  margin-bottom: 12px;
}
.cloud-head h2 {
  font-size: clamp(32px, 4vw, 48px);
  font-weight: 800;
  margin-bottom: 10px;
}
.cloud-head p {
  color: #6b6560;
  margin-bottom: 28px;
}
.cloud-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}
.upload-btn {
  border: 0;
  cursor: pointer;
  padding: 12px 26px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #d9351f, #f58b4e);
  box-shadow: 0 6px 18px rgba(217, 53, 31, 0.3);
}
.count { color: #8b847a; font-size: 13px; }
.cloud-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 18px;
}

/* 手机端适配 */
@media (max-width: 600px) {
  .cloud-page {
    padding: 80px 16px 60px;
  }
  .cloud-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .cloud-img {
    height: 200px;
  }
  .cloud-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .upload-btn {
    width: 100%;
  }
}
.cloud-card {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  transition: transform 0.2s, box-shadow 0.2s;
}
.cloud-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 28px rgba(0,0,0,0.12);
}
.cloud-img {
  width: 100%;
  height: 260px;
  object-fit: cover;
  display: block;
  cursor: pointer;
}
.cloud-info {
  padding: 12px 14px;
}
.cloud-title {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cloud-cat {
  font-size: 12px;
  color: #8b847a;
  margin-top: 2px;
}
.cloud-ops {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 6px;
}
.op-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 0;
  cursor: pointer;
  font-size: 14px;
  background: rgba(0,0,0,0.5);
  color: #fff;
  backdrop-filter: blur(4px);
  transition: background 0.2s;
}
.op-btn.on {
  background: #f5a623;
}
.op-btn:hover { background: rgba(0,0,0,0.75); }
.empty {
  text-align: center;
  padding: 80px 0;
  color: #8b847a;
  font-size: 15px;
}
</style>
