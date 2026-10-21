<template>
  <div class="page bridge-page">
    <!-- ============ 页面标题 ============ -->
    <div class="bridge-head">
      <div class="eyebrow">Bridge</div>
      <h2>桥牌<span class="grad">对战室</span></h2>
    </div>

    <!-- ============ 功能切换 ============ -->
    <div class="tabs">
      <button class="tab" :class="{ active: tab === 'intro' }" @click="tab = 'intro'">📖 玩法</button>
      <button class="tab" :class="{ active: tab === 'wheel' }" @click="showWheel = true; tab = 'wheel'">🤖 开始对战</button>
    </div>

    <!-- ============ 转盘选先后手 ============ -->
    <div v-if="tab === 'wheel'" class="wheel-stage">
      <div class="wheel-container">
        <div class="wheel" :style="{ transform: `rotate(${wheelRotation}deg)` }">
          <div class="wheel-section north">北</div>
          <div class="wheel-section east">东</div>
          <div class="wheel-section south">你</div>
          <div class="wheel-section west">西</div>
        </div>
        <div class="wheel-pointer"></div>
        <button class="spin-btn" @click="spinWheel" :disabled="isSpinning">
          {{ isSpinning ? '转动中...' : '开始转盘' }}
        </button>
        <div v-if="wheelResult" class="wheel-result">
          👉 {{ wheelResult }} 先叫牌！
        </div>
      </div>
    </div>

    <!-- ============ 玩法介绍 ============ -->
    <div v-if="tab === 'intro'" class="intro-stage">
      <div class="intro-card">
        <h3>🃏 专业桥牌规则</h3>
        <div class="rules-list">
          <div class="rule-item">
            <span class="rule-num">1</span>
            <div>
              <strong>叫牌阶段</strong>
              <p>轮流叫牌，确定将牌花色和目标墩数，最后一个叫牌的人定约</p>
            </div>
          </div>
          <div class="rule-item">
            <span class="rule-num">2</span>
            <div>
              <strong>将牌（王牌）</strong>
              <p>叫牌定的花色是将牌，将牌比其他花色都大，跟不出可以出将牌杀</p>
            </div>
          </div>
          <div class="rule-item">
            <span class="rule-num">3</span>
            <div>
              <strong>打牌阶段</strong>
              <p>定约人下家先出，必须跟同花色，将牌最大，赢墩多的赢</p>
            </div>
          </div>
          <div class="rule-item">
            <span class="rule-num">4</span>
            <div>
              <strong>计分</strong>
              <p>完成叫牌目标得分，没完成失分，打完统计总分</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============ 叫牌阶段 ============ -->
    <div v-if="tab === 'play' && biddingPhase" class="bidding-stage">
      <div class="bidding-title">📢 叫牌阶段</div>
      <div class="bidding-cards">
        <img :src="getCardImg('梅花A')" alt="牌" class="bidding-card" />
        <img :src="getCardImg('方块K')" alt="牌" class="bidding-card" />
        <img :src="getCardImg('红桃Q')" alt="牌" class="bidding-card" />
        <img :src="getCardImg('黑桃J')" alt="牌" class="bidding-card" />
        <img :src="getCardImg('梅花10')" alt="牌" class="bidding-card" />
        <img :src="getCardImg('方块9')" alt="牌" class="bidding-card" />
        <img :src="getCardImg('红桃8')" alt="牌" class="bidding-card" />
      </div>
      <div class="bidding-info">
        当前定约：{{ contract || '未定' }} · 将牌：{{ trumpSuit || '未定' }}
      </div>
      
      <!-- 叫牌记录 -->
      <div class="bidding-history">
        <div v-for="(bid, i) in bidHistory" :key="i" class="bid-item">
          {{ bid.player }}: {{ bid.call }}
        </div>
      </div>

      <!-- 叫牌按钮 -->
      <div class="bid-actions" v-if="currentBidder === 'south'">
        <div class="bid-row">
          <button v-for="level in [1,2,3,4,5,6,7]" :key="level" 
                  class="bid-btn" 
                  @click="makeBid(level, '梅花')">
            <img :src="getCardImg('梅花A')" class="bid-card-img" />
            <span class="bid-level">{{ level }}</span>
          </button>
        </div>
        <div class="bid-row">
          <button v-for="level in [1,2,3,4,5,6,7]" :key="level" 
                  class="bid-btn" 
                  @click="makeBid(level, '方块')">
            <img :src="getCardImg('方块A')" class="bid-card-img" />
            <span class="bid-level">{{ level }}</span>
          </button>
        </div>
        <div class="bid-row">
          <button v-for="level in [1,2,3,4,5,6,7]" :key="level" 
                  class="bid-btn" 
                  @click="makeBid(level, '红桃')">
            <img :src="getCardImg('红桃A')" class="bid-card-img" />
            <span class="bid-level">{{ level }}</span>
          </button>
        </div>
        <div class="bid-row">
          <button v-for="level in [1,2,3,4,5,6,7]" :key="level" 
                  class="bid-btn" 
                  @click="makeBid(level, '黑桃')">
            <img :src="getCardImg('黑桃A')" class="bid-card-img" />
            <span class="bid-level">{{ level }}</span>
          </button>
        </div>
        <div class="bid-row">
          <button v-for="level in [1,2,3,4,5,6,7]" :key="level" 
                  class="bid-btn" 
                  @click="makeBid(level, '无将')">
            <span class="bid-level">无将 {{ level }}</span>
          </button>
        </div>
        <div class="bid-row">
          <button class="bid-btn pass" @click="makePass">不叫</button>
        </div>
      </div>
      <div v-else class="bidding-waiting">
        AI叫牌中...
      </div>
      
      <!-- 叫牌时显示自己的牌 -->
      <div class="bidding-your-cards">
        <img 
          v-for="(card, i) in yourHand" 
          :key="i" 
          :src="getCardImg(card)" 
          :alt="card"
          class="bidding-your-card"
        />
      </div>
    </div>

    <!-- ============ 打牌阶段 ============ -->
    <div v-if="tab === 'play' && !biddingPhase" class="game-stage">
      <!-- 定约信息 -->
      <div class="contract-info">
        {{ contract }} 定约 · 庄家：{{ declarer }} · 将牌：{{ trumpSuit || '无将' }}
      </div>

      <!-- 北家（队友） -->
      <div class="player-area north">
        <div class="player-cards">
          <img v-for="n in northHand.length" :key="'n' + n" :src="cardBack" alt="北家牌" class="player-card" />
        </div>
        <p class="player-name">🧑‍🤝‍🧑 北（队友） · 赢了 {{ northTricks }} 墩</p>
      </div>

      <!-- 东西家 -->
      <div class="middle-row">
        <!-- 西家 -->
        <div class="player-area west">
          <div class="west-cards">
            <img v-for="n in westHand.length" :key="'w' + n" :src="cardBack" alt="西家牌" class="player-card small" />
          </div>
          <p class="player-name">西 · {{ westTricks }} 墩</p>
        </div>

        <!-- 中间出牌区 -->
        <div class="table-area">
          <div class="played-grid">
            <div class="played-slot north-slot">
              <img v-if="played.north" :src="getCardImg(played.north)" class="played-card" />
            </div>
            <div class="played-slot west-slot">
              <img v-if="played.west" :src="getCardImg(played.west)" class="played-card" />
            </div>
            <div class="played-slot east-slot">
              <img v-if="played.east" :src="getCardImg(played.east)" class="played-card" />
            </div>
            <div class="played-slot south-slot">
              <img v-if="played.south" :src="getCardImg(played.south)" class="played-card" />
            </div>
          </div>
          <div class="game-info">
            <div>总墩数：{{ totalTricks }} / 13</div>
            <div>我方（南北）：{{ ourTricks }} 墩 · 目标：{{ targetTricks }} 墩</div>
            <div>对方（东西）：{{ theirTricks }} 墩</div>
            <div v-if="currentPlayer === 'south'" class="countdown">⏱️ 你的时间：{{ countdown }} 秒</div>
          </div>
        </div>

        <!-- 东家 -->
        <div class="player-area east">
          <div class="east-cards">
            <img v-for="n in eastHand.length" :key="'e' + n" :src="cardBack" alt="东家牌" class="player-card small" />
          </div>
          <p class="player-name">东 · {{ eastTricks }} 墩</p>
        </div>
      </div>

      <!-- 你（南家） -->
      <div class="player-area south">
        <p class="player-name">👤 你（南） · 赢了 {{ southTricks }} 墩</p>
        <div class="player-cards">
          <img 
            v-for="(card, i) in yourHand" 
            :key="i" 
            :src="getCardImg(card)" 
            :alt="card"
            class="player-card your-card"
            :class="{ disabled: isPlaying }"
            @click="playCard(card, i)"
          />
        </div>
      </div>

      <!-- 控制按钮 -->
      <div class="game-controls">
        <button class="deal-btn" @click="startGame">🔄 重新发牌</button>
        <button class="back-btn" @click="tab = 'intro'">返回</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const tab = ref('intro')
const cardBack = new URL('../assets/Playing cards/牌背.jpg', import.meta.url).href

// 转盘状态
const showWheel = ref(false)
const wheelRotation = ref(0)
const isSpinning = ref(false)
const wheelResult = ref('')

// 游戏状态
const yourHand = ref([])
const northHand = ref([])
const eastHand = ref([])
const westHand = ref([])
const played = ref({ north: null, east: null, west: null, south: null })
const currentSuit = ref(null)
const currentPlayer = ref('south')
const isPlaying = ref(false)
const countdown = ref(30)
let countdownTimer = null

// 叫牌状态
const biddingPhase = ref(true)
const bidHistory = ref([])
const currentBidder = ref('west')
const highestBid = ref(null)
const passCount = ref(0)
const trumpSuit = ref(null)
const contract = ref(null)
const declarer = ref(null)
const targetTricks = ref(0)

// 出牌顺序（顺时针）
const playOrder = ['south', 'west', 'north', 'east']

// 墩数统计
const southTricks = ref(0)
const northTricks = ref(0)
const eastTricks = ref(0)
const westTricks = ref(0)
const totalTricks = ref(0)

const ourTricks = computed(() => southTricks.value + northTricks.value)
const theirTricks = computed(() => eastTricks.value + westTricks.value)

// 生成牌组
function generateDeck() {
  const suits = ['黑桃', '红桃', '方块', '梅花']
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
  const deck = []
  suits.forEach(suit => ranks.forEach(rank => deck.push(`${suit}${rank}`)))
  return deck
}

// 洗牌
function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

// 获取牌的点数
function getCardValue(card) {
  const rank = card.slice(2)
  const values = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 }
  return values[rank] || 0
}

// 获取花色
function getSuit(card) {
  return card.slice(0, 2)
}

// 获取图片路径
function getCardImg(card) {
  return new URL(`../assets/Playing cards/${card}.jpg`, import.meta.url).href
}

// 开始倒计时
function startCountdown(seconds, callback) {
  stopCountdown()
  countdown.value = seconds
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      stopCountdown()
      callback()
    }
  }, 1000)
}

// 停止倒计时
function stopCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

// 玩家超时自动出牌
function autoPlayCard() {
  if (yourHand.value.length > 0 && currentPlayer.value === 'south') {
    playCard(yourHand.value[0], 0)
  }
}

// 叫牌
function makeBid(level, suit) {
  const suitText = suit === '无将' ? '无将' : suit
  const bid = { level, suit, call: `${level}${suitText}` }
  
  // 比大小
  if (highestBid.value) {
    if (level < highestBid.value.level) return
    if (level === highestBid.value.level) {
      const suitOrder = ['梅花', '方块', '红桃', '黑桃', '无将']
      if (suitOrder.indexOf(suit) <= suitOrder.indexOf(highestBid.value.suit)) return
    }
  }
  
  highestBid.value = bid
  bidHistory.value.push({ player: '你', call: bid.call })
  passCount.value = 0
  
  // AI叫牌
  setTimeout(() => {
    aiBid()
  }, 1000)
}

// 不叫
function makePass() {
  bidHistory.value.push({ player: '你', call: '不叫' })
  passCount.value++
  
  // 连续3个不叫，叫牌结束
  if (passCount.value >= 3) {
    endBidding()
    return
  }
  
  setTimeout(() => {
    aiBid()
  }, 1000)
}

// AI叫牌（简单策略：叫一次就不叫了）
function aiBid() {
  const players = ['west', 'north', 'east']
  const playerNames = { west: '西', north: '北', east: '东' }
  
  // 简单AI：随机叫一个或者不叫
  if (highestBid.value && Math.random() > 0.5) {
    bidHistory.value.push({ player: playerNames[currentBidder.value], call: '不叫' })
    passCount.value++
    
    if (passCount.value >= 3) {
      endBidding()
      return
    }
  } else if (!highestBid.value) {
    // 第一个叫，随便叫一个1红桃
    const bid = { level: 1, suit: '红桃', call: '1红桃' }
    highestBid.value = bid
    bidHistory.value.push({ player: playerNames[currentBidder.value], call: bid.call })
    passCount.value = 0
  } else {
    // 后面的都不叫
    bidHistory.value.push({ player: playerNames[currentBidder.value], call: '不叫' })
    passCount.value++
    
    if (passCount.value >= 3) {
      endBidding()
      return
    }
  }
  
  // 下一个人叫牌
  const currentIdx = playOrder.indexOf(currentBidder.value)
  currentBidder.value = playOrder[(currentIdx + 1) % 4]
  
  if (currentBidder.value !== 'south') {
    setTimeout(() => aiBid(), 800)
  }
}

// 叫牌结束
function endBidding() {
  // 如果没有人叫牌，默认定约1黑桃
  if (!highestBid.value) {
    highestBid.value = { level: 1, suit: '黑桃', call: '1黑桃' }
  }
  
  biddingPhase.value = false
  trumpSuit.value = highestBid.value.suit
  contract.value = highestBid.value.call
  targetTricks.value = highestBid.value.level + 6
  declarer.value = '你'
  
  // 开始打牌
  setTimeout(() => {
    startCountdown(30, autoPlayCard)
  }, 1000)
}

// AI选牌策略（专业版，支持将牌）
async function aiChooseCard(hand, leadSuit, currentCards) {
  if (hand.length === 0) return null
  
  // 优先跟同花色
  const sameSuit = hand.filter(c => getSuit(c) === leadSuit)
  
  if (sameSuit.length > 0) {
    // 有同花色：看看能不能赢这墩
    const currentMax = currentCards.length > 0 
      ? Math.max(...currentCards.filter(c => getSuit(c) === leadSuit).map(c => getCardValue(c)))
      : 0
    
    const winningCards = sameSuit.filter(c => getCardValue(c) > currentMax)
    
    if (winningCards.length > 0) {
      winningCards.sort((a, b) => getCardValue(a) - getCardValue(b))
      return winningCards[0]
    } else {
      sameSuit.sort((a, b) => getCardValue(a) - getCardValue(b))
      return sameSuit[0]
    }
  } else {
    // 没有同花色：如果有将牌，出将牌赢
    if (trumpSuit.value && trumpSuit.value !== '无将') {
      const trumps = hand.filter(c => getSuit(c) === trumpSuit.value)
      if (trumps.length > 0) {
        trumps.sort((a, b) => getCardValue(a) - getCardValue(b))
        return trumps[0]
      }
    }
    
    // 没有将牌，出最小的单张
    const sorted = [...hand].sort((a, b) => getCardValue(a) - getCardValue(b))
    return sorted[0]
  }
}

// 转盘转动
function spinWheel() {
  if (isSpinning.value) return
  isSpinning.value = true
  wheelResult.value = ''
  
  // 随机转5-8圈，然后随机停在一个位置
  const randomDeg = 1800 + Math.random() * 1800 // 5-10圈
  wheelRotation.value += randomDeg
  
  setTimeout(() => {
    isSpinning.value = false
    // 指针在顶部（0度位置），转盘转了wheelRotation度，
    // 所以指针指向的转盘上的角度是 (360 - wheelRotation % 360) % 360
    const pointerAngle = (360 - (wheelRotation.value % 360)) % 360
    // 四个色块（每个90度，分界线在45/135/225/315度，中心在0/90/180/270度）：
    // 红=北：315-45度（中心0度）
    // 蓝=东：45-135度（中心90度）
    // 绿=南(你)：135-225度（中心180度）
    // 黄=西：225-315度（中心270度）
    let firstBidder
    if (pointerAngle >= 315 || pointerAngle < 45) firstBidder = 'north'
    else if (pointerAngle >= 45 && pointerAngle < 135) firstBidder = 'east'
    else if (pointerAngle >= 135 && pointerAngle < 225) firstBidder = 'south'
    else firstBidder = 'west'
    
    const names = { north: '北家', east: '东家', south: '你', west: '西家' }
    wheelResult.value = names[firstBidder]
    
    // 延迟一下，然后开始游戏
    setTimeout(() => {
      startGame(firstBidder)
    }, 1500)
  }, 3000)
}

// 开始游戏
function startGame(firstBidder = 'south') {
  const deck = shuffle(generateDeck())
  yourHand.value = deck.slice(0, 13)
  northHand.value = deck.slice(13, 26)
  eastHand.value = deck.slice(26, 39)
  westHand.value = deck.slice(39, 52)
  
  // 理牌：按花色排序，同花色按点数从大到小（A在左边）
  const suitOrder = ['梅花', '方块', '红桃', '黑桃']
  yourHand.value.sort((a, b) => {
    const suitA = getSuit(a)
    const suitB = getSuit(b)
    const orderA = suitOrder.indexOf(suitA)
    const orderB = suitOrder.indexOf(suitB)
    if (orderA !== orderB) return orderA - orderB
    return getCardValue(b) - getCardValue(a) // 从大到小
  })
  
  played.value = { north: null, east: null, west: null, south: null }
  currentSuit.value = null
  currentPlayer.value = 'south'
  isPlaying.value = false
  southTricks.value = 0
  northTricks.value = 0
  eastTricks.value = 0
  westTricks.value = 0
  totalTricks.value = 0
  
  // 重置叫牌
  biddingPhase.value = true
  bidHistory.value = []
  currentBidder.value = firstBidder
  highestBid.value = null
  passCount.value = 0
  trumpSuit.value = null
  contract.value = null
  declarer.value = null
  targetTricks.value = 0
  
  tab.value = 'play'
  
  // 如果第一个叫牌的不是你，自动开始AI叫牌
  if (firstBidder !== 'south') {
    setTimeout(() => {
      aiBid()
    }, 1000)
  }
}

// 玩家出牌
function playCard(card, index) {
  if (isPlaying.value) return
  if (currentPlayer.value !== 'south') return
  
  stopCountdown()
  
  yourHand.value.splice(index, 1)
  played.value.south = card
  
  if (!currentSuit.value) {
    currentSuit.value = getSuit(card)
  }
  
  nextPlayer()
}

// 下一个人出牌
async function nextPlayer() {
  const currentIdx = playOrder.indexOf(currentPlayer.value)
  const nextIdx = (currentIdx + 1) % 4
  currentPlayer.value = playOrder[nextIdx]
  
  // 四个人都出完了
  if (played.value.south && played.value.west && played.value.north && played.value.east) {
    setTimeout(() => judgeTrick(), 1000)
    return
  }
  
  // 玩家出牌
  if (currentPlayer.value === 'south') {
    isPlaying.value = false
    startCountdown(30, autoPlayCard)
    return
  }
  
  // AI自动出牌
  isPlaying.value = true
  setTimeout(async () => {
    const handMap = {
      'north': northHand.value,
      'east': eastHand.value,
      'west': westHand.value
    }
    const hand = handMap[currentPlayer.value]
    const currentCards = [played.value.south, played.value.west, played.value.north, played.value.east].filter(Boolean)
    const card = await aiChooseCard(hand, currentSuit.value, currentCards)
    const idx = hand.indexOf(card)
    hand.splice(idx, 1)
    played.value[currentPlayer.value] = card
    
    nextPlayer()
  }, 800)
}

// 判断这墩谁赢（支持将牌）
function judgeTrick() {
  const cards = [
    { player: 'south', card: played.value.south },
    { player: 'west', card: played.value.west },
    { player: 'north', card: played.value.north },
    { player: 'east', card: played.value.east },
  ]
  
  let winner = cards[0]
  cards.forEach(c => {
    // 将牌最大
    if (trumpSuit.value && trumpSuit.value !== '无将') {
      const cIsTrump = getSuit(c.card) === trumpSuit.value
      const wIsTrump = getSuit(winner.card) === trumpSuit.value
      
      if (cIsTrump && !wIsTrump) {
        winner = c
      } else if (cIsTrump && wIsTrump) {
        if (getCardValue(c.card) > getCardValue(winner.card)) {
          winner = c
        }
      } else if (!cIsTrump && !wIsTrump && getSuit(c.card) === currentSuit.value) {
        if (getCardValue(c.card) > getCardValue(winner.card)) {
          winner = c
        }
      }
    } else {
      // 无将，只跟同花色比
      if (getSuit(c.card) === currentSuit.value) {
        if (getCardValue(c.card) > getCardValue(winner.card)) {
          winner = c
        }
      }
    }
  })
  
  // 统计墩数
  if (winner.player === 'south') southTricks.value++
  if (winner.player === 'north') northTricks.value++
  if (winner.player === 'east') eastTricks.value++
  if (winner.player === 'west') westTricks.value++
  
  totalTricks.value++
  
  // 重置
  setTimeout(() => {
    played.value = { north: null, east: null, west: null, south: null }
    currentSuit.value = null
    currentPlayer.value = winner.player
    isPlaying.value = false
    
    // 游戏结束：打完13墩
    if (totalTricks.value >= 13) {
      stopCountdown()
      const made = ourTricks.value >= targetTricks.value
      setTimeout(() => {
        alert(`🎉 13墩打完！\n定约：${contract.value}\n目标：${targetTricks.value} 墩\n我方赢了：${ourTricks.value} 墩\n${made ? '✅ 完成定约！赢啦！' : '❌ 没完成定约，输了'}`)
      }, 500)
      return
    }
    
    // 下一轮
    if (currentPlayer.value === 'south') {
      startCountdown(30, autoPlayCard)
    } else {
      isPlaying.value = true
      setTimeout(async () => {
        const handMap = {
          'north': northHand.value,
          'east': eastHand.value,
          'west': westHand.value
        }
        const hand = handMap[currentPlayer.value]
        const card = await aiChooseCard(hand, null, [])
        const idx = hand.indexOf(card)
        hand.splice(idx, 1)
        played.value[currentPlayer.value] = card
        currentSuit.value = getSuit(card)
        nextPlayer()
      }, 800)
    }
  }, 1500)
}
</script>

<style scoped>
.bridge-page {
  min-height: 100vh;
  padding: 50px 20px 30px;
  max-width: 1200px;
  margin: 0 auto;
}

/* ============ 转盘样式 ============ */
.wheel-stage {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}
.wheel-container {
  position: relative;
  text-align: center;
}
.wheel {
  width: 280px;
  height: 280px;
  border-radius: 50%;
  border: 8px solid #8b5a2b;
  position: relative;
  overflow: hidden;
  transition: transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99);
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  background: conic-gradient(
    from -45deg,
    #d9351f 0deg 90deg,
    #2d5f8a 90deg 180deg,
    #2d8a4e 180deg 270deg,
    #8a7a2d 270deg 360deg
  );
}
.wheel-section {
  position: absolute;
  font-weight: bold;
  font-size: 24px;
  color: #fff;
}
.wheel-section.north {
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
}
.wheel-section.east {
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
}
.wheel-section.south {
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
}
.wheel-section.west {
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
}
.wheel-pointer {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 15px solid transparent;
  border-right: 15px solid transparent;
  border-top: 25px solid #d9351f;
  z-index: 10;
}
.spin-btn {
  margin-top: 30px;
  padding: 12px 30px;
  font-size: 16px;
  font-weight: 600;
  background: #141416;
  color: #fff;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.3s;
}
.spin-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}
.spin-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.wheel-result {
  margin-top: 20px;
  font-size: 20px;
  font-weight: bold;
  color: #d9351f;
}

.bridge-head {
  text-align: center;
  margin-bottom: 25px;
  padding-top: 20px;
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
  margin-bottom: 12px;
}
.eyebrow::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #d9351f;
  box-shadow: 0 0 0 3px rgba(217, 53, 31, 0.2);
}
.bridge-head h2 {
  font-weight: 700;
  font-size: clamp(24px, 4vw, 42px);
  white-space: nowrap;
}
.bridge-head .grad {
  font-style: italic;
  font-weight: 800;
  background: linear-gradient(135deg, #d9351f, #f58b4e);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.tabs {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 25px;
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
}
.tab.active {
  background: linear-gradient(135deg, #d9351f, #f58b4e);
  border-color: transparent;
  color: #fff;
}

/* 介绍页 */
.intro-stage {
  max-width: 700px;
  margin: 0 auto;
}
.intro-card {
  background: #fffaf0;
  border: 1px solid #ede6d6;
  border-radius: 20px;
  padding: 25px;
}
.intro-card h3 {
  margin-bottom: 18px;
  color: #2b2b30;
}
.rules-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.rule-item {
  display: flex;
  gap: 12px;
}
.rule-num {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: linear-gradient(135deg, #d9351f, #f58b4e);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}
.rule-item strong {
  color: #2b2b30;
}
.rule-item p {
  margin-top: 4px;
  font-size: 13px;
  color: #888;
}

/* 叫牌阶段 */
.bidding-stage {
  max-width: 500px;
  margin: 0 auto;
  background: #fffaf0;
  border: 1px solid #ede6d6;
  border-radius: 20px;
  padding: 20px;
  text-align: center;
}
.bidding-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 15px;
  color: #2b2b30;
}
.bidding-cards {
  margin-bottom: 15px;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  height: 60px;
}
.bidding-card {
  width: 35px;
  height: 49px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  margin-left: -15px;
  transform-origin: bottom center;
}
.bidding-card:nth-child(1) { transform: rotate(-20deg); }
.bidding-card:nth-child(2) { transform: rotate(-13deg); }
.bidding-card:nth-child(3) { transform: rotate(-6deg); }
.bidding-card:nth-child(4) { transform: rotate(0deg); }
.bidding-card:nth-child(5) { transform: rotate(6deg); }
.bidding-card:nth-child(6) { transform: rotate(13deg); }
.bidding-card:nth-child(7) { transform: rotate(20deg); }
.bidding-info {
  font-size: 13px;
  color: #666;
  margin-bottom: 15px;
}
.bidding-history {
  background: #fff;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
  min-height: 100px;
  text-align: left;
}
.bid-item {
  font-size: 14px;
  line-height: 1.8;
  color: #333;
}
.bid-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.bid-row {
  display: flex;
  gap: 6px;
  justify-content: center;
}
.bid-btn {
  padding: 5px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.bid-card-img {
  width: 24px;
  height: 34px;
  border-radius: 2px;
}
.bid-level {
  font-size: 11px;
}
.bid-btn:hover {
  background: #f0f0f0;
}
.bid-btn.pass {
  background: #f5f5f5;
  padding: 8px 20px;
}
.bidding-waiting {
  font-size: 14px;
  color: #999;
  padding: 20px;
}
.bidding-your-cards {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}
.bidding-your-card {
  width: 30px;
  height: 42px;
  border-radius: 3px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  background: #fff;
}

/* 打牌阶段 */
.contract-info {
  text-align: center;
  font-size: 13px;
  color: #666;
  margin-bottom: 10px;
  padding: 8px;
  background: #fff8ee;
  border-radius: 8px;
}

.game-stage {
  max-width: 800px;
  margin: 0 auto;
}

.player-area {
  text-align: center;
  margin-bottom: 10px;
}

/* 中间牌桌 - 像Bridge Champ那样的绿色圆桌 */
.table-area {
  flex: 1;
  background: radial-gradient(circle, #2d6a4f 0%, #1b4332 100%);
  border-radius: 20px;
  padding: 20px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 400px;
  margin: 0 auto;
  box-shadow: inset 0 0 30px rgba(0,0,0,0.3);
}

.player-area {
  text-align: center;
  margin-bottom: 15px;
}
.player-cards {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}
.player-card {
  width: 45px;
  height: 63px;
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}
.player-card.small {
  width: 30px;
  height: 42px;
}
.player-name {
  font-size: 13px;
  color: #666;
  font-weight: 600;
}

/* 北家的牌（扇形弧形） */
.player-area.north .player-cards {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  height: 70px;
  position: relative;
}
.player-area.north .player-card {
  width: 24px;
  height: 34px;
  margin-left: -18px;
  border-radius: 3px;
  transform-origin: bottom center;
}
.player-area.north .player-card:nth-child(1) { transform: rotate(-25deg); }
.player-area.north .player-card:nth-child(2) { transform: rotate(-21deg); }
.player-area.north .player-card:nth-child(3) { transform: rotate(-17deg); }
.player-area.north .player-card:nth-child(4) { transform: rotate(-13deg); }
.player-area.north .player-card:nth-child(5) { transform: rotate(-9deg); }
.player-area.north .player-card:nth-child(6) { transform: rotate(-5deg); }
.player-area.north .player-card:nth-child(7) { transform: rotate(0deg); }
.player-area.north .player-card:nth-child(8) { transform: rotate(5deg); }
.player-area.north .player-card:nth-child(9) { transform: rotate(9deg); }
.player-area.north .player-card:nth-child(10) { transform: rotate(13deg); }
.player-area.north .player-card:nth-child(11) { transform: rotate(17deg); }
.player-area.north .player-card:nth-child(12) { transform: rotate(21deg); }
.player-area.north .player-card:nth-child(13) { transform: rotate(25deg); }

/* 西家的牌（竖排） */
.west-cards {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 180px;
  justify-content: center;
}
.west-cards .player-card {
  width: 24px;
  height: 34px;
  margin-top: -25px;
  border-radius: 3px;
  transform-origin: center right;
}

/* 东家的牌（竖排） */
.east-cards {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 180px;
  justify-content: center;
}
.east-cards .player-card {
  width: 24px;
  height: 34px;
  margin-top: -25px;
  border-radius: 3px;
  transform-origin: center left;
}

.middle-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30px;
  margin: 15px 0;
}

/* 中间牌桌 */
.table-area {
  flex: 1;
  background: linear-gradient(135deg, #2d5a3d, #1e4029);
  border-radius: 15px;
  padding: 15px;
  min-height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 300px;
}
.played-grid {
  display: grid;
  grid-template-areas: 
    ". north ."
    "west . east"
    ". south .";
  gap: 10px;
  margin-bottom: 15px;
}
.played-slot {
  width: 45px;
  height: 63px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.north-slot { grid-area: north; }
.west-slot { grid-area: west; }
.east-slot { grid-area: east; }
.south-slot { grid-area: south; }
.played-card {
  width: 45px;
  height: 63px;
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.game-info {
  color: #fff;
  font-size: 13px;
  text-align: center;
  line-height: 1.8;
  opacity: 0.9;
}
.countdown {
  font-size: 16px;
  font-weight: 700;
  color: #ffd700;
  margin-top: 5px;
}

/* 你的牌 */
.your-card {
  cursor: pointer;
  transition: transform 0.2s;
  background: #fff;
}
.your-card:hover {
  transform: translateY(-8px);
}
.your-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 控制按钮 */
.game-controls {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}
.deal-btn, .back-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.deal-btn {
  background: linear-gradient(135deg, #d9351f, #f58b4e);
  color: #fff;
}
.back-btn {
  background: #fff8ee;
  border: 1.5px solid #dad2bf;
  color: #2b2b30;
}

@media (max-width: 750px) {
  .player-card {
    width: 30px;
    height: 42px;
  }
  .player-card.small {
    width: 18px;
    height: 25px;
  }
  .played-card {
    width: 30px;
    height: 42px;
  }
  .played-slot {
    width: 30px;
    height: 42px;
  }
  .bridge-page {
    padding: 15px 10px;
  }
  .middle-row {
    gap: 10px;
  }
  .table-area {
    padding: 10px;
    min-height: 120px;
    max-width: 250px;
  }
  .west-cards, .east-cards {
    height: 100px;
  }
  .west-cards .player-card, .east-cards .player-card {
    width: 18px;
    height: 25px;
    margin-top: -18px;
  }
  .player-area.north .player-card {
    width: 20px;
    height: 28px;
    margin-left: -12px;
  }
  .player-area.north .player-cards {
    height: 50px;
  }
}
</style>
