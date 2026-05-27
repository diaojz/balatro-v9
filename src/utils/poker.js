const RANK_ORDER = ['2','3','4','5','6','7','8','9','10','J','Q','K','A']

function getRankIndex(rank) {
  return RANK_ORDER.indexOf(rank)
}

function isStraight(cards) {
  if (cards.length !== 5) return false
  const indices = cards.map(c => getRankIndex(c.rank)).sort((a, b) => a - b)
  const isNormal = indices.every((v, i) => i === 0 || v === indices[i-1] + 1)
  if (isNormal) return true
  // A-2-3-4-5 低顺子
  const isLow = JSON.stringify(indices) === JSON.stringify([0,1,2,3,12])
  return isLow
}

function isFlush(cards) {
  if (cards.length !== 5) return false
  return cards.every(c => c.suit === cards[0].suit)
}

function getRankGroups(cards) {
  const groups = {}
  for (const card of cards) {
    groups[card.rank] = (groups[card.rank] || 0) + 1
  }
  return Object.values(groups).sort((a, b) => b - a)
}

export function identifyHand(cards) {
  if (!cards || cards.length === 0) {
    return { name: '高牌', chips: 5, mult: 1 }
  }
  const groups = getRankGroups(cards)
  const flush = isFlush(cards)
  const straight = isStraight(cards)

  if (flush && straight) return { name: '同花顺', chips: 100, mult: 8 }
  if (groups[0] === 4)   return { name: '四条',   chips: 60,  mult: 7 }
  if (groups[0] === 3 && groups[1] === 2) return { name: '葫芦', chips: 40, mult: 4 }
  if (flush)             return { name: '同花',   chips: 35,  mult: 4 }
  if (straight)          return { name: '顺子',   chips: 30,  mult: 4 }
  if (groups[0] === 3)   return { name: '三条',   chips: 30,  mult: 3 }
  if (groups[0] === 2 && groups[1] === 2) return { name: '两对', chips: 20, mult: 2 }
  if (groups[0] === 2)   return { name: '对子',   chips: 10,  mult: 2 }
  return { name: '高牌', chips: 5, mult: 1 }
}
