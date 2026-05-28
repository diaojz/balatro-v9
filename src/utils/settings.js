const LS_KEY = 'balatro.settings'

export const DEFAULT_SETTINGS = {
  bgmVolume: 50,
  sfxVolume: 70,
  animSpeed: 'normal',
  showFormula: true,
  aiAutoMode: false,   // v8.3 新增
}

export const ANIM_SCALE = {
  slow: 1.5,
  normal: 1,
  fast: 0.6,
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      // aiAutoMode 不从 localStorage 恢复(每次刷新都是关)
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw), aiAutoMode: false }
    }
  } catch {}
  return { ...DEFAULT_SETTINGS }
}

export function saveSettings(settings) {
  try {
    // 保存时排除 aiAutoMode,避免上次开启的托管影响下次启动
    const { aiAutoMode: _, ...persistent } = settings
    localStorage.setItem(LS_KEY, JSON.stringify(persistent))
  } catch {}
}

export function applyAnimScale(speed) {
  const scale = ANIM_SCALE[speed] ?? 1
  document.documentElement.style.setProperty('--anim-scale', String(scale))
}
