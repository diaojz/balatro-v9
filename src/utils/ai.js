// AI 出牌启发式(v8.4 升级)
// - 删除 early return:绝对枚举 1..min(5,N) 所有子集,无论手牌张数
// - 启用 dev console.log debug:打印 top-5 候选,方便观察 AI 决策
// - 同分时优先「牌型 rank 高 + 张数多」(打葫芦不打三条)

import { calculateScore } from './scoring.js'

// 牌型 rank(数字越大优先级越高)
const HAND_TYPE_RANK = {
  '同花顺': 9, '四条': 8, '葫芦': 7, '同花': 6, '顺子': 5,
  '三条':   4, '两对': 3, '对子': 2, '高牌': 1,
}

const AI_DEBUG = false  // 改成 true 在 Console 看 top-5 候选

export function aiPickBestSubset(hand, ownedJokers = []) {
  if (hand.length === 0) return []

  let best = { score: -1, ids: [], handName: '', cards: [] }
  const candidates = []
  const maxSize = Math.min(5, hand.length)

  for (let size = 1; size <= maxSize; size++) {
    for (const subset of combinations(hand, size)) {
      const result = calculateScore(subset, ownedJokers)
      const cand = {
        score: result.score,
        chips: result.chips,
        mult: result.mult,
        handName: result.handName,
        ids: subset.map(c => c.id),
        size,
      }
      candidates.push(cand)
      if (isBetter(cand, best)) best = cand
    }
  }

  if (AI_DEBUG) {
    candidates.sort((a, b) => b.score - a.score || HAND_TYPE_RANK[b.handName] - HAND_TYPE_RANK[a.handName])
    console.log('[AI] top-5 候选:', candidates.slice(0, 5).map(c =>
      `${c.handName}(${c.size}张) ${c.chips}×${c.mult}=${c.score}`
    ))
    console.log('[AI] 选中:', best.handName, best.ids)
  }

  return best.ids
}

// 同分 tiebreaker:① 分数高 > ② 牌型 rank 高 > ③ 张数多(出更多牌补给更快)
function isBetter(cand, best) {
  if (cand.score > best.score) return true
  if (cand.score < best.score) return false
  const candRank = HAND_TYPE_RANK[cand.handName] || 0
  const bestRank = HAND_TYPE_RANK[best.handName] || 0
  if (candRank > bestRank) return true
  if (candRank < bestRank) return false
  return cand.size > best.size
}

// 商店买 Joker 建议:简化版 — 选 price 最低的可买
export function aiSuggestShopBuy(shopJokers, coins, ownedCount) {
  const MAX_JOKERS = 5
  if (ownedCount >= MAX_JOKERS) return null
  const buyable = shopJokers.filter(j => !j.sold && coins >= j.price && ownedCount < MAX_JOKERS)
  if (buyable.length === 0) return null
  buyable.sort((a, b) => a.price - b.price)
  return buyable[0].id
}

function* combinations(arr, k) {
  if (k === 0) { yield []; return }
  if (k > arr.length) return
  const [first, ...rest] = arr
  for (const combo of combinations(rest, k - 1)) {
    yield [first, ...combo]
  }
  yield* combinations(rest, k)
}
