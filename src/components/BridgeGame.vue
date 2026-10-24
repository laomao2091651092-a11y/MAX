<script setup>
/*
 * BridgeGame.vue —— 娱乐级定约桥牌单文件组件
 * 严格遵循 WBF 标准规则（叫牌合法性 / 跟牌 / 赢墩 / 标准盘式计分）。
 * 依赖：仅 Vue 3 Composition API，无任何第三方库。
 * 牌面素材：通过 props.pokerBasePath 拼接（默认指定路径，浏览器中请改为可访问的 URL）。
 */
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'

/* ============ Props / Events ============ */
const props = defineProps({
  initialBoard: { type: Number, default: 1 },          // 起始副数，默认 1
  aiDifficulty: { type: String, default: 'normal' },    // 'easy' | 'normal' | 'hard'
  pokerBasePath: { type: String, default: 'F:\\乌班图\\tarot\\扑克牌' }, // 默认指定路径
  showSettings: { type: Boolean, default: true },
  netMode: { type: String, default: 'solo' },           // solo=单机 | host=房主(算牌局) | guest=客人 | spectate=旁观(只能看)
  netSeat: { type: String, default: 'S' }               // 我在真实牌桌上的座位（N/E/S/W）
})
const emit = defineEmits({
  boardEnd: (r) => typeof r === 'object',
  totalUpdate: (t) => typeof t === 'object',
  netChange: (s) => typeof s === 'object',   // 房主：牌局变了，广播快照
  netAct: (a) => typeof a === 'object'       // 客人：我的动作，发给房主
})

/* ============ 常量 ============ */
const SEATS = ['N', 'E', 'S', 'W']
const SEAT_CN = { N: '北', E: '东', S: '南', W: '西' }
const NEXT = { N: 'E', E: 'S', S: 'W', W: 'N' }
const PREV = { N: 'W', W: 'S', S: 'E', E: 'N' }
const PARTNER = { N: 'S', S: 'N', E: 'W', W: 'E' }
const SUIT_CN = { S: '黑桃', H: '红桃', D: '方块', C: '梅花' }
const SUIT_SYMBOL = { C: '♣', D: '♦', H: '♥', S: '♠', NT: 'NT' }
const SUIT_RANK = { C: 1, D: 2, H: 3, S: 4, NT: 5 } // 叫牌花色等级 C<D<H<S<NT
const RANK_DISPLAY = { 14: 'A', 13: 'K', 12: 'Q', 11: 'J' }
const SUIT_ORDER = { S: 0, H: 1, D: 2, C: 3 }        // 显示排序

/* ============ 联网：座位换算（本地永远是南家） ============
 * 引擎和模板里"我"永远是南家(S)。联网时我在真实牌桌上的座位可能是北/东/西，
 * 所以真实座位 ↔ 本地座位 之间做一次整体旋转。只在网络边界换算一次，
 * 引擎规则和模板一行都不用改。solo 模式 netSeat='S'，换算恒等于自身。 */
const CYCLE = ['N', 'E', 'S', 'W']
const shift = computed(() => (CYCLE.indexOf(props.netSeat) - 2 + 4) % 4)
function realOf(local) { return CYCLE[(CYCLE.indexOf(local) + shift.value + 4) % 4] }
function localOf(real) { return CYCLE[(CYCLE.indexOf(real) - shift.value + 4) % 4] }

// 房主专用：还有哪些"本地座位"由远端真人在操作（这些座位不能让 AI 代打）
const remoteSeats = ref([])
function setRemoteSeats(reals) {
  remoteSeats.value = (reals || []).map(r => localOf(r)).filter(s => s !== 'S')
}
function isRemote(seat) { return remoteSeats.value.indexOf(seat) >= 0 }
// 客人 / 旁观：牌局都来自网络快照，本地不算牌
const isMirror = computed(() => props.netMode === 'guest' || props.netMode === 'spectate')

function sideOf(seat) { return (seat === 'N' || seat === 'S') ? 'NS' : 'EW' }
function rankDisplay(r) { return RANK_DISPLAY[r] || String(r) }
function cardImage(card) { return `${props.pokerBasePath}/${SUIT_CN[card.suit]}${rankDisplay(card.rank)}.png` }
function backImage() { return `${props.pokerBasePath}/牌背.png` }

// 16 副一循环的发牌人 / 局况（严格按规范表）
const BOARD_TABLE = [
  { dealer: 'N', vul: 'none' }, { dealer: 'E', vul: 'ns' }, { dealer: 'S', vul: 'ew' }, { dealer: 'W', vul: 'both' },
  { dealer: 'N', vul: 'ns' }, { dealer: 'E', vul: 'ew' }, { dealer: 'S', vul: 'both' }, { dealer: 'W', vul: 'none' },
  { dealer: 'N', vul: 'ew' }, { dealer: 'E', vul: 'both' }, { dealer: 'S', vul: 'none' }, { dealer: 'W', vul: 'ns' },
  { dealer: 'N', vul: 'both' }, { dealer: 'E', vul: 'none' }, { dealer: 'S', vul: 'ns' }, { dealer: 'W', vul: 'ew' }
]

/* ============ 响应式状态 ============ */
const game = reactive({
  board: 1, phase: 'bidding', // bidding | playing | scoring
  hands: { N: [], E: [], S: [], W: [] },
  bidding: [],                // {seat, action:'pass'|'bid'|'double'|'redouble', level?, strain?, dbl?}
  currentBid: null,           // {level, strain, side, dbl:'none'|'double'|'redouble'}
  passCount: 0,
  declarer: null, dummy: null, leader: null, turn: null,
  currentTrick: [],           // {seat, card}
  tricksPlayed: 0, tricksNS: 0, tricksEW: 0, dummyRevealed: false,
  winnerSeat: null,           // 本墩已判定赢家（高亮窗口内）
  lastResult: null, history: [], totalNS: 0, totalEW: 0,
  dealer: null, vulnerability: null
})

const settings = reactive({
  difficulty: props.aiDifficulty, cardSize: 80, hints: false, speed: 650, autoDummy: true,
  sound: false, seed: null    // seed 为数字时确定性发牌（同种子同牌局）；null 表示随机
})

const broken = reactive({})   // 图片加载失败回退
const toastMsg = ref('')
const showHistory = ref(false)
const showBid = ref(false) // 打牌阶段回看叫牌浮层
const showStats = ref(false)
const showSettingsPanel = ref(false)

/* ============ 响应式：测量容器宽度，自动缩放 ============ */
const rootEl = ref(null)
const containerW = ref(1024)
let resizeObs = null
const narrow = computed(() => containerW.value < 640) // 窄屏：中央改纵向堆叠
// 有效牌宽：取设置值与容器可容纳宽度的较小者
// 手机窄屏：南家 13 张叠得更紧（每张叠 22%），把牌尽量做大，出牌更好点
const cardW = computed(() => {
  const w = containerW.value
  if (narrow.value) {
    const bySouth = (w - 14) / 7.6
    return Math.round(Math.max(34, Math.min(settings.cardSize, bySouth, 56)))
  }
  const bySouth = Math.max(30, (w - 48) / 11)
  return Math.round(Math.max(30, Math.min(settings.cardSize, bySouth)))
})
// 牌桌（呢面）尺寸：手机上收小，把空间让给牌和下方的照片
const feltSize = computed(() => {
  const w = containerW.value
  if (narrow.value) return Math.round(Math.max(150, Math.min(230, w * 0.56)))
  return Math.round(Math.max(160, Math.min(320, w * 0.34)))
})

/* ============ 牌堆 / 发牌 ============ */
function freshDeck() {
  const d = []
  for (const s of ['S', 'H', 'D', 'C']) for (let r = 2; r <= 14; r++) d.push({ suit: s, rank: r })
  return d
}
function shuffle(a, rng) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1));[a[i], a[j]] = [a[j], a[i]] }
  return a
}
// 确定性随机数：相同 seed 必出相同牌局（方便分享/复盘）
function mulberry32(seed) {
  let s = seed >>> 0
  return function () {
    s |= 0; s = s + 0x6D2B79F5 | 0
    let t = Math.imul(s ^ s >>> 15, 1 | s)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}
function sortHand(h) { h.sort((a, b) => SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit] || b.rank - a.rank) }

function deal(board) {
  const t = BOARD_TABLE[(board - 1) % 16]
  game.dealer = t.dealer
  game.vulnerability = t.vul
  const base = settings.seed != null ? Number(settings.seed) : ((Date.now() ^ (board * 2654435761)) >>> 0)
  const rng = mulberry32((base + board * 7919) >>> 0)
  const deck = shuffle(freshDeck(), rng)
  game.hands = { N: [], E: [], S: [], W: [] }
  let seat = t.dealer
  for (let i = 0; i < 52; i++) { game.hands[seat].push(deck[i]); seat = NEXT[seat] }
  for (const s of SEATS) sortHand(game.hands[s])
  game.bidding = []; game.currentBid = null; game.passCount = 0
  game.declarer = null; game.dummy = null; game.leader = null; game.turn = null
  game.currentTrick = []; game.tricksPlayed = 0; game.tricksNS = 0; game.tricksEW = 0
  game.dummyRevealed = false; game.winnerSeat = null; game.lastResult = null
  showBid.value = false
  game.phase = 'bidding'; game.turn = game.dealer
  sfx('deal')
}

/* ============ 叫牌合法性 ============ */
function isContractLegal(level, strain) {
  if (!game.currentBid) return true
  const c = game.currentBid
  if (level > c.level) return true
  if (level === c.level && SUIT_RANK[strain] > SUIT_RANK[c.strain]) return true
  return false
}
function isDoubleLegal(seat) {
  if (!game.currentBid || game.currentBid.dbl !== 'none') return false
  return sideOf(seat) !== game.currentBid.side
}
function isRedoubleLegal(seat) {
  if (!game.currentBid || game.currentBid.dbl !== 'double') return false
  return sideOf(seat) === game.currentBid.side
}

/* ============ 应用一次叫品 ============ */
function applyBid(action) {
  let entry
  if (action.type === 'pass') {
    game.passCount++
    entry = { seat: game.turn, action: 'pass' }
  } else if (action.type === 'bid') {
    game.passCount = 0
    game.currentBid = { level: action.level, strain: action.strain, side: sideOf(game.turn), dbl: 'none' }
    entry = { seat: game.turn, action: 'bid', level: action.level, strain: action.strain, dbl: '—' }
  } else if (action.type === 'double') {
    game.passCount = 0
    game.currentBid.dbl = 'double'
    const lastBid = [...game.bidding].reverse().find(b => b.action === 'bid')
    if (lastBid) lastBid.dbl = 'X'
    entry = { seat: game.turn, action: 'double' }
  } else if (action.type === 'redouble') {
    game.passCount = 0
    game.currentBid.dbl = 'redouble'
    const lastBid = [...game.bidding].reverse().find(b => b.action === 'bid')
    if (lastBid) lastBid.dbl = 'XX'
    entry = { seat: game.turn, action: 'redouble' }
  }
  game.bidding.push(entry)

  if (game.currentBid && game.passCount >= 3) { endBidding(); save(); return }
  if (!game.currentBid && game.passCount >= 4) { endBiddingAllPass(); save(); return }

  game.turn = NEXT[game.turn]
  scheduleAI()
  save()
}

/* 人类叫牌动作 */
/* 叫牌动作：客人端不自己结算，先把动作发给房主，等房主广播回来 */
function submitBid(action) {
  if (props.netMode === 'spectate') { showToast('你在旁观，不能叫牌'); return }
  if (props.netMode === 'guest') { emit('netAct', { kind: 'bid', seat: realOf('S'), action }); return }
  applyBid(action)
}
function humanPass() { if (game.turn === 'S') submitBid({ type: 'pass' }) }
function humanDouble() { if (game.turn === 'S' && isDoubleLegal('S')) submitBid({ type: 'double' }) }
function humanRedouble() { if (game.turn === 'S' && isRedoubleLegal('S')) submitBid({ type: 'redouble' }) }
function humanBid(level, strain) { if (game.turn === 'S' && isContractLegal(level, strain)) submitBid({ type: 'bid', level, strain }) }

/* ============ 结束叫牌 ============ */
function endBidding() {
  const cb = game.currentBid
  let declarerSeat = null
  for (const b of game.bidding) { // 定约方中首个叫出该花色/无将者即为庄家
    if (b.action === 'bid' && b.strain === cb.strain && sideOf(b.seat) === cb.side) { declarerSeat = b.seat; break }
  }
  game.declarer = declarerSeat
  game.dummy = PARTNER[declarerSeat]
  game.phase = 'playing'
  game.tricksNS = 0; game.tricksEW = 0; game.tricksPlayed = 0
  game.currentTrick = []; game.dummyRevealed = false
  game.leader = PREV[declarerSeat] // 庄家左手边（逆时针前一家）首攻
  game.turn = game.leader
  scheduleAI()
}
function endBiddingAllPass() {
  game.lastResult = { board: game.board, contract: '四家 Pass', made: null, score: 0, parts: [] }
  game.history.push({ board: game.board, contract: '四家 Pass', declarer: null, made: null, nsScore: 0, ewScore: 0, tricksNS: 0, tricksEW: 0 })
  game.phase = 'scoring'
  emit('boardEnd', { board: game.board, contract: '四家 Pass', nsScore: 0, ewScore: 0 })
  emit('totalUpdate', { ns: game.totalNS, ew: game.totalEW })
}

/* ============ 打牌 ============
 * 明手控制权：桥牌规则为"庄家控制明手"，明手本身无决策权。
 * - 南家(你)是庄家：你操作自己的牌 + 明手(北家)的牌
 * - 北家(AI)是庄家：明手是南家(你)，你的牌由北家 AI 操作，你无需出手
 * - 东西家是庄家：明手为东/西，由 AI 操作，你只打自己的牌 */
function isHumanControlled(seat) {
  if (game.phase !== 'playing') return false
  if (props.netMode === 'spectate') return false // 旁观：谁都不让点
  // 我（南家）：自己是庄家时连明手一起操作
  if (seat === 'S' || (game.declarer === 'S' && seat === game.dummy)) return true
  // 远端真人座位同理：他当庄家时，他的明手也归他操作
  if (isRemote(seat)) return true
  if (game.declarer && isRemote(game.declarer) && seat === game.dummy) return true
  return false
}
function isLegalPlay(seat, card) {
  if (game.currentTrick.length === 0) return true
  const leadSuit = game.currentTrick[0].card.suit
  const hasLead = game.hands[seat].some(c => c.suit === leadSuit)
  if (hasLead) return card.suit === leadSuit // 必须跟同花色
  return true // 垫牌 / 将吃
}
function betterCard(a, b, leadSuit, trump) {
  const ca = a.card, cb = b.card
  const aT = trump !== 'NT' && ca.suit === trump
  const bT = trump !== 'NT' && cb.suit === trump
  if (aT && !bT) return a
  if (bT && !aT) return b
  if (aT && bT) return ca.rank > cb.rank ? a : b
  const aL = ca.suit === leadSuit, bL = cb.suit === leadSuit
  if (aL && !bL) return a
  if (bL && !aL) return b
  if (aL && bL) return ca.rank > cb.rank ? a : b
  return a // 两家均垫牌，原领先者保持
}
function trickWinner(trick, leadSuit, trump) {
  if (!trick.length) return null
  let w = trick[0]
  for (let i = 1; i < trick.length; i++) w = betterCard(w, trick[i], leadSuit, trump)
  return w
}
function currentTrickWinnerSeat() {
  const w = trickWinner(game.currentTrick, game.currentTrick[0]?.card.suit, game.currentBid.strain)
  return w ? w.seat : null
}
function wouldWinIfPlayed(card) {
  const leadSuit = game.currentTrick[0].card.suit
  const w = trickWinner(game.currentTrick, leadSuit, game.currentBid.strain)
  if (!w) return true
  return betterCard(w, { seat: 'X', card }, leadSuit, game.currentBid.strain).seat === 'X'
}

function humanPlayCard(card) {
  if (props.netMode === 'spectate') return
  if (game.phase !== 'playing' || !isHumanControlled(game.turn)) return
  if (!isLegalPlay(game.turn, card)) { showToast(illegalReason(game.turn, card)); return }
  // 客人端：动作发房主，本地不动（等房主广播快照回来才刷新）
  if (props.netMode === 'guest') {
    picked.value = null
    emit('netAct', { kind: 'play', seat: realOf(game.turn), card: { suit: card.suit, rank: card.rank } })
    return
  }
  playCard(game.turn, card)
}
function illegalReason(seat, card) {
  if (game.currentTrick.length && game.currentTrick[0].card.suit !== card.suit &&
    game.hands[seat].some(c => c.suit === game.currentTrick[0].card.suit)) return '必须跟出同花色牌'
  return '当前不可出该牌'
}

function playCard(seat, card) {
  const h = game.hands[seat]
  const idx = h.findIndex(c => c.suit === card.suit && c.rank === card.rank)
  if (idx >= 0) h.splice(idx, 1)
  game.currentTrick.push({ seat, card })
  sfx('play')
  if (game.currentTrick.length === 1) game.dummyRevealed = true // 首攻后明手亮牌
  if (game.currentTrick.length === 4) {
    trickTimer = setTimeout(resolveTrick, Math.max(300, settings.speed))
  } else {
    game.turn = NEXT[seat]
    scheduleAI()
  }
  save()
}
function resolveTrick() {
  if (!game.currentTrick.length) return // 防止重开后残留定时器误触发
  // 第二阶段：高亮窗口结束后，清墩并继续
  if (game.winnerSeat != null) {
    const w = game.winnerSeat
    game.turn = w
    game.currentTrick = []
    game.winnerSeat = null
    if (game.tricksPlayed >= 13) { endPlay(); save(); return }
    clearTimers(); scheduleAI(); save()
    return
  }
  // 第一阶段：判定赢家并进入高亮窗口
  const leadSuit = game.currentTrick[0].card.suit
  const w = trickWinner(game.currentTrick, leadSuit, game.currentBid.strain)
  if (sideOf(w.seat) === 'NS') game.tricksNS++; else game.tricksEW++
  game.tricksPlayed++
  game.winnerSeat = w.seat
  // 先安排好高亮→清墩的定时器，再做提示/音效，避免后续调用异常时彻底卡住
  trickTimer = setTimeout(resolveTrick, Math.max(450, settings.speed)) // 高亮停留时间
  if (sideOf(w.seat) === 'NS') showToast('南北方赢得第 ' + game.tricksPlayed + ' 墩')
  else showToast('东西方赢得第 ' + game.tricksPlayed + ' 墩')
  sfx('trick')
  save()
}

/* ============ 计分（标准盘式，严格按规范） ============ */
function computeScore({ level, strain, dbl, declarerSide, vulnerability, tricksWon }) {
  const needed = level + 6
  const made = tricksWon >= needed
  const vul = (vulnerability === 'both') ||
    (vulnerability === 'ns' && declarerSide === 'NS') ||
    (vulnerability === 'ew' && declarerSide === 'EW')
  const parts = []
  if (made) {
    const base = (strain === 'C' || strain === 'D') ? 20 : 30
    const contractScore = level * base + (strain === 'NT' ? 10 : 0)
    parts.push({ label: `定约分(${level}×${base}${strain === 'NT' ? '+10首墩' : ''})`, value: contractScore })
    const overtricks = tricksWon - needed
    let overScore = 0
    if (overtricks > 0) {
      if (dbl === 'none') overScore = overtricks * base
      else if (dbl === 'double') overScore = overtricks * (vul ? 200 : 100)
      else overScore = overtricks * (vul ? 400 : 200)
      parts.push({ label: `超墩(${overtricks})`, value: overScore })
    }
    // 奖励分
    let bonus = 0, bonusLabel = ''
    if (contractScore >= 100) { bonus = vul ? 500 : 300; bonusLabel = '成局奖励' }
    else { bonus = 50; bonusLabel = '不成局奖励' }
    if (level === 6) { bonus = vul ? 750 : 500; bonusLabel = '小满贯奖励' }
    if (level === 7) { bonus = vul ? 1500 : 1000; bonusLabel = '大满贯奖励' }
    parts.push({ label: bonusLabel, value: bonus })
    if (dbl === 'double') parts.push({ label: '加倍奖励', value: 50 })
    if (dbl === 'redouble') parts.push({ label: '再加倍奖励', value: 100 })
    const total = parts.reduce((s, p) => s + p.value, 0)
    return { made: true, score: total, parts, over: overtricks, vul }
  } else {
    const under = needed - tricksWon
    const table = {
      nv_und: [-50, -100, -150, -200, -250, -300, -350],
      nv_dbl: [-100, -300, -500, -800, -1100, -1400, -1700],
      v_und: [-100, -200, -300, -400, -500, -600, -700],
      v_dbl: [-200, -500, -800, -1100, -1400, -1700, -2000]
    }
    let raw
    if (dbl === 'none') raw = (vul ? table.v_und : table.nv_und)[under - 1]
    else if (dbl === 'double') raw = (vul ? table.v_dbl : table.nv_dbl)[under - 1]
    else raw = (vul ? table.v_dbl : table.nv_dbl)[under - 1] * 2 // 再加倍 = 加倍分值×2
    parts.push({ label: `宕${under}墩${dbl === 'none' ? '' : (dbl === 'double' ? '(加倍)' : '(再加倍)')}${vul ? '(有局)' : '(无局)'}`, value: raw })
    return { made: false, score: raw, parts, under, vul }
  }
}
function endPlay() {
  // 幂等保护：只允许在打牌阶段结算一次，避免兜底/重复触发造成重复计分
  if (game.phase !== 'playing') return
  const cb = game.currentBid
  const declarerSide = sideOf(game.declarer)
  const won = declarerSide === 'NS' ? game.tricksNS : game.tricksEW
  const r = computeScore({ level: cb.level, strain: cb.strain, dbl: cb.dbl, declarerSide, vulnerability: game.vulnerability, tricksWon: won })
  r.board = game.board; r.contract = contractText.value; r.declarer = game.declarer
  r.tricksNS = game.tricksNS; r.tricksEW = game.tricksEW
  game.lastResult = r
  if (declarerSide === 'NS') game.totalNS += r.score; else game.totalEW += r.score
  game.history.push({
    board: game.board, contract: r.contract, declarer: game.declarer, made: r.made,
    nsScore: declarerSide === 'NS' ? r.score : 0, ewScore: declarerSide === 'EW' ? r.score : 0,
    tricksNS: game.tricksNS, tricksEW: game.tricksEW
  })
  game.phase = 'scoring'
  sfx('score')
  emit('boardEnd', { board: game.board, contract: r.contract, nsScore: declarerSide === 'NS' ? r.score : 0, ewScore: declarerSide === 'EW' ? r.score : 0 })
  emit('totalUpdate', { ns: game.totalNS, ew: game.totalEW })
}

/* ============ AI 调度 ============ */
let aiTimer = null
let trickTimer = null
let settleWatchdog = null   // 兜底看门狗：防止墩结算定时器被他人清掉导致卡住
function clearTimers() {
  if (aiTimer) { clearTimeout(aiTimer); aiTimer = null }
  if (trickTimer) { clearTimeout(trickTimer); trickTimer = null }
}
function scheduleAI() {
  // 客人 / 旁观端不跑 AI：牌局由房主算好后广播过来，本地只渲染
  if (isMirror.value) return
  // 只清 AI 自身的定时器；绝不能清 trickTimer，否则会把"一墩出满后的结算"打断，卡在最后一墩
  if (aiTimer) { clearTimeout(aiTimer); aiTimer = null }
  if (game.phase === 'bidding') {
    if (game.turn === 'S' || isRemote(game.turn)) return // 等待人类（本地 / 远端真人）
    aiTimer = setTimeout(aiBidTurn, settings.speed)
  } else if (game.phase === 'playing') {
    // 你当庄家且轮到明手出牌、开启自动明手时，由 AI 代打，你只需出自己的 13 张
    if (game.turn === game.dummy && game.declarer === 'S' && settings.autoDummy) {
      aiTimer = setTimeout(() => aiPlayTurn(true), settings.speed)
      return
    }
    if (isHumanControlled(game.turn)) return
    aiTimer = setTimeout(aiPlayTurn, settings.speed)
  }
}
function aiBidTurn() {
  if (game.phase !== 'bidding' || game.turn === 'S' || isRemote(game.turn)) return
  const b = aiBid(game.turn)
  applyBid(b)
}
function aiPlayTurn(force) {
  if (game.phase !== 'playing' || (!force && isHumanControlled(game.turn))) return
  const card = aiPlayCard(game.turn)
  if (card) playCard(game.turn, card)
}

/* ============ AI 叫牌（标准自然法，简化且合法） ============ */
function hcp(hand) {
  let p = 0
  for (const c of hand) { if (c.rank === 14) p += 4; else if (c.rank === 13) p += 3; else if (c.rank === 12) p += 2; else if (c.rank === 11) p += 1 }
  return p
}
function suitLengths(hand) { const l = { S: 0, H: 0, D: 0, C: 0 }; for (const c of hand) l[c.suit]++; return l }
function isBalanced(hand) {
  const l = suitLengths(hand)
  const vals = Object.values(l).sort((a, b) => b - a)
  return vals[0] <= 5 && vals[1] <= 4 && vals[2] <= 3 && vals[3] >= 2
}
function longestSuit(hand) {
  const l = suitLengths(hand); let best = 'C', bl = -1
  for (const s of ['S', 'H', 'D', 'C']) if (l[s] > bl) { bl = l[s]; best = s }
  return { suit: best, len: bl }
}
function findPartnerBidStrain(seat) {
  const p = PARTNER[seat]
  for (const b of game.bidding) if (b.action === 'bid' && b.seat === p) return b.strain
  return null
}
function findMyOpeningStrain(seat) {
  for (const b of game.bidding) if (b.action === 'bid' && b.seat === seat) return b.strain
  return null
}
function aiBid(seat) {
  const hand = game.hands[seat]
  const myHcp = hcp(hand)
  const len = suitLengths(hand)
  const cb = game.currentBid
  const mySide = sideOf(seat)
  const weHigh = cb && cb.side === mySide
  const easy = settings.difficulty === 'easy'
  const ls = longestSuit(hand)
  const pass = { type: 'pass' }
  const mk = (lvl, str) => isContractLegal(lvl, str) ? { type: 'bid', level: lvl, strain: str } : null
  const lowestAbove = () => {
    if (!cb) return { type: 'bid', level: 1, strain: 'C' }
    for (let l = 1; l <= 7; l++) for (const s of ['C', 'D', 'H', 'S', 'NT']) if (isContractLegal(l, s)) return { type: 'bid', level: l, strain: s }
    return null
  }

  if (!cb) { // 开叫
    if (myHcp >= 15 && myHcp <= 17 && isBalanced(hand)) return mk(1, 'NT') || pass
    if (myHcp >= (easy ? 13 : 11)) return mk(1, ls.suit) || pass
    return pass
  }
  if (weHigh) {
    const pStrain = findPartnerBidStrain(seat)
    const mStrain = findMyOpeningStrain(seat)
    if (pStrain) {
      const support = len[pStrain]
      if (support >= (easy ? 4 : 3) && myHcp >= (easy ? 10 : 8)) {
        if (pStrain === 'NT') {
          if (myHcp >= 13) return mk(3, 'NT') || lowestAbove() || pass
          if (myHcp >= 11) return mk(2, 'NT') || lowestAbove() || pass
        } else {
          const t = mk(Math.min(7, cb.level + 1), pStrain)
          return t || pass
        }
      }
      if (ls.len >= 5 && myHcp >= 10) { const t = mk(Math.max(cb.level, 1), ls.suit); if (t) return t }
      if (myHcp >= 12 && isContractLegal(1, 'NT')) return mk(1, 'NT')
      return pass
    }
    if (mStrain) {
      if (ls.len >= 6) { const t = mk(Math.min(7, cb.level + 1), ls.suit); if (t) return t }
      if (myHcp >= 15) { const t = mk(Math.min(7, cb.level + 1), mStrain); if (t) return t }
      return pass
    }
    return pass
  }
  // 对方叫品占优
  if (isDoubleLegal(seat)) {
    const opp = cb.strain
    const shortOpp = opp === 'NT' ? isBalanced(hand) : (len[opp] <= (easy ? 1 : 2))
    if (shortOpp && myHcp >= (easy ? 11 : 10)) return { type: 'double' }
  }
  if (myHcp >= (easy ? 13 : 12)) {
    if (ls.len >= 5) return mk(Math.max(1, cb.level + 1), ls.suit) || lowestAbove() || pass
    if (isContractLegal(1, 'NT')) return mk(1, 'NT')
  }
  return pass
}

/* ============ AI 出牌 ============ */
function highestOf(cards) { let b = null; for (const c of cards) if (!b || c.rank > b.rank) b = c; return b }
function lowestOf(cards) { let b = null; for (const c of cards) if (!b || c.rank < b.rank) b = c; return b }
/** 垫牌时保留长套：从张数最少的花色里垫最小的（困难难度用，避免把长套垫短） */
function discardLowestFromShortest(legal) {
  const bySuit = {}
  for (const c of legal) { (bySuit[c.suit] = bySuit[c.suit] || []).push(c) }
  let bestSuit = null, bestLen = Infinity
  for (const s in bySuit) {
    if (bySuit[s].length < bestLen) { bestLen = bySuit[s].length; bestSuit = s }
  }
  return lowestOf(bySuit[bestSuit]) || lowestOf(legal)
}

function aiPlayCard(seat) {
  const hand = game.hands[seat]
  const trump = game.currentBid.strain
  const declarerSide = sideOf(game.declarer)
  const mySide = sideOf(seat)
  const isDec = mySide === declarerSide
  const trick = game.currentTrick
  const leadSuit = trick.length ? trick[0].card.suit : null
  const legal = hand.filter(c => isLegalPlay(seat, c))
  if (!legal.length) legal.push(hand[0])
  const ls = longestSuit(hand)
  const diff = settings.difficulty
  // 简单难度：AI 有一定概率“看走眼”随机出牌，明显更好打
  if (diff === 'easy' && legal.length > 1 && Math.random() < 0.35) {
    return legal[Math.floor(Math.random() * legal.length)]
  }

  if (trick.length === 0) { // 领出
    // 困难难度：庄家有将定约时先吊将（把外面的将牌清掉，再兑现赢墩）
    if (diff === 'hard' && isDec && trump !== 'NT') {
      const tr = legal.filter(c => c.suit === trump)
      if (tr.length) return highestOf(tr)
    }
    const cand = legal.filter(c => c.suit === ls.suit)
    return (cand.length ? highestOf(cand) : highestOf(legal)) || legal[0]
  }
  const wSeat = currentTrickWinnerSeat()
  const wSide = wSeat ? sideOf(wSeat) : null
  const followers = leadSuit ? legal.filter(c => c.suit === leadSuit) : []
  const hasLead = followers.length > 0

  if (isDec) {
    if (hasLead) {
      if (wSide === declarerSide) return lowestOf(followers) // 同伴领先，垫小
      const win = followers.filter(c => wouldWinIfPlayed(c))
      return win.length ? lowestOf(win) : lowestOf(followers)
    }
    const trumps = legal.filter(c => trump !== 'NT' && c.suit === trump)
    if (trumps.length) {
      if (wSide !== declarerSide) { const win = trumps.filter(c => wouldWinIfPlayed(c)); if (win.length) return lowestOf(win) }
      return lowestOf(trumps) // 将吃或垫将
    }
    return diff === 'hard' ? discardLowestFromShortest(legal) : lowestOf(legal)
  } else { // 防守方：争取打宕
    if (hasLead) {
      if (wSide === mySide) return lowestOf(followers)
      const win = followers.filter(c => wouldWinIfPlayed(c))
      return win.length ? lowestOf(win) : lowestOf(followers)
    }
    const trumps = legal.filter(c => trump !== 'NT' && c.suit === trump)
    if (wSide !== mySide) {
      if (trumps.length) { const win = trumps.filter(c => wouldWinIfPlayed(c)); if (win.length) return lowestOf(win); return lowestOf(trumps) }
      return diff === 'hard' ? discardLowestFromShortest(legal) : lowestOf(legal) // 垫牌
    }
    return diff === 'hard' ? discardLowestFromShortest(legal) : lowestOf(legal) // 同伴已赢，垫小
  }
}

/* ============ 流程控制 ============ */
function nextBoard() {
  clearTimers()
  const nb = game.board + 1
  game.board = nb; deal(nb); game.phase = 'bidding'; game.lastResult = null
  scheduleAI(); save()
}
function restartBoard() {
  if (isMirror.value) { showToast('联网局由房主重开'); return }
  clearTimers()
  if (game.phase === 'scoring' && game.lastResult) {
    const last = game.history[game.history.length - 1]
    if (last && last.board === game.board) {
      game.history.pop()
      if (game.declarer) { if (sideOf(game.declarer) === 'NS') game.totalNS -= game.lastResult.score; else game.totalEW -= game.lastResult.score }
    }
  }
  deal(game.board); game.phase = 'bidding'; game.lastResult = null
  scheduleAI(); save()
}
function resetAll() {
  if (isMirror.value) { showToast('联网局由房主重置'); return }
  clearTimers()
  game.board = props.initialBoard; game.totalNS = 0; game.totalEW = 0; game.history = []
  deal(props.initialBoard); game.phase = 'bidding'; game.lastResult = null
  scheduleAI(); save()
}
/* ============ 发牌种子 ============ */
function ensureSeed() { if (settings.seed == null) settings.seed = Math.floor(Math.random() * 1e9) }
function copySeed() {
  ensureSeed()
  const s = String(settings.seed)
  save()
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(s).then(() => showToast('已复制种子 ' + s)).catch(() => showToast('种子：' + s))
  } else showToast('种子：' + s)
}
function restartWithSeed() {
  ensureSeed(); clearTimers()
  game.board = props.initialBoard; game.totalNS = 0; game.totalEW = 0; game.history = []
  deal(props.initialBoard); game.phase = 'bidding'; game.lastResult = null
  scheduleAI(); save()
}
/* ============ 统计看板 ============ */
const stats = computed(() => {
  const h = game.history
  const total = h.length
  let nsWin = 0, made = 0
  for (const r of h) { if (r.nsScore > 0) nsWin++; if (r.made) made++ }
  return {
    total,
    nsWin, ewWin: total - nsWin,
    nsWinPct: total ? Math.round(nsWin / total * 100) : 0,
    made, madePct: total ? Math.round(made / total * 100) : 0,
    nsScore: game.totalNS, ewScore: game.totalEW
  }
})

/* ============ 本地缓存 ============ */
const STORAGE_KEY = 'bridge-game-state-v1'
function save() {
  if (props.netMode !== 'solo') return // 联网局不写本地存档，免得污染人机进度
  try {
    const d = {
      board: game.board, phase: game.phase, hands: game.hands, bidding: game.bidding,
      currentBid: game.currentBid, passCount: game.passCount, declarer: game.declarer, dummy: game.dummy,
      leader: game.leader, turn: game.turn, currentTrick: game.currentTrick, tricksPlayed: game.tricksPlayed,
      tricksNS: game.tricksNS, tricksEW: game.tricksEW, dummyRevealed: game.dummyRevealed, winnerSeat: game.winnerSeat,
      lastResult: game.lastResult, history: game.history, totalNS: game.totalNS, totalEW: game.totalEW,
      dealer: game.dealer, vulnerability: game.vulnerability,
      settings: { difficulty: settings.difficulty, cardSize: settings.cardSize, hints: settings.hints, speed: settings.speed, autoDummy: settings.autoDummy, sound: settings.sound, seed: settings.seed }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d))
  } catch (e) { /* ignore */ }
}
function load() {
  if (props.netMode !== 'solo') return false // 联网局的牌局来自网络快照
  try {
    const raw = localStorage.getItem(STORAGE_KEY); if (!raw) return false
    const d = JSON.parse(raw)
    Object.assign(game, d)
    if (d.settings) Object.assign(settings, d.settings)
    return true
  } catch (e) { return false }
}
onMounted(() => {
  if (rootEl.value && typeof ResizeObserver !== 'undefined') {
    resizeObs = new ResizeObserver(es => {
      for (const e of es) containerW.value = e.contentRect.width
    })
    resizeObs.observe(rootEl.value)
  }
  // 客人 / 旁观端不发牌：等房主把牌局快照广播过来
  if (isMirror.value) return
  if (!load()) deal(props.initialBoard) // 全新开局也必须调度 AI，否则会一直"思考中"
  save()
  if (game.phase === 'playing' && game.currentTrick.length === 4) resolveTrick() // 刷新时一墩已满，先结算
  else scheduleAI()
})
onBeforeUnmount(() => {
  if (resizeObs) { resizeObs.disconnect(); resizeObs = null }
  if (settleWatchdog) { clearTimeout(settleWatchdog); settleWatchdog = null }
})
watch(() => ({ ...settings }), save, { deep: true })
// 外部传入的难度变了就同步到内部设置（页面上的难度切换即时生效）
watch(() => props.aiDifficulty, v => {
  if (v && v !== settings.difficulty) settings.difficulty = v
})

/* ============ 计算属性 / UI 辅助 ============ */
const contractText = computed(() => {
  if (!game.currentBid) return '—'
  const c = game.currentBid
  const dbl = c.dbl === 'double' ? 'X' : c.dbl === 'redouble' ? 'XX' : ''
  return `${c.level}${SUIT_SYMBOL[c.strain]}${dbl}`
})
const vulText = computed(() => ({ none: '双方无局', ns: '南北有局', ew: '东西有局', both: '双方有局' }[game.vulnerability] || '—'))
const phaseText = computed(() => ({ bidding: '叫牌', playing: '打牌', scoring: '结算' }[game.phase] || '—'))
const declarerText = computed(() => game.declarer ? SEAT_CN[game.declarer] + '家' : '—')
const turnText = computed(() => game.turn ? SEAT_CN[game.turn] + '家' : '—')

const BID_LEVELS = [1, 2, 3, 4, 5, 6, 7]
const BID_STRAINS = ['C', 'D', 'H', 'S', 'NT']

function bidText(b) {
  if (b.action === 'pass') return 'Pass'
  if (b.action === 'double') return 'X'
  if (b.action === 'redouble') return 'XX'
  return `${b.level}${SUIT_SYMBOL[b.strain]}${b.dbl === 'X' ? 'X' : b.dbl === 'XX' ? 'XX' : ''}`
}
function bidsBySeat(seat) { return game.bidding.filter(b => b.seat === seat) }
function isHighestBid(b) {
  if (b.action !== 'bid') return false
  const last = [...game.bidding].reverse().find(x => x.action === 'bid')
  return last === b
}
function canClickSeat(seat) {
  if (game.phase !== 'playing' || game.turn !== seat) return false
  return isHumanControlled(seat)
}
function seatCardSize() { return cardW.value + 'px' }
function isBroken(card) { return !!broken[card.suit + card.rank] }
function onImgError(card) { broken[card.suit + card.rank] = true }
function showToast(m) { toastMsg.value = m; setTimeout(() => { if (toastMsg.value === m) toastMsg.value = '' }, 1800) }

/* ============ 轻量音效（WebAudio 合成，无需素材） ============ */
let audioCtx = null
function beep(freq, dur, type = 'sine', gain = 0.05) {
  if (!settings.sound) return
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const o = audioCtx.createOscillator(), g = audioCtx.createGain()
    o.type = type; o.frequency.value = freq
    g.gain.value = gain
    o.connect(g); g.connect(audioCtx.destination)
    o.start(); g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur)
    o.stop(audioCtx.currentTime + dur)
  } catch (e) { /* ignore */ }
}
function sfx(kind) {
  if (!settings.sound) return
  if (kind === 'play') beep(420, 0.08, 'triangle')
  else if (kind === 'trick') beep(680, 0.12, 'sine')
  else if (kind === 'score') { beep(523, 0.12, 'sine'); setTimeout(() => beep(784, 0.18, 'sine'), 120) }
  else if (kind === 'deal') beep(300, 0.06, 'square', 0.03)
}

// 中央墩位：按座位定位
function trickCardAt(seat) { return game.currentTrick.find(t => t.seat === seat)?.card || null }
function trickEntryAt(seat) { return game.currentTrick.find(t => t.seat === seat) || null }

/* ============ 北/东/西 扇形手持布局 ============
 * 模拟开扇式拿牌：以各家"手"的位置为圆心，牌沿圆弧排列并旋转。
 * 悬停/选中时牌沿半径方向"探出"（通过 --lx/--ly/--rot 变量驱动 CSS）。 */
function fanLayout(n) {
  const w = cardW.value
  const h = Math.round(w * 1.42)
  const R = Math.max(w * 3.2, 180)                 // 扇形半径
  const cnt = n || 13
  const step = cnt > 1 ? Math.min(5, 46 / (cnt - 1)) : 0 // 相邻牌夹角
  const tmax = ((cnt - 1) / 2) * step * Math.PI / 180
  const Rc = R - h / 2                             // 牌中心所在半径
  return { w, h, Rc, step, tmax, cnt }
}
const northFan = computed(() => fanLayout(game.hands.N.length))
const westFan = computed(() => fanLayout(game.hands.W.length))
const eastFan = computed(() => fanLayout(game.hands.E.length))
function fanCardStyle(seat, i) {
  const lay = seat === 'N' ? northFan.value : seat === 'W' ? westFan.value : eastFan.value
  const mid = (lay.cnt - 1) / 2
  const L = Math.max(10, Math.round(lay.w * 0.18)) // 探出距离
  const rad = ((seat === 'E' ? mid - i : i - mid) * lay.step) * Math.PI / 180
  const deg = rad * 180 / Math.PI
  const bw = lay.Rc * (1 - Math.cos(lay.tmax))     // 横向鼓出
  const bh = lay.Rc * Math.sin(lay.tmax)           // 纵向半展宽
  let left, top, lx, ly
  if (seat === 'N') {          // 圆心在上（手里），扇面朝下展开
    left = bw + lay.Rc * Math.sin(rad)
    top = bw - lay.Rc * (1 - Math.cos(rad))
    lx = L * Math.sin(rad); ly = L * Math.cos(rad)
  } else if (seat === 'W') {   // 圆心在右侧，扇面朝左展开
    left = lay.Rc * (1 - Math.cos(rad))
    top = bh + lay.Rc * Math.sin(rad)
    lx = -L * Math.cos(rad); ly = L * Math.sin(rad)
  } else {                     // 东：镜像
    left = bw - lay.Rc * (1 - Math.cos(rad))
    top = bh - lay.Rc * Math.sin(rad)
    lx = L * Math.cos(rad); ly = -L * Math.sin(rad)
  }
  return {
    left: left + 'px', top: top + 'px', width: lay.w + 'px',
    '--lx': lx + 'px', '--ly': ly + 'px', '--rot': (seat === 'N' ? -deg : deg) + 'deg',
    zIndex: i + 1
  }
}
function fanBoxStyle(lay, seat) {
  const bw = lay.Rc * (1 - Math.cos(lay.tmax)) // 沿展开方向的鼓出量
  const bh = lay.Rc * Math.sin(lay.tmax)       // 垂直于展开方向的半展宽
  if (seat === 'N') return { width: (lay.w + 2 * bh) + 'px', height: (lay.h + bw) + 'px' }
  return { width: (lay.w + bw) + 'px', height: (lay.h + 2 * bh) + 'px' }
}

/* ============ 两段式出牌：第一下选中探出，再点一下打出 ============ */
const picked = ref(null) // { seat, card }
function pickCard(seat, card) {
  if (!canClickSeat(seat)) return
  if (isPicked(card, seat)) {
    picked.value = null
    humanPlayCard(card)
  } else {
    if (!isLegalPlay(seat, card)) { showToast(illegalReason(seat, card)); return }
    picked.value = { seat, card }
  }
}
function isPicked(card, seat) {
  return !!picked.value && picked.value.seat === seat && picked.value.card === card
}
// 回合/墩次/阶段变化时自动取消选中
watch(() => [game.turn, game.phase, game.tricksPlayed], () => { picked.value = null })

// ============================================================
// 结算兜底看门狗：
// 正常情况下墩结算靠 trickTimer 推进。若定时器被意外打断（例如 AI 调度、
// 重渲染等），会卡在"4 张已出满却不判定"或"13 墩打完却不结算"。
// 这里的定时器独立于 clearTimers，确保一定能推进到结算。
// ============================================================
watch(
  () => [game.phase, game.tricksPlayed, game.currentTrick.length],
  () => {
    if (settleWatchdog) { clearTimeout(settleWatchdog); settleWatchdog = null }
    if (isMirror.value) return // 客人 / 旁观端一切以房主快照为准，不自行结算
    if (game.phase !== 'playing') return
    const pending = game.tricksPlayed >= 13 || game.currentTrick.length === 4
    if (!pending) return
    settleWatchdog = setTimeout(() => {
      settleWatchdog = null
      if (game.phase !== 'playing') return
      // 13 墩已打完但还停在打牌阶段 → 强制结算
      if (game.tricksPlayed >= 13 && game.currentTrick.length === 0) { endPlay(); save(); return }
      // 4 张已出满却迟迟没判定 → 推一把
      if (game.currentTrick.length === 4) resolveTrick()
    }, Math.max(1200, settings.speed * 2 + 400)) // 明显长于正常动画，绝不抢跑
  },
  { flush: 'post' }
)

// 某座位是否应显示真实牌面（明手已亮牌，或南家自己）
function showRealHand(seat) {
  if (seat === 'S') return true
  if (seat === game.dummy && game.dummyRevealed) return true
  return false
}
function handForDisplay(seat) { return game.hands[seat] }
function legalHint(card, seat) { return settings.hints && canClickSeat(seat) && isLegalPlay(seat, card) }
/* 建议高亮：开启新手提示时，用 AI 引擎算出推荐叫品/出牌，单独以青色脉冲标出 */
function suggestedBid() {
  if (!settings.hints || game.phase !== 'bidding' || game.turn !== 'S') return null
  return aiBid('S')
}
function isSuggestedBid(level, strain) {
  const b = suggestedBid(); return !!b && b.type === 'bid' && b.level === level && b.strain === strain
}
function isSuggestedPass() { const b = suggestedBid(); return !!b && b.type === 'pass' }
function isSuggestedDouble() { const b = suggestedBid(); return !!b && b.type === 'double' }
function isSuggestedRedouble() { const b = suggestedBid(); return !!b && b.type === 'redouble' }
function suggestedPlayCard(seat) {
  if (!settings.hints || !canClickSeat(seat)) return null
  return aiPlayCard(seat)
}
function isSuggestedPlay(card, seat) {
  const c = suggestedPlayCard(seat); return !!c && c.suit === card.suit && c.rank === card.rank
}

/* ============ 联网：快照 / 远端动作 ============ */
let applying = false

/** 房主：把当前牌局打包成"真实座位坐标"的快照，广播给全房间 */
function snapshot() {
  const hands = {}
  for (const s of SEATS) hands[realOf(s)] = game.hands[s].map(c => ({ suit: c.suit, rank: c.rank }))
  return {
    t: 'state',
    board: game.board, phase: game.phase,
    hands,
    bidding: game.bidding.map(b => ({ ...b, seat: realOf(b.seat) })),
    currentBid: game.currentBid ? { ...game.currentBid } : null,
    passCount: game.passCount,
    declarer: game.declarer ? realOf(game.declarer) : null,
    dummy: game.dummy ? realOf(game.dummy) : null,
    leader: game.leader ? realOf(game.leader) : null,
    turn: game.turn ? realOf(game.turn) : null,
    currentTrick: game.currentTrick.map(t => ({ seat: realOf(t.seat), card: { suit: t.card.suit, rank: t.card.rank } })),
    tricksPlayed: game.tricksPlayed, tricksNS: game.tricksNS, tricksEW: game.tricksEW,
    dummyRevealed: game.dummyRevealed,
    winnerSeat: game.winnerSeat ? realOf(game.winnerSeat) : null,
    lastResult: game.lastResult
      ? { ...game.lastResult, declarer: game.lastResult.declarer ? realOf(game.lastResult.declarer) : null }
      : null,
    totalNS: game.totalNS, totalEW: game.totalEW,
    dealer: game.dealer ? realOf(game.dealer) : null,
    vulnerability: game.vulnerability,
    history: game.history.map(h => ({ ...h, declarer: h.declarer ? realOf(h.declarer) : null }))
  }
}

/** 客人：收到房主快照后，换算回"我是南家"的本地坐标并渲染 */
function applySnapshot(s) {
  if (!s) return
  applying = true
  clearTimers()
  const hands = { N: [], E: [], S: [], W: [] }
  for (const real of SEATS) {
    hands[localOf(real)] = ((s.hands && s.hands[real]) || []).map(c => ({ suit: c.suit, rank: c.rank }))
  }
  game.hands = hands
  game.board = s.board || 1
  game.phase = s.phase || 'bidding'
  game.bidding = (s.bidding || []).map(b => ({ ...b, seat: localOf(b.seat) }))
  game.currentBid = s.currentBid || null
  game.passCount = s.passCount || 0
  game.declarer = s.declarer ? localOf(s.declarer) : null
  game.dummy = s.dummy ? localOf(s.dummy) : null
  game.leader = s.leader ? localOf(s.leader) : null
  game.turn = s.turn ? localOf(s.turn) : null
  game.currentTrick = (s.currentTrick || [])
    .map(t => ({ seat: localOf(t.seat), card: { suit: t.card.suit, rank: t.card.rank } }))
  game.tricksPlayed = s.tricksPlayed || 0
  game.tricksNS = s.tricksNS || 0
  game.tricksEW = s.tricksEW || 0
  game.dummyRevealed = !!s.dummyRevealed
  game.winnerSeat = s.winnerSeat ? localOf(s.winnerSeat) : null
  game.lastResult = s.lastResult
    ? { ...s.lastResult, declarer: s.lastResult.declarer ? localOf(s.lastResult.declarer) : null }
    : null
  game.totalNS = s.totalNS || 0
  game.totalEW = s.totalEW || 0
  game.dealer = s.dealer ? localOf(s.dealer) : null
  game.vulnerability = s.vulnerability || null
  game.history = (s.history || []).map(h => ({ ...h, declarer: h.declarer ? localOf(h.declarer) : null }))
  applying = false
}

/** 房主：把远端真人发来的动作落到本地牌局上（seat 是真实座位） */
function remoteAct(realSeat, act) {
  if (props.netMode !== 'host' || !act) return false
  const seat = localOf(realSeat)
  if (act.kind === 'bid') {
    if (game.phase !== 'bidding' || game.turn !== seat) return false
    applyBid(act.action)
    return true
  }
  if (act.kind === 'play') {
    if (game.phase !== 'playing' || game.turn !== seat) return false
    const c = act.card
    if (!c) return false
    const card = game.hands[seat].find(x => x.suit === c.suit && x.rank === c.rank)
    if (!card) return false
    if (!isLegalPlay(seat, card)) return false
    playCard(seat, card)
    return true
  }
  return false
}

/** 房主：开一副新牌（联网局每副都换随机种子） */
function netDeal(board) {
  clearTimers()
  game.board = board || props.initialBoard
  game.totalNS = 0; game.totalEW = 0; game.history = []
  settings.seed = Math.floor(Math.random() * 1e9)
  deal(game.board)
  game.lastResult = null
  scheduleAI()
}

// 房主端：牌局一变就广播快照（客人端不动，避免回环）
watch(() => game, () => {
  if (props.netMode !== 'host' || applying) return
  emit('netChange', snapshot())
}, { deep: true, flush: 'post' })

defineExpose({ snapshot, applySnapshot, remoteAct, netDeal, setRemoteSeats })
</script>

<template>
  <div class="bridge-game" ref="rootEl" :style="{ '--bb-w': cardW + 'px' }">
    <!-- 顶部信息栏 -->
    <div class="bridge-topbar">
      <span class="bb-item">副数 <b>{{ game.board }}</b></span>
      <span class="bb-item bb-sm-hide">局况 <b>{{ vulText }}</b></span>
      <span class="bb-item">阶段 <b>{{ phaseText }}</b></span>
      <span class="bb-item">庄家 <b>{{ declarerText }}</b></span>
      <span class="bb-item">定约 <b>{{ contractText }}</b></span>
      <span class="bb-item">赢墩 <b>北南 {{ game.tricksNS }} / 东西 {{ game.tricksEW }}</b></span>
      <span class="bb-item bb-sm-hide">总分 <b>北南 {{ game.totalNS }} / 东西 {{ game.totalEW }}</b></span>
      <span class="bb-spacer"></span>
      <button v-if="props.showSettings" class="bb-btn" @click="showSettingsPanel = !showSettingsPanel">设置</button>
      <button class="bb-btn" @click="showStats = !showStats">统计</button>
      <button class="bb-btn" @click="showHistory = !showHistory">记录</button>
      <button class="bb-btn" @click="restartBoard">重开本副</button>
      <button class="bb-btn" @click="resetAll">重置</button>
    </div>

    <!-- 牌桌 -->
    <div class="bridge-table">
      <!-- 北（扇形手持） -->
      <div class="bb-seat bb-north">
        <div class="bb-seatname">北家{{ game.dummy === 'N' ? '(明手)' : '' }}</div>
        <div class="bb-fan bb-fan-n" :style="fanBoxStyle(northFan, 'N')">
          <template v-if="showRealHand('N')">
            <img v-for="(c, i) in handForDisplay('N')" :key="c.suit + c.rank" class="bb-card bb-fan-card"
              :class="{ 'bb-click': canClickSeat('N'), 'bb-hint': legalHint(c, 'N'), 'bb-out': isPicked(c, 'N'), 'bb-suggest': isSuggestedPlay(c, 'N') }"
              :style="fanCardStyle('N', i)" :src="cardImage(c)" :alt="c.suit + c.rank"
              @error="onImgError(c)" @click="pickCard('N', c)" />
          </template>
          <template v-else>
            <img v-for="(c, i) in game.hands['N']" :key="'nf' + i" class="bb-card bb-fan-card bb-back"
              :style="fanCardStyle('N', i)" :src="backImage()" @error="onImgError({ suit: 'back' })" />
          </template>
        </div>
      </div>

      <!-- 西（扇形手持） -->
      <div class="bb-seat bb-west">
        <div class="bb-seatname">西家{{ game.dummy === 'W' ? '(明手)' : '' }}</div>
        <div class="bb-fan bb-fan-w" :style="fanBoxStyle(westFan, 'W')">
          <template v-if="showRealHand('W')">
            <img v-for="(c, i) in handForDisplay('W')" :key="c.suit + c.rank" class="bb-card bb-fan-card"
              :class="{ 'bb-click': canClickSeat('W'), 'bb-hint': legalHint(c, 'W'), 'bb-out': isPicked(c, 'W'), 'bb-suggest': isSuggestedPlay(c, 'W') }"
              :style="fanCardStyle('W', i)" :src="cardImage(c)" :alt="c.suit + c.rank"
              @error="onImgError(c)" @click="pickCard('W', c)" />
          </template>
          <template v-else>
            <img v-for="(c, i) in game.hands['W']" :key="'wf' + i" class="bb-card bb-fan-card bb-back"
              :style="fanCardStyle('W', i)" :src="backImage()" @error="onImgError({ suit: 'back' })" />
          </template>
        </div>
      </div>

      <!-- 中央：牌桌（呢面）；叫牌区为浮层，仅叫牌阶段显示，打牌时可点击查看 -->
      <div class="bb-center" :class="{ 'bb-center-narrow': narrow }">
        <div class="bb-tablewrap">
          <div class="bb-felt" :style="{ width: feltSize + 'px', height: feltSize + 'px' }">
            <div class="bb-trick-pos bb-trick-n">
              <img v-if="trickEntryAt('N')" class="bb-card bb-trickcard bb-in-N"
                :class="{ 'bb-win': game.winnerSeat === 'N' }" :key="trickEntryAt('N')"
                :style="{ width: seatCardSize() }"
                :src="cardImage(trickEntryAt('N').card)" @error="onImgError(trickEntryAt('N').card)" />
            </div>
            <div class="bb-trick-pos bb-trick-w">
              <img v-if="trickEntryAt('W')" class="bb-card bb-trickcard bb-in-W"
                :class="{ 'bb-win': game.winnerSeat === 'W' }" :key="trickEntryAt('W')"
                :style="{ width: seatCardSize() }"
                :src="cardImage(trickEntryAt('W').card)" @error="onImgError(trickEntryAt('W').card)" />
            </div>
            <div class="bb-trick-pos bb-trick-e">
              <img v-if="trickEntryAt('E')" class="bb-card bb-trickcard bb-in-E"
                :class="{ 'bb-win': game.winnerSeat === 'E' }" :key="trickEntryAt('E')"
                :style="{ width: seatCardSize() }"
                :src="cardImage(trickEntryAt('E').card)" @error="onImgError(trickEntryAt('E').card)" />
            </div>
            <div class="bb-trick-pos bb-trick-s">
              <img v-if="trickEntryAt('S')" class="bb-card bb-trickcard bb-in-S"
                :class="{ 'bb-win': game.winnerSeat === 'S' }" :key="trickEntryAt('S')"
                :style="{ width: seatCardSize() }"
                :src="cardImage(trickEntryAt('S').card)" @error="onImgError(trickEntryAt('S').card)" />
            </div>
            <div class="bb-trick-center" v-if="game.phase !== 'bidding'">第 {{ game.tricksPlayed + 1 }} 墩</div>
          </div>

          <!-- 叫牌浮层 -->
          <div class="bb-bidbox bb-bidoverlay" v-if="game.phase === 'bidding' || showBid"
            :style="{ width: Math.min(narrow ? 300 : 260, containerW - 24) + 'px' }">
            <div class="bb-bidhead">
              <span>叫牌</span>
              <button v-if="game.phase !== 'bidding'" class="bb-btn" @click="showBid = false">收起</button>
            </div>
            <div class="bb-bidhist">
              <div class="bh-col" v-for="s in ['N', 'E', 'S', 'W']" :key="s">
                <div class="bh-head">{{ SEAT_CN[s] }}</div>
                <div class="bh-cell" v-for="(b, i) in bidsBySeat(s)" :key="i"
                  :class="{ 'bh-active': isHighestBid(b) }">{{ bidText(b) }}</div>
              </div>
            </div>

            <div class="bb-bidctrl" v-if="game.phase === 'bidding'">
              <div v-if="game.turn === 'S'" class="bb-bidprompt">
                <div class="bb-bidrow">
                  <span class="bb-suitlabel bb-suit-black">♣</span>
                  <button v-for="lv in BID_LEVELS" :key="'lv' + lv" class="bb-bidbtn"
                    :class="{ 'bb-suggest': isSuggestedBid(lv, 'C') }"
                    :disabled="!isContractLegal(lv, 'C')" @click="humanBid(lv, 'C')">{{ lv }}<span class="bb-sym bb-sym-black">♣</span></button>
                </div>
                <div class="bb-bidrow">
                  <span class="bb-suitlabel bb-suit-red">♦</span>
                  <button v-for="lv in BID_LEVELS" :key="'ld' + lv" class="bb-bidbtn"
                    :class="{ 'bb-suggest': isSuggestedBid(lv, 'D') }"
                    :disabled="!isContractLegal(lv, 'D')" @click="humanBid(lv, 'D')">{{ lv }}<span class="bb-sym bb-sym-red">♦</span></button>
                </div>
                <div class="bb-bidrow">
                  <span class="bb-suitlabel bb-suit-red">♥</span>
                  <button v-for="lv in BID_LEVELS" :key="'lh' + lv" class="bb-bidbtn"
                    :class="{ 'bb-suggest': isSuggestedBid(lv, 'H') }"
                    :disabled="!isContractLegal(lv, 'H')" @click="humanBid(lv, 'H')">{{ lv }}<span class="bb-sym bb-sym-red">♥</span></button>
                </div>
                <div class="bb-bidrow">
                  <span class="bb-suitlabel bb-suit-black">♠</span>
                  <button v-for="lv in BID_LEVELS" :key="'ls' + lv" class="bb-bidbtn"
                    :class="{ 'bb-suggest': isSuggestedBid(lv, 'S') }"
                    :disabled="!isContractLegal(lv, 'S')" @click="humanBid(lv, 'S')">{{ lv }}<span class="bb-sym bb-sym-black">♠</span></button>
                </div>
                <div class="bb-bidrow">
                  <span class="bb-suitlabel bb-suit-nt">NT</span>
                  <button v-for="lv in BID_LEVELS" :key="'ln' + lv" class="bb-bidbtn"
                    :class="{ 'bb-suggest': isSuggestedBid(lv, 'NT') }"
                    :disabled="!isContractLegal(lv, 'NT')" @click="humanBid(lv, 'NT')">{{ lv }}<span class="bb-sym bb-sym-nt">NT</span></button>
                </div>
                <div class="bb-bidrow bb-bidrow-act">
                  <span class="bb-suitlabel"></span>
                  <button class="bb-bidbtn bb-act" :class="{ 'bb-suggest': isSuggestedPass() }" @click="humanPass">Pass</button>
                  <button class="bb-bidbtn bb-act" :class="{ 'bb-suggest': isSuggestedDouble() }" :disabled="!isDoubleLegal('S')" @click="humanDouble">X</button>
                  <button class="bb-bidbtn bb-act" :class="{ 'bb-suggest': isSuggestedRedouble() }" :disabled="!isRedoubleLegal('S')" @click="humanRedouble">XX</button>
                </div>
              </div>
              <div v-else class="bb-waiting">{{ turnText }} 思考中…</div>
            </div>
          </div>

          <!-- 打牌阶段回看叫牌的小按钮 -->
          <button v-if="game.phase !== 'bidding' && !showBid" class="bb-btn bb-bidpeek"
            @click="showBid = true">叫牌</button>
        </div>
      </div>

      <!-- 东（扇形手持） -->
      <div class="bb-seat bb-east">
        <div class="bb-seatname">东家{{ game.dummy === 'E' ? '(明手)' : '' }}</div>
        <div class="bb-fan bb-fan-e" :style="fanBoxStyle(eastFan, 'E')">
          <template v-if="showRealHand('E')">
            <img v-for="(c, i) in handForDisplay('E')" :key="c.suit + c.rank" class="bb-card bb-fan-card"
              :class="{ 'bb-click': canClickSeat('E'), 'bb-hint': legalHint(c, 'E'), 'bb-out': isPicked(c, 'E'), 'bb-suggest': isSuggestedPlay(c, 'E') }"
              :style="fanCardStyle('E', i)" :src="cardImage(c)" :alt="c.suit + c.rank"
              @error="onImgError(c)" @click="pickCard('E', c)" />
          </template>
          <template v-else>
            <img v-for="(c, i) in game.hands['E']" :key="'ef' + i" class="bb-card bb-fan-card bb-back"
              :style="fanCardStyle('E', i)" :src="backImage()" @error="onImgError({ suit: 'back' })" />
          </template>
        </div>
      </div>

      <!-- 南（玩家） -->
      <div class="bb-seat bb-south">
        <div class="bb-seatname">南家（你）{{ game.dummy === 'S' ? '(明手)' : '' }}</div>
        <div class="bb-hand bb-hand-h">
          <img v-for="c in handForDisplay('S')" :key="c.suit + c.rank" class="bb-card"
            :class="{ 'bb-click': canClickSeat('S'), 'bb-hint': legalHint(c, 'S'), 'bb-out': isPicked(c, 'S'), 'bb-suggest': isSuggestedPlay(c, 'S') }"
            :style="{ width: seatCardSize() }" :src="cardImage(c)" :alt="c.suit + c.rank"
            @error="onImgError(c)" @click="pickCard('S', c)" />
        </div>
      </div>
    </div>

    <!-- 结算弹窗 -->
    <div class="bb-modal" v-if="game.phase === 'scoring' && game.lastResult">
      <div class="bb-modal-box">
        <h3>第 {{ game.lastResult.board }} 副结算</h3>
        <div class="bb-result-line">定约：<b>{{ game.lastResult.contract }}</b>　庄家：<b>{{ game.lastResult.declarer ? SEAT_CN[game.lastResult.declarer] + '家' : '—' }}</b></div>
        <div class="bb-result-line">结果：<b>{{ game.lastResult.made === null ? '四家 Pass' : (game.lastResult.made ? '完成' : '宕 ' + game.lastResult.under + ' 墩') }}</b></div>
        <div class="bb-result-line">赢墩：北南 {{ game.lastResult.tricksNS }} / 东西 {{ game.lastResult.tricksEW }}</div>
        <table class="bb-scoretable">
          <tr v-for="(p, i) in game.lastResult.parts" :key="i"><td>{{ p.label }}</td><td>{{ p.value }}</td></tr>
          <tr class="bb-scoretotal"><td>本副得分</td><td>{{ game.lastResult.score }}</td></tr>
        </table>
        <div class="bb-modal-actions">
          <button class="bb-btn" @click="restartBoard">重开本副</button>
          <button class="bb-btn bb-primary" @click="nextBoard">下一副</button>
        </div>
      </div>
    </div>

    <!-- 历史记录面板 -->
    <div class="bb-panel" v-if="showHistory">
      <div class="bb-panel-head">历史记录 <button class="bb-btn" @click="showHistory = false">关闭</button></div>
      <table class="bb-histtable">
        <tr><th>副</th><th>定约</th><th>庄家</th><th>结果</th><th>北南</th><th>东西</th><th>赢墩</th></tr>
        <tr v-for="h in game.history" :key="h.board">
          <td>{{ h.board }}</td><td>{{ h.contract }}</td>
          <td>{{ h.declarer ? SEAT_CN[h.declarer] + '家' : '—' }}</td>
          <td>{{ h.made === null ? 'Pass' : (h.made ? '成' : '宕') }}</td>
          <td>{{ h.nsScore }}</td><td>{{ h.ewScore }}</td>
          <td>{{ h.tricksNS }}/{{ h.tricksEW }}</td>
        </tr>
        <tr class="bb-histtotal"><td>累计</td><td></td><td></td><td></td><td>{{ game.totalNS }}</td><td>{{ game.totalEW }}</td><td></td></tr>
      </table>
    </div>

    <!-- 统计看板 -->
    <div class="bb-panel" v-if="showStats">
      <div class="bb-panel-head">统计看板 <button class="bb-btn" @click="showStats = false">关闭</button></div>
      <div v-if="stats.total === 0" style="font-size:13px;color:#9fd0bb;">还没有完成任何一副牌。</div>
      <template v-else>
        <div class="bb-stat-grid">
          <div class="bb-stat"><b>{{ stats.total }}</b><span>已完成副数</span></div>
          <div class="bb-stat"><b>{{ stats.madePct }}%</b><span>定约完成率</span></div>
          <div class="bb-stat"><b>{{ stats.nsWinPct }}%</b><span>北南胜率</span></div>
          <div class="bb-stat"><b>{{ stats.nsScore }}</b><span>北南累计分</span></div>
          <div class="bb-stat"><b>{{ stats.ewScore }}</b><span>东西累计分</span></div>
          <div class="bb-stat"><b>{{ stats.nsWin }} : {{ stats.ewWin }}</b><span>南北 : 东西 赢副</span></div>
        </div>
        <div style="margin-top:10px;font-size:12px;color:#9fd0bb;">胜率以“哪一方得分>0”计；宕牌或无局时该副计对方赢。</div>
      </template>
    </div>

    <!-- 设置面板 -->
    <div class="bb-panel bb-panel-right" v-if="showSettingsPanel && props.showSettings">
      <div class="bb-panel-head">设置 <button class="bb-btn" @click="showSettingsPanel = false">关闭</button></div>
      <div class="bb-setrow">
        <label>AI 难度</label>
        <select v-model="settings.difficulty">
          <option value="easy">简单（保守，偶尔失误）</option>
          <option value="normal">中等（正常水平）</option>
          <option value="hard">困难（更强，会吊将/保长套）</option>
        </select>
      </div>
      <div class="bb-setrow">
        <label>牌面大小 {{ settings.cardSize }}px</label>
        <input type="range" min="56" max="120" v-model.number="settings.cardSize" />
      </div>
      <div class="bb-setrow">
        <label>新手提示</label>
        <input type="checkbox" v-model="settings.hints" />（高亮合法操作）
      </div>
      <div class="bb-setrow">
        <label>自动出明手牌</label>
        <input type="checkbox" v-model="settings.autoDummy" />（你当庄家时由 AI 代打明手）
      </div>
      <div class="bb-setrow">
        <label>动画速度 {{ settings.speed }}ms</label>
        <input type="range" min="200" max="1500" step="50" v-model.number="settings.speed" />
      </div>
      <div class="bb-setrow">
        <label>音效</label>
        <input type="checkbox" v-model="settings.sound" />（出牌/赢墩/结算轻提示音）
      </div>
      <div class="bb-setrow">
        <label>发牌种子</label>
        <div style="display:flex;gap:6px;align-items:center;">
          <input type="number" v-model.number="settings.seed" placeholder="空=随机" style="width:90px;" />
          <button class="bb-btn" @click="settings.seed = Math.floor(Math.random()*1e9)">随机</button>
        </div>
        <span style="font-size:11px;color:#9fd0bb;">相同种子 → 相同牌局，可发给朋友比拼</span>
      </div>
      <div class="bb-setrow">
        <button class="bb-btn" @click="copySeed">复制当前种子</button>
        <button class="bb-btn" @click="restartWithSeed">用此种子重开</button>
      </div>
    </div>

    <!-- 提示 toast -->
    <transition name="bb-fade">
      <div class="bb-toast" v-if="toastMsg">{{ toastMsg }}</div>
    </transition>
  </div>
</template>

<style scoped>
.bridge-game {
  --bb-green: #13613f;
  --bb-green2: #0e4d33;
  width: 100%; margin: 0 auto;
  background: linear-gradient(180deg, #262d27 0%, #1a201b 100%);
  color: #eaf3ee;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  user-select: none;
  overflow-x: hidden;
  /* 关闭手机端双击缩放（保留单指滑动/点击），避免双击误放大且回不去 */
  touch-action: manipulation;
}
.bridge-topbar {
  display: flex; flex-wrap: wrap; align-items: center; gap: 10px;
  padding: 8px 14px; background: #151a15; border-bottom: 1px solid rgba(255,255,255,.07);
  font-size: 14px;
}
.bb-item b { color: #ffd86b; }
.bb-spacer { flex: 1; }
.bb-btn {
  background: #1f7a52; color: #fff; border: 1px solid #2c9b6b; border-radius: 6px;
  padding: 5px 10px; cursor: pointer; font-size: 13px;
}
.bb-btn:hover { background: #259160; }
.bb-btn:disabled { opacity: .4; cursor: not-allowed; }
/* 卡牌/按钮同样禁用双击缩放 */
.bb-btn, .bb-card, .bb-bidbtn, .bb-setrow { touch-action: manipulation; }
.bb-primary { background: #c9962b; border-color: #e0ad3c; }
.bb-primary:hover { background: #dcab40; }

.bridge-table {
  display: grid;
  grid-template-columns: auto auto auto;
  justify-content: center;      /* 三列按内容收紧并整体居中，东西手牌紧贴牌桌 */
  column-gap: 16px; row-gap: 8px;
  grid-template-rows: auto 1fr auto;
  grid-template-areas: "north north north" "west center east" "south south south";
  padding: 14px; min-height: 540px; align-items: center;
}
.bb-north { grid-area: north; }
.bb-west { grid-area: west; }
.bb-east { grid-area: east; }
.bb-south { grid-area: south; }
.bb-center { grid-area: center; display: flex; justify-content: center; align-items: center; min-width: 0; }
.bb-center-narrow { flex-direction: column; gap: 10px; }
.bb-tablewrap { position: relative; display: flex; justify-content: center; align-items: center; }

/* 叫牌浮层：覆盖在牌桌中央，仅叫牌阶段/回看时出现 */
.bb-bidoverlay {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  background: rgba(8, 24, 17, .93); border: 1px solid rgba(255,255,255,.18);
  border-radius: 12px; padding: 10px 12px;
  box-shadow: 0 10px 28px rgba(0,0,0,.55);
  z-index: 6; max-height: 94%; overflow: auto;
}
.bb-bidhead {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 13px; color: #bfe3d2; margin-bottom: 6px;
}
.bb-bidpeek {
  position: absolute; right: 8px; bottom: 8px; z-index: 5; opacity: .8;
  font-size: 12px; padding: 3px 10px;
}
.bb-bidpeek:hover { opacity: 1; }

.bb-seat { text-align: center; }
.bb-seatname { font-size: 13px; color: #bfe3d2; margin-bottom: 4px; }
.bb-hand { display: flex; justify-content: center; }
.bb-hand-h .bb-card { margin: 0 calc(var(--bb-w, 80px) * -0.18); }

/* 北/东/西 扇形手持牌：悬停探出，选中（bb-out）保持探出状态 */
.bb-fan { position: relative; margin: 0 auto; }
.bb-fan-card {
  position: absolute; transform-origin: center;
  transform: translate(var(--lx, 0px), var(--ly, 0px)) rotate(var(--rot, 0deg));
  transition: transform .18s ease, filter .18s ease;
}
.bb-fan-card:hover {
  transform: translate(calc(var(--lx, 0px) * 1.7), calc(var(--ly, 0px) * 1.7)) rotate(var(--rot, 0deg));
  filter: brightness(1.15);
}
.bb-fan-card.bb-out {
  transform: translate(calc(var(--lx, 0px) * 2.3), calc(var(--ly, 0px) * 2.3)) rotate(var(--rot, 0deg));
  filter: brightness(1.25) drop-shadow(0 4px 8px rgba(0,0,0,.5));
  z-index: 99 !important;
}
.bb-fan-card.bb-click { cursor: pointer; }
.bb-fan-card.bb-click:hover { outline: 2px solid #ffd86b; outline-offset: 1px; }

.bb-card {
  height: auto; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,.4);
  background: #fff; transition: transform .15s ease, filter .15s ease; vertical-align: middle;
}
.bb-card.bb-click { cursor: pointer; }
.bb-hand .bb-card.bb-click:hover { transform: translateY(-10px); }
.bb-hand .bb-card.bb-out { transform: translateY(-18px); z-index: 99; }
.bb-card.bb-hint { outline: 3px solid #ffd86b; outline-offset: 1px; }
/* 出牌飞入动画：从出牌者方位飞入中央墩位 */
.bb-trickcard { animation: trickIn .26s ease; }
.bb-in-N { animation-name: trickInN; }
.bb-in-S { animation-name: trickInS; }
.bb-in-W { animation-name: trickInW; }
.bb-in-E { animation-name: trickInE; }
@keyframes trickInN { from { opacity: 0; transform: translate(-50%, -34px) scale(.7); } to { opacity: 1; transform: translate(-50%, 0) scale(1); } }
@keyframes trickInS { from { opacity: 0; transform: translate(-50%, 34px) scale(.7); } to { opacity: 1; transform: translate(-50%, 0) scale(1); } }
@keyframes trickInW { from { opacity: 0; transform: translate(-34px, -50%) scale(.7); } to { opacity: 1; transform: translate(0, -50%) scale(1); } }
@keyframes trickInE { from { opacity: 0; transform: translate(34px, -50%) scale(.7); } to { opacity: 1; transform: translate(0, -50%) scale(1); } }
/* 赢墩高亮 */
.bb-trickcard.bb-win { box-shadow: 0 0 0 3px #ffd86b, 0 0 18px 5px rgba(255,216,107,.8); animation: winPulse .6s ease; z-index: 4; }
@keyframes winPulse { 0% { box-shadow: 0 0 0 3px #ffd86b, 0 0 4px 1px rgba(255,216,107,.4); } 50% { box-shadow: 0 0 0 4px #fff, 0 0 22px 8px rgba(255,216,107,.9); } 100% { box-shadow: 0 0 0 3px #ffd86b, 0 0 18px 5px rgba(255,216,107,.8); } }
/* 建议高亮（不同于全合法牌的黄色描边，用青色脉冲） */
.bb-card.bb-suggest { outline: 3px solid #4fd1ff; outline-offset: 1px; animation: suggestPulse 1.1s ease-in-out infinite; }
@keyframes suggestPulse { 0%,100% { box-shadow: 0 0 0 3px #4fd1ff, 0 0 6px 1px rgba(79,209,255,.4); } 50% { box-shadow: 0 0 0 4px #aef0ff, 0 0 16px 5px rgba(79,209,255,.85); } }
.bb-back { background: #2c5d8f; }

/* 中央牌桌：木边 + 绿呢面（尺寸由 JS 按容器宽度注入） */
.bb-felt {
  position: relative; flex: none;
  background: radial-gradient(circle at 50% 38%, #1c8253 0%, #116340 55%, #0b4a2e 100%);
  border: 8px solid #7b5533;
  border-radius: 42%;
  box-shadow: inset 0 0 36px rgba(0,0,0,.5), 0 10px 26px rgba(0,0,0,.45);
}
.bb-trick-pos { position: absolute; }
.bb-trick-n { top: 4%; left: 50%; transform: translateX(-50%); }
.bb-trick-s { bottom: 4%; left: 50%; transform: translateX(-50%); }
.bb-trick-w { left: 5%; top: 50%; transform: translateY(-50%); }
.bb-trick-e { right: 5%; top: 50%; transform: translateY(-50%); }
.bb-trick-center {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  font-size: 13px; color: #bfe3d2; text-shadow: 0 1px 2px rgba(0,0,0,.6);
}

.bb-bidbox { display: flex; flex-direction: column; gap: 8px; }
.bb-bidhist { display: flex; gap: 4px; background: rgba(0,0,0,.2); padding: 6px; border-radius: 8px; }
.bh-col { flex: 1; text-align: center; font-size: 12px; }
.bh-head { color: #9fd0bb; margin-bottom: 3px; }
.bh-cell { padding: 2px 0; min-height: 18px; color: #eaf3ee; }
.bh-active { color: #ffd86b; font-weight: bold; }
.bb-bidctrl { background: rgba(0,0,0,.2); padding: 8px; border-radius: 8px; }
.bb-bidprompt { display: flex; flex-direction: column; gap: 4px; }
/* 固定网格：行首花色标识 + 7 个阶数按钮，保证每种花色严格一行不换行 */
.bb-bidrow {
  display: grid; grid-template-columns: 26px repeat(7, 1fr);
  gap: 3px; align-items: stretch;
}
.bb-suitlabel {
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: bold; border-radius: 5px;
  background: rgba(245,247,244,.92); line-height: 1;
}
.bb-suit-black { color: #17211b; }
.bb-suit-red { color: #d23a2e; }
.bb-suit-nt { color: #4a3418; font-size: 11px; letter-spacing: -.5px; }
.bb-bidbtn {
  background: #1f7a52; color: #fff; border: 1px solid #2c9b6b; border-radius: 5px;
  padding: 4px 0; min-width: 0; cursor: pointer; font-size: 12px;
  white-space: nowrap; overflow: hidden;
}
.bb-sym { font-size: 11px; }
.bb-sym-red { color: #ffb0a4; }
.bb-sym-black { color: #eaf3ee; }
.bb-sym-nt { color: #ffe1a6; }
.bb-bidbtn:hover:not(:disabled) { background: #259160; }
.bb-bidbtn:disabled { opacity: .35; cursor: not-allowed; }
.bb-bidrow-act .bb-bidbtn { padding: 4px 2px; font-size: 12px; }
.bb-bidrow-act .bb-bidbtn:last-child { grid-column: span 3; }
.bb-bidrow-act .bb-bidbtn:nth-child(2) { grid-column: span 2; }
.bb-bidrow-act .bb-bidbtn:nth-child(3) { grid-column: span 2; }
.bb-act { background: #c9962b; border-color: #e0ad3c; }
.bb-waiting { font-size: 13px; color: #cfe9dc; padding: 6px; }

.bb-modal {
  position: fixed; inset: 0; background: rgba(0,0,0,.55); display: flex;
  align-items: center; justify-content: center; z-index: 50;
}
.bb-modal-box {
  background: #14503a; border: 1px solid #2c9b6b; border-radius: 12px;
  padding: 20px 26px; min-width: 320px; color: #eaf3ee;
}
.bb-modal-box h3 { margin: 0 0 12px; color: #ffd86b; }
.bb-result-line { margin: 4px 0; font-size: 14px; }
.bb-scoretable { width: 100%; margin: 10px 0; border-collapse: collapse; font-size: 13px; }
.bb-scoretable td { padding: 4px 6px; border-bottom: 1px solid rgba(255,255,255,.1); text-align: left; }
.bb-scoretable td:last-child { text-align: right; color: #ffd86b; }
.bb-scoretotal td { font-weight: bold; border-top: 1px solid rgba(255,255,255,.3); }
.bb-modal-actions { margin-top: 14px; display: flex; gap: 10px; justify-content: flex-end; }

.bb-panel {
  /* top 下移到顶部毛玻璃导航栏之下，z-index 高于导航(50)，避免"关闭"按钮被遮住 */
  position: fixed; top: 104px; left: 16px; z-index: 60; background: #14503a;
  border: 1px solid #2c9b6b; border-radius: 10px; padding: 14px; width: 360px; max-height: 70vh; overflow: auto;
}
.bb-panel-right { left: auto; right: 16px; width: 280px; }
.bb-panel-head { font-weight: bold; color: #ffd86b; margin-bottom: 10px; display: flex; justify-content: space-between; }
.bb-histtable { width: 100%; border-collapse: collapse; font-size: 12px; }
.bb-histtable th, .bb-histtable td { padding: 3px 4px; border-bottom: 1px solid rgba(255,255,255,.1); text-align: center; }
.bb-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.bb-stat { background: rgba(0,0,0,.22); border-radius: 8px; padding: 10px 6px; text-align: center; }
.bb-stat b { display: block; font-size: 20px; color: #ffd86b; }
.bb-stat span { font-size: 11px; color: #bfe3d2; }
.bb-histtotal td { font-weight: bold; color: #ffd86b; }
.bb-setrow { margin: 10px 0; font-size: 13px; display: flex; flex-direction: column; gap: 4px; }
.bb-setrow select, .bb-setrow input[type="range"] { width: 100%; }
.bb-setrow input[type="checkbox"] { width: auto; }

.bb-toast {
  position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%);
  background: #b23b3b; color: #fff; padding: 10px 18px; border-radius: 8px;
  font-size: 14px; z-index: 60;
}
.bb-fade-enter-active, .bb-fade-leave-active { transition: opacity .3s; }
.bb-fade-enter-from, .bb-fade-leave-to { opacity: 0; }

/* ============ 手机 / 窄屏适配 ============ */
@media (max-width: 640px) {
  .bridge-topbar { gap: 6px; padding: 6px 8px; font-size: 12px; }
  .bb-sm-hide { display: none; }         /* 手机端隐藏局况/总分，给牌桌省高度 */
  .bb-btn { padding: 4px 8px; font-size: 12px; }
  .bridge-table { padding: 8px 2px; gap: 4px; min-height: 380px; }
  .bb-seatname { font-size: 11px; margin-bottom: 2px; }
  /* 南家手牌叠得更紧，牌面更大更好点 */
  .bb-hand-h .bb-card { margin: 0 calc(var(--bb-w, 80px) * -0.22); }
  .bb-trick-center { font-size: 12px; }
  .bb-bidbtn { font-size: 11px; padding: 3px 0; }
  .bb-suitlabel { font-size: 12px; }
  .bb-bidhist { font-size: 11px; }
  .bb-panel { width: 92vw; left: 4vw; max-height: 62vh; top: 84px; }
  .bb-panel-right { width: 80vw; left: auto; right: 4vw; }
  .bb-modal-box { min-width: 0; width: 92vw; max-width: 380px; padding: 16px; }
  .bb-toast { width: max-content; max-width: 86vw; font-size: 13px; }
}
</style>
