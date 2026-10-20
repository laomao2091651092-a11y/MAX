<template>
  <div class="page menu-page">
    <!-- ============ 页面标题 ============ -->
    <div class="menu-head">
      <div class="eyebrow">Menu</div>
      <h2>今天想<span class="grad">吃点什么？</span></h2>
      <p>点一点想吃的菜，生成清单发给 TA，等着被投喂 🍽️</p>
    </div>

    <!-- ============ 分类筛选按钮 ============ -->
    <div class="cat-bar">
      <!-- v-for 循环渲染分类按钮（分类在 src/data/dishes.js） -->
      <button
        v-for="cat in dishCategories"
        :key="cat"
        class="cat-btn"
        :class="{ active: activeCategory === cat }"
        @click="activeCategory = cat"
      >
        {{ cat }}
      </button>
    </div>

    <!-- ============ 菜品网格 ============ -->
    <div class="dish-grid">
      <!-- 根据当前分类筛选后的菜品列表 -->
      <div v-for="dish in filteredDishes" :key="dish.id" class="dish-card" @click="addToCart(dish)">
        <!-- 菜品图：有图显示图片，无图用渐变 + emoji 占位 -->
        <div class="dish-img" :style="{ background: `linear-gradient(180deg, ${dish.color[0]}, ${dish.color[1]})` }">
          <img v-if="dish.img" :src="requireImg(dish.img)" :alt="dish.name" />
          <span v-else class="dish-emoji">{{ dish.emoji }}</span>
          <!-- 右上角分类标签 -->
          <span class="dish-tag">{{ dish.category }}</span>
        </div>
        <!-- 菜品信息 -->
        <div class="dish-info">
          <div class="dish-name">{{ dish.name }}</div>
          <div class="dish-desc">{{ dish.desc }}</div>
          <!-- 用 ❤ 数量代替价格 -->
          <div class="dish-hearts">
            <span v-for="n in dish.hearts" :key="n" class="heart">❤</span>
            <span v-for="n in 5 - dish.hearts" :key="'e' + n" class="heart empty">❤</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ============ 想吃清单（右侧悬浮面板） ============ -->
    <div class="cart" :class="{ open: cartOpen }">
      <!-- 移动端：底部收起的清单条 -->
      <div class="cart-toggle" @click="cartOpen = !cartOpen">
        <span>🛒 想吃清单</span>
        <span class="cart-count">{{ cart.length > 0 ? cart.length + ' 种' : '' }}</span>
      </div>

      <div class="cart-body">
        <h4>今天想吃 🛒</h4>
        <!-- 清单为空时显示提示 -->
        <p v-if="cart.length === 0" class="cart-empty">还没选菜，点上面的菜加入清单～</p>

        <!-- 清单列表：每道菜一行 -->
        <div v-for="item in cart" :key="item.id" class="cart-item">
          <span class="ci-name">{{ item.emoji }} {{ item.name }}</span>
          <div class="ci-ctrl">
            <!-- 减少数量（数量为1时点击=删除） -->
            <button class="ci-btn" @click="decrease(item.id)">−</button>
            <span class="ci-num">{{ item.count }}</span>
            <!-- 增加数量 -->
            <button class="ci-btn" @click="increase(item.id)">＋</button>
            <!-- 删除这道菜 -->
            <button class="ci-del" @click="removeItem(item.id)">✕</button>
          </div>
        </div>

        <!-- 合计 -->
        <div class="cart-total" v-if="cart.length > 0">
          <span>合计</span>
          <span class="total-hearts">{{ '❤'.repeat(totalHearts) }}</span>
          <span>共 {{ totalCount }} 道</span>
        </div>

        <!-- 下单按钮 -->
        <button class="order-btn" :disabled="cart.length === 0" @click="order">
          下单生成文案 🧡
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
// 引入 Vue 的响应式 API
import { ref, reactive, computed } from 'vue'
// 引入菜品数据（加菜改菜去 src/data/dishes.js）
import { dishes, dishCategories } from '../data/dishes.js'

// 当前选中的分类
const activeCategory = ref('全部')

// 根据分类筛选菜品（计算属性：分类变化时自动重新计算）
const filteredDishes = computed(() => {
  if (activeCategory.value === '全部') return dishes
  return dishes.filter((d) => d.category === activeCategory.value)
})

// 想吃清单：存放 { id, name, emoji, count }，count 是数量
const cart = reactive([])

// 清单面板开关（移动端用）
const cartOpen = ref(false)

// 根据文件名拼出图片路径（图片放在 src/assets/images/dishes/ 下）
function requireImg(name) {
  return new URL(`../assets/images/dishes/${name}`, import.meta.url).href
}

// ----- 清单操作函数 -----
// 点击菜品：加入清单（已存在则数量+1）
function addToCart(dish) {
  const found = cart.find((item) => item.id === dish.id)
  if (found) {
    found.count++ // 已有这道菜：数量 +1
  } else {
    cart.push({ id: dish.id, name: dish.name, emoji: dish.emoji, count: 1 })
  }
}
// 数量 +1
function increase(id) {
  const item = cart.find((i) => i.id === id)
  if (item) item.count++
}
// 数量 -1（减到 0 就删掉这道菜）
function decrease(id) {
  const idx = cart.findIndex((i) => i.id === id)
  if (idx !== -1) {
    if (cart[idx].count > 1) cart[idx].count--
    else cart.splice(idx, 1)
  }
}
// 直接删除
function removeItem(id) {
  const idx = cart.findIndex((i) => i.id === id)
  if (idx !== -1) cart.splice(idx, 1)
}

// 合计：共几道菜（数量之和）
const totalCount = computed(() =>
  cart.reduce((sum, item) => sum + item.count, 0)
)

// 合计：总共多少颗爱心（每道菜的心数 × 数量）
const totalHearts = computed(() => {
  let sum = 0
  cart.forEach((item) => {
    const dish = dishes.find((d) => d.id === item.id)
    if (dish) sum += dish.hearts * item.count
  })
  return sum
})

// 下单：生成可爱文案并复制到剪贴板（可以直接发微信）
async function order() {
  // 把清单拼成文案
  const lines = cart.map((item) => `${item.name}×${item.count}`)
  const text = `宝贝，今天我想吃：${lines.join('、')}，一共 ${totalCount.value} 道菜，等你投喂！🧡`

  try {
    // 复制到剪贴板（需要 https 或 localhost 环境，本地开发没问题）
    await navigator.clipboard.writeText(text)
    alert('✅ 下单文案已复制！快去发微信给 TA 吧～')
  } catch (e) {
    // 剪贴板失败时降级：直接弹窗显示文案
    alert('复制失败，请手动复制：\n\n' + text)
  }
}
</script>

<style scoped>
/* ============ 页面标题 ============ */
.menu-head {
  max-width: 1280px;
  margin: 0 auto 30px;
}
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: #8b847a;
  font-weight: 500;
  margin-bottom: 16px;
}
.eyebrow::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #d9351f;
  box-shadow: 0 0 0 3px rgba(217, 53, 31, 0.2);
}
.menu-head h2 {
  font-weight: 700;
  font-size: clamp(34px, 4.4vw, 60px);
  line-height: 1;
  letter-spacing: -0.03em;
}
.menu-head .grad {
  font-style: italic;
  font-weight: 800;
  background: linear-gradient(135deg, #d9351f, #f58b4e);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.menu-head p {
  margin-top: 16px;
  font-size: 15px;
  color: #2b2b30;
}

/* ============ 分类按钮 ============ */
.cat-bar {
  max-width: 1280px;
  margin: 0 auto 30px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.cat-btn {
  background: #fff8ee;
  border: 1.5px solid #dad2bf;
  color: #2b2b30;
  padding: 9px 22px;
  border-radius: 999px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}
.cat-btn:hover {
  border-color: #d9351f;
  color: #d9351f;
}
/* 选中分类：橙红渐变高亮 */
.cat-btn.active {
  background: linear-gradient(135deg, #d9351f, #f58b4e);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 8px 20px -6px rgba(217, 53, 31, 0.5);
}

/* ============ 菜品网格 ============ */
.dish-grid {
  max-width: 1280px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  padding-bottom: 40px;
}
.dish-card {
  border-radius: 22px;
  overflow: hidden;
  background: #fffaf0;
  border: 1px solid #ede6d6;
  cursor: pointer;
  transition: transform 0.4s cubic-bezier(0.6, 0, 0.2, 1),
    box-shadow 0.4s;
}
/* 悬停：上浮 + 橙色投影 */
.dish-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 30px 50px -18px rgba(180, 50, 20, 0.4);
}
.dish-img {
  aspect-ratio: 4 / 3;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dish-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.dish-emoji {
  font-size: 56px;
  filter: drop-shadow(0 8px 16px rgba(120, 20, 0, 0.25));
}
/* 分类小标签 */
.dish-tag {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(20, 10, 6, 0.6);
  backdrop-filter: blur(6px);
  color: #fff;
  font-size: 11px;
  padding: 5px 12px;
  border-radius: 999px;
  letter-spacing: 0.05em;
}
.dish-info {
  padding: 16px 18px 18px;
  text-align: center;
}
.dish-name {
  font-size: 17px;
  font-weight: 700;
  color: #141416;
}
.dish-desc {
  margin-top: 6px;
  font-size: 12px;
  color: #8b847a;
}
/* 爱心价格 */
.dish-hearts {
  margin-top: 10px;
  font-size: 14px;
}
.heart {
  color: #d9351f;
}
.heart.empty {
  color: #e5dcc8;
}

/* ============ 想吃清单 ============ */
.cart {
  position: fixed;
  right: 28px;
  top: 110px;
  width: 300px;
  z-index: 40;
}
/* 移动端：默认收起成一条 */
.cart-toggle {
  display: none;
}
.cart-body {
  background: #141416;
  color: #f4edde;
  border-radius: 24px;
  padding: 22px;
  box-shadow: 0 40px 80px -30px rgba(20, 8, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  position: relative;
  overflow: hidden;
}
.cart-body::before {
  content: "";
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(232, 90, 43, 0.35), transparent 65%);
  top: -80px;
  right: -60px;
  filter: blur(30px);
  pointer-events: none;
}
.cart-body h4 {
  font-size: 16px;
  margin-bottom: 14px;
  position: relative;
}
.cart-empty {
  font-size: 13px;
  color: #8b847a;
  line-height: 1.6;
  position: relative;
}
/* 清单单项 */
.cart-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 13px;
  position: relative;
}
.ci-name {
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ci-ctrl {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ci-btn {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.2s;
}
.ci-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}
.ci-num {
  min-width: 18px;
  text-align: center;
  font-weight: 700;
}
.ci-del {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #8b847a;
  font-size: 12px;
  cursor: pointer;
}
.ci-del:hover {
  color: #f58b4e;
}
/* 合计 */
.cart-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0 4px;
  font-size: 13px;
  color: #8b847a;
  position: relative;
}
.total-hearts {
  color: #f58b4e;
  font-size: 14px;
  letter-spacing: 1px;
}
/* 下单按钮 */
.order-btn {
  width: 100%;
  margin-top: 12px;
  background: linear-gradient(135deg, #d9351f, #f58b4e);
  border: none;
  color: #fff;
  padding: 13px;
  border-radius: 999px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  position: relative;
  transition: transform 0.3s, opacity 0.3s;
}
.order-btn:hover {
  transform: translateY(-2px);
}
/* 清单为空时按钮置灰 */
.order-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

/* ============ 响应式 ============ */
@media (max-width: 1100px) {
  .dish-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 750px) {
  .dish-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }
  .dish-emoji {
    font-size: 40px;
  }
  /* 移动端清单：固定底部，默认收起 */
  .cart {
    left: 12px;
    right: 12px;
    top: auto;
    bottom: 12px;
    width: auto;
  }
  .cart-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #141416;
    color: #f4edde;
    padding: 12px 18px;
    border-radius: 999px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 20px 40px -12px rgba(20, 8, 0, 0.5);
  }
  .cart-count {
    color: #f58b4e;
  }
  /* 展开状态显示清单面板 */
  .cart-body {
    display: none;
    margin-bottom: 8px;
  }
  .cart.open .cart-body {
    display: block;
  }
}
</style>
