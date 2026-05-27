<template>
  <aside class="sidebar">
    <!-- Logo: v9 增量 - Press Start 2P 18px 金色 -->
    <div class="sb-logo">🃏 小丑牌</div>

    <!-- 关卡信息 -->
    <div class="sb-section">
      <div class="sb-label">关卡</div>
      <div class="sb-value-display">{{ currentBlind.name }}</div>
    </div>

    <!-- chips × mult 大计分块 -->
    <div class="sb-score-block">
      <div class="score-chips">
        <span class="score-block-label">CHIPS</span>
        <span class="score-block-num">{{ lastChips }}</span>
      </div>
      <span class="score-times">×</span>
      <div class="score-mult">
        <span class="score-block-label">MULT</span>
        <span class="score-block-num">{{ lastMult }}</span>
      </div>
    </div>

    <!-- 目标分 / 当前分 -->
    <div class="sb-section">
      <div class="sb-row">
        <span class="sb-label">目标</span>
        <span class="sb-num">{{ currentBlind.target }}</span>
      </div>
      <div class="sb-row">
        <span class="sb-label">当前</span>
        <span class="sb-num" :class="{ achieved: blindScore >= currentBlind.target }">{{ blindScore }}</span>
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

    <!-- 牌型名 -->
    <div class="sb-hand-type" :class="{ muted: !lastHandName }">
      {{ lastHandName || '—' }}
    </div>

    <!-- 重开按钮 -->
    <button class="px-btn px-btn-restart sb-restart" @click="$emit('restart')">重新开始</button>
  </aside>
</template>

<script setup>
defineProps({
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
</script>

<style scoped>
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

/* v9 增量：Logo - Press Start 2P 18px 金色 */
.sb-logo {
  font-family: 'Press Start 2P', monospace;
  font-size: 18px;
  color: var(--gold);
  text-align: center;
  padding: 12px 0;
  letter-spacing: 1px;
  text-shadow: 0 0 16px rgba(255,209,102,.5);
}

/* chips × mult 大计分块 */
.sb-score-block {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--inset);
  border-radius: 10px;
  padding: 12px 10px;
  border: 1px solid rgba(74,107,255,.2);
}
.score-chips {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(180deg, var(--chips-from), var(--chips-to));
  border-radius: 8px;
  padding: 8px 12px;
  min-width: 70px;
}
.score-mult {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(180deg, var(--mult-from), var(--mult-to));
  border-radius: 8px;
  padding: 8px 12px;
  min-width: 70px;
}
.score-block-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: rgba(255,255,255,.8);
  margin-bottom: 4px;
  letter-spacing: 1px;
}
.score-block-num {
  font-family: 'Press Start 2P', monospace;
  font-size: 20px;
  color: #fff;
  text-shadow: 0 2px 8px rgba(0,0,0,.4);
}
.score-times {
  font-family: 'Press Start 2P', monospace;
  font-size: 18px;
  color: var(--muted);
}

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
.sb-num.achieved {
  color: var(--green);
}
.sb-value-display {
  font-size: 13px;
  color: var(--text-dim);
  font-weight: 600;
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
  background: linear-gradient(90deg, var(--sb-blue), var(--green));
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* 牌型名 */
.sb-hand-type {
  text-align: center;
  font-size: 16px;
  font-weight: 700;
  color: var(--gold);
  padding: 6px 0;
}
.sb-hand-type.muted {
  color: var(--muted);
  font-weight: 400;
}

.sb-restart {
  margin-top: auto;
  width: 100%;
  font-size: 13px;
  min-height: 44px;
  padding: 10px 16px;
}
</style>
