<template>
  <div class="play-area" ref="playAreaEl">
    <div class="play-cards">
      <div class="empty-hint" v-if="playedCards.length === 0">
        <span class="formula-preview" v-if="showFormula && previewScore > 0">
          预估:{{ previewChips }} × {{ previewMult }} = {{ previewScore }}
        </span>
        <template v-else>选择手牌组成牌型(1-5 张)</template>
      </div>
      <template v-else>
        <Transition name="hand-name-pop">
          <div class="hand-name-banner" v-if="handName && !showFormulaOverlay" :key="handName">
            {{ handName }}
          </div>
        </Transition>
        <Transition name="formula">
          <div class="formula-inline" v-if="showFormulaOverlay">
            <span class="formula-chips">{{ formulaChips }}</span>
            <span class="formula-x"> × </span>
            <span class="formula-mult">{{ formulaMult }}</span>
            <span class="formula-eq"> = </span>
            <span class="formula-score">{{ formulaScore }}</span>
          </div>
        </Transition>
        <div class="cards-row">
          <div v-for="(card, idx) in playedCards" :key="card.id"
               class="playing-card played"
               :data-card-id="card.id"
               :class="{
                 highlighting: highlightingIdx >= idx,
                 'joker-hit': jokerHitIds.includes(card.id),
               }">
            <div v-if="flyTexts[idx]" class="fly-text chips-fly">{{ flyTexts[idx] }}</div>
            <span class="card-rank" :class="suitColor(card.suit)">{{ card.rank }}</span>
            <span class="card-suit-center" :class="suitColor(card.suit)">{{ card.suit }}</span>
            <span class="card-rank card-rank-bottom" :class="suitColor(card.suit)">{{ card.rank }}</span>
          </div>
        </div>
      </template>
    </div>

    <DeckPile :deck-count="deckCount" ref="deckPileRef" />
  </div>
</template>

<script setup>
import DeckPile from './DeckPile.vue'
import { ref } from 'vue'

defineProps({
  playedCards: Array,
  handName: String,
  lastChips: Number,
  lastMult: Number,
  showFormula: Boolean,
  showFormulaOverlay: Boolean,
  formulaChips: Number,
  formulaMult: Number,
  formulaScore: Number,
  highlightingIdx: Number,
  flyTexts: Array,
  jokerHitIds: Array,
  deckCount: Number,
  previewChips: { type: Number, default: 0 },
  previewMult:  { type: Number, default: 0 },
  previewScore: { type: Number, default: 0 },
})

const playAreaEl = ref(null)
const deckPileRef = ref(null)
defineExpose({ deckPileRef, playAreaEl })

function suitColor(suit) {
  return ['♥', '♦'].includes(suit) ? 'red-suit' : 'black-suit'
}
</script>

<style scoped>
.play-area {
  position: relative;          /* 让 DeckPile absolute 嵌进来 */
  z-index: 10;                 /* 高于 JokerArea */
  background: rgba(5,8,24,.5);
  padding: 12px 16px 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.play-cards {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
}

.empty-hint {
  color: var(--muted);
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.formula-preview {
  font-size: 13px;
  color: var(--gold);
  opacity: 0.8;
}

.cards-row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: nowrap;
  justify-content: center;
}

.hand-name-banner {
  font: 900 42px/1 'Inter', 'PingFang SC', sans-serif;
  color: #ffd166;
  letter-spacing: 6px;
  padding: 8px 28px;
  border: 2px solid rgba(255,209,102,.5);
  border-radius: 14px;
  text-shadow:
    -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000,
    0 0 18px rgba(255,209,102,.95),
    0 0 36px rgba(255,209,102,.55);
  z-index: 100;
}

.hand-name-pop-enter-active {
  animation: handNamePop calc(0.5s * var(--anim-scale)) cubic-bezier(.34,1.56,.64,1);
}
@keyframes handNamePop {
  0%   { opacity: 0; transform: scale(0.3) rotate(-4deg); }
  55%  { opacity: 1; transform: scale(1.12) rotate(1.5deg); }
  100% { opacity: 1; transform: scale(1) rotate(0); }
}

.formula-inline {
  background: rgba(5,8,24,.85);
  border: 2px solid rgba(255,200,87,.6);
  border-radius: 12px;
  padding: 12px 20px;
  backdrop-filter: blur(4px);
  z-index: 20;
  display: flex; align-items: center; gap: 4px;
}
.formula-chips { font: 700 40px/1 'Press Start 2P', monospace; color: #4dd6ff; }
.formula-mult  { font: 700 40px/1 'Press Start 2P', monospace; color: #ff8844; }
.formula-score { font: 700 52px/1 'Press Start 2P', monospace; color: #ffd166; }
.formula-x, .formula-eq { font: 700 28px/1 'Press Start 2P', monospace; color: #c9d2e8; }

.formula-enter-active { animation: formulaPop calc(0.3s * var(--anim-scale)) cubic-bezier(.34,1.56,.64,1); }
.formula-leave-active { animation: formulaFade calc(0.2s * var(--anim-scale)) ease; }
@keyframes formulaPop {
  0%   { opacity: 0; transform: scale(0.5); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes formulaFade {
  0%   { opacity: 1; }
  100% { opacity: 0; }
}

/* 出牌 card */
.playing-card.played {
  cursor: default;
  pointer-events: none;
  position: relative;
}
.playing-card.played:hover {
  transform: none;
}

.playing-card.played.highlighting {
  box-shadow: 0 0 16px rgba(77,214,255,.8), 0 0 32px rgba(77,214,255,.4);
  border-color: #4dd6ff;
}

.playing-card.played.joker-hit {
  animation: jokerHitExplosion calc(0.35s * var(--anim-scale)) cubic-bezier(.22, 1.5, .42, 1);
  z-index: 5;
}

.playing-card.played.joker-hit::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 8px;
  animation: hitBurst calc(0.4s * var(--anim-scale)) ease-out;
  pointer-events: none;
  z-index: -1;
}

@keyframes jokerHitExplosion {
  0%   { transform: scale(1) translateY(0) rotate(0); filter: brightness(1); }
  35%  {
    transform: scale(1.5) translateY(-36px) rotate(-6deg);
    filter: brightness(1.8) saturate(1.7);
    box-shadow:
      0 0 24px rgba(255, 209, 102, 0.9),
      0 0 48px rgba(255, 153, 51, 0.7),
      0 0 72px rgba(255, 102, 0, 0.5);
  }
  100% { transform: scale(1) translateY(0) rotate(0); filter: brightness(1); box-shadow: none; }
}

@keyframes hitBurst {
  0%   {
    box-shadow:
      0 0 0 rgba(255,209,102,0),
      0 0 0 rgba(255,209,102,0);
  }
  40%  {
    box-shadow:
      0 -45px 0 rgba(255,209,102,.6),
      0 45px 0 rgba(255,209,102,.6),
      -45px 0 0 rgba(255,209,102,.6),
      45px 0 0 rgba(255,209,102,.6),
      -32px -32px 0 rgba(255,209,102,.6),
      32px -32px 0 rgba(255,209,102,.6),
      -32px 32px 0 rgba(255,209,102,.6),
      32px 32px 0 rgba(255,209,102,.6);
  }
  100% {
    box-shadow:
      0 -100px 0 rgba(255,209,102,0),
      0 100px 0 rgba(255,209,102,0),
      -100px 0 0 rgba(255,209,102,0),
      100px 0 0 rgba(255,209,102,0),
      -70px -70px 0 rgba(255,209,102,0),
      70px -70px 0 rgba(255,209,102,0),
      -70px 70px 0 rgba(255,209,102,0),
      70px 70px 0 rgba(255,209,102,0);
  }
}

.fly-text.chips-fly {
  position: absolute;
  top: -32px; left: 50%;
  transform: translateX(-50%);
  font: 900 48px/1 'Inter', sans-serif;
  color: #4dd6ff;
  text-shadow:
    -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000,
    0 0 18px rgba(77,214,255,1), 0 0 36px rgba(77,214,255,.7);
  animation: flyTextUp calc(0.7s * var(--anim-scale)) ease-out forwards;
  pointer-events: none;
}
@keyframes flyTextUp {
  0%   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  60%  { opacity: 1; transform: translateX(-50%) translateY(-32px) scale(1.1); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-48px) scale(0.9); }
}

.card-rank {
  position: absolute;
  top: 6px;
  left: 7px;
  font-family: var(--pixel);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}

.card-rank-bottom {
  top: auto;
  bottom: 6px;
  left: auto;
  right: 7px;
  transform: rotate(180deg);
}

.card-suit-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 28px;
  line-height: 1;
  user-select: none;
}

.red-suit { color: #c0392b; }
.black-suit { color: #1a0f24; }
</style>
