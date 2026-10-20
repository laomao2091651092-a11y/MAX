// ============================================================
// 菜品配置（dishes.js）
// 💡 以后加菜：1. 图片放进 src/assets/images/dishes/
//              2. 在下面数组里加一行 { id, name, category, hearts, emoji, color, desc, img }
// hearts = ❤ 数量，代表这道菜的"想要程度"（1~5）
// ============================================================

// 菜品分类（点菜页顶部的筛选按钮）
export const dishCategories = ['全部', '家常菜', '甜点', '饮品']

// 菜品列表
export const dishes = [
  // ===== 家常菜 =====
  { id: 1, name: '番茄炒蛋', category: '家常菜', hearts: 3, emoji: '🍳', color: ['#d9351f', '#f58b4e'], desc: '你最爱吃的下饭菜', img: '' },
  { id: 2, name: '糖醋排骨', category: '家常菜', hearts: 4, emoji: '🍖', color: ['#e85a2b', '#fdc68a'], desc: '酸酸甜甜就是你', img: '' },
  { id: 3, name: '可乐鸡翅', category: '家常菜', hearts: 4, emoji: '🍗', color: ['#d9351f', '#fdc68a'], desc: '吃了会开心', img: '' },
  { id: 4, name: '青椒肉丝', category: '家常菜', hearts: 2, emoji: '🌶️', color: ['#f58b4e', '#fdc68a'], desc: '微辣提神', img: '' },

  // ===== 甜点 =====
  { id: 5, name: '草莓蛋糕', category: '甜点', hearts: 5, emoji: '🍰', color: ['#e85a2b', '#fdc68a'], desc: '甜甜的像你', img: '' },
  { id: 6, name: '芒果布丁', category: '甜点', hearts: 3, emoji: '🥭', color: ['#f58b4e', '#fdc68a'], desc: '滑滑嫩嫩', img: '' },
  { id: 7, name: '提拉米苏', category: '甜点', hearts: 4, emoji: '🍮', color: ['#d9351f', '#f58b4e'], desc: '浓郁丝滑', img: '' },
  { id: 8, name: '马卡龙', category: '甜点', hearts: 2, emoji: '🍬', color: ['#f58b4e', '#fdc68a'], desc: '五颜六色的快乐', img: '' },

  // ===== 饮品 =====
  { id: 9, name: '珍珠奶茶', category: '饮品', hearts: 3, emoji: '🧋', color: ['#e85a2b', '#f58b4e'], desc: '三分糖去冰', img: '' },
  { id: 10, name: '杨枝甘露', category: '饮品', hearts: 4, emoji: '🥭', color: ['#f58b4e', '#fdc68a'], desc: '芒果味十足', img: '' },
  { id: 11, name: '柠檬气泡水', category: '饮品', hearts: 2, emoji: '🍋', color: ['#fdc68a', '#f58b4e'], desc: '清爽解腻', img: '' },
  { id: 12, name: '热巧克力', category: '饮品', hearts: 3, emoji: '🍫', color: ['#d9351f', '#e85a2b'], desc: '冬天暖暖的', img: '' },
]
