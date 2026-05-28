<template>
  <!-- v9 硬约束:手牌在上,按钮在下 -->
  <div class="hand-area">
    <!-- 手牌区(在上)+ 双阶段理牌 keyframes -->
    <div class="cards-row" :class="{ 'is-collapsing': isCollapsing, 'is-spreading': isSpreading }">
      <div
        v-for="card in hand"
        :key="card.id"
        class="playing-card"
        :class="{ selected: selectedIds.has(card.id), dealing: card.dealing }"
        :ref="el => setCardRef(card.id, el)"
        @click="$emit('toggle-select', card.id)"
      >
        <span class="card-rank" :class="card.suit === '♥' || card.suit === '♦' ? 'red' : 'black'">{{ card.rank }}</span>
        <span class="card-suit-center" :class="card.suit === '♥' || card.suit === '♦' ? 'red' : 'black'">{{ card.suit }}</span>
        <span class="card-rank-bottom" :class="card.suit === '♥' || card.suit === '♦' ? 'red' : 'black'">{{ card.rank }}</span>
      </div>
    </div>

    <!-- 操作按钮行(在下)- v9 三栏 grid 布局 -->
    <div class="btn-row">
      <!-- 左:排序图标按钮 -->
      <div class="btn-left">
        <button class="sort-icon-btn" @click="$emit('sort-rank')" :disabled="isPlaying" title="按点数排序">
          <span class="sort-icon">⇅</span>
          <span class="sort-label">点</span>
        </button>
        <button class="sort-icon-btn" @click="$emit('sort-suit')" :disabled="isPlaying" title="按花色排序">
          <span class="sort-icon">♥</span>
          <span class="sort-label">花</span>
        </button>
      </div>

      <!-- 中央:出牌 + 弃牌 -->
      <div class="btn-center">
        <button
          class="px-btn px-btn-play big-play"
          :disabled="isPlaying || selectedIds.size === 0 || handsLeft <= 0"
          @click="$emit('play')"
        >出牌 ({{ selectedIds.size }})</button>
        <button
          class="px-btn px-btn-discard mid-discard"
          :disabled="isPlaying || selectedIds.size === 0 || discardsLeft <= 0"
          @click="$emit('discard')"
        >弃牌 ({{ discardsLeft }})</button>
      </div>

      <!-- 右:AI 按钮 + 全自动 toggle -->
      <div class="btn-right">
        <AIButton
          ref="aiBtnRef"
          :disabled="isPlaying || handsLeft <= 0"
          @ai-play="$emit('ai-play')"
        />
        <label class="ai-auto-toggle" :class="{ on: aiAutoMode }" title="AI 全自动托管">
          <input type="checkbox" :checked="aiAutoMode" @change="$emit('update-ai-auto', $event.target.checked)" />
          <span class="toggle-track-small"><span class="toggle-knob-small"></span></span>
          <span class="ai-auto-label">托管</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AIButton from './AIButton.vue'

defineProps({
  hand:         { type: Array,  required: true },
  selectedIds:  { type: Object, required: true },
  handsLeft:    { type: Number, required: true },
  discardsLeft: { type: Number, required: true },
  isPlaying:    { type: Boolean, default: false },
  isCollapsing: { type: Boolean, default: false },
  isSpreading:  { type: Boolean, default: false },
  aiAutoMode:   { type: Boolean, default: false },
})

defineEmits(['toggle-select', 'play', 'discard', 'sort-rank', 'sort-suit', 'ai-play', 'update-ai-auto'])

const aiBtnRef = ref(null)
const cardRefs = ref({})
function setCardRef(id, el) {
  if (el) cardRefs.value[id] = el
  else delete cardRefs.value[id]
}
defineExpose({ aiBtnRef, cardRefs })
</script>

<style scoped>
.hand-area {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 10px 12px 20px;
  gap: 12px;
  height: 300px;
}

.cards-row {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 8px;
  flex-wrap: nowrap;
  padding: 0 4px;
  min-height: 170px;
}

/* 双阶段理牌 keyframes */
.cards-row.is-collapsing .playing-card {
  transition: none !important;
  animation: cardCollapse calc(0.15s * var(--anim-scale, 1)) ease-in forwards;
}
@keyframes cardCollapse {
  0%   { transform: scale(1) translateY(0) rotate(0); opacity: 1; }
  100% { transform: scale(0.35) translateY(-25px) rotate(-3deg); opacity: 0.7; }
}
.cards-row.is-spreading .playing-card {
  transition: none !important;
  animation: cardSpread calc(0.32s * var(--anim-scale, 1)) cubic-bezier(.25, .8, .35, 1) backwards;
}
.cards-row.is-spreading .playing-card:nth-child(1) { animation-delay: 0ms; }
.cards-row.is-spreading .playing-card:nth-child(2) { animation-delay: 35ms; }
.cards-row.is-spreading .playing-card:nth-child(3) { animation-delay: 70ms; }
.cards-row.is-spreading .playing-card:nth-child(4) { animation-delay: 105ms; }
.cards-row.is-spreading .playing-card:nth-child(5) { animation-delay: 140ms; }
.cards-row.is-spreading .playing-card:nth-child(6) { animation-delay: 175ms; }
.cards-row.is-spreading .playing-card:nth-child(7) { animation-delay: 210ms; }
.cards-row.is-spreading .playing-card:nth-child(8) { animation-delay: 245ms; }
@keyframes cardSpread {
  0%   { transform: scale(0.35) translateY(-25px) rotate(-3deg); opacity: 0.7; }
  70%  { transform: scale(1.03) translateY(-3px) rotate(0.6deg); opacity: 1; }
  100% { transform: scale(1) translateY(0) rotate(0); opacity: 1; }
}

/* v9 三栏 grid 布局 */
.btn-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
}
.btn-left {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
}
.btn-center {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.btn-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

/* 排序图标按钮 56×56 */
.sort-icon-btn {
  width: 56px;
  height: 56px;
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(99,102,241,.28) 0%, rgba(67,56,202,.20) 100%);
  border: 2px solid rgba(129,140,248,.55);
  color: #e0e7ff;
  box-shadow: 0 3px 0 rgba(67,56,202,.4);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  transition: all 0.15s ease;
  flex-shrink: 0;
}
.sort-icon-btn:hover:not([disabled]) { transform: translateY(-2px); filter: brightness(1.15); }
.sort-icon-btn:active:not([disabled]) { transform: translateY(1px); }
.sort-icon-btn[disabled] { opacity: 0.5; cursor: not-allowed; }
.sort-icon { font-size: 18px; line-height: 1; }
.sort-label { font-size: 11px; font-family: Inter, 'PingFang SC', sans-serif; font-weight: 700; color: #c7d2fe; }

.big-play { width: 240px; height: 60px; font-size: 20px; min-height: 60px; padding: 0; }
.mid-discard { width: 160px; height: 60px; font-size: 16px; min-height: 60px; padding: 0; }

/* AI 全自动 toggle */
.ai-auto-toggle {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  user-select: none;
}
.ai-auto-toggle input { display: none; }
.toggle-track-small {
  width: 36px;
  height: 20px;
  background: rgba(255,255,255,.15);
  border-radius: 10px;
  position: relative;
  transition: background 0.2s;
}
.ai-auto-toggle.on .toggle-track-small {
  background: #a855f7;
  box-shadow: 0 0 8px rgba(168,85,247,.6);
}
.toggle-knob-small {
  width: 14px;
  height: 14px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 3px;
  left: 3px;
  transition: transform 0.2s;
}
.ai-auto-toggle.on .toggle-knob-small {
  transform: translateX(16px);
}
.ai-auto-label { font-size: 12px; color: var(--muted); }
.ai-auto-toggle.on .ai-auto-label { color: #a855f7; }

/* 扑克牌内容 */
.card-rank {
  position: absolute;
  top: 6px;
  left: 8px;
  font-family: Inter, sans-serif;
  font-size: 16px;
  font-weight: 800;
  line-height: 1;
}
.card-suit-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 36px;
  line-height: 1;
}
.card-rank-bottom {
  position: absolute;
  bottom: 6px;
  right: 8px;
  font-family: Inter, sans-serif;
  font-size: 16px;
  font-weight: 800;
  line-height: 1;
  transform: rotate(180deg);
}
.red { color: #dc2626; }
.black { color: #1a0f24; }
</style>
