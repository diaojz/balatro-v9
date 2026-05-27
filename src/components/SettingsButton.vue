<template>
  <button class="px-btn px-btn-settings settings-btn" @click="$emit('open')">⚙</button>
</template>

<script setup>
defineEmits(['open'])
</script>

<style scoped>
.settings-btn {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 100;
  width: 44px;
  height: 44px;
  min-height: 44px;
  padding: 0;
  font-size: 20px;
  border-radius: 50%;
}
</style>
