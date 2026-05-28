<template>
  <div class="joker-area">
    <div class="joker-label">Joker 槽</div>
    <div class="joker-slots">
      <template v-for="i in MAX_JOKERS" :key="i">
        <div v-if="ownedJokers[i - 1]" class="joker-card" :ref="el => setJokerRef(ownedJokers[i - 1].id, el)">
          <div class="joker-art">
            <template v-if="isImagePath(ownedJokers[i - 1].art)">
              <img :src="ownedJokers[i - 1].art" :alt="ownedJokers[i - 1].name" class="joker-art-img" />
            </template>
            <template v-else>
              <span class="joker-art-emoji">{{ ownedJokers[i - 1].art }}</span>
            </template>
          </div>
          <div class="joker-name">{{ ownedJokers[i - 1].name }}</div>
          <div class="joker-desc">{{ ownedJokers[i - 1].description }}</div>
          <div class="joker-rarity" :style="{ color: rarityColor(ownedJokers[i - 1].rarity) }">
            {{ ownedJokers[i - 1].rarity }}
          </div>
        </div>
        <div v-else class="joker-empty">
          <span style="font-size:24px;color:var(--muted);">+</span>
          <span style="font-size:11px;color:var(--muted);">空槽</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { RARITY_COLOR } from '../config/jokers.js'
import { MAX_JOKERS }   from '../config/constants.js'

defineProps({
  ownedJokers: { type: Array, default: () => [] },
})

// v9 关键修复:jokerRefs 必须是 ref({}) 然后用 .value[id] 赋值(不是直接 obj[id])
const jokerRefs = ref({})
function setJokerRef(id, el) {
  if (el) jokerRefs.value[id] = el
  else delete jokerRefs.value[id]
}
defineExpose({ jokerRefs })

function rarityColor(rarity) {
  return RARITY_COLOR[rarity] ?? '#fff'
}

function isImagePath(art) {
  if (typeof art !== 'string') return true  // import 进来的 module URL
  return art.startsWith('/') || art.startsWith('data:') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(art)
}
</script>

<style scoped>
.joker-area {
  height: 250px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 16px;
  gap: 8px;
  border-bottom: 1px solid rgba(74,107,255,.15);
  background: rgba(0,0,0,.08);
}

.joker-label {
  font-size: 11px;
  color: var(--muted);
  letter-spacing: 2px;
  text-transform: uppercase;
  align-self: flex-start;
}

.joker-slots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex: 1;
}

.joker-card {
  width: 140px;
  height: 180px;
  background: linear-gradient(180deg, var(--paper-1) 0%, var(--paper-2) 50%, var(--paper-3) 100%);
  border: 2px solid var(--card-edge);
  border-radius: 8px;
  box-shadow: 0 4px 0 rgba(0,0,0,.55);
  position: relative;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px;
}

.joker-art {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.joker-art-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.joker-art-emoji {
  font-size: 36px;
  line-height: 1;
}

.joker-name {
  font-family: 'Inter', 'PingFang SC', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #1a0f24;
  text-align: center;
}
.joker-desc {
  font-size: 10px;
  color: #4a3f2a;
  text-align: center;
  line-height: 1.4;
}
.joker-rarity {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.joker-empty {
  width: 140px;
  height: 180px;
  border: 3px dashed rgba(79,70,229,.4);
  border-radius: 8px;
  background: rgba(74,107,255,.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-shrink: 0;
}
</style>
