<template>
  <div class="shop-view">
    <h2 class="shop-title">🛒 商店</h2>
    <p class="shop-subtitle">第 {{ round }} 关通关！金币: {{ coins }}</p>

    <div class="shop-jokers">
      <div
        v-for="joker in shopJokers"
        :key="joker.id"
        class="shop-joker-card"
        :class="{ bought: joker.bought, cantafford: coins < joker.price }"
      >
        <div class="joker-art">{{ joker.art }}</div>
        <div class="joker-name">{{ joker.name }}</div>
        <div class="joker-desc">{{ joker.description }}</div>
        <div class="joker-rarity" :style="{ color: rarityColor(joker.rarity) }">{{ joker.rarity }}</div>
        <button
          class="px-btn px-btn-skip buy-btn"
          :disabled="joker.bought || coins < joker.price || ownedJokers.length >= MAX_JOKERS"
          @click="$emit('buy', joker)"
        >
          {{ joker.bought ? '已购买' : `$${joker.price}` }}
        </button>
      </div>
    </div>

    <button class="px-btn px-btn-skip skip-btn" @click="$emit('skip')">
      跳过 →
    </button>
  </div>
</template>

<script setup>
import { RARITY_COLOR } from '../config/jokers.js'
import { MAX_JOKERS }   from '../config/constants.js'

defineProps({
  shopJokers:  { type: Array,  required: true },
  coins:       { type: Number, required: true },
  ownedJokers: { type: Array,  required: true },
  round:       { type: Number, required: true },
})
defineEmits(['buy', 'skip'])

function rarityColor(rarity) {
  return RARITY_COLOR[rarity] ?? '#fff'
}
</script>

<style scoped>
.shop-view {
  position: fixed;
  inset: 0;
  background: rgba(5,8,24,.92);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  z-index: 200;
  backdrop-filter: blur(6px);
}
.shop-title {
  font-family: 'Inter', 'PingFang SC', sans-serif;
  font-size: 28px;
  font-weight: 800;
  color: var(--gold);
}
.shop-subtitle {
  font-size: 15px;
  color: var(--text-dim);
}
.shop-jokers {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: center;
}
.shop-joker-card {
  width: 160px;
  background: linear-gradient(180deg, var(--paper-1) 0%, var(--paper-2) 100%);
  border: 2px solid var(--card-edge);
  border-radius: 10px;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: transform 0.15s;
}
.shop-joker-card:hover {
  transform: translateY(-4px);
}
.shop-joker-card.bought {
  opacity: 0.5;
}
.joker-art  { font-size: 40px; }
.joker-name { font-size: 12px; font-weight: 700; color: #1a0f24; text-align: center; }
.joker-desc { font-size: 10px; color: #4a3f2a; text-align: center; line-height: 1.4; }
.joker-rarity { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
.buy-btn {
  margin-top: 4px;
  min-height: 36px;
  padding: 6px 16px;
  font-size: 13px;
}
.skip-btn {
  margin-top: 8px;
  min-height: 48px;
  padding: 12px 32px;
  font-size: 16px;
}
</style>
