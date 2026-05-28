<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-panel">
      <div class="modal-header">
        <span class="modal-title">设置</span>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <!-- 动画速度 -->
        <div class="setting-row">
          <label class="setting-label">动画速度</label>
          <div class="speed-btns">
            <button
              v-for="opt in speedOptions"
              :key="opt.value"
              class="speed-btn"
              :class="{ active: local.animSpeed === opt.value }"
              @click="local.animSpeed = opt.value; apply()"
            >{{ opt.label }}</button>
          </div>
        </div>

        <!-- 公式预览 -->
        <div class="setting-row">
          <label class="setting-label">出牌公式预览</label>
          <label class="toggle">
            <input type="checkbox" v-model="local.showFormula" @change="apply" />
            <span class="toggle-track">
              <span class="toggle-thumb"></span>
            </span>
          </label>
        </div>

        <!-- AI 全自动托管 -->
        <div class="setting-row ai-auto-row">
          <label>
            🤖 AI 全自动托管
            <div class="setting-sub">开启后 AI 自动连打,直到通关或失败</div>
          </label>
          <button class="toggle-btn" :class="{ on: local.aiAutoMode }"
                  @click="local.aiAutoMode = !local.aiAutoMode; apply()">
            <span class="toggle-knob"></span>
          </button>
        </div>

        <!-- BGM 音量 (UI 占位) -->
        <div class="setting-row">
          <label class="setting-label">背景音乐 <span class="ui-only">(界面占位)</span></label>
          <div class="slider-row">
            <input type="range" min="0" max="100" v-model="local.bgmVolume" class="slider" />
            <span class="slider-val">{{ local.bgmVolume }}</span>
          </div>
        </div>

        <!-- SFX 音量 (UI 占位) -->
        <div class="setting-row">
          <label class="setting-label">音效音量 <span class="ui-only">(界面占位)</span></label>
          <div class="slider-row">
            <input type="range" min="0" max="100" v-model="local.sfxVolume" class="slider" />
            <span class="slider-val">{{ local.sfxVolume }}</span>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="px-btn px-btn-skip" @click="$emit('close')">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'

const props = defineProps({
  settings: Object,
})

const emit = defineEmits(['close', 'update'])

// 本地副本
const local = reactive({ ...props.settings })

const speedOptions = [
  { value: 'slow',   label: '慢' },
  { value: 'normal', label: '正常' },
  { value: 'fast',   label: '快' },
]

function apply() {
  emit('update', { ...local })
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.65);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-panel {
  background: var(--sb-panel);
  border: 2px solid rgba(74,107,255,.4);
  border-radius: 16px;
  width: 420px;
  max-width: 95vw;
  box-shadow: 0 24px 64px rgba(0,0,0,.6);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid rgba(255,255,255,.08);
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--gold);
}

.close-btn {
  background: none;
  border: none;
  color: var(--muted);
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: color 0.15s;
}
.close-btn:hover { color: var(--text); }

.modal-body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.setting-label {
  font-size: 14px;
  color: var(--text-dim);
  flex-shrink: 0;
}

.ui-only {
  font-size: 11px;
  color: var(--muted);
}

.speed-btns {
  display: flex;
  gap: 6px;
}

.speed-btn {
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,.2);
  background: rgba(255,255,255,.05);
  color: var(--text-dim);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.speed-btn.active {
  background: var(--sb-blue);
  border-color: var(--sb-blue);
  color: #fff;
}
.speed-btn:hover:not(.active) {
  background: rgba(255,255,255,.1);
}

/* Toggle switch */
.toggle {
  display: flex;
  align-items: center;
  cursor: pointer;
}
.toggle input { display: none; }
.toggle-track {
  width: 44px;
  height: 24px;
  background: rgba(255,255,255,.15);
  border-radius: 12px;
  position: relative;
  transition: background 0.2s;
}
.toggle input:checked + .toggle-track {
  background: var(--green);
}
.toggle-thumb {
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 3px;
  left: 3px;
  transition: transform 0.2s;
}
.toggle input:checked + .toggle-track .toggle-thumb {
  transform: translateX(20px);
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.slider {
  width: 120px;
  accent-color: var(--sb-blue);
}
.slider-val {
  font-family: var(--display);
  font-size: 18px;
  color: var(--text-dim);
  min-width: 28px;
  text-align: right;
}

.ai-auto-row {
  padding: 10px 12px;
  background: rgba(168,85,247,.08);
  border: 1px solid rgba(168,85,247,.3);
  border-radius: 8px;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}
.ai-auto-row label {
  font-size: 14px;
  color: var(--text-dim);
  cursor: default;
}
.setting-sub {
  font: 400 11px/1.4 'Inter', sans-serif;
  color: var(--muted);
  margin-top: 2px;
}
.toggle-btn {
  width: 44px;
  height: 24px;
  background: rgba(255,255,255,.15);
  border: none;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
  padding: 0;
  flex-shrink: 0;
  align-self: flex-end;
}
.toggle-btn.on {
  background: #a855f7;
  box-shadow: 0 0 8px rgba(168,85,247,.6);
}
.toggle-knob {
  display: block;
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 3px;
  left: 3px;
  transition: transform 0.2s;
}
.toggle-btn.on .toggle-knob {
  transform: translateX(20px);
}

.modal-footer {
  padding: 14px 20px 18px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid rgba(255,255,255,.08);
}
</style>
