// ============================================================
// 画廊照片配置（gallery.js）
// 💡 以后加照片：1. 图片放进 src/assets/images/gallery/
//                2. 在下面数组里加一行 { id, title, emoji, color, img, detail, original }
// 图片建议：竖版 9:16（手机照片直接可用），jpg/png 格式
// img      = 网页展示图（建议放压缩版 xxx-s.jpg，加载快）
// original = 原图文件名（"下载原图"按钮用的高清原图）
// detail 三种类型（点击照片的效果）：
//   'bubble' = 进入"液体气泡详细页"
//   'zoom'   = 进入"全屏放大画廊"（本照片全屏 + 其他照片成底部缩略图）
//   false    = 打开普通大图预览（Lightbox）
// ============================================================

export const photos = [
  {
    id: 1,
    title: '我们的第一张合照',
    emoji: '💕',                       // 占位表情（有照片后可删掉）
    color: ['#d9351f', '#fdc68a'],     // 占位渐变色（有照片后可删掉）
    img: '1-s.jpg',                     // ✅ 网页展示压缩图
    original: '1.png',                  // ✅ 原图（下载用）
    detail: 'bubble',                   // 液体气泡详细页
  },
  {
    id: 2,
    title: '第一次约会',
    emoji: '🌹',
    color: ['#e85a2b', '#f58b4e'],
    img: '2-s.jpg',                     // ✅ 网页展示压缩图
    original: '2.jpg',                  // ✅ 原图（下载用）
    detail: 'bubble',                   // 液体气泡详细页
  },
  {
    id: 3,
    title: '一起过生日',
    emoji: '🎂',
    color: ['#d9351f', '#f58b4e'],
    img: '3-s.jpg',                     // ✅ 网页展示压缩图
    original: '3.jpg',                  // ✅ 原图（下载用）
    detail: 'bubble',                   // 液体气泡详细页
  },
  {
    id: 4,
    title: '海边旅行',
    emoji: '🏖️',
    color: ['#f58b4e', '#fdc68a'],
    img: '4-s.jpg',                     // ✅ 网页展示压缩图
    original: '4.jpg',                  // ✅ 原图（下载用）
    detail: 'bubble',                   // 液体气泡详细页
  },
  {
    id: 5,
    title: '星空下的夜晚',
    emoji: '✨',
    color: ['#e85a2b', '#fdc68a'],
    img: '',
    detail: false,                      // 普通大图预览
  },
  {
    id: 6,
    title: '一起吃饭',
    emoji: '🍜',
    color: ['#d9351f', '#fdc68a'],
    img: '',
    detail: false,                      // 普通大图预览
  },
  {
    id: 7,
    title: '游乐园的一天',
    emoji: '🎡',
    color: ['#f58b4e', '#fdc68a'],
    img: '',
    detail: false,                      // 普通大图预览
  },
  {
    id: 8,
    title: '家里的猫猫',
    emoji: '🐱',
    color: ['#e85a2b', '#f58b4e'],
    img: '',
    detail: false,                      // 普通大图预览
  },
  {
    id: 9,
    title: '测试横图',
    emoji: '🖼️',
    color: ['#e85a2b', '#f58b4e'],
    img: '横1.jpg',                     // ✅ 你的测试照片（横版）
    original: '横1.jpg',                // 原图（下载用）
    desc: '这是一张横版测试照片，点开会进入全屏放大画廊效果，其他横版照片会变成底部缩略图。',
    // quote 已关闭：照片本身自带文字，页面不再叠加文案
    // quote: '风从海面来，捎来好消息',
    // quoteEn: 'The wind blows from the sea, bringing good news',
    detail: 'zoom',                     // 🆕 全屏放大画廊效果
  },
]
