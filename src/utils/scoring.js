import { identifyHand } from './poker.js'

const CARD_VALUES = {
  'A': 11, 'K': 10, 'Q': 10, 'J': 10,
  '2': 2, '3': 3, '4': 4, '5': 5,
  '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
}

export function getCardValue(rank) {
  return CARD_VALUES[rank] ?? parseInt(rank, 10) ?? 0
}

export function calculateScore(cards, ownedJokers = []) {
  const handType = identifyHand(cards)
  const cardSum = cards.reduce((sum, c) => sum + getCardValue(c.rank), 0)
  let chips = handType.chips + cardSum
  let mult = handType.mult

  for (const joker of ownedJokers) {
    if (typeof joker.effect === 'function') {
      const result = joker.effect(cards, chips, mult, handType.name)
      chips = result.chips
      mult = result.mult
    }
  }

  return {
    score: chips * mult,
    chips,
    mult,
    handName: handType.name,
    handType,
  }
}
