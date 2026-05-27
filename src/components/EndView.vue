<template>
  <div class="end-view" :class="type">
    <div class="end-icon">{{ type === 'won' ? '🏆' : '💀' }}</div>
    <h1 class="end-title">{{ type === 'won' ? '恭喜通关！' : '游戏失败' }}</h1>
    <p class="end-desc">
      {{ type === 'won' ? '你完成了全部 3 关！' : `未能在 ${handsLeft} 手内达成目标分。` }}
    </p>
    <button class="px-btn px-btn-restart restart-btn" @click="$emit('restart')">
      再来一局
    </button>
  </div>
</template>

<script setup>
defineProps({
  type:      { type: String, required: true }, // 'won' | 'lost'
  handsLeft: { type: Number, default: 0 },
})
defineEmits(['restart'])
</script>

<style scoped>
.end-view {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  z-index: 300;
  backdrop-filter: blur(8px);
}
.end-view.won  { background: rgba(5,20,56,.88); }
.end-view.lost { background: rgba(30,0,0,.88); }

.end-icon {
  font-size: 72px;
  animation: bounce 0.6s ease infinite alternate;
}
@keyframes bounce {
  from { transform: translateY(0); }
  to   { transform: translateY(-12px); }
}
.end-title {
  font-family: 'Inter', 'PingFang SC', sans-serif;
  font-size: 36px;
  font-weight: 900;
  color: var(--gold);
}
.end-desc {
  font-size: 16px;
  color: var(--text-dim);
}
.restart-btn {
  min-height: 56px;
  padding: 14px 40px;
  font-size: 18px;
  margin-top: 12px;
}
</style>
