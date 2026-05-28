<template>
  <div class="game-root">
    <!-- 游戏中 / 商店 / 结算 -->
    <template v-if="gameState === 'playing'">
      <SideBar
        :currentBlind="currentBlind"
        :blindIndex="blindIndex"
        :blindScore="blindScore"
        :handsLeft="handsLeft"
        :discardsLeft="discardsLeft"
        :coins="coins"
        :lastHandName="lastHandName"
        :lastChips="lastChips"
        :lastMult="lastMult"
        @restart="restartGame"
      />
      <div class="main-area">
        <JokerArea :ownedJokers="ownedJokers" ref="jokerAreaRef" />
        <Transition name="blind-toast">
          <div v-if="blindToastText" class="blind-toast">{{ blindToastText }}</div>
        </Transition>
        <PlayArea
          ref="playAreaRef"
          :playedCards="playedCards"
          :handName="lastHandName"
          :lastChips="lastChips"
          :lastMult="lastMult"
          :showFormula="settings.showFormula"
          :showFormulaOverlay="showFormulaOverlay"
          :formulaChips="formulaChips"
          :formulaMult="formulaMult"
          :formulaScore="formulaScore"
          :highlightingIdx="highlightingIdx"
          :flyTexts="flyTexts"
          :jokerHitIds="jokerHitCardIds"
          :deckCount="deck.length"
        />
        <HandArea
          ref="handAreaRef"
          :hand="hand"
          :selectedIds="selectedIds"
          :handsLeft="handsLeft"
          :discardsLeft="discardsLeft"
          :isPlaying="isAnimating"
          :isCollapsing="isCollapsing"
          :isSpreading="isSpreading"
          :aiAutoMode="settings.aiAutoMode"
          @toggle-select="toggleSelect"
          @play="handlePlay"
          @discard="handleDiscard"
          @sort-rank="sortByRankWithAnim"
          @sort-suit="sortBySuitWithAnim"
          @ai-play="handleAIPlay"
          @update-ai-auto="updateAiAuto"
        />
      </div>
    </template>

    <ShopView
      v-else-if="gameState === 'shop'"
      :coins="coins"
      :shopJokers="shopJokers"
      :ownedJokers="ownedJokers"
      :aiHighlight="shopAIHighlight"
      @buy="handleBuy"
      @skip="handleSkip"
    />

    <EndView
      v-else-if="gameState === 'won' || gameState === 'lost'"
      :state="gameState"
      :blindIndex="blindIndex"
      :coins="coins"
      :ownedJokers="ownedJokers"
      @restart="restartGame"
    />

    <SettingsButton @open="showSettings = true" />
    <SettingsModal
      v-if="showSettings"
      :settings="settings"
      @close="showSettings = false"
      @update="updateSettings"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import SideBar from './components/SideBar.vue'
import HandArea from './components/HandArea.vue'
import PlayArea from './components/PlayArea.vue'
import JokerArea from './components/JokerArea.vue'
import SettingsButton from './components/SettingsButton.vue'
import SettingsModal from './components/SettingsModal.vue'
import ShopView from './components/ShopView.vue'
import EndView from './components/EndView.vue'

import { HAND_SIZE, STARTING_HANDS, STARTING_DISCARDS, SHOP_JOKER_COUNT } from './config/constants.js'
import { BLINDS, TOTAL_BLINDS, calcReward } from './config/blinds.js'
import { JOKERS } from './config/jokers.js'
import { identifyHand } from './utils/poker.js'
import { calculateScore, getCardValue } from './utils/scoring.js'
import { loadSettings, saveSettings, applyAnimScale } from './utils/settings.js'
import { aiPickBestSubset, aiSuggestShopBuy } from './utils/ai.js'

// ───── 状态机骨架 ─────
const gameState = ref('playing')
const blindIndex = ref(0)
const round = ref(1)
const blindScore = ref(0)
const handsLeft = ref(STARTING_HANDS)
const discardsLeft = ref(STARTING_DISCARDS)
const coins = ref(0)
const ownedJokers = ref([])
const shopJokers = ref([])
const shopAIHighlight = ref(null)

// 牌堆与手牌
const deck = ref([])
const hand = ref([])
const selectedIds = ref(new Set())
const playedCards = ref([])

// 计分展示
const lastHandName = ref('')
const lastChips = ref(0)
const lastMult = ref(0)

// v8.3 新增: 动效相关 ref
const highlightingIdx = ref(-1)
const flyTexts = ref([])
const jokerHitCardIds = ref([])
const triggeringJokerIds = ref([])
const showFormulaOverlay = ref(false)
const formulaChips = ref(0)
const formulaMult = ref(0)
const formulaScore = ref(0)

// 双阶段理牌
const isSorting = ref(false)        // 保留兼容
const isCollapsing = ref(false)     // 阶段 1
const isSpreading = ref(false)      // 阶段 2
let sortingTimer1 = null
let sortingTimer2 = null

// 设置
const settings = ref(loadSettings())
const showSettings = ref(false)

// 动画锁
const isAnimating = ref(false)
const showScoreOverlay = ref(false)

// 关卡切换 toast
const blindToastText = ref('')
let blindToastTimer = null

// template refs
const jokerAreaRef = ref(null)
const playAreaRef = ref(null)
const handAreaRef = ref(null)

function showBlindToast() {
  const blind = BLINDS[blindIndex.value]
  if (!blind) return
  blindToastText.value = `底注 ${blind.ante} · 第 ${blindIndex.value + 1}/${TOTAL_BLINDS} 关 · ${blind.name} · 目标 ${blind.target}`
  if (blindToastTimer) clearTimeout(blindToastTimer)
  blindToastTimer = setTimeout(() => { blindToastText.value = '' }, 2000)
}

const currentBlind = computed(() => BLINDS[blindIndex.value])

// ───── 工具函数 ─────
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

// 牌组生成
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

// ───── 双阶段理牌动效 ─────
function triggerSortingAnim() {
  isCollapsing.value = false
  isSpreading.value = false
  if (sortingTimer1) clearTimeout(sortingTimer1)
  if (sortingTimer2) clearTimeout(sortingTimer2)

  const scale = getAnimScale()
  requestAnimationFrame(() => {
    isCollapsing.value = true
    isSorting.value = true
    // 阶段 1 完成后启动阶段 2
    sortingTimer1 = setTimeout(() => {
      isCollapsing.value = false
      isSpreading.value = true
      // 阶段 2 收尾
      sortingTimer2 = setTimeout(() => {
        isSpreading.value = false
        isSorting.value = false
      }, (7 * 35 + 350) * scale)
    }, 150 * scale)
  })
}

// ───── 发牌 ─────
async function dealCards(count) {
  const needed = count !== undefined ? count : HAND_SIZE - hand.value.length
  if (needed <= 0) return
  const drawn = []
  for (let i = 0; i < needed && deck.value.length > 0; i++) {
    const card = deck.value.pop()
    drawn.push({ ...card, dealing: true })
  }

  await nextTick()
  let deckRect = null
  const deckPileRef = playAreaRef.value?.deckPileRef
  if (deckPileRef?.pileEl) {
    deckRect = deckPileRef.pileEl.getBoundingClientRect()
  }

  // 错峰 60ms 逐张加入手牌
  for (let i = 0; i < drawn.length; i++) {
    const card = drawn[i]
    await new Promise(r => setTimeout(r, i * 60))
    hand.value.push(card)
    await nextTick()
    const cardId = card.id

    if (deckRect) {
      const cardEl = handAreaRef.value?.cardRefs?.[cardId]
      if (cardEl) {
        const targetRect = cardEl.getBoundingClientRect()
        animateFlyCard(deckRect, targetRect, cardId)
        continue
      }
    }
    // fallback
    const idx = hand.value.findIndex(c => c.id === cardId)
    if (idx !== -1) hand.value[idx] = { ...hand.value[idx], dealing: false }
  }

  // 发牌完成后自动按点降序排序 + 触发双阶段理牌
  if (drawn.length > 0) {
    const totalDuration = (drawn.length - 1) * 60 + 400 * getAnimScale() + 80
    await new Promise(r => setTimeout(r, totalDuration))
    hand.value = [...hand.value].sort((a, b) => RANK_ORDER.indexOf(b.rank) - RANK_ORDER.indexOf(a.rank))
    triggerSortingAnim()
  }
}

function animateFlyCard(fromRect, toRect, cardId = null) {
  const clone = document.createElement('div')
  clone.style.cssText = `
    position: fixed;
    left: ${fromRect.left}px;
    top: ${fromRect.top}px;
    width: ${fromRect.width}px;
    height: ${fromRect.height}px;
    background: linear-gradient(135deg, #6b3ec9 0%, #4a2599 50%, #2d0d6e 100%);
    border: 2px solid #1a0f24;
    border-radius: 8px;
    pointer-events: none;
    z-index: 999;
    box-shadow: 0 4px 8px rgba(0,0,0,.5);
  `
  document.body.appendChild(clone)

  const dx = toRect.left - fromRect.left
  const dy = toRect.top - fromRect.top
  const scaleX = toRect.width / fromRect.width
  const scaleY = toRect.height / fromRect.height
  const dur = 400 * getAnimScale()

  const anim = clone.animate([
    { transform: 'translate(0,0) scale(1)', opacity: 0.9 },
    { transform: `translate(${dx}px,${dy}px) scale(${scaleX},${scaleY})`, opacity: 1 },
  ], { duration: dur, easing: 'cubic-bezier(0.2, 0.8, 0.4, 1)', fill: 'forwards' })

  anim.onfinish = () => {
    clone.remove()
    if (cardId !== null) {
      const idx = hand.value.findIndex(c => c.id === cardId)
      if (idx !== -1) hand.value[idx] = { ...hand.value[idx], dealing: false }
    }
  }
}

// ───── 切换选中 ─────
function toggleSelect(cardId) {
  if (isAnimating.value) return
  const newSet = new Set(selectedIds.value)
  if (newSet.has(cardId)) {
    newSet.delete(cardId)
  } else {
    if (newSet.size >= 5) return
    newSet.add(cardId)
  }
  selectedIds.value = newSet
}

// ───── Joker 飞字 ─────
function spawnJokerFlyText(jokerId, deltaChips, deltaMult, beforeMult, afterMult) {
  // v8.4 修:expose 的 ref 在 component proxy 上可能未 unwrap,做兼容
  const refsContainer = jokerAreaRef.value?.jokerRefs
  const jokerEl = refsContainer?.[jokerId] || refsContainer?.value?.[jokerId]
  if (!jokerEl) return

  const rect = jokerEl.getBoundingClientRect()
  const el = document.createElement('div')

  // v7.24:中文飞字
  let text = ''
  if (deltaMult !== 0) {
    const isMultiply = beforeMult > 0 && Math.abs(afterMult - (beforeMult + deltaMult)) > 0.01
    if (isMultiply) {
      text = `×${(afterMult / beforeMult).toFixed(0)} 倍率`
    } else {
      text = `+${deltaMult} 倍率`
    }
  } else if (deltaChips !== 0) {
    text = `+${deltaChips} 筹码`
  }
  if (!text) return

  const animScale = getAnimScale()
  el.textContent = text
  const safeTop = Math.max(rect.top - 24, 4)
  el.style.cssText = `
    position: fixed;
    left: ${rect.left + rect.width / 2}px;
    top: ${safeTop}px;
    transform: translateX(-50%);
    font: 900 28px/1 Inter, sans-serif;
    letter-spacing: 1.5px;
    color: #ff8844;
    pointer-events: none;
    z-index: 999;
    text-shadow:
      -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000,
      0 0 12px rgba(255,136,68,1), 0 0 24px rgba(255,136,68,.7);
    white-space: nowrap;
    animation: flyTextUp ${0.7 * animScale}s ease-out forwards;
  `
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 700 * animScale)
}

// v8.4 新增:每张命中牌上方飞一个倍率字(增强体感)
function spawnCardMultFlyText(cardId, text) {
  const cardEl = document.querySelector(`.playing-card.played[data-card-id="${cardId}"]`)
  if (!cardEl) return
  const rect = cardEl.getBoundingClientRect()
  const el = document.createElement('div')
  const animScale = getAnimScale()
  el.textContent = text
  el.style.cssText = `
    position: fixed;
    left: ${rect.left + rect.width / 2}px;
    top: ${rect.top - 18}px;
    transform: translateX(-50%);
    font: 900 36px/1 Inter, sans-serif;
    color: #ff8844;
    pointer-events: none;
    z-index: 999;
    text-shadow:
      -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000,
      0 0 14px rgba(255,136,68,1), 0 0 28px rgba(255,136,68,.7);
    white-space: nowrap;
    animation: flyTextUp ${0.7 * animScale}s ease-out forwards;
  `
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 700 * animScale)
}

// ───── 出牌 8 步完整时间线 ─────
let isPlaying = false

async function handlePlay() {
  if (gameState.value !== 'playing') return
  if (isPlaying) return
  const selected = hand.value.filter(c => selectedIds.value.has(c.id))
  if (selected.length === 0) return

  isPlaying = true
  isAnimating.value = true

  // 步骤 1:选中牌移出手牌,放入 playedCards
  hand.value = hand.value.filter(c => !selectedIds.value.has(c.id))
  selectedIds.value = new Set()
  lastHandName.value = ''
  lastChips.value = 0
  lastMult.value = 0
  highlightingIdx.value = -1
  flyTexts.value = []

  playedCards.value = selected
  await delay(350)

  // 步骤 2:识别牌型 + 初始 chips/mult
  const handType = identifyHand(selected)
  lastHandName.value = handType.name
  let currentChips = handType.chips
  let currentMult = handType.mult
  lastChips.value = currentChips
  lastMult.value = currentMult
  flyTexts.value = new Array(selected.length).fill(null)

  await delay(200)

  // 步骤 3:逐张高亮 + 蓝色 chips 飞字
  for (let i = 0; i < selected.length; i++) {
    highlightingIdx.value = i
    const cardVal = getCardValue(selected[i].rank)
    currentChips += cardVal
    lastChips.value = currentChips

    const newFlyTexts = new Array(selected.length).fill(null)
    newFlyTexts[i] = `+${cardVal}`
    flyTexts.value = newFlyTexts
    await delay(150)
  }
  flyTexts.value = new Array(selected.length).fill(null)
  highlightingIdx.value = -1
  await delay(100)

  // 步骤 4:逐 Joker 触发(金光 + 红 mult 飞字 + 命中爆裂)
  for (const joker of ownedJokers.value) {
    if (typeof joker.effect !== 'function') continue
    const before = { chips: currentChips, mult: currentMult }
    const res = joker.effect(selected, currentChips, currentMult, handType.name)
    currentChips = res.chips
    currentMult = res.mult

    if (res.chips !== before.chips || res.mult !== before.mult) {
      triggeringJokerIds.value = [joker.id]
      lastChips.value = currentChips
      lastMult.value = currentMult

      const deltaMult = currentMult - before.mult
      const deltaChips = currentChips - before.chips
      spawnJokerFlyText(joker.id, deltaChips, deltaMult, before.mult, currentMult)

      // Joker 命中牌依次"敲击"(400ms / 张) + 每张牌上方飞倍率字
      const matchedIds = typeof joker.matchCards === 'function'
        ? joker.matchCards(selected, handType.name) : []
      const isMultiply = before.mult > 0 && Math.abs(currentMult - (before.mult + deltaMult)) > 0.01
      const perCardText = deltaMult !== 0
        ? (isMultiply ? `×${(currentMult / before.mult).toFixed(0)}` : `+${deltaMult}`)
        : `+${deltaChips}`
      for (const cardId of matchedIds) {
        jokerHitCardIds.value = [cardId]  // 单张当前敲击
        spawnCardMultFlyText(cardId, perCardText)  // v8.4 新增
        await delay(400)
      }
      jokerHitCardIds.value = []

      // 保证 Joker 触发整体节奏不少于 800ms
      const matchedDuration = matchedIds.length * 400
      if (matchedDuration < 800) await delay(800 - matchedDuration)
      triggeringJokerIds.value = []
      await delay(100)
    }
  }

  // 步骤 5 + 6:公式弹出 + 累加分数
  formulaChips.value = currentChips
  formulaMult.value = currentMult
  formulaScore.value = currentChips * currentMult
  showFormulaOverlay.value = true
  blindScore.value += formulaScore.value
  handsLeft.value -= 1

  // v8.4 修:通关立刻结算(不补牌),避免"分数超过目标后还发一手再进商店"
  if (blindScore.value >= currentBlind.value.target) {
    await delay(1200)  // 让玩家多看一会儿公式
    showFormulaOverlay.value = false
    lastHandName.value = ''
    lastChips.value = 0
    lastMult.value = 0
    playedCards.value = []
    flyTexts.value = []
    isPlaying = false
    isAnimating.value = false

    const reward = calcReward(handsLeft.value, currentBlind.value.ante)
    coins.value += reward
    await delay(400)
    if (blindIndex.value >= BLINDS.length - 1) {
      gameState.value = 'won'  // 第 10 关通关
    } else {
      enterShop()
    }
    return
  }

  await delay(800)
  showFormulaOverlay.value = false
  lastHandName.value = ''
  lastChips.value = 0
  lastMult.value = 0
  await delay(200)

  // 步骤 7:清出牌区 + 补牌(只在未通关时执行)
  playedCards.value = []
  flyTexts.value = []
  await nextTick()
  await dealCards(Math.min(selected.length, deck.value.length))
  isPlaying = false
  isAnimating.value = false

  // 步骤 8:判失败(通关已在上面提前 return)
  if (handsLeft.value <= 0) {
    await delay(400)
    gameState.value = 'lost'
  }
}

// ───── 弃牌 ─────
async function handleDiscard() {
  if (isAnimating.value) return
  const selected = hand.value.filter(c => selectedIds.value.has(c.id))
  if (selected.length === 0) return
  if (discardsLeft.value <= 0) return

  isAnimating.value = true
  discardsLeft.value--

  // 移除选中牌
  hand.value = hand.value.filter(c => !selectedIds.value.has(c.id))
  selectedIds.value = new Set()

  await delay(200)

  // 补牌
  const needed = HAND_SIZE - hand.value.length
  if (needed > 0) await dealCards(needed)

  isAnimating.value = false
}

// ───── AI 出牌 ─────
async function handleAIPlay() {
  if (gameState.value !== 'playing') return
  if (isPlaying) return

  const bestIds = aiPickBestSubset(hand.value, ownedJokers.value)

  // 一张张点选(350ms / 张),累积选中
  selectedIds.value = new Set()
  for (const id of bestIds) {
    await new Promise(r => setTimeout(r, 350 * getAnimScale()))
    if (gameState.value !== 'playing') return
    selectedIds.value = new Set([...selectedIds.value, id])
  }

  // 全部选完后停 600ms 让用户看清最终组合
  await new Promise(r => setTimeout(r, 600 * getAnimScale()))
  if (gameState.value !== 'playing') return
  await handlePlay()
}

// ───── AI 全自动托管 while loop ─────
let aiAutoBusy = false
async function aiAutoStep() {
  if (!settings.value.aiAutoMode) return
  if (aiAutoBusy) return
  aiAutoBusy = true

  try {
    while (settings.value.aiAutoMode) {
      await new Promise(r => setTimeout(r, 800))   // 起步停顿
      if (!settings.value.aiAutoMode) break

      if (isPlaying) {
        await new Promise(r => setTimeout(r, 400))
        continue
      }

      if (gameState.value === 'playing' && hand.value.length > 0) {
        await handleAIPlay()
        await new Promise(r => setTimeout(r, 1400))   // 出完看清
      } else if (gameState.value === 'shop') {
        await new Promise(r => setTimeout(r, 1000))   // 看清商店
        if (!settings.value.aiAutoMode) break

        const buyId = aiSuggestShopBuy(shopJokers.value, coins.value, ownedJokers.value.length)
        if (buyId) {
          shopAIHighlight.value = buyId
          await new Promise(r => setTimeout(r, 900))   // 高亮
          if (!settings.value.aiAutoMode) break
          handleBuy(buyId)
          await new Promise(r => setTimeout(r, 900))   // 看购买动画
        }
        if (settings.value.aiAutoMode && gameState.value === 'shop') {
          await handleSkip()
          await new Promise(r => setTimeout(r, 800))   // 跳过
        }
      } else {
        break  // won / lost 退出
      }
    }
  } finally {
    aiAutoBusy = false
  }
}

// watch
watch(() => settings.value.aiAutoMode, (newVal) => {
  if (newVal) aiAutoStep()
})
watch(gameState, (newState, oldState) => {
  if (settings.value.aiAutoMode && newState === 'playing' && oldState !== 'playing') {
    aiAutoStep()
  }
})

// ───── 通关进商店 ─────
function enterShop() {
  generateShop()
  shopAIHighlight.value = null
  gameState.value = 'shop'
}

// ───── 商店 ─────
function generateShop() {
  const pool = JOKERS.filter(j => !ownedJokers.value.some(o => o.id === j.id))
  shopJokers.value = shuffle(pool).slice(0, SHOP_JOKER_COUNT)
}

function handleBuy(jokerOrId) {
  const joker = typeof jokerOrId === 'string'
    ? shopJokers.value.find(j => j.id === jokerOrId)
    : jokerOrId
  if (!joker) return
  if (coins.value < joker.price) return
  if (ownedJokers.value.length >= 5) return
  coins.value -= joker.price
  ownedJokers.value.push({ ...joker })
  shopJokers.value = shopJokers.value.filter(j => j.id !== joker.id)
}

async function handleSkip() {
  shopAIHighlight.value = null
  blindIndex.value++
  startRound()
}

// ───── 排序 ─────
const RANK_ORDER = ['2','3','4','5','6','7','8','9','10','J','Q','K','A']
const SUIT_ORDER = ['♠','♥','♦','♣']

function sortByRankWithAnim() {
  hand.value = [...hand.value].sort((a, b) => RANK_ORDER.indexOf(b.rank) - RANK_ORDER.indexOf(a.rank))
  triggerSortingAnim()
}

function sortBySuitWithAnim() {
  hand.value = [...hand.value].sort((a, b) => {
    const si = SUIT_ORDER.indexOf(a.suit) - SUIT_ORDER.indexOf(b.suit)
    if (si !== 0) return si
    return RANK_ORDER.indexOf(b.rank) - RANK_ORDER.indexOf(a.rank)
  })
  triggerSortingAnim()
}

// ───── 开始新一关 ─────
function startRound() {
  blindScore.value = 0
  handsLeft.value = STARTING_HANDS
  discardsLeft.value = STARTING_DISCARDS
  playedCards.value = []
  lastHandName.value = ''
  lastChips.value = 0
  lastMult.value = 0
  selectedIds.value = new Set()
  deck.value = shuffle(createDeck())
  hand.value = []
  gameState.value = 'playing'
  dealCards()
  showBlindToast()
}

// ───── 重开 ─────
function restartGame() {
  blindIndex.value = 0
  round.value = 1
  coins.value = 0
  ownedJokers.value = []
  shopJokers.value = []
  startRound()
}

// ───── 设置 ─────
function updateSettings(newSettings) {
  settings.value = newSettings
  saveSettings(newSettings)
  applyAnimScale(newSettings.animSpeed)
}

function updateAiAuto(val) {
  settings.value = { ...settings.value, aiAutoMode: val }
  saveSettings(settings.value)
}

// ───── 初始化 ─────
onMounted(() => {
  applyAnimScale(settings.value.animSpeed)
  deck.value = shuffle(createDeck())
  dealCards()
  showBlindToast()
})
</script>

<style scoped>
.game-root {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
}

.main-area {
  flex: 1;
  display: grid;
  grid-template-rows: 250px 1fr 300px;
  overflow: hidden;
  position: relative;
}

.blind-toast {
  position: fixed;
  top: 30%;
  /* sidebar 占 min(28vw, 480px),右主区中心 ≈ 50% + sidebar/2 */
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
