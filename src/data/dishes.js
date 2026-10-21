// ============================================================
// 菜品配置（dishes.js）
// 💡 以后加菜：1. 图片放进 src/assets/images/dishes/
//              2. 在下面数组里加一行 { id, name, category, hearts, emoji, color, desc, img }
// hearts = ❤ 数量，代表这道菜的"想要程度"（1~5）
// ============================================================

// 菜品分类（点菜页顶部的筛选按钮）
export const dishCategories = ['全部', '地上跑的', '天上飞的', '水里游的', '烧烤', '饮品']

// 菜品列表
export const dishes = [
  // ===== 地上跑的 =====
  { id: 1, name: '红烧肉', category: '地上跑的', hearts: 5, emoji: '🍖', color: ['#d9351f', '#f58b4e'], desc: '肥而不腻入口即化', img: '' },
  { id: 2, name: '糖醋排骨', category: '地上跑的', hearts: 4, emoji: '🍖', color: ['#e85a2b', '#fdc68a'], desc: '酸酸甜甜就是你', img: '' },
  { id: 3, name: '青椒肉丝', category: '地上跑的', hearts: 3, emoji: '🌶️', color: ['#f58b4e', '#fdc68a'], desc: '微辣超级下饭', img: '' },
  { id: 4, name: '红烧排骨', category: '地上跑的', hearts: 4, emoji: '🍖', color: ['#d9351f', '#fdc68a'], desc: '软烂脱骨超香', img: '' },

  // ===== 天上飞的 =====
  { id: 5, name: '可乐鸡翅', category: '天上飞的', hearts: 5, emoji: '🍗', color: ['#d9351f', '#fdc68a'], desc: '吃了会开心', img: '' },
  { id: 6, name: '宫保鸡丁', category: '天上飞的', hearts: 4, emoji: '🍗', color: ['#e85a2b', '#fdc68a'], desc: '微辣带甜超下饭', img: '' },
  { id: 7, name: '黄焖鸡', category: '天上飞的', hearts: 4, emoji: '🍲', color: ['#f58b4e', '#fdc68a'], desc: '汤汁泡饭绝了', img: '' },
  { id: 8, name: '奥尔良烤翅', category: '天上飞的', hearts: 3, emoji: '🍗', color: ['#d9351f', '#e85a2b'], desc: '外焦里嫩', img: '' },

  // ===== 水里游的 =====
  { id: 9, name: '清蒸鲈鱼', category: '水里游的', hearts: 4, emoji: '🐟', color: ['#e85a2b', '#f58b4e'], desc: '鲜嫩少刺营养好', img: '' },
  { id: 10, name: '红烧鱼', category: '水里游的', hearts: 4, emoji: '🐠', color: ['#d9351f', '#fdc68a'], desc: '汤汁浓郁超下饭', img: '' },
  { id: 11, name: '油焖大虾', category: '水里游的', hearts: 5, emoji: '🦐', color: ['#e85a2b', '#f58b4e'], desc: '剥虾的快乐', img: '' },
  { id: 12, name: '蒜蓉扇贝', category: '水里游的', hearts: 3, emoji: '🦪', color: ['#f58b4e', '#fdc68a'], desc: '蒜香浓郁', img: '' },

  // ===== 烧烤 =====
  { id: 13, name: '烤羊肉串', category: '烧烤', hearts: 5, emoji: '🍢', color: ['#d9351f', '#e85a2b'], desc: '滋滋冒油', img: '' },
  { id: 14, name: '烤鸡翅', category: '烧烤', hearts: 4, emoji: '🍗', color: ['#e85a2b', '#f58b4e'], desc: '外焦里嫩', img: '' },
  { id: 15, name: '烤韭菜', category: '烧烤', hearts: 3, emoji: '🥬', color: ['#f58b4e', '#fdc68a'], desc: '烧烤必点', img: '' },
  { id: 16, name: '烤茄子', category: '烧烤', hearts: 4, emoji: '🍆', color: ['#d9351f', '#fdc68a'], desc: '蒜蓉味超赞', img: '' },

  // ===== 饮品 =====
  { id: 17, name: '珍珠奶茶', category: '饮品', hearts: 4, emoji: '🧋', color: ['#e85a2b', '#f58b4e'], desc: '三分糖去冰', img: '' },
  { id: 18, name: '杨枝甘露', category: '饮品', hearts: 4, emoji: '🥭', color: ['#f58b4e', '#fdc68a'], desc: '芒果味十足', img: '' },
  { id: 19, name: '柠檬气泡水', category: '饮品', hearts: 3, emoji: '🍋', color: ['#fdc68a', '#f58b4e'], desc: '清爽解腻', img: '' },
  { id: 20, name: '热巧克力', category: '饮品', hearts: 3, emoji: '🍫', color: ['#d9351f', '#e85a2b'], desc: '冬天暖暖的', img: '' },
]
