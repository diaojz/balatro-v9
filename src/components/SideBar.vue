<template>
  <aside class="sidebar">
    <!-- Logo -->
    <div class="sb-logo">🃏 小丑牌</div>

    <!-- Ante 徽章 -->
    <div class="sb-ante-badge">
      底注 {{ currentBlind.ante }} / 共 4 底注
    </div>

    <!-- 盲注 panel：PokerChip + 名称 -->
    <div class="sb-section sb-blind-panel">
      <div class="sb-blind-row">
        <PokerChip :variant="currentBlind.chip" :size="36" />
        <div class="sb-blind-info">
          <div class="sb-blind-name">{{ currentBlind.name }}</div>
          <div class="sb-blind-target">目标 {{ currentBlind.target }}</div>
        </div>
      </div>
    </div>

    <!-- chips × mult 大计分块 (v9 增量) -->
    <div class="sb-score-block">
      <div class="chips-block" :class="{ bumping: chipsBumping }">
        <span class="block-label">CHIPS</span>
        <span class="block-num">{{ lastChips }}</span>
      </div>
      <span class="times-sign">×</span>
      <div class="mult-block" :class="{ bumping: multBumping }">
        <span class="block-label">MULT</span>
        <span class="block-num">{{ lastMult }}</span>
      </div>
    </div>

    <!-- Round Score：VT323 48px 红色 + scoreBump (v9 增量) -->
    <div class="sb-section">
      <div class="sb-row">
        <span class="sb-label">目标</span>
        <span class="sb-num">{{ currentBlind.target }}</span>
      </div>
      <div class="sb-row">
        <span class="sb-label">当前</span>
        <span class="sb-round-score" :class="{ 'score-bump': scoreBumping, achieved: blindScore >= currentBlind.target }">
          {{ displayScore }}
        </span>
      </div>
    </div>

    <!-- 进度条 -->
    <div class="sb-progress-bar">
      <div class="sb-progress-fill" :style="{ width: Math.min(100, (blindScore / currentBlind.target) * 100) + '%' }"></div>
    </div>

    <!-- 手数 / 弃牌 / 金币 -->
    <div class="sb-section">
      <div class="sb-row">
        <span class="sb-label">手数</span>
        <span class="sb-num">{{ handsLeft }}</span>
      </div>
      <div class="sb-row">
        <span class="sb-label">弃牌</span>
        <span class="sb-num">{{ discardsLeft }}</span>
      </div>
      <div class="sb-row">
        <span class="sb-label">💰 金币</span>
        <span class="sb-num gold">{{ coins }}</span>
      </div>
    </div>

    <!-- 牌型名：handTypePulse -->
    <div class="sb-hand-type" :class="{ muted: !lastHandName, pulse: handTypePulsing }">
      {{ lastHandName || '—' }}
    </div>

    <!-- 重开按钮 -->
    <button class="px-btn px-btn-restart sb-restart" @click="$emit('restart')">重新开始</button>
  </aside>
</template>

<script setup>
import { ref, watch } from 'vue'
import PokerChip from './PokerChip.vue'

const props = defineProps({
  currentBlind: { type: Object, required: true },
  blindScore:   { type: Number, required: true },
  handsLeft:    { type: Number, required: true },
  discardsLeft: { type: Number, required: true },
  coins:        { type: Number, required: true },
  lastChips:    { type: Number, default: 0 },
  lastMult:     { type: Number, default: 0 },
  lastHandName: { type: String, default: '' },
})
defineEmits(['restart'])

// ── RAF 数字插值 + scoreBump ────────────────────────────────
const displayScore = ref(0)
const scoreBumping = ref(false)
let rafId = null
let scoreBumpTimer = null

watch(() => props.blindScore, (newVal, oldVal) => {
  if (rafId) cancelAnimationFrame(rafId)
  const start = oldVal ?? 0
  const end = newVal
  if (start === end) return
  const duration = 600 * (parseFloat(getComputedStyle(document.documentElement)
    .getPropertyValue('--anim-scale') || '1'))
  const startTime = performance.now()

  if (scoreBumpTimer) clearTimeout(scoreBumpTimer)
  scoreBumping.value = false
  requestAnimationFrame(() => { scoreBumping.value = true })
  scoreBumpTimer = setTimeout(() => { scoreBumping.value = false }, duration + 200)

  function tick(now) {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - (1 - progress) ** 3
    displayScore.value = Math.round(start + (end - start) * eased)
    if (progress < 1) {
      rafId = requestAnimationFrame(tick)
    } else {
      displayScore.value = end
      rafId = null
    }
  }
  rafId = requestAnimationFrame(tick)
})

// ── chips bump ─────────────────────────────────────────────
const chipsBumping = ref(false)
let chipsBumpTimer = null
watch(() => props.lastChips, (newVal, oldVal) => {
  if (newVal === oldVal || newVal === 0) return
  if (chipsBumpTimer) clearTimeout(chipsBumpTimer)
  chipsBumping.value = false
  requestAnimationFrame(() => { chipsBumping.value = true })
  chipsBumpTimer = setTimeout(() => { chipsBumping.value = false }, 500)
})

// ── mult bump ──────────────────────────────────────────────
const multBumping = ref(false)
let multBumpTimer = null
watch(() => props.lastMult, (newVal, oldVal) => {
  if (newVal === oldVal || newVal === 0) return
  if (multBumpTimer) clearTimeout(multBumpTimer)
  multBumping.value = false
  requestAnimationFrame(() => { multBumping.value = true })
  multBumpTimer = setTimeout(() => { multBumping.value = false }, 500)
})

// ── handType pulse ─────────────────────────────────────────
const handTypePulsing = ref(false)
let handTypePulseTimer = null
watch(() => props.lastHandName, (newVal) => {
  if (!newVal) return
  if (handTypePulseTimer) clearTimeout(handTypePulseTimer)
  handTypePulsing.value = false
  requestAnimationFrame(() => { handTypePulsing.value = true })
  handTypePulseTimer = setTimeout(() => { handTypePulsing.value = false }, 500)
})
</script>

<style scoped>
/* CSS 变量 */
:root {
  --chips-from: #4dd6ff;
  --chips-to:   #2196f3;
  --mult-from:  #ff8844;
  --mult-to:    #ff3344;
}

.sidebar {
  width: min(28vw, 480px);
  min-width: 280px;
  height: 100vh;
  background: var(--sb-panel);
  border-right: 1px solid rgba(74,107,255,.25);
  display: flex;
  flex-direction: column;
  padding: 20px 16px;
  gap: 16px;
  overflow-y: auto;
}

/* Logo */
.sb-logo {
  font-family: 'Press Start 2P', monospace;
  font-size: 18px;
  color: var(--gold);
  text-align: center;
  padding: 12px 0;
  letter-spacing: 1px;
  text-shadow: 0 0 16px rgba(255,209,102,.5);
}

/* Ante 徽章 */
.sb-ante-badge {
  text-align: center;
  font-family: 'Inter', 'PingFang SC', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: var(--gold);
  background: rgba(255,209,102,.12);
  border: 1px solid rgba(255,209,102,.3);
  border-radius: 20px;
  padding: 4px 12px;
  letter-spacing: 1px;
}

/* 盲注 panel */
.sb-blind-panel {
  padding: 10px 12px;
}
.sb-blind-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.sb-blind-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sb-blind-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}
.sb-blind-target {
  font-size: 11px;
  color: var(--muted);
}

/* ── chips × mult 大计分块 (v9 增量) ── */
.sb-score-block {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.chips-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(180deg, #4dd6ff, #2196f3);
  border-radius: 10px;
  padding: 10px 14px;
  min-width: 80px;
  transform-origin: center;
}
.chips-block.bumping {
  animation: blockBumpChips 0.45s ease-out;
}

.mult-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(180deg, #ff8844, #ff3344);
  border-radius: 10px;
  padding: 10px 14px;
  min-width: 80px;
  transform-origin: center;
}
.mult-block.bumping {
  animation: blockBumpMult 0.45s ease-out;
}

.block-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: rgba(0,0,0,.7);
  margin-bottom: 4px;
  letter-spacing: 1px;
}
.block-num {
  font-family: 'Press Start 2P', monospace;
  font-size: 28px;
  color: #000;
  line-height: 1;
}

.times-sign {
  font-family: 'Press Start 2P', monospace;
  font-size: 22px;
  color: var(--muted);
  flex-shrink: 0;
}

/* ── Round Score VT323 48px 红色 (v9 增量) ── */
.sb-round-score {
  font-family: 'VT323', monospace;
  font-size: 48px;
  color: var(--red, #ef4444);
  line-height: 1;
  transition: color 0.3s;
}
.sb-round-score.achieved {
  color: var(--green);
}
.sb-round-score.score-bump {
  animation: scoreBump 0.8s ease-out;
}

/* ── keyframes ── */
@keyframes scoreBump {
  0%   { transform: scale(1); color: var(--red, #ef4444); text-shadow: none; }
  15%  { transform: scale(1.5); color: var(--gold); text-shadow: 0 0 24px var(--gold), 0 0 12px var(--gold); }
  40%  { transform: scale(1.25); color: var(--gold); text-shadow: 0 0 20px var(--gold); }
  70%  { transform: scale(1.1);  color: var(--gold); text-shadow: 0 0 12px var(--gold); }
  100% { transform: scale(1);    color: var(--red, #ef4444); text-shadow: none; }
}

@keyframes blockBumpChips {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.18); box-shadow: 0 0 24px #4dd6ff; }
  100% { transform: scale(1); }
}
@keyframes blockBumpMult {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.18); box-shadow: 0 0 24px #ff8844; }
  100% { transform: scale(1); }
}

@keyframes handTypePulse {
  0%   { transform: scale(0.7); opacity: 0; }
  60%  { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

/* section / row / label / num */
.sb-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: rgba(0,0,0,.2);
  border-radius: 8px;
  padding: 10px 12px;
}
.sb-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.sb-label {
  font-size: 12px;
  color: var(--muted);
}
.sb-num {
  font-family: 'VT323', monospace;
  font-size: 22px;
  color: var(--text);
}
.sb-num.gold {
  color: var(--gold);
}

/* 进度条 */
.sb-progress-bar {
  height: 6px;
  background: rgba(255,255,255,.1);
  border-radius: 3px;
  overflow: hidden;
}
.sb-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--sb-blue, #4a6bff), var(--green, #22c55e));
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* 牌型名 pulse */
.sb-hand-type {
  text-align: center;
  font-size: 16px;
  font-weight: 700;
  color: var(--gold);
  padding: 6px 0;
  transform-origin: center;
}
.sb-hand-type.muted {
  color: var(--muted);
  font-weight: 400;
}
.sb-hand-type.pulse {
  animation: handTypePulse 0.45s ease-out;
}

.sb-restart {
  margin-top: auto;
  width: 100%;
  font-size: 13px;
  min-height: 44px;
  padding: 10px 16px;
}
</style>
