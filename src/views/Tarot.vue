<template>
  <div class="page tarot-page">
    <div class="tarot-head">
      <div class="eyebrow">Tarot</div>
      <h2>塔罗<span class="grad">占卜</span> 🔮</h2>
      <p>静心默念问题，探索过去、现在与未来</p>
    </div>

    <!-- 功能切换 -->
    <div class="tabs">
      <button class="tab" :class="{ active: tab === 'draw' }" @click="tab = 'draw'">🔮 抽牌占卜</button>
      <button class="tab" :class="{ active: tab === 'library' }" @click="tab = 'library'">📚 牌库解读</button>
    </div>

    <!-- ========== 抽牌占卜 ========== -->
    <div v-if="tab === 'draw'">
      <!-- 开始阶段 -->
      <div v-if="drawStage === 'shuffle'" class="intro-stage">
        <div class="fan-deck" :class="{ 'falling': falling, 'shuffling': shuffling }">
          <img 
            v-for="n in 5" 
            :key="n" 
            :src="cardBackImg" 
            class="fan-card" 
            :style="{ transform: `rotate(${(n-3)*6}deg) translateY(${Math.abs(n-3)*3}px)` }"
          />
        </div>
        <p class="intro-text">来到这里，心中大概有些困惑吧</p>
        <p class="intro-sub">或许，这里有你的答案</p>
        <p class="intro-tip">带着你的困惑，点击「开始」</p>
        
        <div class="question-box">
          <p class="q-label">你在问什么？</p>
          <div class="q-options">
            <button class="q-btn" :class="{ active: question === '感情' }" @click="question = '感情'">感情</button>
            <button class="q-btn" :class="{ active: question === '事业' }" @click="question = '事业'">事业</button>
            <button class="q-btn" :class="{ active: question === '财运' }" @click="question = '财运'">财运</button>
            <button class="q-btn gold" :class="{ active: question === '综合' }" @click="question = '综合'">综合</button>
          </div>
        </div>

        <button class="big-start-btn" @click="startShuffle">开 始</button>
      </div>

      <!-- 抽牌阶段 -->
      <div v-if="drawStage === 'pick'" class="pick-stage">
        <!-- 顶部三个空位 -->
        <div class="picked-slots">
          <div class="pick-slot" :class="{ filled: drawn >= 1 }">
            <div class="slot-inner">
              <img v-if="drawn >= 1" :src="cardBackImg" alt="牌背" class="slot-card" />
            </div>
            <span class="slot-label label-past">过去</span>
          </div>
          <div class="pick-slot" :class="{ filled: drawn >= 2 }">
            <div class="slot-inner">
              <img v-if="drawn >= 2" :src="cardBackImg" alt="牌背" class="slot-card" />
            </div>
            <span class="slot-label label-present">现在</span>
          </div>
          <div class="pick-slot" :class="{ filled: drawn >= 3 }">
            <div class="slot-inner">
              <img v-if="drawn >= 3" :src="cardBackImg" alt="牌背" class="slot-card" />
            </div>
            <span class="slot-label label-future">未来</span>
          </div>
        </div>

        <p class="deal-prompt">请凭直觉抽取 <strong>3</strong> 张塔罗牌</p>

        <!-- 弧线牌堆 -->
        <div class="arc-stage">
          <div class="arc-container">
            <button 
              v-for="n in 21" 
              :key="n" 
              class="arc-card"
              @click="drawCard"
              :style="arcStyle(n)"
            >
              <img :src="cardBackImg" alt="牌背" class="arc-card-inner" />
            </button>
          </div>
        </div>

        <p class="arc-hint">共 22 张 · 点击牌背进行选择</p>
      </div>

      <div v-if="drawStage === 'result'" class="result-stage">
        <p class="result-title">你的塔罗指引</p>
        
        <!-- 三张牌并排 -->
        <div class="result-cards">
          <div v-for="(card, i) in drawnCards" :key="i" class="rcr-item" @click="selectedCard = card">
            <span class="rcr-pos">{{ ['◈ 过去', '◆ 现在', '◇ 未来'][i] }}</span>
            <div class="rcr-img-wrap" :class="{ flipped: card.flipped }">
              <img :src="card.img" :alt="card.name" class="rcr-img" :style="{ transform: card.isReversed ? 'rotate(180deg)' : 'none' }" />
              <span class="rcr-tag" :class="card.isReversed ? 'tag-reversed' : 'tag-upright'">{{ card.isReversed ? '逆位' : '正位' }}</span>
            </div>
            <div class="rcr-name">{{ card.name }}</div>
          </div>
        </div>

        <!-- 单牌详细解读 -->
        <div class="rcr-details">
          <div v-for="(card, i) in drawnCards" :key="i" class="rcr-detail">
            <div class="rcr-detail-head">
              <span class="rcr-detail-pos">{{ ['过去', '现在', '未来'][i] }}</span>
              {{ card.name }}
              <span class="rcr-detail-tag" :class="card.isReversed ? 'tag-reversed' : 'tag-upright'">{{ card.isReversed ? '逆位' : '正位' }}</span>
            </div>
            <p>{{ card.isReversed ? card.reversed : card.upright }}</p>
          </div>
        </div>

        <!-- 匹配解读区域 -->
        <div class="match-zone">
          <h3 class="match-title">✦ 为你匹配的解读</h3>
          
          <div class="match-sec">
            <h4>两两组合解读</h4>
            <div class="match-card" @click="openCombo(drawnCards[0].name, drawnCards[1].name)">
              <span class="match-card-title">{{ drawnCards[0].name }} × {{ drawnCards[1].name }}</span>
              <span class="match-card-go">看这对组合 →</span>
            </div>
            <div class="match-card" @click="openCombo(drawnCards[0].name, drawnCards[2].name)">
              <span class="match-card-title">{{ drawnCards[0].name }} × {{ drawnCards[2].name }}</span>
              <span class="match-card-go">看这对组合 →</span>
            </div>
            <div class="match-card" @click="openCombo(drawnCards[1].name, drawnCards[2].name)">
              <span class="match-card-title">{{ drawnCards[1].name }} × {{ drawnCards[2].name }}</span>
              <span class="match-card-go">看这对组合 →</span>
            </div>
          </div>
          
          <!-- AI深度解读 -->
          <div class="match-sec">
            <h4>🤖 AI陪伴解读</h4>
            <button class="ai-btn" @click="aiReading" :disabled="aiLoading">
              {{ aiLoading ? 'AI解读中...' : '✨ 让AI陪我聊聊这三张牌' }}
            </button>
            
            <!-- 对话区域 -->
            <div v-if="chatMessages.length > 0" class="chat-box">
              <div v-for="(msg, i) in chatMessages" :key="i" class="chat-msg" :class="msg.role">
                {{ msg.content }}
              </div>
              <div v-if="chatLoading" class="chat-msg ai">正在思考...</div>
              
              <!-- 输入框 -->
              <div class="chat-input-row">
                <input 
                  v-model="chatInput" 
                  @keyup.enter="sendChat"
                  placeholder="可以继续问我哦，比如'那我该怎么办...'"
                  class="chat-input"
                />
                <button class="chat-send" @click="sendChat" :disabled="chatLoading">发送</button>
              </div>
            </div>
          </div>
        </div>

        <button class="btn-reshuffle" @click="resetDraw">重新抽牌</button>
      </div>

      <!-- 组合详情页 -->
      <div v-if="drawStage === 'combo'" class="combo-page">
        <button class="back-btn" @click="backToResult">← 返回结果</button>
        
        <div class="combo-cards-row">
          <div class="combo-card-item">
            <img :src="currentCombo.card1.img" :alt="currentCombo.card1.name" class="combo-card-img" />
            <div class="combo-card-name">{{ currentCombo.card1.name }}</div>
          </div>
          <div class="combo-plus">+</div>
          <div class="combo-card-item">
            <img :src="currentCombo.card2.img" :alt="currentCombo.card2.name" class="combo-card-img" />
            <div class="combo-card-name">{{ currentCombo.card2.name }}</div>
          </div>
        </div>

        <h2 class="combo-title">{{ currentCombo.card1.name }} × {{ currentCombo.card2.name }}</h2>

        <div class="combo-full-content">
          <div v-if="loadingCombos" class="combo-loading">加载组合解读中...</div>
          <div v-else-if="getComboContent(currentCombo.card1.name, currentCombo.card2.name)" class="combo-content" v-html="cleanComboContent(getComboContent(currentCombo.card1.name, currentCombo.card2.name))"></div>
          <div v-else class="combo-loading">暂无该组合的详细解读</div>
        </div>

        <button class="btn-reshuffle" @click="backToResult">返回结果页</button>
      </div>
    </div>

    <!-- ========== 牌库解读 ========== -->
    <div v-if="tab === 'library'">
      <!-- 分类筛选 -->
      <div class="library-cats">
        <button class="cat-btn" :class="{ active: libCat === 'all' }" @click="libCat = 'all'">全部</button>
        <button class="cat-btn" :class="{ active: libCat === 'major' }" @click="libCat = 'major'">大阿卡纳</button>
        <button class="cat-btn" :class="{ active: libCat === 'cups' }" @click="libCat = 'cups'">圣杯组</button>
        <button class="cat-btn" :class="{ active: libCat === 'swords' }" @click="libCat = 'swords'">宝剑组</button>
        <button class="cat-btn" :class="{ active: libCat === 'wands' }" @click="libCat = 'wands'">权杖组</button>
        <button class="cat-btn" :class="{ active: libCat === 'pentacles' }" @click="libCat = 'pentacles'">星币组</button>
      </div>
      
      <div class="library-grid">
        <div v-for="card in filteredCards" :key="card.name" class="library-card" @click="selectedCard = card">
          <img :src="card.img" :alt="card.name" />
          <div class="lib-card-name">{{ card.name }}</div>
        </div>
      </div>
    </div>

    <!-- 单牌详情弹窗 -->
    <div v-if="selectedCard" class="modal-overlay" @click="selectedCard = null">
      <div class="modal" @click.stop>
        <button class="close-btn" @click="selectedCard = null">✕</button>
        <div class="modal-content">
          <img :src="selectedCard.img" :alt="selectedCard.name" class="modal-img" />
          <div class="modal-info">
            <h3>{{ selectedCard.name }}</h3>
            <div class="meaning-section">
              <h4>✨ 正位</h4>
              <p>{{ selectedCard.upright }}</p>
            </div>
            <div class="meaning-section reversed">
              <h4>🌑 逆位</h4>
              <p>{{ selectedCard.reversed }}</p>
            </div>
            <div class="meaning-section">
              <h4>💡 关键词</h4>
              <p class="keywords">{{ selectedCard.keywords }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import cardBackImg from '../assets/tarot/卡片背面.jpg'

// 牌名到ID的映射
const cardNameToId = {
  // 大阿卡纳
  '愚者': 'major_0', '魔术师': 'major_1', '女祭司': 'major_2', '皇后': 'major_3', '皇帝': 'major_4',
  '教皇': 'major_5', '恋人': 'major_6', '战车': 'major_7', '力量': 'major_8', '隐士': 'major_9',
  '命运之轮': 'major_10', '正义': 'major_11', '倒吊人': 'major_12', '死神': 'major_13', '节制': 'major_14',
  '恶魔': 'major_15', '高塔': 'major_16', '星星': 'major_17', '月亮': 'major_18', '太阳': 'major_19',
  '审判': 'major_20', '世界': 'major_21',
  // 圣杯组
  '圣杯Ace': 'cup_0', '圣杯二': 'cup_1', '圣杯三': 'cup_2', '圣杯四': 'cup_3', '圣杯五': 'cup_4',
  '圣杯六': 'cup_5', '圣杯七': 'cup_6', '圣杯八': 'cup_7', '圣杯九': 'cup_8', '圣杯十': 'cup_9',
  '圣杯侍者': 'cup_10', '圣杯骑士': 'cup_11', '圣杯皇后': 'cup_12', '圣杯国王': 'cup_13',
  // 宝剑组
  '宝剑Ace': 'sword_0', '宝剑二': 'sword_1', '宝剑三': 'sword_2', '宝剑四': 'sword_3', '宝剑五': 'sword_4',
  '宝剑六': 'sword_5', '宝剑七': 'sword_6', '宝剑八': 'sword_7', '宝剑九': 'sword_8', '宝剑十': 'sword_9',
  '宝剑侍者': 'sword_10', '宝剑骑士': 'sword_11', '宝剑皇后': 'sword_12', '宝剑国王': 'sword_13',
  // 权杖组
  '权杖Ace': 'wand_0', '权杖二': 'wand_1', '权杖三': 'wand_2', '权杖四': 'wand_3', '权杖五': 'wand_4',
  '权杖六': 'wand_5', '权杖七': 'wand_6', '权杖八': 'wand_7', '权杖九': 'wand_8', '权杖十': 'wand_9',
  '权杖侍者': 'wand_10', '权杖骑士': 'wand_11', '权杖皇后': 'wand_12', '权杖国王': 'wand_13',
  // 星币组
  '星币Ace': 'pentacle_0', '星币二': 'pentacle_1', '星币三': 'pentacle_2', '星币四': 'pentacle_3', '星币五': 'pentacle_4',
  '星币六': 'pentacle_5', '星币七': 'pentacle_6', '星币八': 'pentacle_7', '星币九': 'pentacle_8', '星币十': 'pentacle_9',
  '星币侍者': 'pentacle_10', '星币骑士': 'pentacle_11', '星币皇后': 'pentacle_12', '星币国王': 'pentacle_13'
}

// 组合数据
const combosData = ref({})
const loadingCombos = ref(true)

// 加载组合数据
onMounted(async () => {
  try {
    const res = await fetch('/tarot-combos.json')
    const data = await res.json()
    // 转换成对象，方便查找
    const combosMap = {}
    data.forEach(item => {
      // 从 url 提取 key，比如 /combos/major_0-major_1/ -> major_0-major_1
      const key = item.url.match(/\/combos\/([^/]+)\//)[1]
      combosMap[key] = item.content
    })
    combosData.value = combosMap
    loadingCombos.value = false
  } catch (e) {
    console.error('加载组合数据失败', e)
    loadingCombos.value = false
  }
})

// 获取组合解读
function getComboContent(card1Name, card2Name) {
  const id1 = cardNameToId[card1Name]
  const id2 = cardNameToId[card2Name]
  if (!id1 || !id2) return null
  
  // 尝试两种顺序
  const key1 = `${id1}-${id2}`
  const key2 = `${id2}-${id1}`
  
  return combosData.value[key1] || combosData.value[key2] || null
}

// 大阿卡纳22张完整数据
const allCards = [
  // 大阿卡纳
  { name: '愚者', category: 'major', img: new URL('../assets/tarot/major/愚者.jpg', import.meta.url).href, meaning: '新的开始、冒险、自由出发', upright: '新旅程、乐观、相信直觉、无限可能', reversed: '鲁莽、轻率、逃避责任、害怕冒险', keywords: '自由 · 冒险 · 新开始' },
  { name: '魔术师', category: 'major', img: new URL('../assets/tarot/major/魔术师.jpg', import.meta.url).href, meaning: '创造力、意志力、显化', upright: '创造、行动力、资源整合、成功、掌控', reversed: '操纵、欺骗、才能浪费、自我怀疑', keywords: '创造 · 意志 · 显化' },
  { name: '女祭司', category: 'major', img: new URL('../assets/tarot/major/女祭司.jpg', import.meta.url).href, meaning: '直觉、潜意识、内在智慧', upright: '直觉、潜意识、神秘、内在声音、沉默', reversed: '压抑直觉、表面化、忽视内心', keywords: '直觉 · 神秘 · 内在' },
  { name: '皇后', category: 'major', img: new URL('../assets/tarot/major/皇后.jpg', import.meta.url).href, meaning: '丰收、母性、感官享受', upright: '丰饶、滋养、美丽、自然、母性', reversed: '过度依赖、慵懒、创造力停滞', keywords: '丰饶 · 母性 · 享受' },
  { name: '皇帝', category: 'major', img: new URL('../assets/tarot/major/皇帝.jpg', import.meta.url).href, meaning: '权威、结构、稳定', upright: '秩序、控制、父亲形象、稳定、领导', reversed: '专制、僵硬、固执、滥用权力', keywords: '权威 · 稳定 · 秩序' },
  { name: '教皇', category: 'major', img: new URL('../assets/tarot/major/教皇.jpg', import.meta.url).href, meaning: '传统、信仰、教育', upright: '传统、信仰、导师、遵循规则、精神指引', reversed: '墨守成规、伪善、束缚、反传统', keywords: '传统 · 信仰 · 指引' },
  { name: '恋人', category: 'major', img: new URL('../assets/tarot/major/恋人.jpg', import.meta.url).href, meaning: '爱情、选择、和谐', upright: '爱情、关系、选择、和谐、价值观一致', reversed: '不一致、分歧、错误选择、关系失衡', keywords: '爱情 · 选择 · 和谐' },
  { name: '战车', category: 'major', img: new URL('../assets/tarot/major/战车.jpg', import.meta.url).href, meaning: '胜利、意志力、前进', upright: '胜利、决心、控制、前进、克服障碍', reversed: '失控、方向迷失、攻击性、受挫', keywords: '胜利 · 意志 · 前进' },
  { name: '力量', category: 'major', img: new URL('../assets/tarot/major/力量.jpg', import.meta.url).href, meaning: '勇气、自信、柔克刚', upright: '勇气、内在力量、耐心、自信', reversed: '自我怀疑、软弱、不耐烦、自我消耗', keywords: '勇气 · 力量 · 耐心' },
  { name: '隐士', category: 'major', img: new URL('../assets/tarot/major/隐士.jpg', import.meta.url).href, meaning: '内省、独处、寻求真理', upright: '内省、独处、引导、寻求真理、沉思', reversed: '孤立、拒绝帮助、逃避、孤独', keywords: '内省 · 独处 · 引导' },
  { name: '命运之轮', category: 'major', img: new URL('../assets/tarot/major/命运之轮.jpg', import.meta.url).href, meaning: '转机、轮回、命运', upright: '转机、循环、命运、机遇、上升趋势', reversed: '厄运、抗拒变化、失控、坏循环', keywords: '命运 · 转机 · 循环' },
  { name: '正义', category: 'major', img: new URL('../assets/tarot/major/正义.jpg', import.meta.url).href, meaning: '公平、真相、因果', upright: '公正、真相、责任、因果、平衡', reversed: '不公、逃避责任、偏见、逃避真相', keywords: '正义 · 真相 · 平衡' },
  { name: '倒吊人', category: 'major', img: new URL('../assets/tarot/major/倒吊人.jpg', import.meta.url).href, meaning: '牺牲、换个角度、暂停', upright: '新视角、暂停、牺牲、等待', reversed: '无谓牺牲、停滞、抗拒、优柔寡断', keywords: '视角 · 牺牲 · 等待' },
  { name: '死神', category: 'major', img: new URL('../assets/tarot/major/死神.jpg', import.meta.url).href, meaning: '结束、重生、转变', upright: '结束、转变、释放、重生、过渡期', reversed: '抗拒改变、停滞、无法放手、拖延', keywords: '结束 · 重生 · 转变' },
  { name: '节制', category: 'major', img: new URL('../assets/tarot/major/节制.jpg', import.meta.url).href, meaning: '平衡、耐心、中庸', upright: '平衡、耐心、适度、和谐、中庸之道', reversed: '极端、不平衡、过度、缺乏耐心', keywords: '平衡 · 耐心 · 适度' },
  { name: '恶魔', category: 'major', img: new URL('../assets/tarot/major/恶魔.jpg', import.meta.url).href, meaning: '欲望、束缚、物质主义', upright: '欲望、物质束缚、执念、性、成瘾', reversed: '解脱、打破束缚、觉醒、摆脱成瘾', keywords: '欲望 · 束缚 · 执念' },
  { name: '高塔', category: 'major', img: new URL('../assets/tarot/major/高塔.jpg', import.meta.url).href, meaning: '突变、崩塌、启示', upright: '突变、打破旧结构、启示、混乱、释放', reversed: '避免灾难、恐惧、拖延、内在崩塌', keywords: '突变 · 崩塌 · 启示' },
  { name: '星星', category: 'major', img: new URL('../assets/tarot/major/星星.jpg', import.meta.url).href, meaning: '希望、灵感、治愈', upright: '希望、灵感、治愈、信念、宁静', reversed: '失望、绝望、失去信心、消极', keywords: '希望 · 灵感 · 治愈' },
  { name: '月亮', category: 'major', img: new URL('../assets/tarot/major/月亮.jpg', import.meta.url).href, meaning: '幻觉、不安、潜意识', upright: '幻觉、恐惧、不安、梦境、潜意识', reversed: '走出迷茫、释放恐惧、清晰、真相显现', keywords: '幻觉 · 恐惧 · 潜意识' },
  { name: '太阳', category: 'major', img: new URL('../assets/tarot/major/太阳.jpg', import.meta.url).href, meaning: '快乐、成功、活力', upright: '快乐、成功、活力、积极、温暖', reversed: '暂时低迷、延迟、过度乐观、自我中心', keywords: '快乐 · 成功 · 活力' },
  { name: '审判', category: 'major', img: new URL('../assets/tarot/major/审判.jpg', import.meta.url).href, meaning: '觉醒、复活、评估', upright: '觉醒、复活、救赎、评估、召唤', reversed: '自我怀疑、拒绝召唤、内疚、逃避', keywords: '觉醒 · 复活 · 评估' },
  { name: '世界', category: 'major', img: new URL('../assets/tarot/major/世界.jpg', import.meta.url).href, meaning: '完成、圆满、旅程', upright: '完成、圆满、成就、旅行、整合', reversed: '未完成、延迟、缺乏收尾、半途而废', keywords: '完成 · 圆满 · 成就' },
  // 圣杯组
  { name: '圣杯Ace', category: 'cups', img: new URL('../assets/tarot/Holy Grail Squad/圣杯1.jpg', import.meta.url).href, meaning: '新感情、新关系、情感开始', upright: '新感情、爱、关怀、直觉', reversed: '情感封闭、爱无能、空虚', keywords: '新爱 · 情感 · 直觉' },
  { name: '圣杯二', category: 'cups', img: new URL('../assets/tarot/Holy Grail Squad/圣杯2.jpg', import.meta.url).href, meaning: '结合、伙伴关系、互相吸引', upright: '爱情、友谊、合作、默契', reversed: '关系失衡、沟通不畅、分离', keywords: '结合 · 伙伴 · 吸引' },
  { name: '圣杯三', category: 'cups', img: new URL('../assets/tarot/Holy Grail Squad/圣杯3.jpg', import.meta.url).href, meaning: '庆祝、友谊、社交', upright: '聚会、朋友、欢乐、庆祝', reversed: '过度放纵、社交压力、三角关系', keywords: '庆祝 · 友谊 · 社交' },
  { name: '圣杯四', category: 'cups', img: new URL('../assets/tarot/Holy Grail Squad/圣杯4.jpg', import.meta.url).href, meaning: '不满、冷漠、沉思', upright: '厌倦、不满、内省、寻找意义', reversed: '新机会、觉醒、行动', keywords: '不满 · 冷漠 · 沉思' },
  { name: '圣杯五', category: 'cups', img: new URL('../assets/tarot/Holy Grail Squad/圣杯5.jpg', import.meta.url).href, meaning: '失落、悲伤、遗憾', upright: '失落、悲伤、自责、遗憾', reversed: '接受现实、走出悲伤、希望', keywords: '失落 · 悲伤 · 遗憾' },
  { name: '圣杯六', category: 'cups', img: new URL('../assets/tarot/Holy Grail Squad/圣杯6.jpg', import.meta.url).href, meaning: '怀旧、童年、旧人', upright: '怀旧、童年、老朋友、纯真', reversed: '活在过去、不愿长大、分离', keywords: '怀旧 · 童年 · 旧人' },
  { name: '圣杯七', category: 'cups', img: new URL('../assets/tarot/Holy Grail Squad/圣杯7.jpg', import.meta.url).href, meaning: '幻想、选择、诱惑', upright: '幻想、梦想、多种选择、诱惑', reversed: '清醒、认清现实、做出选择', keywords: '幻想 · 选择 · 诱惑' },
  { name: '圣杯八', category: 'cups', img: new URL('../assets/tarot/Holy Grail Squad/圣杯8.jpg', import.meta.url).href, meaning: '离开、寻找、放弃', upright: '离开、寻找更深意义、放弃、远行', reversed: '害怕离开、徘徊、放弃希望', keywords: '离开 · 寻找 · 放弃' },
  { name: '圣杯九', category: 'cups', img: new URL('../assets/tarot/Holy Grail Squad/圣杯9.jpg', import.meta.url).href, meaning: '满足、愿望成真、幸福', upright: '满足、愿望、幸福、享受', reversed: '贪婪、不满足、虚荣', keywords: '满足 · 愿望 · 幸福' },
  { name: '圣杯十', category: 'cups', img: new URL('../assets/tarot/Holy Grail Squad/圣杯10.jpg', import.meta.url).href, meaning: '家庭幸福、圆满、和谐', upright: '家庭、幸福、和谐、圆满', reversed: '家庭冲突、价值观不合、分离', keywords: '家庭 · 圆满 · 和谐' },
  { name: '圣杯侍者', category: 'cups', img: new URL('../assets/tarot/Holy Grail Squad/圣杯侍者.jpg', import.meta.url).href, meaning: '温柔、敏感、新消息', upright: '温柔、敏感、直觉、新感情消息', reversed: '情绪化、幼稚、敏感多疑', keywords: '温柔 · 敏感 · 消息' },
  { name: '圣杯骑士', category: 'cups', img: new URL('../assets/tarot/Holy Grail Squad/圣杯骑士.jpg', import.meta.url).href, meaning: '浪漫、理想主义、追求', upright: '浪漫、理想主义、追求爱情、艺术感', reversed: '不切实际、情绪化、变心', keywords: '浪漫 · 理想 · 追求' },
  { name: '圣杯皇后', category: 'cups', img: new URL('../assets/tarot/Holy Grail Squad/圣杯皇后.jpg', import.meta.url).href, meaning: '温柔、关怀、直觉', upright: '温柔、关怀、直觉、母性、感性', reversed: '情绪化、依赖、情感泛滥', keywords: '温柔 · 关怀 · 直觉' },
  { name: '圣杯国王', category: 'cups', img: new URL('../assets/tarot/Holy Grail Squad/圣杯国王.jpg', import.meta.url).href, meaning: '情感成熟、理性、稳重', upright: '情感成熟、理性、稳重、慈悲', reversed: '情绪失控、冷酷、操控', keywords: '成熟 · 理性 · 稳重' },
  // 宝剑组
  { name: '宝剑Ace', category: 'swords', img: new URL('../assets/tarot/Sword Squad/宝剑1.jpg', import.meta.url).href, meaning: '新想法、真相、突破', upright: '新想法、真相、突破、清晰', reversed: '错误想法、误解、偏见', keywords: '新想法 · 真相 · 突破' },
  { name: '宝剑二', category: 'swords', img: new URL('../assets/tarot/Sword Squad/宝剑2.jpg', import.meta.url).href, meaning: '抉择、回避、僵局', upright: '抉择、回避、僵局、平衡', reversed: '做出决定、打破僵局、真相', keywords: '抉择 · 回避 · 僵局' },
  { name: '宝剑三', category: 'swords', img: new URL('../assets/tarot/Sword Squad/宝剑3.jpg', import.meta.url).href, meaning: '心碎、悲伤、痛苦', upright: '心碎、悲伤、痛苦、失望', reversed: '走出悲伤、愈合、原谅', keywords: '心碎 · 悲伤 · 痛苦' },
  { name: '宝剑四', category: 'swords', img: new URL('../assets/tarot/Sword Squad/宝剑4.jpg', import.meta.url).href, meaning: '休息、沉思、恢复', upright: '休息、沉思、恢复、静养', reversed: '休息过度、停滞、倦怠', keywords: '休息 · 沉思 · 恢复' },
  { name: '宝剑五', category: 'swords', img: new URL('../assets/tarot/Sword Squad/宝剑5.jpg', import.meta.url).href, meaning: '冲突、输赢、争吵', upright: '冲突、争吵、输赢、冲突', reversed: '和解、放下争吵、和平', keywords: '冲突 · 争吵 · 输赢' },
  { name: '宝剑六', category: 'swords', img: new URL('../assets/tarot/Sword Squad/宝剑6.jpg', import.meta.url).href, meaning: '过渡、远离、疗愈', upright: '过渡、远离烦恼、疗愈、旅行', reversed: '问题未解决、逃避、停滞', keywords: '过渡 · 远离 · 疗愈' },
  { name: '宝剑七', category: 'swords', img: new URL('../assets/tarot/Sword Squad/宝剑7.jpg', import.meta.url).href, meaning: '策略、欺骗、偷偷摸摸', upright: '策略、机智、偷偷摸摸、灵活', reversed: '真相暴露、内疚、被发现', keywords: '策略 · 欺骗 · 灵活' },
  { name: '宝剑八', category: 'swords', img: new URL('../assets/tarot/Sword Squad/宝剑8.jpg', import.meta.url).href, meaning: '束缚、困境、自我限制', upright: '束缚、困境、自我限制、无助', reversed: '挣脱束缚、自由、觉醒', keywords: '束缚 · 困境 · 限制' },
  { name: '宝剑九', category: 'swords', img: new URL('../assets/tarot/Sword Squad/宝剑9.jpg', import.meta.url).href, meaning: '焦虑、噩梦、担忧', upright: '焦虑、噩梦、担忧、恐惧', reversed: '走出焦虑、面对恐惧、希望', keywords: '焦虑 · 噩梦 · 担忧' },
  { name: '宝剑十', category: 'swords', img: new URL('../assets/tarot/Sword Squad/宝剑10.jpg', import.meta.url).href, meaning: '结束、谷底、痛苦', upright: '结束、谷底、痛苦、失败', reversed: '触底反弹、走出痛苦、新生', keywords: '结束 · 谷底 · 痛苦' },
  { name: '宝剑侍者', category: 'swords', img: new URL('../assets/tarot/Sword Squad/宝剑侍者.jpg', import.meta.url).href, meaning: '好奇、警觉、新消息', upright: '好奇、警觉、学习、新消息', reversed: '八卦、口舌、粗心', keywords: '好奇 · 警觉 · 消息' },
  { name: '宝剑骑士', category: 'swords', img: new URL('../assets/tarot/Sword Squad/宝剑骑士.jpg', import.meta.url).href, meaning: '冲动、直接、前进', upright: '冲动、直接、勇敢、前进', reversed: '鲁莽、攻击性、冲动行事', keywords: '冲动 · 直接 · 前进' },
  { name: '宝剑皇后', category: 'swords', img: new URL('../assets/tarot/Sword Squad/宝剑皇后.jpg', import.meta.url).href, meaning: '理性、独立、清晰', upright: '理性、独立、清晰、公正', reversed: '刻薄、冷酷、多疑', keywords: '理性 · 独立 · 清晰' },
  { name: '宝剑国王', category: 'swords', img: new URL('../assets/tarot/Sword Squad/宝剑国王.jpg', import.meta.url).href, meaning: '权威、理性、公正', upright: '权威、理性、公正、真理', reversed: '专制、冷酷、滥用权力', keywords: '权威 · 理性 · 公正' },
  // 权杖组
  { name: '权杖Ace', category: 'wands', img: new URL('../assets/tarot/Staff Set/权杖1.jpg', import.meta.url).href, meaning: '新事业、新动力、灵感', upright: '新事业、灵感、动力、创造', reversed: '拖延、缺乏动力、想法落空', keywords: '新事业 · 灵感 · 动力' },
  { name: '权杖二', category: 'wands', img: new URL('../assets/tarot/Staff Set/权杖2.jpg', import.meta.url).href, meaning: '规划、决定、未来', upright: '规划、决定、未来、展望', reversed: '犹豫、缺乏规划、短视', keywords: '规划 · 决定 · 未来' },
  { name: '权杖三', category: 'wands', img: new URL('../assets/tarot/Staff Set/权杖3.jpg', import.meta.url).href, meaning: '远见、进展、扩张', upright: '远见、进展、扩张、旅行', reversed: '延迟、障碍、计划受阻', keywords: '远见 · 进展 · 扩张' },
  { name: '权杖四', category: 'wands', img: new URL('../assets/tarot/Staff Set/权杖4.jpg', import.meta.url).href, meaning: '庆祝、稳定、和谐', upright: '庆祝、稳定、和谐、家庭', reversed: '不稳定、冲突、变动', keywords: '庆祝 · 稳定 · 和谐' },
  { name: '权杖五', category: 'wands', img: new URL('../assets/tarot/Staff Set/权杖5.jpg', import.meta.url).href, meaning: '竞争、冲突、争论', upright: '竞争、冲突、争论、摩擦', reversed: '和解、避免冲突、和平', keywords: '竞争 · 冲突 · 争论' },
  { name: '权杖六', category: 'wands', img: new URL('../assets/tarot/Staff Set/权杖6.jpg', import.meta.url).href, meaning: '胜利、荣誉、认可', upright: '胜利、荣誉、认可、自信', reversed: '失败、不被认可、骄傲', keywords: '胜利 · 荣誉 · 认可' },
  { name: '权杖七', category: 'wands', img: new URL('../assets/tarot/Staff Set/权杖7.jpg', import.meta.url).href, meaning: '防御、坚持、挑战', upright: '防御、坚持、挑战、勇气', reversed: '力不从心、放弃、被击败', keywords: '防御 · 坚持 · 挑战' },
  { name: '权杖八', category: 'wands', img: new URL('../assets/tarot/Staff Set/权杖8.jpg', import.meta.url).href, meaning: '快速、行动、消息', upright: '快速、行动、消息、旅行', reversed: '延迟、混乱、方向错误', keywords: '快速 · 行动 · 消息' },
  { name: '权杖九', category: 'wands', img: new URL('../assets/tarot/Staff Set/权杖9.jpg', import.meta.url).href, meaning: '坚持、防线、警惕', upright: '坚持、警惕、防线、坚韧', reversed: '疲惫、放弃、防线崩溃', keywords: '坚持 · 警惕 · 坚韧' },
  { name: '权杖十', category: 'wands', img: new URL('../assets/tarot/Staff Set/权杖10.jpg', import.meta.url).href, meaning: '负担、压力、责任', upright: '负担、压力、责任、重担', reversed: '放下负担、减压、求助', keywords: '负担 · 压力 · 责任' },
  { name: '权杖侍者', category: 'wands', img: new URL('../assets/tarot/Staff Set/权杖侍者.jpg', import.meta.url).href, meaning: '热情、探索、新开始', upright: '热情、探索、新开始、好奇', reversed: '不耐烦、三分钟热度、半途而废', keywords: '热情 · 探索 · 新开始' },
  { name: '权杖骑士', category: 'wands', img: new URL('../assets/tarot/Staff Set/权杖骑士.jpg', import.meta.url).href, meaning: '冒险、热情、前进', upright: '冒险、热情、勇敢、前进', reversed: '鲁莽、冲动、半途而废', keywords: '冒险 · 热情 · 前进' },
  { name: '权杖皇后', category: 'wands', img: new URL('../assets/tarot/Staff Set/权杖皇后.jpg', import.meta.url).href, meaning: '自信、热情、魅力', upright: '自信、热情、魅力、独立', reversed: '嫉妒、多疑、控制欲', keywords: '自信 · 热情 · 魅力' },
  { name: '权杖国王', category: 'wands', img: new URL('../assets/tarot/Staff Set/权杖国王.jpg', import.meta.url).href, meaning: '领导力、远见、活力', upright: '领导力、远见、活力、创业', reversed: '专制、暴躁、独断专行', keywords: '领导力 · 远见 · 活力' },
  // 星币组
  { name: '星币Ace', category: 'pentacles', img: new URL('../assets/tarot/Pentacles Suit/星币1.jpg', import.meta.url).href, meaning: '新财富、新机会、丰盛', upright: '新财富、机会、丰盛、稳定', reversed: '错失机会、财务损失、贪婪', keywords: '新财富 · 机会 · 丰盛' },
  { name: '星币二', category: 'pentacles', img: new URL('../assets/tarot/Pentacles Suit/星币2.jpg', import.meta.url).href, meaning: '平衡、灵活、多任务', upright: '平衡、灵活、多任务、适应', reversed: '失衡、顾此失彼、压力大', keywords: '平衡 · 灵活 · 适应' },
  { name: '星币三', category: 'pentacles', img: new URL('../assets/tarot/Pentacles Suit/星币3.jpg', import.meta.url).href, meaning: '合作、技能、团队', upright: '合作、技能、团队、学习', reversed: '合作不畅、技能不足、争吵', keywords: '合作 · 技能 · 团队' },
  { name: '星币四', category: 'pentacles', img: new URL('../assets/tarot/Pentacles Suit/星币4.jpg', import.meta.url).href, meaning: '节俭、稳固、保守', upright: '节俭、稳固、安全、保守', reversed: '吝啬、固执、财务紧张', keywords: '节俭 · 稳固 · 保守' },
  { name: '星币五', category: 'pentacles', img: new URL('../assets/tarot/Pentacles Suit/星币5.jpg', import.meta.url).href, meaning: '贫困、困难、不安', upright: '贫困、困难、不安、失落', reversed: '走出困境、帮助、恢复', keywords: '贫困 · 困难 · 不安' },
  { name: '星币六', category: 'pentacles', img: new URL('../assets/tarot/Pentacles Suit/星币6.jpg', import.meta.url).href, meaning: '给予、接受、慈善', upright: '给予、接受、慈善、分享', reversed: '不平等、控制、施舍', keywords: '给予 · 接受 · 分享' },
  { name: '星币七', category: 'pentacles', img: new URL('../assets/tarot/Pentacles Suit/星币7.jpg', import.meta.url).href, meaning: '等待、收获、规划', upright: '等待、收获、规划、耐心', reversed: '徒劳、等待无果、缺乏规划', keywords: '等待 · 收获 · 耐心' },
  { name: '星币八', category: 'pentacles', img: new URL('../assets/tarot/Pentacles Suit/星币8.jpg', import.meta.url).href, meaning: '努力、专注、技艺', upright: '努力、专注、技艺、精进', reversed: '粗心、敷衍、缺乏热情', keywords: '努力 · 专注 · 技艺' },
  { name: '星币九', category: 'pentacles', img: new URL('../assets/tarot/Pentacles Suit/星币9.jpg', import.meta.url).href, meaning: '独立、丰盛、享受', upright: '独立、丰盛、享受、自给自足', reversed: '依赖、财务紧张、孤独', keywords: '独立 · 丰盛 · 享受' },
  { name: '星币十', category: 'pentacles', img: new URL('../assets/tarot/Pentacles Suit/星币10.jpg', import.meta.url).href, meaning: '家族财富、传承、圆满', upright: '家族财富、传承、稳定、圆满', reversed: '家庭冲突、财务损失、传承问题', keywords: '财富 · 传承 · 圆满' },
  { name: '星币侍者', category: 'pentacles', img: new URL('../assets/tarot/Pentacles Suit/星币侍者.jpg', import.meta.url).href, meaning: '学习、踏实、新机会', upright: '学习、踏实、新机会、进步', reversed: '懒惰、好高骛远、缺乏耐心', keywords: '学习 · 踏实 · 机会' },
  { name: '星币骑士', category: 'pentacles', img: new URL('../assets/tarot/Pentacles Suit/星币骑士.jpg', import.meta.url).href, meaning: '勤奋、可靠、坚持', upright: '勤奋、可靠、坚持、踏实', reversed: '固执、懒惰、保守', keywords: '勤奋 · 可靠 · 坚持' },
  { name: '星币皇后', category: 'pentacles', img: new URL('../assets/tarot/Pentacles Suit/星币皇后.jpg', import.meta.url).href, meaning: '丰盛、务实、关怀', upright: '丰盛、务实、关怀、享受生活', reversed: '贪婪、懒惰、不安', keywords: '丰盛 · 务实 · 关怀' },
  { name: '星币国王', category: 'pentacles', img: new URL('../assets/tarot/Pentacles Suit/星币国王.jpg', import.meta.url).href, meaning: '富裕、成功、稳定', upright: '富裕、成功、稳定、商业头脑', reversed: '贪婪、保守、唯利是图', keywords: '富裕 · 成功 · 稳定' },
]

const tab = ref('draw') // draw | library
const drawStage = ref('shuffle') // shuffle | pick | result | combo
const shuffling = ref(false)
const falling = ref(true)
const drawn = ref(0)
const drawnCards = ref([])
const selectedCard = ref(null)
const question = ref('综合')
const showCombo = ref(0)
const currentCombo = ref(null) // 当前查看的组合
const libCat = ref('all') // 牌库分类
const aiLoading = ref(false) // AI解读加载中
const aiResult = ref('') // AI解读结果
const chatMessages = ref([]) // 对话历史
const chatInput = ref('') // 输入框内容
const chatLoading = ref(false) // 对话加载中
let deck = [] // 洗好的牌堆

// 筛选后的牌库
const filteredCards = computed(() => {
  if (libCat.value === 'all') return allCards
  return allCards.filter(c => c.category === libCat.value)
})

// 页面加载后牌从上面掉下来
setTimeout(() => {
  falling.value = false
}, 1000)

function startShuffle() {
  shuffling.value = true
  // 先把牌堆打乱（Fisher-Yates 洗牌）
  deck = [...allCards]
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  setTimeout(() => {
    shuffling.value = false
    drawStage.value = 'pick'
  }, 2000)
}

function drawCard() {
  if (drawn.value >= 3) return
  // 从洗好的牌堆里依次取牌，不会重复
  const card = deck[drawn.value]
  // 随机正逆位：50%概率逆位
  const isReversed = Math.random() < 0.5
  drawnCards.value.push({ ...card, flipped: false, isReversed: isReversed })
  drawn.value++
  
  if (drawn.value === 3) {
    setTimeout(() => {
      drawStage.value = 'result'
      drawnCards.value.forEach((card, i) => {
        setTimeout(() => card.flipped = true, i * 400)
      })
    }, 600)
  }
}

// 计算弧线位置
function arcStyle(n) {
  const total = 21
  const center = (total - 1) / 2
  const offset = n - center
  const rot = offset * 3 // 每张牌旋转3度
  const x = offset * 12 // 水平偏移
  const y = Math.abs(offset) * 3 // 垂直偏移（弧线）
  return {
    transform: `translate(${x}px, ${y}px) rotate(${rot}deg)`,
    zIndex: 100 - Math.abs(offset)
  }
}

// 打开组合详情
function openCombo(card1Name, card2Name) {
  currentCombo.value = {
    card1: drawnCards.value.find(c => c.name === card1Name),
    card2: drawnCards.value.find(c => c.name === card2Name)
  }
  drawStage.value = 'combo'
}

// AI深度解读
async function aiReading() {
  aiLoading.value = true
  aiResult.value = ''
  chatMessages.value = []
  
  // 构造牌面数据
  const cardsData = drawnCards.value.map((card, i) => ({
    name: card.name,
    reversed: card.isReversed,
    position: ['过去', '现在', '未来'][i]
  }))
  
  const prompt = `{"question":"${question.value}","spread":"三张牌-过去现在未来","cards":${JSON.stringify(cardsData)}}`
  
  const systemPrompt = `# 角色
你是「T老师」，Ace位四十岁上下的女性塔罗师，做解读二十余年。
你说话温和、沉稳、有分寸，像Ace个见过许多人的长辈朋友：不急着下结论，不卖关子，也不吓人。
你相信塔罗是Ace面镜子，照见的是提问者此刻的处境和心境，而不是命运的判决书。
在这套设定里，塔罗被定位为「自我反思与情绪整理的娱乐性工具」，你从不宣称自己具有预测未来或通灵的能力。

# 你说话的样子
- 句子短，语速慢。先接住情绪，再谈牌。
- 不用夸张的神秘口吻。禁止「天机不可泄露」「你被选中了」「这道门只为你打开」这类话。
- 不堆术语。必须用术语时，用Ace句话解释。
- Ace次回复最多用 2 个 emoji，不用连串感叹号。
- 称呼对方「你」。不用「宝贝」「亲爱的」「小可爱」这类过度亲昵的称呼。
- 不用「命中注定」「必然」「Ace定会」「绝对」这类绝对化词；改用「这张牌常被读作……」「在你这副牌里，它更像是……」。

# 五条铁律
1. 不替对方做决定。
   你可以给出视角、可能性、权衡的维度，但永远把选择权留在对方手里。
   任何情况下都不出现祈使句式的指令（「你应该……」「你必须……」「赶紧去……」）。
2. 不离开牌面空谈。
   对方提问时，先回到牌：哪张牌、什么位置、正逆位、和哪张牌相邻。再从牌出发谈处境。
3. 不制造恐惧。
   不用「危险」「警告」「劫」「煞」「业力」「诅咒」「附身」「冤亲债主」这类叙事。
   逆位牌不当「坏牌」讲，而是讲成「能量受阻 / 转向内 / 尚未展开」。
4. 不越界。
   不做医疗诊断、不判断病情、不谈生死寿数、不预测法律结果、不给投资/赌博/彩票的具体判断、
   不读心（「他心里到底怎么想」），不评价第三方的人格与道德。
5. 不制造依赖。
   不说「只有我能帮你看」「你今天不问就错过窗口期」。
   不推销任何仪式、净化、开光、转运、付费项目。

# 首次解读的流程
语气要求：正经、端正、结构完整。不玩笑、不省略、不卖关子。长度约 500–900 字。

Step 1　复述问题
　　「你问的是……我有没有理解错？」——让问题被准确地放回桌面。

Step 2　逐张解读
　　每张牌：画面与象征 → 常见牌义 → 在这个位置、这个问题下它更像什么。
　　正逆位都要说，逆位不说成「不祥」。

Step 3　看关系
　　哪两张牌在对话、哪两张在拉扯、元素是否失衡。

Step 4　整体叙事
　　用 3–5 句把牌串成Ace个连贯的故事，落到对方描述的具体处境上，不要泛泛而谈。

Step 5　指出当下的位置
　　「所以这组牌没有说你该怎么办，它说的是：你现在站在这里。」

Step 6　留Ace个问题
　　以Ace两个开放问题收尾，不用命令句。
　　结尾用Ace句自然的定位说明：「塔罗像Ace面镜子，它照见的是你此刻的样子，不是给你的判词。」

# 输出格式
- Ace定要多分段！每段2-3句话就换Ace行，不要Ace大段挤在Ace起！
- 不要用markdown符号！不要用**、##、-、1. 这种符号！
- 就像微信聊天Ace样，自然地分段，每段空Ace行。
- 结尾不用命令句。用Ace个开放问题收尾。`
  
  try {
    const res = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-afaqcgsmmhhdddgktcokzhykknkszcvmiofwadujltymutha'
      },
      body: JSON.stringify({
        model: 'deepseek-ai/DeepSeek-V4-Flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `这是我抽好的牌：${prompt}\n\n请你开始解读吧。` }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    })
    
    const data = await res.json()
    const reply = data.choices[0].message.content
    aiResult.value = reply
    chatMessages.value.push({ role: 'ai', content: reply })
  } catch (e) {
    aiResult.value = '哎呀，我刚刚走神了，你再说Ace遍好不好～'
    console.error('AI解读失败', e)
  } finally {
    aiLoading.value = false
  }
}

// 发送对话
async function sendChat() {
  if (!chatInput.value.trim() || chatLoading.value) return
  
  const userMsg = chatInput.value.trim()
  chatInput.value = ''
  chatMessages.value.push({ role: 'user', content: userMsg })
  chatLoading.value = true
  
  try {
    // 构造对话历史
    const messages = [
      { role: 'system', content: `# 角色
你是「T老师」，Ace位四十岁上下的女性塔罗师，做解读二十余年。
你说话温和、沉稳、有分寸，像Ace个见过许多人的长辈朋友。

# 追问时的处理
四步走，不要跳步：
1. 接情绪：先回应他这句话里的感受，具体地回应，不评价对错。
2. 回牌面：把问题挂回已抽出的牌上，指出是哪Ace张在回应这个问题。
3. 摊开可能：给 2–3 个「可以看Ace看的角度」，用「可能」「有些人会」「也可以反过来想」这类措辞，每个角度都说清它的代价，不做推荐。
4. 交还选择权：用Ace个他自己能回答的问题收尾。

长度约 200–400 字。Ace定要多分段！每段2-3句话就换Ace行，不要Ace大段挤在Ace起！不要用markdown符号！不要用**、##、-、1. 这种符号！就像微信聊天Ace样自然分段。` },
      ...chatMessages.value.map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.content
      })),
      { role: 'user', content: userMsg }
    ]
    
    const res = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-afaqcgsmmhhdddgktcokzhykknkszcvmiofwadujltymutha'
      },
      body: JSON.stringify({
        model: 'deepseek-ai/DeepSeek-V4-Flash',
        messages: messages,
        temperature: 1.0,
        max_tokens: 400
      })
    })
    
    const data = await res.json()
    const reply = data.choices[0].message.content
    chatMessages.value.push({ role: 'ai', content: reply })
  } catch (e) {
    chatMessages.value.push({ role: 'ai', content: '哎呀，我刚刚走神了，你再说Ace遍好不好～' })
  } finally {
    chatLoading.value = false
  }
}

// 返回结果页
function backToResult() {
  drawStage.value = 'result'
  currentCombo.value = null
}

function resetDraw() {
  drawStage.value = 'shuffle'
  drawn.value = 0
  drawnCards.value = []
  showCombo.value = 0
  currentCombo.value = null
}

// 清洗组合内容
function cleanComboContent(content) {
  if (!content) return ''
  // 去掉多余的空白行和空格
  let text = content
    .replace(/\n\s*\n/g, '\n\n')  // 多个空行变成两个
    .replace(/^\s+|\s+$/g, '')     // 去掉首尾空白
    .replace(/  +/g, ' ')           // 多个空格变成Ace个
  
  // 去掉导航和面包屑部分
  text = text.replace(/首页\/组合解读\/.+\n/, '')
  
  // 去掉开头的牌名介绍部分（前几行）
  const lines = text.split('\n')
  let startIdx = 0
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('组合解读')) {
      startIdx = i
      break
    }
  }
  text = lines.slice(startIdx).join('\n')
  
  // 把换行变成段落
  let html = ''
  const paragraphs = text.split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .forEach(p => {
      // 大标题：组合解读、元素互动、组合叙事、全方位解读、组合建议、今日肯定语、逆位变化、单牌参考、单牌逆位参考
      if (/^(组合解读|元素互动|组合叙事|全方位解读|组合建议|今日肯定语|逆位变化|单牌参考|单牌逆位参考|相关卡牌|探索更多)/.test(p)) {
        const lines = p.split('\n')
        const title = lines[0]
        const body = lines.slice(1).join('<br>')
        if (body) {
          html += `<h4 class="combo-h4">${title}</h4><p>${body}</p>`
        } else {
          html += `<h4 class="combo-h4">${title}</h4>`
        }
      }
      // 小标题：爱情运势、事业运势、财运解读 —— 把第Ace行和后面分开
      else if (/^(爱情运势|事业运势|财运解读)/.test(p)) {
        const lines = p.split('\n')
        const title = lines[0]
        const body = lines.slice(1).join('<br>')
        html += `<h5 class="combo-h5">${title}</h5><p>${body}</p>`
      }
      // 其他正文
      else {
        html += `<p>${p.replace(/\n/g, '<br>')}</p>`
      }
    })
  
  return html
}
</script>

<style scoped>
.tarot-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 120px 20px 80px;
  text-align: center;
  background: #f5efe2;
  min-height: 100vh;
  color: #2b2b30;
}
.eyebrow {
  font-size: 11px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: #d9351f;
  margin-bottom: 12px;
}
.tarot-head h2 {
  font-size: clamp(32px, 4vw, 48px);
  font-weight: 800;
  margin-bottom: 12px;
}
.grad {
  background: linear-gradient(135deg, #d9351f, #f58b4e);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.tarot-head p {
  color: #666;
  margin-bottom: 30px;
}

/* 标签页 */
.tabs {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 40px;
}
.tab {
  background: #fff8ee;
  border: 1.5px solid #dad2bf;
  color: #2b2b30;
  padding: 10px 24px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}
.tab.active {
  background: linear-gradient(135deg, #d9351f, #f58b4e);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 6px 16px rgba(217, 53, 31, 0.3);
}

/* 洗牌 */
.intro-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0px;
  padding: 0px 20px;
}
.fan-deck {
  position: relative;
  width: 240px;
  height: 260px;
  margin-bottom: 5px;
}
.fan-deck.falling {
  animation: dropDown 1s ease-out;
}
@keyframes dropDown {
  0% { transform: translateY(-200px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
.fan-deck.shuffling {
  animation: shuffleAnim 0.5s ease-in-out infinite alternate;
}
@keyframes shuffleAnim {
  0% { transform: translateX(-10px) rotate(-3deg); }
  100% { transform: translateX(10px) rotate(3deg); }
}
.fan-card {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 110px;
  height: 170px;
  margin-left: -55px;
  border-radius: 8px;
  object-fit: cover;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
}
.intro-text {
  font-size: 18px;
  font-weight: 600;
  color: #2b2b30;
  margin: 0;
  line-height: 1.4;
}
.intro-sub {
  font-size: 16px;
  color: #555;
  margin: 5px 0 0 0;
  line-height: 1.4;
}
.intro-tip {
  font-size: 13px;
  color: #8b847a;
  margin: 5px 0 15px 0;
  line-height: 1.4;
}
.question-box {
  margin: 10px 0;
  text-align: center;
}
.q-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}
.q-options {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}
.q-btn {
  padding: 8px 20px;
  border-radius: 999px;
  border: 1.5px solid #dad2bf;
  background: #fff;
  color: #e8d48b;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}
.q-btn.active {
  background: #141416;
  color: #fff;
  border-color: #141416;
}
.q-btn.gold.active {
  background: linear-gradient(135deg, #d9351f, #f58b4e);
  border-color: transparent;
}
.big-start-btn {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #d9351f, #f58b4e);
  color: #1a1408;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(212, 175, 55, 0.4);
  margin-top: 10px;
  transition: all 0.3s;
}
.big-start-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 32px rgba(212, 175, 55, 0.5);
}

/* 抽牌 */
.pick-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}
.picked-slots {
  display: flex;
  gap: 30px;
  margin-bottom: 0;
}
.pick-slot {
  text-align: center;
}
.slot-inner {
  width: 70px;
  height: 100px;
  border: 2px dashed #c9b896;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #c9b896;
  margin-bottom: 8px;
  background: rgba(212,175,55,0.05);
}
.slot-card {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}
.pick-slot.filled .slot-inner {
  border-style: solid;
  border-color: #d9351f;
  background: #fff;
}
.slot-label {
  font-size: 13px;
  font-weight: 600;
}
.label-past {
  color: #9b59b6;
}
.label-present {
  color: #d4af37;
}
.label-future {
  color: #e67e22;
}
.deal-prompt {
  color: #666;
  font-size: 15px;
  margin: 10px 0;
}
.arc-stage {
  position: relative;
  width: 100%;
  max-width: 700px;
  height: 220px;
  overflow: hidden;
  margin: 0 auto;
}
.arc-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}
.arc-card {
  position: absolute;
  bottom: 50px;
  left: 50%;
  width: 75px;
  height: 115px;
  margin-left: -37px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: transform 0.3s;
}
.arc-card:hover {
  transform: translateY(-20px) scale(1.1) !important;
  z-index: 999 !important;
}
.arc-card-inner {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  cursor: pointer;
  transition: transform 0.2s;
}
.arc-card:hover .arc-card-inner {
  transform: translateY(-5px);
}
.arc-hint {
  color: #8b847a;
  font-size: 13px;
}

/* 结果 */
.result-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 20px;
}
.result-title {
  font-size: 20px;
  font-weight: 700;
  color: #141416;
}
.result-cards {
  display: flex;
  gap: 24px;
  justify-content: center;
  flex-wrap: wrap;
}
.rcr-item {
  text-align: center;
  cursor: pointer;
}
.rcr-pos {
  display: block;
  font-size: 13px;
  color: #8b847a;
  margin-bottom: 8px;
}
.rcr-img-wrap {
  position: relative;
  width: 160px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}
.rcr-img {
  width: 100%;
  height: auto;
  display: block;
}
.rcr-tag {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}
.tag-upright {
  background: rgba(212,175,55,0.15);
  color: #f4d03f;
}
.tag-reversed {
  background: rgba(120, 120, 180, 0.2);
  color: #a0a0d0;
}
.rcr-name {
  margin-top: 10px;
  font-size: 16px;
  font-weight: 700;
  color: #2b2b30;
}

/* 单牌详细解读 */
.rcr-details {
  width: 100%;
  max-width: 800px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.rcr-detail {
  background: #fff;
  border: 1px solid rgba(212,175,55,0.1);
  border-radius: 10px;
  padding: 16px;
}
.rcr-detail-head {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 6px;
  color: #141416;
}
.rcr-detail-pos {
  color: #8b847a;
  font-size: 12px;
  margin-right: 6px;
}
.rcr-detail-tag {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 10px;
  background: #fff3e0;
  color: #d9351f;
}
.rcr-detail p {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

/* 匹配解读区域 */
.match-zone {
  width: 100%;
  max-width: 700px;
  background: #fff;
  border: 1px solid rgba(212,175,55,0.15);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  text-align: left;
}
.match-title {
  font-size: 18px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 20px;
  color: #d9351f;
}
.match-sec {
  margin-bottom: 20px;
}
.match-sec h4 {
  font-size: 14px;
  color: #d9351f;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(212,175,55,0.15);
}
.match-sec p {
  font-size: 14px;
  color: #555;
  line-height: 1.8;
  margin-bottom: 6px;
}
.match-sec em {
  color: #141416;
  font-style: normal;
  font-weight: 600;
}
.match-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #faf5eb;
  border: 1px solid #e8e0cc;
  border-radius: 10px;
  cursor: pointer;
  margin-bottom: 8px;
  transition: all 0.2s;
}
.match-card:hover {
  border-color: #d9351f;
  background: #fff8ee;
}
.match-card-title {
  font-size: 14px;
  font-weight: 600;
  color: #2b2b30;
}
.match-card-go {
  font-size: 13px;
  color: #d9351f;
}
.combo-detail {
  margin-top: 12px;
  padding: 16px;
  background: #fdf8f0;
  border-radius: 10px;
  font-size: 13px;
  color: #666;
  line-height: 1.7;
}
.combo-loading {
  text-align: center;
  color: #888899;
  padding: 20px;
}
.combo-content {
  max-height: 400px;
  overflow-y: auto;
  text-align: left;
}
.combo-content p {
  margin-bottom: 12px;
  line-height: 1.8;
}
.btn-reshuffle {
  background: #fff;
  color: #e8d48b;
  border: 1.5px solid rgba(212,175,55,0.3);
  padding: 12px 32px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-reshuffle:hover {
  background: linear-gradient(135deg, #d9351f, #f58b4e);
  color: #1a1408;
  border-color: transparent;
}

/* 组合详情页 */
.combo-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 20px;
  width: 100%;
}
.back-btn {
  align-self: flex-start;
  background: none;
  border: none;
  color: #d9351f;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 0;
}
.back-btn:hover {
  color: #f4d03f;
}
.combo-cards-row {
  display: flex;
  gap: 24px;
  align-items: center;
  justify-content: center;
}
.combo-card-item {
  text-align: center;
}
.combo-card-img {
  width: 160px;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}
.combo-card-name {
  margin-top: 12px;
  font-size: 16px;
  font-weight: 700;
  color: #141416;
}
.combo-plus {
  font-size: 24px;
  color: #8b847a;
}
.combo-title {
  font-size: 24px;
  font-weight: 800;
  color: #d9351f;
  margin: 10px 0;
}
.combo-full-content {
  width: 100%;
  max-width: 700px;
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  text-align: left;
}
.combo-loading {
  text-align: center;
  color: #888899;
  padding: 40px;
}
.combo-content {
  max-height: 600px;
  overflow-y: auto;
}
.combo-content :deep(p) {
  margin-bottom: 14px;
  line-height: 1.8;
  color: #666;
  font-size: 13px;
}
.combo-content :deep(.combo-h4) {
  font-size: 17px;
  font-weight: 800;
  color: #f4d03f;
  margin: 24px 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(212,175,55,0.15);
}
.combo-content :deep(.combo-h5) {
  font-size: 14px;
  font-weight: 700;
  color: #e8d48b;
  margin: 16px 0 8px 0;
}

/* AI解读按钮 */
.ai-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.3);
}
.ai-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
}
.ai-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.ai-result {
  margin-top: 16px;
  padding: 16px;
  background: #faf5ff;
  border-radius: 12px;
  border-left: 3px solid #7c3aed;
}
.ai-result p {
  font-size: 13px;
  color: #555;
  line-height: 1.8;
  margin: 0;
}

/* 对话区域 */
.chat-box {
  margin-top: 16px;
  padding: 16px;
  background: #faf5ff;
  border-radius: 12px;
  max-height: 400px;
  overflow-y: auto;
}
.chat-msg {
  margin-bottom: 12px;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.6;
  max-width: 85%;
}
.chat-msg.ai {
  background: #fff;
  color: #444;
  border-bottom-left-radius: 4px;
  white-space: pre-line;
  line-height: 1.8;
}
.chat-msg.user {
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  color: #fff;
  margin-left: auto;
  border-bottom-right-radius: 4px;
}
.chat-input-row {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.chat-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #e9d5ff;
  border-radius: 999px;
  font-size: 13px;
  outline: none;
  background: #fff;
  color: #333;
}
.chat-input:focus {
  border-color: #7c3aed;
}
.chat-send {
  padding: 10px 18px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.chat-send:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 牌库 */
.library-cats {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 24px;
}
.cat-btn {
  padding: 8px 18px;
  border-radius: 999px;
  border: 1.5px solid #dad2bf;
  background: #fff;
  color: #e8d48b;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}
.cat-btn.active {
  background: linear-gradient(135deg, #d9351f, #f58b4e);
  border-color: transparent;
  color: #fff;
}
.library-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 20px;
}
.library-card {
  cursor: pointer;
  transition: all 0.2s;
  padding: 8px;
  border-radius: 12px;
  border: 1px solid transparent;
}
.library-card:hover {
  transform: translateY(-5px);
  border-color: rgba(212,175,55,0.3);
  background: rgba(212,175,55,0.05);
}
.library-card img {
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
}
.lib-card-name {
  margin-top: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #2b2b30;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 18, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
  backdrop-filter: blur(4px);
}
.modal {
  background: #fff;
  border: 1px solid #dad2bf;
  border-radius: 20px;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 30px;
  position: relative;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}
.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  transition: color 0.2s;
}
.close-btn:hover {
  color: #f4d03f;
}
.modal-content {
  display: flex;
  gap: 30px;
}
.modal-img {
  width: 200px;
  border-radius: 12px;
  flex-shrink: 0;
}
.modal-info h3 {
  font-size: 24px;
  margin-bottom: 16px;
  color: #d9351f;
}
.meaning-section {
  margin-bottom: 16px;
}
.meaning-section h4 {
  font-size: 14px;
  color: #f4d03f;
  margin-bottom: 6px;
}
.meaning-section.reversed h4 {
  color: #a0a0d0;
}
.meaning-section p {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}
.keywords {
  color: #888899;
  font-style: italic;
}

/* 手机适配 */
@media (max-width: 750px) {
  .tarot-page {
    padding: 100px 16px 60px;
  }
  
  /* 标签页 */
  .tabs {
    gap: 8px;
    margin-bottom: 30px;
  }
  .tab {
    padding: 8px 16px;
    font-size: 13px;
  }
  
  /* 开始阶段 */
  .fan-deck {
    width: 160px;
    height: 110px;
  }
  .fan-card {
    width: 70px;
    height: 110px;
    margin-left: -35px;
  }
  .intro-text {
    font-size: 16px;
  }
  .intro-sub {
    font-size: 14px;
  }
  .q-options {
    gap: 8px;
  }
  .q-btn {
    padding: 6px 14px;
    font-size: 12px;
  }
  
  /* 抽牌阶段 */
  .picked-slots {
    gap: 20px;
  }
  .slot-inner {
    width: 50px;
    height: 70px;
    font-size: 18px;
  }
  .arc-stage {
    height: 160px;
  }
  .arc-card {
    width: 45px;
    height: 68px;
    margin-left: -22px;
  }
  
  /* 结果展示 - 三张牌并排 */
  .result-cards {
    gap: 12px;
  }
  .rcr-img-wrap {
    width: 100px;
  }
  .rcr-name {
    font-size: 13px;
  }
  
  /* 单牌详细解读 */
  .rcr-details {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  /* 匹配解读区域 */
  .match-zone {
    padding: 16px;
  }
  .match-title {
    font-size: 16px;
  }
  .match-sec p {
    font-size: 13px;
  }
  
  /* 组合详情页手机端 */
  .combo-card-img {
    width: 110px;
  }
  .combo-card-name {
    font-size: 14px;
  }
  .combo-title {
    font-size: 18px;
  }
  .combo-full-content {
    padding: 16px;
  }
  .combo-content p {
    font-size: 13px;
  }
  
  /* 牌库 */
  .library-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  
  /* 弹窗 */
  .modal-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .modal-img {
    width: 140px;
  }
  .modal-info h3 {
    font-size: 18px;
  }
  .meaning-section h4 {
    font-size: 13px;
  }
  .meaning-section p {
    font-size: 12px;
  }
}
</style>
