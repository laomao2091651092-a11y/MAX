// ============================================================
// 桥牌页照片的共享状态（单例）
// 为什么要单例：电脑端左右两块照片栏、手机端照片条是多个组件，
// 如果各自 fetch 一份数据，删掉一张后别的组件列表还是旧的，
// 再点删除就会删同一个 id → 后端报「照片不存在」。共用一份就没这问题。
//
// 两类照片：
//   bridge           → 横图（普通用户上传，左边 4 张 + 手机端切换）
//   bridge_vertical  → 竖图（仅管理员可改，右边专属 1 张）
// ============================================================
import { ref } from 'vue'
import { API_BASE, authHeader } from '../api.js'

const CATEGORY_H = 'bridge'          // 横图
const CATEGORY_V = 'bridge_vertical' // 竖图（管理员专属）

const photos = ref([])         // 横图列表
const verticalPhotos = ref([]) // 竖图列表（一般只有 1 张在用）
const uploading = ref(false)
const loading = ref(false)

let loadedOnce = false
let inflight = null

export function useBridgePhotos() {
  // 拉取桥牌页照片（多个组件同时调用只会发一次请求）
  async function load(force = false) {
    if (loadedOnce && !force) return
    if (inflight) return inflight
    loading.value = true
    inflight = (async () => {
      try {
        const res = await fetch(`${API_BASE}/photos`, { headers: authHeader() })
        if (!res.ok) throw new Error('HTTP ' + res.status)
        const all = await res.json()
        const list = Array.isArray(all) ? all : []
        photos.value = list.filter(p => p.category === CATEGORY_H)
        verticalPhotos.value = list.filter(p => p.category === CATEGORY_V)
        loadedOnce = true
      } catch (e) {
        // 加载失败不覆盖已有列表，交给调用方提示
      } finally {
        loading.value = false
        inflight = null
      }
    })()
    return inflight
  }

  // 上传一个裁剪好的 jpg Blob；category 决定是横图还是管理员竖图
  async function upload(blob, category = CATEGORY_H) {
    if (uploading.value) return { ok: false, message: '正在上传，稍等一下' }
    uploading.value = true
    try {
      const fd = new FormData()
      fd.append('file', blob, 'bridge-' + Date.now() + '.jpg')
      fd.append('title', category === CATEGORY_V ? '桥牌页竖图' : '桥牌页照片')
      fd.append('category', category)
      const res = await fetch(`${API_BASE}/photos/upload`, {
        method: 'POST',
        headers: authHeader(),
        body: fd
      })
      let data = null
      try {
        data = await res.json()
      } catch (_) {
        data = null
      }
      if (!res.ok || !data || data.code !== 0) {
        throw new Error((data && data.message) || '上传失败 HTTP ' + res.status)
      }
      const p = data.data || {}
      if (p.id) {
        const item = { ...p, category: p.category || category }
        if (category === CATEGORY_V) {
          verticalPhotos.value = [item, ...verticalPhotos.value.filter(x => x.id !== p.id)]
        } else {
          // 新照片放最前（后端按时间倒序，保持一致）
          photos.value = [item, ...photos.value.filter(x => x.id !== p.id)]
        }
        loadedOnce = true
      }
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.message || '网络错误' }
    } finally {
      uploading.value = false
    }
  }

  // 删除一张：已经不存在（404 / “照片不存在”）也算成功，避免两边争抢时反复报错
  async function remove(photo) {
    const id = photo && photo.id
    if (!id) return { ok: false, message: '这张照片没有 id，删不了' }
    try {
      const res = await fetch(`${API_BASE}/photos/${id}`, {
        method: 'DELETE',
        headers: authHeader()
      })
      let data = null
      try {
        data = await res.json()
      } catch (_) {
        data = null
      }
      const alreadyGone = res.status === 404 || (data && /不存在|not found/i.test(data.message || ''))
      if (res.ok && (!data || data.code === 0)) {
        photos.value = photos.value.filter(x => x.id !== id)
        verticalPhotos.value = verticalPhotos.value.filter(x => x.id !== id)
        return { ok: true }
      }
      if (alreadyGone) {
        photos.value = photos.value.filter(x => x.id !== id)
        verticalPhotos.value = verticalPhotos.value.filter(x => x.id !== id)
        return { ok: true }
      }
      throw new Error((data && data.message) || '删除失败 HTTP ' + res.status)
    } catch (err) {
      return { ok: false, message: err.message || '网络错误' }
    }
  }

  return { photos, verticalPhotos, uploading, loading, load, upload, remove }
}
