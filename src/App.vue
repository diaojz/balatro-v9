<template>
  <div class="game-layout">
    <!-- 左侧 SideBar -->
    <SideBar
      :currentBlind="currentBlind"
      :blindScore="blindScore"
      :handsLeft="handsLeft"
      :discardsLeft="discardsLeft"
      :coins="coins"
      :lastChips="lastChips"
      :lastMult="lastMult"
      :lastHandName="lastHandName"
      @restart="restartGame"
    />

    <!-- 右侧主区域 -->
    <div class="main-area">
      <!-- 顶：Joker 区 250px -->
      <JokerArea :ownedJokers="ownedJokers" />

      <!-- 中：出牌区 1fr -->
      <PlayArea
        :playedCards="playedCards"
        :lastHandName="lastHandName"
        :lastChips="lastChips"
        :lastMult="lastMult"
        :lastScore="lastScore"
        :showFormulaOverlay="showFormulaOverlay"
        :showFormula="settings.showFormula"
      />

      <!-- 下：手牌区 300px -->
      <HandArea
        :hand="hand"
        :selectedIds="selectedIds"
        :discardsLeft="discardsLeft"
        :isAnimating="isAnimating"
        :sortMode="sortMode"
        @toggle-select="toggleSelect"
        @play="handlePlay"
        @discard="handleDiscard"
        @sort="handleSort"
      />
    </div>

    <!-- 关卡切换 toast -->
    <Transition name="blind-toast">
      <div v-if="blindToastText" class="blind-toast">{{ blindToastText }}</div>
    </Transition>

    <!-- 设置按钮 -->
    <SettingsButton @open="showSettings = true" />

    <!-- 设置弹窗 -->
    <SettingsModal
      :show="showSettings"
      :settings="settings"
      @close="showSettings = false"
      @update="updateSettings"
    />

    <!-- 商店 -->
    <ShopView
      v-if="gameState === 'shop'"
      :shopJokers="shopJokers"
      :coins="coins"
      :ownedJokers="ownedJokers"
      :round="round"
      @buy="buyJoker"
      @skip="skipShop"
    />

    <!-- 结局覆盖层 -->
    <EndView
      v-if="gameState === 'won' || gameState === 'lost'"
      :state="gameState"
      :blindIndex="blindIndex"
      :coins="coins"
      :ownedJokers="ownedJokers"
      @restart="restartGame"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import SideBar        from './components/SideBar.vue'
import HandArea       from './components/HandArea.vue'
import PlayArea       from './components/PlayArea.vue'
import JokerArea      from './components/JokerArea.vue'
import SettingsButton from './components/SettingsButton.vue'
import SettingsModal  from './components/SettingsModal.vue'
import ShopView       from './components/ShopView.vue'
import EndView        from './components/EndView.vue'

import { HAND_SIZE, STARTING_HANDS, STARTING_DISCARDS, SHOP_JOKER_COUNT, MAX_JOKERS } from './config/constants.js'
import { BLINDS, TOTAL_BLINDS, calcReward } from './config/blinds.js'
import { JOKERS } from './config/jokers.js'
import { calculateScore } from './utils/scoring.js'
import { loadSettings, saveSettings, applyAnimScale } from './utils/settings.js'

// ── 状态字段 ──────────────────────────────────────────────────
const gameState    = ref('playing')
const blindIndex   = ref(0)
const round        = ref(1)
const blindScore   = ref(0)
const handsLeft    = ref(STARTING_HANDS)
const discardsLeft = ref(STARTING_DISCARDS)
const coins        = ref(0)
const ownedJokers  = ref([])
const shopJokers   = ref([])

// 牌堆与手牌
const deck        = ref([])
const hand        = ref([])
const selectedIds = ref(new Set())
const playedCards = ref([])

// 计分展示
const lastHandName = ref('')
const lastChips    = ref(0)
const lastMult     = ref(0)
const lastScore    = ref(0)

// UI 状态
const settings           = ref(loadSettings())
const showSettings       = ref(false)
const isAnimating        = ref(false)
const showFormulaOverlay = ref(false)
const sortMode           = ref('rank')

// 关卡 toast
const blindToastText = ref('')
let blindToastTimer = null

const currentBlind = computed(() => BLINDS[blindIndex.value])

// ── toast 函数 ────────────────────────────────────────────────
function showBlindToast() {
  const blind = BLINDS[blindIndex.value]
  if (!blind) return
  blindToastText.value = `底注 ${blind.ante} · 第 ${blindIndex.value + 1}/${TOTAL_BLINDS} 关 · ${blind.name} · 目标 ${blind.target}`
  if (blindToastTimer) clearTimeout(blindToastTimer)
  blindToastTimer = setTimeout(() => { blindToastText.value = '' }, 2000)
}

// ── 工具函数 ─────────────────────────────────────────────────
function getAnimScale() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--anim-scale') || '1')
}
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms * getAnimScale()))
}
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── 牌组生成 ─────────────────────────────────────────────────
function createDeck() {
  const suits = ['♠', '♥', '♦', '♣']
  const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']
  let id = Date.now() * 1000 + Math.floor(Math.random() * 1000)
  const d = []
  for (const suit of suits) {
    for (const rank of ranks) {
      d.push({ id: id++, suit, rank })
    }
  }
  return d
}

// ── 发牌 ────────────────────────────────────────────────────
async function dealCards(count) {
  for (let i = 0; i < count; i++) {
    if (deck.value.length === 0) {
      deck.value = shuffle(createDeck())
    }
    const card = deck.value.pop()
    card.dealing = true
    hand.value.push(card)
    await delay(60)
    card.dealing = false
  }
}

// ── 初始化一局/一关 ─────────────────────────────────────────
async function initRound() {
  deck.value        = shuffle(createDeck())
  hand.value        = []
  selectedIds.value = new Set()
  playedCards.value = []
  blindScore.value  = 0
  handsLeft.value   = STARTING_HANDS
  discardsLeft.value = STARTING_DISCARDS
  lastHandName.value = ''
  lastChips.value    = 0
  lastMult.value     = 0
  lastScore.value    = 0
  showFormulaOverlay.value = false
  gameState.value    = 'playing'
  await dealCards(HAND_SIZE)
  showBlindToast()
}

// ── 重开 ────────────────────────────────────────────────────
function restartGame() {
  blindIndex.value  = 0
  round.value       = 1
  coins.value       = 0
  ownedJokers.value = []
  shopJokers.value  = []
  initRound()
}

// ── 选牌 ────────────────────────────────────────────────────
function toggleSelect(cardId) {
  if (isAnimating.value) return
  const s = new Set(selectedIds.value)
  if (s.has(cardId)) {
    s.delete(cardId)
  } else {
    if (s.size < 5) s.add(cardId)
  }
  selectedIds.value = s
}

// ── 排序 ────────────────────────────────────────────────────
const RANK_ORDER = ['2','3','4','5','6','7','8','9','10','J','Q','K','A']
const SUIT_ORDER = ['♠','♥','♦','♣']

function handleSort(mode) {
  sortMode.value = mode
  if (mode === 'rank') {
    hand.value = [...hand.value].sort((a, b) => RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank))
  } else {
    hand.value = [...hand.value].sort((a, b) => {
      const sd = SUIT_ORDER.indexOf(a.suit) - SUIT_ORDER.indexOf(b.suit)
      return sd !== 0 ? sd : RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank)
    })
  }
}

// ── 出牌 ────────────────────────────────────────────────────
async function handlePlay() {
  if (isAnimating.value || selectedIds.value.size === 0) return
  isAnimating.value = true

  const selected = hand.value.filter(c => selectedIds.value.has(c.id))

  hand.value = hand.value.filter(c => !selectedIds.value.has(c.id))
  selectedIds.value = new Set()
  playedCards.value = selected
  await delay(350)

  // 计分
  const result = calculateScore(selected, ownedJokers.value)
  lastHandName.value = result.handName
  lastChips.value    = result.chips
  lastMult.value     = result.mult
  lastScore.value    = result.score

  // 公式 overlay 弹出 1 秒后淡出
  showFormulaOverlay.value = true
  await delay(1000)
  showFormulaOverlay.value = false

  // 累加分数
  blindScore.value += result.score
  handsLeft.value  -= 1

  // 清出牌区 → 补牌
  await delay(200)
  playedCards.value = []
  const needed = HAND_SIZE - hand.value.length
  await dealCards(needed)

  isAnimating.value = false

  // 判断状态
  checkGameState()
}

// ── 弃牌 ────────────────────────────────────────────────────
async function handleDiscard() {
  if (isAnimating.value || selectedIds.value.size === 0 || discardsLeft.value <= 0) return
  isAnimating.value = true

  hand.value = hand.value.filter(c => !selectedIds.value.has(c.id))
  selectedIds.value  = new Set()
  discardsLeft.value -= 1

  await delay(150)

  const needed = HAND_SIZE - hand.value.length
  await dealCards(needed)

  isAnimating.value = false
}

// ── 通关/失败判断 ───────────────────────────────────────────
function checkGameState() {
  if (blindScore.value >= currentBlind.value.target) {
    // 通关：传 ante 参数到 calcReward
    const reward = calcReward(handsLeft.value, currentBlind.value.ante)
    coins.value += reward

    if (blindIndex.value >= TOTAL_BLINDS - 1) {
      // 第 10 关通关 → won，不进商店
      gameState.value = 'won'
    } else {
      // 进商店
      prepareShop()
      gameState.value = 'shop'
    }
  } else if (handsLeft.value <= 0) {
    // 手数耗尽，失败
    gameState.value = 'lost'
  }
}

// ── 商店准备 ────────────────────────────────────────────────
function prepareShop() {
  const available = JOKERS.filter(j => !ownedJokers.value.find(o => o.id === j.id))
  const pool = shuffle(available).slice(0, SHOP_JOKER_COUNT)
  shopJokers.value = pool.map(j => ({ ...j, bought: false }))
}

function buyJoker(joker) {
  if (coins.value < joker.price) return
  if (ownedJokers.value.length >= MAX_JOKERS) return
  coins.value -= joker.price
  ownedJokers.value = [...ownedJokers.value, { ...joker }]
  shopJokers.value = shopJokers.value.map(j => j.id === joker.id ? { ...j, bought: true } : j)
}

function skipShop() {
  blindIndex.value += 1
  round.value      += 1
  initRound()
}

// ── 设置 ────────────────────────────────────────────────────
function updateSettings(newSettings) {
  settings.value = newSettings
  applyAnimScale(newSettings.animSpeed)
}

// ── 初始化 ──────────────────────────────────────────────────
onMounted(() => {
  applyAnimScale(settings.value.animSpeed)
  initRound()
})
</script>

<style scoped>
.game-layout {
  width: 100vw;
  height: 100vh;
  display: flex;
  overflow: hidden;
}

.main-area {
  flex: 1;
  display: grid;
  grid-template-rows: 250px 1fr 300px;
  overflow: hidden;
}

/* 关卡切换 toast */
.blind-toast {
  position: fixed;
  top: 30%;
  /* sidebar 占 min(28vw, 480px)，右主区中心 ≈ 50% + sidebar/2 */
  left: calc(50% + min(14vw, 240px));
  transform: translate(-50%, -50%);
  background: linear-gradient(135deg, rgba(255,209,102,.95), rgba(245,158,11,.95));
  color: #1a1a1a;
  font: 900 28px/1.2 'Inter', 'PingFang SC', sans-serif;
  padding: 22px 48px;
  border-radius: 16px;
  border: 3px solid #ffd166;
  box-shadow: 0 16px 40px rgba(0,0,0,.55), 0 0 40px rgba(255,209,102,.7);
  z-index: 150;
  pointer-events: none;
  white-space: nowrap;
  letter-spacing: 2px;
  text-shadow: 0 2px 0 rgba(255,255,255,.4);
}
.blind-toast-enter-active { animation: blindToastIn .4s cubic-bezier(.34,1.56,.64,1); }
.blind-toast-leave-active { animation: blindToastOut .3s ease; }

@keyframes blindToastIn {
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.4) rotate(-3deg); }
  60%  { opacity: 1; transform: translate(-50%, -50%) scale(1.08) rotate(1deg); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(0); }
}
@keyframes blindToastOut {
  0%   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.15); }
}
</style>
