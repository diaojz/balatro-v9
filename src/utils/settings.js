const LS_KEY = 'balatro.settings'

export const DEFAULT_SETTINGS = {
  bgmVolume: 50,
  sfxVolume: 70,
  animSpeed: 'normal',
  showFormula: true,
}

export const ANIM_SCALE = {
  slow: 1.5,
  normal: 1,
  fast: 0.6,
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {}
  return { ...DEFAULT_SETTINGS }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(settings))
  } catch {}
}

export function applyAnimScale(speed) {
  const scale = ANIM_SCALE[speed] ?? 1
  document.documentElement.style.setProperty('--anim-scale', String(scale))
}
