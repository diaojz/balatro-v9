<template>
  <div class="end-overlay">
    <div class="end-card">
      <div class="end-icon">{{ state === 'won' ? '🎉' : '💀' }}</div>
      <h2 class="end-title" :class="state === 'won' ? 'won-title' : 'lost-title'">
        {{ state === 'won' ? '通关全部' : '失败' }}
      </h2>
      <p v-if="state === 'lost'" class="end-desc">
        卡在第 {{ blindIndex + 1 }} / {{ totalBlinds }} 关
      </p>
      <p v-else class="end-desc won-desc">
        🏆 恭喜通过全部 {{ totalBlinds }} 关！击败终极 BOSS！
      </p>
      <div class="end-stats">
        <div class="end-stat-row">
          <span>金币</span>
          <span class="end-stat-val">${{ coins }}</span>
        </div>
        <div v-if="ownedJokers.length" class="end-jokers">
          <span class="end-jokers-label">携带 Joker</span>
          <div class="end-joker-list">
            <span v-for="j in ownedJokers" :key="j.id" class="end-joker-badge">
              {{ j.name }}
            </span>
          </div>
        </div>
      </div>
      <button class="px-btn px-btn-restart" @click="$emit('restart')">重新开始</button>
    </div>
  </div>
</template>

<script setup>
import { TOTAL_BLINDS } from '../config/blinds.js'
defineProps({
  state:       { type: String, required: true },  // 'won' | 'lost'
  blindIndex:  { type: Number, required: true },
  coins:       { type: Number, required: true },
  ownedJokers: { type: Array,  required: true },
})
defineEmits(['restart'])
const totalBlinds = TOTAL_BLINDS
</script>

<style scoped>
.end-overlay {
  position: fixed; inset: 0;
  background: rgba(5,8,24,.9);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  z-index: 200;
}
.end-card {
  background: linear-gradient(180deg, #1a2858, #0d1a40);
  border: 2px solid var(--sb-blue, #4a6bff);
  border-radius: 16px;
  padding: 48px 60px;
  min-width: 360px;
  display: flex; flex-direction: column; align-items: center; gap: 16px;
}
.end-icon { font-size: 72px; }
.end-title { font: 900 32px/1 var(--sans, Inter, sans-serif); margin: 0; }
.won-title { color: var(--gold); }
.lost-title { color: var(--red, #ef4444); }
.end-desc { color: var(--text-dim); margin: 0; }
.won-desc { color: var(--green, #22c55e); }
.end-stat-val { font: 700 20px/1 'VT323', monospace; color: var(--gold); }
.end-jokers { display: flex; flex-direction: column; gap: 6px; align-items: center; }
.end-jokers-label { font-size: 12px; color: var(--muted); }
.end-joker-list { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
.end-joker-badge {
  font: 600 13px/1 Inter, sans-serif;
  background: rgba(74,107,255,.15);
  border: 1px solid rgba(74,107,255,.3);
  border-radius: 6px;
  padding: 4px 8px;
  color: var(--text, #fff);
}
.end-stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  width: 100%;
}
.end-stat-row {
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: 14px;
  color: var(--text-dim);
}
</style>
