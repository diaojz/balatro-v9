<template>
  <!-- v9 硬约束：手牌在上，按钮在下 -->
  <div class="hand-area">
    <!-- 手牌区（在上） -->
    <div class="cards-row">
      <div
        v-for="card in hand"
        :key="card.id"
        class="playing-card"
        :class="{ selected: selectedIds.has(card.id), dealing: card.dealing }"
        :ref="el => { if (el) cardRefs[card.id] = el }"
        @click="$emit('toggle-select', card.id)"
      >
        <span class="card-rank" :class="card.suit === '♥' || card.suit === '♦' ? 'red' : 'black'">{{ card.rank }}</span>
        <span class="card-suit-center" :class="card.suit === '♥' || card.suit === '♦' ? 'red' : 'black'">{{ card.suit }}</span>
        <span class="card-rank-bottom" :class="card.suit === '♥' || card.suit === '♦' ? 'red' : 'black'">{{ card.rank }}</span>
      </div>
    </div>

    <!-- 操作按钮行（在下） - v9 增量：三栏 grid 布局 -->
    <div class="btn-row">
      <!-- 左：排序图标按钮 - v9 增量：紧凑两个 56×56 图标版 -->
      <div class="btn-left">
        <button
          class="sort-icon-btn"
          :class="{ active: sortMode === 'rank' }"
          @click="$emit('sort', 'rank')"
          title="按点数排序"
        >
          <span class="sort-icon">⇅</span>
          <span class="sort-label">点</span>
        </button>
        <button
          class="sort-icon-btn"
          :class="{ active: sortMode === 'suit' }"
          @click="$emit('sort', 'suit')"
          title="按花色排序"
        >
          <span class="sort-icon">♥</span>
          <span class="sort-label">花</span>
        </button>
      </div>

      <!-- 中央：出牌 + 弃牌 -->
      <div class="btn-center">
        <button
          class="px-btn px-btn-play big-play"
          :disabled="selectedIds.size === 0 || isAnimating"
          @click="$emit('play')"
        >
          出牌 ({{ selectedIds.size }})
        </button>
        <button
          class="px-btn px-btn-discard mid-discard"
          :disabled="selectedIds.size === 0 || discardsLeft <= 0 || isAnimating"
          @click="$emit('discard')"
        >
          弃牌 ({{ discardsLeft }})
        </button>
      </div>

      <!-- 右：AI 按钮占位（第 3 轮才接 AIButton） -->
      <div class="btn-right">
        <!-- AI 按钮第 3 轮实现 -->
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  hand:         { type: Array,  required: true },
  selectedIds:  { type: Object, required: true }, // Set
  discardsLeft: { type: Number, required: true },
  isAnimating:  { type: Boolean, default: false },
  sortMode:     { type: String, default: 'rank' },
})
const cardRefs = {}
defineEmits(['toggle-select', 'play', 'discard', 'sort'])
</script>

<style scoped>
/* hand-area flex column：手牌在上，按钮在下，整体贴底 */
.hand-area {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding-bottom: 20px;
  gap: 12px;
  height: 300px;
  padding-left: 12px;
  padding-right: 12px;
}

/* 手牌行 */
.cards-row {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 8px;
  flex-wrap: nowrap;
  padding: 0 4px;
}

/* 按钮行：v9 增量 - 三栏 grid 布局 */
.btn-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
}

/* 左：排序图标按钮区 */
.btn-left {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
}

/* v9 增量：排序图标按钮 56×56 紧凑两栏 */
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
.sort-icon-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.15);
}
.sort-icon-btn:active {
  transform: translateY(1px);
}
.sort-icon-btn.active {
  background: linear-gradient(180deg, rgba(99,102,241,.55) 0%, rgba(67,56,202,.45) 100%);
  border-color: rgba(129,140,248,.9);
  box-shadow: 0 3px 0 rgba(67,56,202,.6), 0 0 8px rgba(129,140,248,.4);
}
.sort-icon {
  font-size: 18px;
  line-height: 1;
}
.sort-label {
  font-size: 11px;
  font-family: 'Inter', 'PingFang SC', sans-serif;
  font-weight: 700;
  color: #c7d2fe;
}

/* 中央：出牌+弃牌 flex row */
.btn-center {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

/* 出牌按钮 240×60 字号 20px */
.big-play {
  width: 240px;
  height: 60px;
  font-size: 20px;
  min-height: 60px;
  padding: 0;
}

/* 弃牌按钮 160×60 字号 16px */
.mid-discard {
  width: 160px;
  height: 60px;
  font-size: 16px;
  min-height: 60px;
  padding: 0;
}

/* 右：AI 按钮占位 */
.btn-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

/* 扑克牌内容 */
.card-rank {
  position: absolute;
  top: 6px;
  left: 8px;
  font-family: 'Inter', sans-serif;
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
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 800;
  line-height: 1;
  transform: rotate(180deg);
}
.red  { color: #dc2626; }
.black { color: #1a0f24; }
</style>
