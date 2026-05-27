<template>
  <div class="play-area">
    <!-- 出牌区标题 -->
    <div class="play-label">出牌区</div>

    <!-- 已出的牌 -->
    <div class="played-cards-row">
      <div
        v-for="card in playedCards"
        :key="card.id"
        class="playing-card played"
      >
        <span class="card-rank" :class="card.suit === '♥' || card.suit === '♦' ? 'red' : 'black'">{{ card.rank }}</span>
        <span class="card-suit-center" :class="card.suit === '♥' || card.suit === '♦' ? 'red' : 'black'">{{ card.suit }}</span>
        <span class="card-rank-bottom" :class="card.suit === '♥' || card.suit === '♦' ? 'red' : 'black'">{{ card.rank }}</span>
      </div>
    </div>

    <!-- 公式分 overlay（showFormula 控制） -->
    <transition name="formula-fade">
      <div v-if="showFormulaOverlay && showFormula" class="formula-overlay">
        <span class="formula-hand-name">{{ lastHandName }}</span>
        <span class="formula-expr">{{ lastChips }} × {{ lastMult }} = <b>{{ lastScore }}</b></span>
      </div>
    </transition>
  </div>
</template>

<script setup>
defineProps({
  playedCards:         { type: Array,   default: () => [] },
  lastHandName:        { type: String,  default: '' },
  lastChips:           { type: Number,  default: 0 },
  lastMult:            { type: Number,  default: 0 },
  lastScore:           { type: Number,  default: 0 },
  showFormulaOverlay:  { type: Boolean, default: false },
  showFormula:         { type: Boolean, default: true },
})
</script>

<style scoped>
.play-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  gap: 12px;
  padding: 12px;
  background: rgba(0,0,0,.12);
  border-top: 1px solid rgba(74,107,255,.15);
  border-bottom: 1px solid rgba(74,107,255,.15);
}

.play-label {
  font-size: 11px;
  color: var(--muted);
  letter-spacing: 2px;
  text-transform: uppercase;
  position: absolute;
  top: 10px;
  left: 16px;
}

.played-cards-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: nowrap;
}

/* 出牌区的牌略小一些，不可点击 */
.playing-card.played {
  cursor: default;
  transform: none;
  width: 88px;
  height: 128px;
}
.playing-card.played:hover {
  transform: none;
}

.card-rank {
  position: absolute;
  top: 5px;
  left: 7px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
}
.card-suit-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 30px;
  line-height: 1;
}
.card-rank-bottom {
  position: absolute;
  bottom: 5px;
  right: 7px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
  transform: rotate(180deg);
}
.red   { color: #dc2626; }
.black { color: #1a0f24; }

/* 公式 overlay */
.formula-overlay {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(10,20,56,.88);
  border: 1px solid rgba(74,107,255,.5);
  border-radius: 10px;
  padding: 10px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  backdrop-filter: blur(4px);
  box-shadow: 0 4px 20px rgba(74,107,255,.3);
  white-space: nowrap;
  pointer-events: none;
}
.formula-hand-name {
  font-family: 'Inter', 'PingFang SC', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: var(--gold);
}
.formula-expr {
  font-family: 'Press Start 2P', monospace;
  font-size: 12px;
  color: var(--text);
}
.formula-expr b {
  color: var(--green);
}

/* fade 动效 */
.formula-fade-enter-active {
  transition: opacity calc(0.2s * var(--anim-scale)) ease;
}
.formula-fade-leave-active {
  transition: opacity calc(0.4s * var(--anim-scale)) ease;
}
.formula-fade-enter-from,
.formula-fade-leave-to {
  opacity: 0;
}
</style>
