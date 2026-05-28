<template>
  <button class="px-btn px-btn-ai"
          :class="{ thinking: isThinking }"
          :disabled="isThinking || disabled"
          @click="handleClick">
    {{ isThinking ? '🤔 AI 思考中…' : label }}
  </button>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  label:    { type: String, default: '🤖 AI 出牌' },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['ai-play'])

const isThinking = ref(false)

function handleClick() {
  if (isThinking.value || props.disabled) return
  isThinking.value = true
  // 800ms 思考动画时长,然后发 ai-play
  setTimeout(() => {
    isThinking.value = false
    emit('ai-play')
  }, 800)
}

function resetThinking() {
  isThinking.value = false
}
defineExpose({ resetThinking })
</script>
