<template>
  <teleport to="body">
    <div v-if="show" class="modal-backdrop" @click.self="$emit('close')">
      <div class="modal-box">
        <h2 class="modal-title">⚙ 设置</h2>

        <!-- 动画速度（真生效） -->
        <div class="setting-row">
          <label class="setting-label">动画速度</label>
          <div class="anim-btns">
            <button
              v-for="opt in animOptions"
              :key="opt.value"
              class="anim-btn"
              :class="{ active: localSettings.animSpeed === opt.value }"
              @click="setAnimSpeed(opt.value)"
            >{{ opt.label }}</button>
          </div>
        </div>

        <!-- 显示公式（真生效） -->
        <div class="setting-row">
          <label class="setting-label">显示计分公式</label>
          <div class="toggle-wrap" @click="toggleFormula">
            <div class="toggle" :class="{ on: localSettings.showFormula }">
              <div class="toggle-knob"></div>
            </div>
            <span class="toggle-text">{{ localSettings.showFormula ? '开' : '关' }}</span>
          </div>
        </div>

        <!-- BGM 音量（仅 UI） -->
        <div class="setting-row">
          <label class="setting-label">背景音乐 <span class="ui-only">(UI占位)</span></label>
          <input type="range" min="0" max="100" v-model="localSettings.bgmVolume" class="slider" />
          <span class="slider-val">{{ localSettings.bgmVolume }}</span>
        </div>

        <!-- SFX 音量（仅 UI） -->
        <div class="setting-row">
          <label class="setting-label">音效 <span class="ui-only">(UI占位)</span></label>
          <input type="range" min="0" max="100" v-model="localSettings.sfxVolume" class="slider" />
          <span class="slider-val">{{ localSettings.sfxVolume }}</span>
        </div>

        <div class="modal-footer">
          <button class="px-btn px-btn-skip" @click="save">保存</button>
          <button class="px-btn px-btn-sort" @click="$emit('close')">取消</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { saveSettings, applyAnimScale } from '../utils/settings.js'

const props = defineProps({
  show:     { type: Boolean, required: true },
  settings: { type: Object,  required: true },
})
const emit = defineEmits(['close', 'update'])

const animOptions = [
  { value: 'slow',   label: '慢' },
  { value: 'normal', label: '正常' },
  { value: 'fast',   label: '快' },
]

const localSettings = ref({ ...props.settings })

watch(() => props.settings, (s) => { localSettings.value = { ...s } })

function setAnimSpeed(val) {
  localSettings.value.animSpeed = val
  applyAnimScale(val)
}

function toggleFormula() {
  localSettings.value.showFormula = !localSettings.value.showFormula
}

function save() {
  saveSettings(localSettings.value)
  applyAnimScale(localSettings.value.animSpeed)
  emit('update', { ...localSettings.value })
  emit('close')
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
  backdrop-filter: blur(4px);
}
.modal-box {
  background: var(--sb-panel);
  border: 1px solid rgba(74,107,255,.4);
  border-radius: 16px;
  padding: 28px 32px;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0,0,0,.6);
}
.modal-title {
  font-family: 'Inter', 'PingFang SC', sans-serif;
  font-size: 18px;
  font-weight: 800;
  color: var(--gold);
  margin-bottom: 24px;
  text-align: center;
}
.setting-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}
.setting-label {
  font-size: 13px;
  color: var(--text-dim);
  min-width: 110px;
  font-weight: 600;
}
.ui-only {
  font-size: 10px;
  color: var(--muted);
  font-weight: 400;
}
.anim-btns {
  display: flex;
  gap: 8px;
}
.anim-btn {
  padding: 6px 16px;
  border-radius: 8px;
  border: 1px solid rgba(129,140,248,.4);
  background: rgba(74,107,255,.1);
  color: var(--text-dim);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'Inter', 'PingFang SC', sans-serif;
}
.anim-btn.active {
  background: var(--sb-blue);
  border-color: var(--sb-blue);
  color: #fff;
}
.toggle-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.toggle {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: rgba(255,255,255,.15);
  position: relative;
  transition: background 0.2s;
}
.toggle.on {
  background: var(--green);
}
.toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s;
  box-shadow: 0 1px 4px rgba(0,0,0,.3);
}
.toggle.on .toggle-knob {
  transform: translateX(20px);
}
.toggle-text {
  font-size: 13px;
  color: var(--text-dim);
}
.slider {
  flex: 1;
  accent-color: var(--sb-blue);
}
.slider-val {
  font-family: 'VT323', monospace;
  font-size: 20px;
  color: var(--gold);
  min-width: 32px;
  text-align: right;
}
.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}
</style>
